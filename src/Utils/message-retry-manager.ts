import { LRUCache } from 'lru-cache'
import type { proto } from '../../WAProto/index.js'
import type { ILogger } from './logger'

const RECENT_MESSAGES_SIZE = 512

const MESSAGE_KEY_SEPARATOR = '\u0000'

const RECREATE_SESSION_TIMEOUT = 60 * 60 * 1000
const PHONE_REQUEST_DELAY = 3000
export interface RecentMessageKey {
	to: string
	id: string
}

export interface RecentMessage {
	message: proto.IMessage
	timestamp: number
}

export interface SessionRecreateHistory {
	[jid: string]: number
}

export interface RetryCounter {
	[messageId: string]: number
}

export type PendingPhoneRequest = Record<string, ReturnType<typeof setTimeout>>

export interface RetryStatistics {
	totalRetries: number
	successfulRetries: number
	failedRetries: number
	mediaRetries: number
	sessionRecreations: number
	phoneRequests: number
}

export enum RetryReason {
	UnknownError = 0,
	SignalErrorNoSession = 1,
	SignalErrorInvalidKey = 2,
	SignalErrorInvalidKeyId = 3,

	SignalErrorInvalidMessage = 4,
	SignalErrorInvalidSignature = 5,
	SignalErrorFutureMessage = 6,

	SignalErrorBadMac = 7,
	SignalErrorInvalidSession = 8,
	SignalErrorInvalidMsgKey = 9,
	BadBroadcastEphemeralSetting = 10,
	UnknownCompanionNoPrekey = 11,
	AdvFailure = 12,
	StatusRevokeDelay = 13
}

const MAC_ERROR_CODES = new Set([RetryReason.SignalErrorInvalidMessage, RetryReason.SignalErrorBadMac])

export class MessageRetryManager {
	private recentMessagesMap = new LRUCache<string, RecentMessage>({
		max: RECENT_MESSAGES_SIZE,
		ttl: 5 * 60 * 1000,
		ttlAutopurge: true,
		dispose: (_value: RecentMessage, key: string) => {
			const separatorIndex = key.lastIndexOf(MESSAGE_KEY_SEPARATOR)
			if (separatorIndex > -1) {
				const messageId = key.slice(separatorIndex + MESSAGE_KEY_SEPARATOR.length)
				const set = this.messageKeyIndex.get(messageId)
				if (set) {
					set.delete(key)
					if (set.size === 0) {
						this.messageKeyIndex.delete(messageId)
					}
				}
			}
		}
	})
	private messageKeyIndex = new Map<string, Set<string>>()
	private sessionRecreateHistory = new LRUCache<string, number>({
		ttl: RECREATE_SESSION_TIMEOUT * 2,
		ttlAutopurge: true
	})
	private retryCounters = new LRUCache<string, number>({
		ttl: 15 * 60 * 1000,
		ttlAutopurge: true,
		updateAgeOnGet: true
	})
	private baseKeys = new LRUCache<string, Uint8Array>({
		max: 1024,
		ttl: 15 * 60 * 1000,
		ttlAutopurge: true
	})
	private pendingPhoneRequests: PendingPhoneRequest = {}
	private readonly maxMsgRetryCount: number = 5
	private statistics: RetryStatistics = {
		totalRetries: 0,
		successfulRetries: 0,
		failedRetries: 0,
		mediaRetries: 0,
		sessionRecreations: 0,
		phoneRequests: 0
	}

	constructor(
		private logger: ILogger,
		maxMsgRetryCount: number
	) {
		this.maxMsgRetryCount = maxMsgRetryCount
	}

	addRecentMessage(to: string, id: string, message: proto.IMessage): void {
		const key: RecentMessageKey = { to, id }
		const keyStr = this.keyToString(key)

		this.recentMessagesMap.set(keyStr, {
			message,
			timestamp: Date.now()
		})

		let indexSet = this.messageKeyIndex.get(id)
		if (!indexSet) {
			indexSet = new Set()
			this.messageKeyIndex.set(id, indexSet)
		}

		indexSet.add(keyStr)

		this.logger.debug(`Added message to retry cache: ${to}/${id}`)
	}

	getRecentMessage(to: string, id: string): RecentMessage | undefined {
		const key: RecentMessageKey = { to, id }
		const keyStr = this.keyToString(key)
		return this.recentMessagesMap.get(keyStr)
	}

	shouldRecreateSession(
		jid: string,
		hasSession: boolean,
		errorCode?: RetryReason
	): { reason: string; recreate: boolean } {

		if (!hasSession) {
			this.sessionRecreateHistory.set(jid, Date.now())
			this.statistics.sessionRecreations++
			return {
				reason: "we don't have a Signal session with them",
				recreate: true
			}
		}

		if (errorCode !== undefined && MAC_ERROR_CODES.has(errorCode)) {
			this.sessionRecreateHistory.set(jid, Date.now())
			this.statistics.sessionRecreations++
			this.logger.warn(
				{ jid, errorCode: RetryReason[errorCode] },
				'MAC error detected, forcing immediate session recreation'
			)
			return {
				reason: `MAC error (code ${errorCode}: ${RetryReason[errorCode]}), immediate session recreation`,
				recreate: true
			}
		}

		const now = Date.now()
		const prevTime = this.sessionRecreateHistory.get(jid)

		if (!prevTime || now - prevTime > RECREATE_SESSION_TIMEOUT) {
			this.sessionRecreateHistory.set(jid, now)
			this.statistics.sessionRecreations++
			return {
				reason: 'retry count > 1 and over an hour since last recreation',
				recreate: true
			}
		}

		return { reason: '', recreate: false }
	}

