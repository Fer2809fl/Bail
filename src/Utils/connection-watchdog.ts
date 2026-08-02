import { DisconnectReason } from '../Types'
import type { ILogger } from './logger'

export type ReconnectDecision = { action: 'reconnect'; delayMs: number } | { action: 'stop'; reason: string }

export type ConnectionWatchdogOptions = {
	baseDelayMs?: number
	maxDelayMs?: number
	backoffFactor?: number
	rateLimitCooldownMs?: number
	logger?: ILogger
	livenessCheckIntervalMs?: number
	zombieThresholdMs?: number
}

const RATE_LIMIT_STYLE_CODES = new Set<number>([
	405,
	DisconnectReason.connectionReplaced,
	DisconnectReason.multideviceMismatch,
	DisconnectReason.forbidden
])

const TERMINAL_CODES = new Set<number>([DisconnectReason.loggedOut, DisconnectReason.badSession])

export class ConnectionWatchdog {
	private consecutiveFailures = 0
	private readonly opts: Required<Omit<ConnectionWatchdogOptions, 'logger'>> & { logger?: ILogger }
	private livenessTimer?: NodeJS.Timeout
	private lastAliveAt = Date.now()

	constructor(options: ConnectionWatchdogOptions = {}) {
		this.opts = {
			baseDelayMs: options.baseDelayMs ?? 1000,
			maxDelayMs: options.maxDelayMs ?? 5 * 60_000,
			backoffFactor: options.backoffFactor ?? 2,
			rateLimitCooldownMs: options.rateLimitCooldownMs ?? 60_000,
			livenessCheckIntervalMs: options.livenessCheckIntervalMs ?? 30_000,
			zombieThresholdMs: options.zombieThresholdMs ?? 90_000,
			logger: options.logger
		}
	}

	notifyConnected() {
		this.consecutiveFailures = 0
		this.lastAliveAt = Date.now()
	}

	notifyActivity() {
		this.lastAliveAt = Date.now()
	}

	decide(statusCode: number | undefined): ReconnectDecision {
		if (statusCode !== undefined && TERMINAL_CODES.has(statusCode)) {
			return { action: 'stop', reason: `terminal disconnect code ${statusCode} - re-authentication required` }
		}

		this.consecutiveFailures++

		if (statusCode !== undefined && RATE_LIMIT_STYLE_CODES.has(statusCode)) {
			this.opts.logger?.warn({ statusCode, consecutiveFailures: this.consecutiveFailures }, 'rate-limit/ban-risk disconnect')
			return { action: 'reconnect', delayMs: this.opts.rateLimitCooldownMs * Math.min(this.consecutiveFailures, 5) }
		}

		const rawDelay = this.opts.baseDelayMs * Math.pow(this.opts.backoffFactor, this.consecutiveFailures - 1)
		const cappedDelay = Math.min(rawDelay, this.opts.maxDelayMs)
		const jitter = cappedDelay * 0.2 * (Math.random() * 2 - 1)
		const delayMs = Math.max(this.opts.baseDelayMs, Math.round(cappedDelay + jitter))

		return { action: 'reconnect', delayMs }
	}

	startLivenessCheck(onZombie: () => void) {
		this.stopLivenessCheck()
		if (this.opts.livenessCheckIntervalMs <= 0) return

		this.livenessTimer = setInterval(() => {
			const idleFor = Date.now() - this.lastAliveAt
			if (idleFor > this.opts.zombieThresholdMs) {
				this.opts.logger?.error({ idleFor }, 'connection watchdog: no activity for a while')
				this.stopLivenessCheck()
				onZombie()
			}
		}, this.opts.livenessCheckIntervalMs)

		this.livenessTimer.unref?.()
	}

	stopLivenessCheck() {
		if (this.livenessTimer) {
			clearInterval(this.livenessTimer)
			this.livenessTimer = undefined
		}
	}
}
