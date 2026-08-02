import { LRUCache } from 'lru-cache'
import type { WAMessage } from '../Types/Message'
import { downloadMediaMessage, extractMessageContent, getContentType } from './messages.js'
import type { MediaDownloadOptions } from './messages-media.js'
import type { ILogger } from './logger'

export type MediaCacheOptions = {
	maxItems?: number
	maxBytes?: number
	reuploadRequest?: (msg: WAMessage) => Promise<WAMessage>
	logger?: ILogger
}

const getMediaHash = (message: WAMessage): string | undefined => {
	const mContent = extractMessageContent(message.message)
	if (!mContent) {
		return undefined
	}

	const contentType = getContentType(mContent)
	if (!contentType) {
		return undefined
	}

	const media = mContent[contentType] as { fileSha256?: Uint8Array } | undefined
	if (!media?.fileSha256) {
		return undefined
	}

	return Buffer.from(media.fileSha256).toString('base64')
}

export const makeMediaCache = (opts: MediaCacheOptions = {}) => {
	const cache = new LRUCache<string, Buffer>({
		max: opts.maxItems ?? 200,
		maxSize: opts.maxBytes ?? 200 * 1024 * 1024,
		sizeCalculation: (value: Buffer) => value.byteLength || 1
	})

	const inflight = new Map<string, Promise<Buffer>>()

	const download = async (message: WAMessage, options: MediaDownloadOptions): Promise<Buffer> => {
		const hash = getMediaHash(message)
		if (!hash) {
			return downloadMediaMessage(message, 'buffer', options, {
				reuploadRequest: opts.reuploadRequest || (async m => m),
				logger: opts.logger || ({ info: () => undefined, debug: () => undefined } as unknown as ILogger)
			})
		}

		const cached = cache.get(hash)
		if (cached) {
			return cached
		}

		const running = inflight.get(hash)
		if (running) {
			return running
		}

		const promise = downloadMediaMessage(message, 'buffer', options, {
			reuploadRequest: opts.reuploadRequest || (async m => m),
			logger: opts.logger || ({ info: () => undefined, debug: () => undefined } as unknown as ILogger)
		})
			.then(buf => {
				cache.set(hash, buf)
				inflight.delete(hash)
				return buf
			})
			.catch(err => {
				inflight.delete(hash)
				throw err
			})

		inflight.set(hash, promise)
		return promise
	}

	const has = (message: WAMessage): boolean => {
		const hash = getMediaHash(message)
		return hash ? cache.has(hash) : false
	}

	const clear = () => {
		cache.clear()
		inflight.clear()
	}

	return {
		download,
		has,
		clear,
		size: () => cache.size
	}
}

export type MediaCache = ReturnType<typeof makeMediaCache>