	parseRetryErrorCode(errorAttr: string | undefined): RetryReason | undefined {
		if (errorAttr === undefined || errorAttr === '') {
			return undefined
		}

		const code = parseInt(errorAttr, 10)
		if (Number.isNaN(code)) {
			return undefined
		}

		if (code >= RetryReason.UnknownError && code <= RetryReason.StatusRevokeDelay) {
			return code as RetryReason
		}

		return RetryReason.UnknownError
	}

	isMacError(errorCode: RetryReason | undefined): boolean {
		return errorCode !== undefined && MAC_ERROR_CODES.has(errorCode)
	}

	incrementRetryCount(messageId: string, participant?: string): number {
		const key = this.retryCounterKey(messageId, participant)
		this.retryCounters.set(key, (this.retryCounters.get(key) || 0) + 1)
		this.statistics.totalRetries++
		return this.retryCounters.get(key)!
	}

	getRetryCount(messageId: string, participant?: string): number {
		return this.retryCounters.get(this.retryCounterKey(messageId, participant)) || 0
	}

	hasExceededMaxRetries(messageId: string, participant?: string): boolean {
		return this.getRetryCount(messageId, participant) >= this.maxMsgRetryCount
	}

	markRetrySuccess(messageId: string, to?: string, participant?: string): void {
		this.statistics.successfulRetries++
		this.retryCounters.delete(this.retryCounterKey(messageId, participant))
		this.retryCounters.delete(messageId)
		this.cancelPendingPhoneRequest(messageId)
		this.removeRecentMessage(messageId, to)
	}

	markRetryFailed(messageId: string, to?: string, participant?: string): void {
		this.statistics.failedRetries++
		this.retryCounters.delete(this.retryCounterKey(messageId, participant))
		this.retryCounters.delete(messageId)
		this.cancelPendingPhoneRequest(messageId)
		this.removeRecentMessage(messageId, to)
	}

	private retryCounterKey(messageId: string, participant?: string): string {
		return participant ? `${messageId}${MESSAGE_KEY_SEPARATOR}${participant}` : messageId
	}

	schedulePhoneRequest(messageId: string, callback: () => void, delay: number = PHONE_REQUEST_DELAY): void {

		this.cancelPendingPhoneRequest(messageId)

		this.pendingPhoneRequests[messageId] = setTimeout(() => {
			delete this.pendingPhoneRequests[messageId]
			this.statistics.phoneRequests++
			callback()
		}, delay)

		this.logger.debug(`Scheduled phone request for message ${messageId} with ${delay}ms delay`)
	}

	cancelPendingPhoneRequest(messageId: string): void {
		const timeout = this.pendingPhoneRequests[messageId]
		if (timeout) {
			clearTimeout(timeout)
			delete this.pendingPhoneRequests[messageId]
			this.logger.debug(`Cancelled pending phone request for message ${messageId}`)
		}
	}

	clear(): void {
		this.recentMessagesMap.clear()
		this.messageKeyIndex.clear()
		this.sessionRecreateHistory.clear()
		this.retryCounters.clear()
		this.baseKeys.clear()
		for (const messageId of Object.keys(this.pendingPhoneRequests)) {
			this.cancelPendingPhoneRequest(messageId)
		}

		this.statistics = {
			totalRetries: 0,
			successfulRetries: 0,
			failedRetries: 0,
			mediaRetries: 0,
			sessionRecreations: 0,
			phoneRequests: 0
		}
	}

	saveBaseKey(addr: string, msgId: string, baseKey: Uint8Array): void {
		this.baseKeys.set(`${addr}:${msgId}`, baseKey)
	}

	hasSameBaseKey(addr: string, msgId: string, baseKey: Uint8Array): boolean {
		const stored = this.baseKeys.get(`${addr}:${msgId}`)
		if (!stored || stored.length !== baseKey.length) {
			return false
		}

		for (let i = 0; i < stored.length; i++) {
			if (stored[i] !== baseKey[i]) return false
		}

		return true
	}

	deleteBaseKey(addr: string, msgId: string): void {
		this.baseKeys.delete(`${addr}:${msgId}`)
	}

	private keyToString(key: RecentMessageKey): string {
		return `${key.to}${MESSAGE_KEY_SEPARATOR}${key.id}`
	}

	private removeRecentMessage(messageId: string, to?: string): void {
		if (to) {
			const keyStr = this.keyToString({ to, id: messageId })
			this.recentMessagesMap.delete(keyStr)

			const indexSet = this.messageKeyIndex.get(messageId)
			if (indexSet) {
				indexSet.delete(keyStr)
				if (indexSet.size === 0) {
					this.messageKeyIndex.delete(messageId)
				}
			}

			return
		}

		const indexSet = this.messageKeyIndex.get(messageId)
		if (!indexSet) {
			return
		}

		for (const keyStr of indexSet) {
			this.recentMessagesMap.delete(keyStr)
		}

		this.messageKeyIndex.delete(messageId)
	}
			}
			
