import type { BaileysEventEmitter } from '../Types/Events'
import type { WAMessage } from '../Types/Message'
import type { AnyMessageContent, MiscMessageGenerationOptions } from '../Types/Message'
import type { ILogger } from './logger'

export type MiddlewareContext = {
	jid: string
	message: WAMessage
	stop: () => void
}

export type Middleware = (ctx: MiddlewareContext) => void | Promise<void>

export type OutgoingMiddlewareContext = {
	jid: string
	content: AnyMessageContent
	options?: MiscMessageGenerationOptions
}

export type OutgoingMiddleware = (ctx: OutgoingMiddlewareContext) => void | Promise<void>

export type MinimalMiddlewareSocket = {
	ev: BaileysEventEmitter
}

export type MiddlewareStackOptions = {
	logger?: ILogger
}

export const makeMiddlewareStack = (sock: MinimalMiddlewareSocket, opts: MiddlewareStackOptions = {}) => {
	const incoming: Middleware[] = []
	const outgoing: OutgoingMiddleware[] = []

	const use = (mw: Middleware) => {
		incoming.push(mw)
		return () => {
			const idx = incoming.indexOf(mw)
			if (idx >= 0) {
				incoming.splice(idx, 1)
			}
		}
	}

	const useOutgoing = (mw: OutgoingMiddleware) => {
		outgoing.push(mw)
		return () => {
			const idx = outgoing.indexOf(mw)
			if (idx >= 0) {
				outgoing.splice(idx, 1)
			}
		}
	}

	sock.ev.on('messages.upsert', async ({ messages, type }) => {
		if (type !== 'notify') {
			return
		}

		for (const message of messages) {
			const rawJid = message.key.remoteJidAlt || message.key.remoteJid
			if (!rawJid) {
				continue
			}

			let stopped = false
			const ctx: MiddlewareContext = {
				jid: rawJid,
				message,
				stop: () => {
					stopped = true
				}
			}

			for (const mw of incoming) {
				try {
					await mw(ctx)
				} catch (err) {
					// A misbehaving middleware must not stop the rest of the chain from
					// running, or crash the process via an unhandled rejection.
					opts.logger?.error({ err, jid: rawJid }, 'middleware threw, continuing chain')
				}

				if (stopped) {
					break
				}
			}
		}
	})

	const runOutgoing = async (jid: string, content: AnyMessageContent, options?: MiscMessageGenerationOptions) => {
		const ctx: OutgoingMiddlewareContext = { jid, content, options }
		for (const mw of outgoing) {
			try {
				await mw(ctx)
			} catch (err) {
				opts.logger?.error({ err, jid }, 'outgoing middleware threw, continuing chain')
			}
		}

		return ctx
	}

	return {
		use,
		useOutgoing,
		runOutgoing
	}
}

export type MiddlewareStack = ReturnType<typeof makeMiddlewareStack>
