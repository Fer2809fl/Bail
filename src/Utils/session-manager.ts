import makeWASocket from '../Socket/index.js'
import type { UserFacingSocketConfig } from '../Types'
import { useMultiFileAuthState } from './use-multi-file-auth-state.js'

type WASocket = ReturnType<typeof makeWASocket>

export type SessionEntry = {
	id: string
	sock: WASocket
	stop: () => Promise<void>
}

export type SessionManagerOptions = {
	baseAuthDir: string
	config?: Omit<Partial<UserFacingSocketConfig>, 'auth'>
}

const SAFE_ID_PATTERN = /^[a-zA-Z0-9_-]+$/

const assertSafeId = (id: string): void => {
	if (!id || !SAFE_ID_PATTERN.test(id)) {
		throw new Error(
			`invalid session id "${id}": only alphanumeric characters, "-" and "_" are allowed (no path separators or traversal sequences)`
		)
	}
}

export const makeSessionManager = (opts: SessionManagerOptions) => {
	const sessions = new Map<string, SessionEntry>()
	const pending = new Map<string, Promise<SessionEntry>>()

	const start = async (id: string, overrideConfig?: Omit<Partial<UserFacingSocketConfig>, 'auth'>) => {
		assertSafeId(id)

		const existing = sessions.get(id)
		if (existing) {
			return existing
		}

		const inflight = pending.get(id)
		if (inflight) {
			return inflight
		}

		const creation = (async () => {
			const authDir = `${opts.baseAuthDir}/${id}`
			const { state, saveCreds } = await useMultiFileAuthState(authDir)

			const sock = makeWASocket({
				...opts.config,
				...overrideConfig,
				auth: state
			})

			sock.ev.on('creds.update', saveCreds)

			const entry: SessionEntry = {
				id,
				sock,
				stop: async () => {
					try {
						sock.ev.removeAllListeners('creds.update')
						sock.end(undefined)
					} finally {
						sessions.delete(id)
					}
				}
			}

			sessions.set(id, entry)
			return entry
		})()

		pending.set(id, creation)

		try {
			return await creation
		} finally {
			pending.delete(id)
		}
	}

	const stop = async (id: string) => {
		const entry = sessions.get(id)
		if (entry) {
			await entry.stop()
		}
	}

	const stopAll = async () => {
		await Promise.all(Array.from(sessions.keys()).map(id => stop(id)))
	}

	const get = (id: string) => sessions.get(id)

	const list = () => Array.from(sessions.keys())

	return {
		start,
		stop,
		stopAll,
		get,
		list
	}
}

export type SessionManager = ReturnType<typeof makeSessionManager>
