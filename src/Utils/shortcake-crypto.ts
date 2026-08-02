import { randomBytes } from 'crypto'
import { proto } from '../../WAProto/index.js'
import type { KeyPair } from '../Types'
import { aesEncryptGCM, Curve, hkdf, sha256 } from './crypto'
import { bytesToCrockford } from './generics'

const NONCE_BYTES = 32
const VERIFICATION_CODE_BYTES = 5
const GCM_IV_BYTES = 12
const ENCRYPTION_KEY_BYTES = 32
const EPHEMERAL_PUBLIC_KEY_BYTES = 32

const ENCRYPTION_KEY_INFO = 'Pairing Information Encryption Key'

export interface ShortcakePrimaryEphemeralIdentity {
	readonly publicKey: Uint8Array
	readonly nonce: Uint8Array
}

export interface ShortcakeCompanionEphemeralIdentity {
	readonly keyPair: KeyPair
	readonly companionNonce: Uint8Array
	readonly companionEphemeralIdentityBytes: Uint8Array
	readonly commitmentHash: Uint8Array
	readonly prologuePayloadBytes: Uint8Array
}

export function generateCompanionEphemeralIdentity(args: {
	readonly ref: string
	readonly deviceType: proto.DeviceProps.PlatformType
}): ShortcakeCompanionEphemeralIdentity {
	const keyPair = Curve.generateKeyPair()
	const companionNonce = randomBytes(NONCE_BYTES)

	const companionEphemeralIdentityBytes = proto.CompanionEphemeralIdentity.encode({
		publicKey: keyPair.public,
		deviceType: args.deviceType,
		ref: args.ref
	}).finish()

	const commitmentHash = sha256(Buffer.concat([companionEphemeralIdentityBytes, companionNonce]))

	const prologuePayloadBytes = proto.ProloguePayload.encode({
		companionEphemeralIdentity: companionEphemeralIdentityBytes,
		commitment: { hash: commitmentHash }
	}).finish()

	return {
		keyPair,
		companionNonce,
		companionEphemeralIdentityBytes,
		commitmentHash,
		prologuePayloadBytes
	}
}

export function decodePrimaryEphemeralIdentity(bytes: Uint8Array): ShortcakePrimaryEphemeralIdentity {
	const decoded = proto.PrimaryEphemeralIdentity.decode(bytes)
	const publicKey = decoded.publicKey
	const nonce = decoded.nonce
	if (!publicKey || publicKey.length !== EPHEMERAL_PUBLIC_KEY_BYTES) {
		throw new Error('shortcake: PrimaryEphemeralIdentity.publicKey must be 32 bytes')
	}

	if (!nonce || nonce.length !== NONCE_BYTES) {
		throw new Error('shortcake: PrimaryEphemeralIdentity.nonce must be 32 bytes')
	}

	return { publicKey, nonce }
}

export function deriveVerificationCode(companionNonce: Uint8Array, primary: ShortcakePrimaryEphemeralIdentity): string {
	const digest = sha256(Buffer.concat([companionNonce, primary.publicKey]))
	const code = Buffer.alloc(VERIFICATION_CODE_BYTES)
	for (let i = 0; i < VERIFICATION_CODE_BYTES; i += 1) {
		code[i] = primary.nonce[i]! ^ digest[i]!
	}

	return bytesToCrockford(code)
}

export function deriveEncryptionKey(args: {
	readonly companionPrivKey: Uint8Array
	readonly primaryPublicKey: Uint8Array
	readonly deviceType: proto.DeviceProps.PlatformType
	readonly ref: string
}): Uint8Array {
	const shared = Curve.sharedKey(args.companionPrivKey, args.primaryPublicKey)
	const salt = Buffer.from(`Companion Pairing ${String(args.deviceType)} with ref ${args.ref}`)
	return hkdf(shared, ENCRYPTION_KEY_BYTES, { salt, info: ENCRYPTION_KEY_INFO })
}

export function encryptPairingRequest(encryptionKey: Uint8Array, plaintext: Uint8Array): Uint8Array {
	if (encryptionKey.length !== ENCRYPTION_KEY_BYTES) {
		throw new Error('shortcake: encryption key must be 32 bytes')
	}

	const iv = randomBytes(GCM_IV_BYTES)
	const encryptedPayload = aesEncryptGCM(plaintext, encryptionKey, iv, Buffer.alloc(0))
	return proto.EncryptedPairingRequest.encode({ encryptedPayload, iv }).finish()
}
