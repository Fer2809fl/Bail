import { Boom } from '@neykoor/boom'
import { randomBytes } from 'crypto'
import { proto } from '../../WAProto/index.js'
import type { AuthenticationCreds } from '../Types'
import {
	type BinaryNode,
	getBinaryNodeChild,
	getBinaryNodeChildBuffer,
	getBinaryNodeChildString,
	S_WHATSAPP_NET
} from '../WABinary'
import { hkdf, hmacSign } from './crypto'
import type { ILogger } from './logger'
import {
	decodePrimaryEphemeralIdentity,
	deriveEncryptionKey,
	deriveVerificationCode,
	encryptPairingRequest,
	generateCompanionEphemeralIdentity,
	type ShortcakeCompanionEphemeralIdentity
} from './shortcake-crypto'

export type ShortcakeAssertionSigner = (
	requestOptions: Uint8Array
) => Promise<{ readonly credentialId: Uint8Array; readonly webauthnAssertion: Uint8Array }>

const HANDOFF_KEY_INFO = 'shortcake-passkey-handoff-v1'
const HANDOFF_KEY_TTL_MS = 5 * 60 * 1000

interface PasskeyHandoffKey {
	readonly hmac: Uint8Array
	readonly ts: number
}

const Stage = Object.freeze({
	WaitingForPrimaryIdentity: 'waiting_for_primary_identity',
	WaitingForConfirmation: 'waiting_for_confirmation',
	WaitingForPairing: 'waiting_for_pairing'
} as const)
type Stage = (typeof Stage)[keyof typeof Stage]

interface ShortcakeSession {
	readonly companion: ShortcakeCompanionEphemeralIdentity
	readonly ref: string
	readonly deviceType: proto.DeviceProps.PlatformType
	readonly skipHandoffUx: boolean
	stage: Stage
	encryptionKey: Uint8Array | null
	verificationCode: string | null
}

export interface ShortcakeFlowOptions {
	readonly logger: ILogger
	readonly query: (node: BinaryNode, timeoutMs?: number) => Promise<BinaryNode>
	readonly signAssertion: ShortcakeAssertionSigner
	readonly getCreds: () => AuthenticationCreds
	readonly updateCreds: (patch: Partial<AuthenticationCreds>) => void
	readonly deviceType?: proto.DeviceProps.PlatformType
	readonly emitVerificationCode?: (code: string) => void
	readonly emitPrologueSent?: () => void
}

const mdIq = (type: 'get' | 'set', content: BinaryNode['content']): BinaryNode => ({
	tag: 'iq',
	attrs: { to: S_WHATSAPP_NET, type, xmlns: 'md' },
	content
})

