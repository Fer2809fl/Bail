import { Boom } from '@neykoor/boom'
import makeWASocket from '../Socket/index.js'
import { DisconnectReason, type UserFacingSocketConfig } from '../Types'
import type { ILogger } from './logger'

type WASocket = ReturnType<typeof makeWASocket>

export type ReconnectOptions = {
	config: UserFacingSocketConfig
	shouldReconnect?: (statusCode: number | undefined) => boolean
	minDelayMs?: number
	maxDelayMs?: number
	maxAttempts?: number
	onSocket?: (sock: WASocket) => void
	onMaxAttemptsReached?: () => void
	onStopped?: (statusCode: number | undefined) => void
	logger?: ILogger
}

const DISCONNECT_STATUS_LOGGED_OUT = 401

const defaultShouldReconnect = (statusCode: number | undefined) => statusCode !== DISCONNECT_STATUS_LOGGED_OUT

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export const makeResilientSocket = (opts: ReconnectOptions) => {
	const minDelay = opts.minDelayMs ?? 1000
	const maxDelay = opts.maxDelayMs ?? 60000
	const shouldReconnect = opts.shouldReconnect ?? defaultShouldReconnect

	let attempt = 0
	let stopped = false
	let currentSock: WASocket | undefined

	const computeDelay = () => {
		const exp = Math.min(maxDelay, minDelay * 2 ** attempt)
		const jitter = Math.random() * exp * 0.2
		return Math.min(maxDelay, exp + jitter)
	}

	const connect = () => {
		const sock = makeWASocket(opts.config)
		currentSock = sock
		opts.onSocket?.(sock)

		sock.ev.on('connection.update', update => {
			const { connection, lastDisconnect } = update
			if (connection === 'open') {
				attempt = 0
			}

			if (connection === 'close' && !stopped) {
				const statusCode = (lastDisconnect?.error as Boom | undefined)?.output?.statusCode
				if (!shouldReconnect(statusCode)) {
					stopped = true
					opts.logger?.warn({ statusCode }, 'reconnect not allowed for this status code, stopping')
					opts.onStopped?.(statusCode)
					return
				}

				if (opts.maxAttempts !== undefined && attempt >= opts.maxAttempts) {
					stopped = true
					opts.logger?.error({ attempt }, 'max reconnect attempts reached')
					opts.onMaxAttemptsReached?.()
					return
				}

					if (statusCode === DisconnectReason.restartRequired) {
					attempt = 0
					opts.logger?.info({ statusCode }, 'restart required, reconnecting immediately')
					connect()
					return
				}

				const wait = computeDelay()
				attempt += 1
				opts.logger?.warn({ attempt, wait, statusCode }, 'reconnecting')
				delay(wait).then(() => {
					if (!stopped) {
						connect()
					}
				})
			}
		})

		return sock
	}

	connect()

	return {
		get socket() {
			return currentSock as WASocket
		},
		stop: () => {
			stopped = true
			currentSock?.end(undefined)
		}
	}
}