export const makeShortcakeFlow = (opts: ShortcakeFlowOptions) => {
	let session: ShortcakeSession | null = null
	let handoffKey: PasskeyHandoffKey | null = null

	const requestPasskeyRequestOptions = async (): Promise<Uint8Array> => {
		const response = await opts.query(mdIq('get', [{ tag: 'passkey_request_options', attrs: {} }]))
		const options = getBinaryNodeChildBuffer(response, 'passkey_request_options')
		if (!options) {
			throw new Boom('shortcake: get-passkey-request-options response missing options', { statusCode: 400 })
		}

		return options
	}

	const requestRef = async (): Promise<string> => {
		const response = await opts.query(mdIq('get', [{ tag: 'ref', attrs: {} }]))
		const ref = getBinaryNodeChildString(response, 'ref')
		if (!ref) {
			throw new Boom('shortcake: get-ref response missing ref', { statusCode: 400 })
		}

		return ref
	}

	const executePrologue = async (
		args: {
			readonly requestOptions?: Uint8Array
			readonly pairingHandoffProof?: Uint8Array
		} = {}
	): Promise<void> => {
		const deviceType = opts.deviceType ?? proto.DeviceProps.PlatformType.CHROME

		const requestOptions = args.requestOptions ?? (await requestPasskeyRequestOptions())
		const assertion = await opts.signAssertion(requestOptions)
		const ref = await requestRef()
		const companion = generateCompanionEphemeralIdentity({ ref, deviceType })

		let pairingHandoffProof = args.pairingHandoffProof
		const stashedKey = handoffKey
		handoffKey = null
		if (pairingHandoffProof === undefined && stashedKey !== null && Date.now() - stashedKey.ts < HANDOFF_KEY_TTL_MS) {
			pairingHandoffProof = hmacSign(companion.prologuePayloadBytes, stashedKey.hmac)
		}

		const skipHandoffUx = pairingHandoffProof !== undefined

		const prologueChildren: BinaryNode[] = [
			{ tag: 'credential_id', attrs: {}, content: assertion.credentialId },
			{ tag: 'webauthn_assertion', attrs: {}, content: assertion.webauthnAssertion },
			{ tag: 'prologue_payload', attrs: {}, content: companion.prologuePayloadBytes }
		]
		if (pairingHandoffProof) {
			prologueChildren.push({ tag: 'pairing_handoff_proof', attrs: {}, content: pairingHandoffProof })
		}

		await opts.query(mdIq('set', [{ tag: 'passkey_prologue', attrs: {}, content: prologueChildren }]))

		session = {
			companion,
			ref,
			deviceType,
			skipHandoffUx,
			stage: Stage.WaitingForPrimaryIdentity,
			encryptionKey: null,
			verificationCode: null
		}
		opts.logger.debug({ ref, skipHandoffUx }, 'shortcake prologue sent')
		opts.emitPrologueSent?.()
	}

	const stashHandoffKeyAndRotateAdv = (): void => {
		const creds = opts.getCreds()
		if (!creds?.advSecretKey) {
			return
		}

		handoffKey = {
			hmac: hkdf(Buffer.from(creds.advSecretKey, 'base64'), 32, { info: HANDOFF_KEY_INFO }),
			ts: Date.now()
		}
		opts.updateCreds({ advSecretKey: randomBytes(32).toString('base64') })
	}

	const handlePasskeyPrologueRequest = async (node: BinaryNode): Promise<boolean> => {
		stashHandoffKeyAndRotateAdv()
		const requestOptions = getBinaryNodeChildBuffer(node, 'passkey_request_options')
		opts.logger.debug({ embeddedOptions: !!requestOptions }, 'shortcake prologue requested by server')
		await executePrologue({ requestOptions })
		return true
	}

	const confirmVerificationCode = async (): Promise<void> => {
		if (!session || session.stage !== Stage.WaitingForConfirmation || !session.encryptionKey) {
			throw new Error('shortcake: no verification code awaiting confirmation')
		}

		const creds = opts.getCreds()
		if (!creds) {
			throw new Error('shortcake: credentials are not initialized')
		}

		const plaintext = proto.PairingRequest.encode({
			companionPublicKey: creds.noiseKey.public,
			companionIdentityKey: creds.signedIdentityKey.public,
			advSecret: Buffer.from(creds.advSecretKey, 'base64')
		}).finish()
		const envelope = encryptPairingRequest(session.encryptionKey, plaintext)

		await opts.query(mdIq('set', [{ tag: 'encrypted_pairing_request', attrs: {}, content: envelope }]))
		session.stage = Stage.WaitingForPairing
		opts.logger.debug('shortcake encrypted pairing request sent')
	}

	const handlePrimaryEphemeralIdentity = async (node: BinaryNode): Promise<boolean> => {
		const child = getBinaryNodeChild(node, 'primary_ephemeral_identity')
		if (!child) {
			return false
		}

		if (!session || session.stage !== Stage.WaitingForPrimaryIdentity) {
			opts.logger.warn('shortcake primary identity ignored: no active prologue')
			return true
		}

		const primaryBytes = getBinaryNodeChildBuffer(node, 'primary_ephemeral_identity')!
		const primary = decodePrimaryEphemeralIdentity(primaryBytes)

		await opts.query(mdIq('set', [{ tag: 'companion_nonce', attrs: {}, content: session.companion.companionNonce }]))

		const verificationCode = deriveVerificationCode(session.companion.companionNonce, primary)
		const encryptionKey = deriveEncryptionKey({
			companionPrivKey: session.companion.keyPair.private,
			primaryPublicKey: primary.publicKey,
			deviceType: session.deviceType,
			ref: session.ref
		})

		session.encryptionKey = encryptionKey
		session.verificationCode = verificationCode
		session.stage = Stage.WaitingForConfirmation
		opts.logger.debug('shortcake verification code ready')
		opts.emitVerificationCode?.(verificationCode)
		await confirmVerificationCode()
		return true
	}

	const handleIncomingNotification = async (node: BinaryNode): Promise<boolean> => {
		if (node.attrs.type === 'passkey_prologue_request') {
			return handlePasskeyPrologueRequest(node)
		}

		if (node.attrs.type === 'crsc_continuation') {
			return handlePrimaryEphemeralIdentity(node)
		}

		return false
	}

	return {
		handleIncomingNotification,
		executePrologue,
		confirmVerificationCode,
		hasSession: () => session !== null,
		getVerificationCode: () => session?.verificationCode ?? null,
		clearSession: () => {
			session = null
			handoffKey = null
		}
	}
}

export type ShortcakeFlow = ReturnType<typeof makeShortcakeFlow>

			
