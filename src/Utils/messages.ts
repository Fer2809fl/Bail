import { Boom } from '@neykoor/boom'
import { createCipheriv, createHash, createHmac, randomBytes } from 'crypto'
import { promises as fs } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { type Transform } from 'stream'
import { proto } from '../../WAProto/index.js'
import {
	CALL_AUDIO_PREFIX,
	CALL_VIDEO_PREFIX,
	MEDIA_KEYS,
	type MediaType,
	URL_REGEX,
	WA_DEFAULT_EPHEMERAL
} from '../Defaults'
import type {
	AnyMediaMessageContent,
	AnyMessageContent,
	DownloadableMessage,
	MessageContentGenerationOptions,
	MessageGenerationOptions,
	MessageGenerationOptionsFromContent,
	MessageUserReceipt,
	MessageWithContextInfo,
	WAMediaUpload,
	WAMessage,
	WAMessageContent,
	WAMessageKey,
	WAStickerPackContent,
	WATextMessage
} from '../Types'
import { CarouselCardType, ListType, WAMessageStatus, WAProto } from '../Types'
import { isJidGroup, isJidNewsletter, isJidStatusBroadcast, isLidUser, isPnUser, jidNormalizedUser } from '../WABinary'
import { sha256 } from './crypto'
import { generateMessageIDV2, getKeyAuthor, unixTimestampSeconds } from './generics'
import type { ILogger } from './logger'
import {
	downloadContentFromMessage,
	encryptedStream,
	generateThumbnail,
	getAudioDuration,
	getAudioWaveform,
	getMediaKeys,
	getRawMediaUploadData,
	getStream,
	toBuffer,
	transcodeAudioToOpus,
	type MediaDownloadOptions
} from './messages-media'
import { shouldIncludeReportingToken } from './reporting-utils'

type ExtractByKey<T, K extends PropertyKey> = T extends Record<K, any> ? T : never
type RequireKey<T, K extends keyof T> = T & {
	[P in K]-?: Exclude<T[P], null | undefined>
}

type WithKey<T, K extends PropertyKey> = T extends unknown ? (K extends keyof T ? RequireKey<T, K> : never) : never

type MediaUploadData = {
	media: WAMediaUpload
	caption?: string
	ptt?: boolean
	ptv?: boolean
	seconds?: number
	gifPlayback?: boolean
	fileName?: string
	jpegThumbnail?: string
	mimetype?: string
	width?: number
	height?: number
	waveform?: Uint8Array
	backgroundArgb?: number
}

const MIMETYPE_MAP: { [T in MediaType]?: string } = {
	image: 'image/jpeg',
	video: 'video/mp4',
	document: 'application/pdf',
	audio: 'audio/ogg; codecs=opus',
	sticker: 'image/webp',
	'product-catalog-image': 'image/jpeg'
}

const MessageTypeProto = {
	image: WAProto.Message.ImageMessage,
	video: WAProto.Message.VideoMessage,
	audio: WAProto.Message.AudioMessage,
	sticker: WAProto.Message.StickerMessage,
	document: WAProto.Message.DocumentMessage
} as const


export const extractUrlFromText = (text: string) => text.match(URL_REGEX)?.[0]

export const generateLinkPreviewIfRequired = async (
	text: string,
	getUrlInfo: MessageGenerationOptions['getUrlInfo'],
	logger: MessageGenerationOptions['logger']
) => {
	const url = extractUrlFromText(text)
	if (!!getUrlInfo && url) {
		try {
			const urlInfo = await getUrlInfo(url)
			return urlInfo
		} catch (error: any) {
			logger?.warn({ trace: error.stack }, 'url generation failed')
		}
	}
}

const assertColor = async (color: any) => {
	let assertedColor
	if (typeof color === 'number') {
		assertedColor = color > 0 ? color : 0xffffffff + Number(color) + 1
	} else {
		let hex = color.trim().replace('#', '')
		if (hex.length <= 6) {
			hex = 'FF' + hex.padStart(6, '0')
		}

		assertedColor = parseInt(hex, 16)
		return assertedColor
	}
}

const isWebPBuffer = (buf: Buffer): boolean =>
	buf.length >= 12 &&
	buf[0] === 0x52 &&
	buf[1] === 0x49 &&
	buf[2] === 0x46 &&
	buf[3] === 0x46 &&
	buf[8] === 0x57 &&
	buf[9] === 0x45 &&
	buf[10] === 0x42 &&
	buf[11] === 0x50

const isAnimatedWebP = (buf: Buffer): boolean => {
	if (!isWebPBuffer(buf)) {
		return false
	}

	let offset = 12
	while (offset < buf.length - 8) {
		const fourCC = buf.toString('ascii', offset, offset + 4)
		const chunkSize = buf.readUInt32LE(offset + 4)
		if (fourCC === 'VP8X') {
			const flagsOffset = offset + 8
			if (flagsOffset < buf.length && (buf[flagsOffset]! & 0x02) !== 0) {
				return true
			}
		} else if (fourCC === 'ANIM' || fourCC === 'ANMF') {
			return true
		}

		offset += 8 + chunkSize + (chunkSize % 2)
	}

	return false
}

const encryptMediaBuffer = async (buf: Buffer, mediaKey: Buffer) => {
	const { cipherKey, iv, macKey } = await getMediaKeys(mediaKey, 'sticker-pack')
	const aes = createCipheriv('aes-256-cbc', cipherKey, iv)
	const hmac = createHmac('sha256', macKey!).update(iv)
	const encPart1 = aes.update(buf)
	const encPart2 = aes.final()
	hmac.update(encPart1).update(encPart2)
	const mac = hmac.digest().subarray(0, 10)
	const encBody = Buffer.concat([encPart1, encPart2, mac])
	const fileEncSha256 = createHash('sha256').update(encPart1).update(encPart2).update(mac).digest()
	const fileSha256 = createHash('sha256').update(buf).digest()
	return { encBody, fileSha256, fileEncSha256 }
}

export const generateStickerPackMessage = async (
	stickerPack: WAStickerPackContent,
	options: MessageContentGenerationOptions
): Promise<proto.Message.IStickerPackMessage> => {
	const { stickers, cover, name, publisher, packId, description } = stickerPack
	if (!stickers || stickers.length === 0) {
		throw new Boom('Sticker pack must contain at least one sticker', { statusCode: 400 })
	}

	if (stickers.length > 120) {
		throw new Boom('Sticker pack exceeds the maximum limit of 120 stickers', { statusCode: 400 })
	}

	const [sharpLib, jimpLib] = await Promise.all([
		//@ts-ignore sharp is an optional peer dependency and may not ship types in every environment
		import('sharp').catch(() => null),
		import('jimp').catch(() => null)
	])

	const stickerPackId = packId || generateMessageIDV2()
	const stickerData: import('fflate').Zippable = {}

	const stickerMetadata = await Promise.all(
		stickers.map(async (s, i) => {
			const source = s.sticker ?? s.data
			if (!source) {
				throw new Boom(`Sticker at index ${i} is missing its image data`, { statusCode: 400 })
			}

			const { stream } = await getStream(source)
			const buffer = await toBuffer(stream)

			let webpBuffer: Buffer
			let isAnimated = false
			if (isWebPBuffer(buffer)) {
				webpBuffer = buffer
				isAnimated = isAnimatedWebP(buffer)
			} else if (sharpLib) {
				webpBuffer = await sharpLib.default(buffer).webp().toBuffer()
			} else if (jimpLib) {
				const Jimp = (jimpLib as any).Jimp || (jimpLib as any).default
				const jimpImage = await Jimp.read(buffer)
				webpBuffer = await jimpImage
					.resize({ w: 512, h: 512, mode: (jimpLib as any).ResizeStrategy?.BILINEAR })
					.getBuffer('image/webp')
			} else {
				webpBuffer = buffer
			}

			if (webpBuffer.length > 1024 * 1024) {
				throw new Boom(`Sticker at index ${i} exceeds the 1MB size limit`, { statusCode: 400 })
			}

			const fileName = `${i + 1}.webp`
			stickerData[fileName] = [new Uint8Array(webpBuffer), { level: 0 }]

			return {
				fileName,
				mimetype: 'image/webp',
				isAnimated: s.isAnimated !== undefined ? s.isAnimated : isAnimated,
				isLottie: s.isLottie || false,
				emojis: s.emojis || [],
				accessibilityLabel: s.accessibilityLabel || ''
			}
		})
	)

	const { stream: coverStream } = await getStream(cover)
	const coverBuffer = await toBuffer(coverStream)
	const coverFileName = `${stickerPackId}.webp`
	stickerData[coverFileName] = [new Uint8Array(coverBuffer), { level: 0 }]

	const { zipSync } = await import('fflate')
	const zipBuffer = Buffer.from(zipSync(stickerData))

	const mediaKey = randomBytes(32)

	const zipEnc = await encryptMediaBuffer(zipBuffer, mediaKey)
	const zipEncPath = join(tmpdir(), 'stickerpack_' + stickerPackId)
	await fs.writeFile(zipEncPath, zipEnc.encBody)
	let stickerPackUploadResult: { mediaUrl: string; directPath: string }
	try {
		stickerPackUploadResult = await options.upload(zipEncPath, {
			fileEncSha256B64: zipEnc.fileEncSha256.toString('base64'),
			mediaType: 'sticker-pack',
			timeoutMs: options.mediaUploadTimeoutMs
		})
	} finally {
		await fs.unlink(zipEncPath).catch(() => {})
	}

	const thumbEnc = await encryptMediaBuffer(coverBuffer, mediaKey)
	const thumbEncPath = join(tmpdir(), 'stickerthumb_' + stickerPackId)
	await fs.writeFile(thumbEncPath, thumbEnc.encBody)
	let thumbUploadResult: { mediaUrl: string; directPath: string }
	try {
		thumbUploadResult = await options.upload(thumbEncPath, {
			fileEncSha256B64: thumbEnc.fileEncSha256.toString('base64'),
			mediaType: 'thumbnail-sticker-pack',
			timeoutMs: options.mediaUploadTimeoutMs
		})
	} finally {
		await fs.unlink(thumbEncPath).catch(() => {})
	}

	const imageDataHash = sha256(coverBuffer).toString('base64')

	return {
		name,
		publisher,
		stickerPackId,
		packDescription: description,
		stickerPackOrigin: proto.Message.StickerPackMessage.StickerPackOrigin.USER_CREATED,
		stickerPackSize: zipBuffer.length,
		stickers: stickerMetadata,
		fileSha256: zipEnc.fileSha256,
		fileEncSha256: zipEnc.fileEncSha256,
		mediaKey,
		directPath: stickerPackUploadResult.directPath,
		fileLength: zipBuffer.length,
		mediaKeyTimestamp: unixTimestampSeconds(),
		trayIconFileName: coverFileName,
		imageDataHash,
		thumbnailDirectPath: thumbUploadResult.directPath,
		thumbnailSha256: thumbEnc.fileSha256,
		thumbnailEncSha256: thumbEnc.fileEncSha256,
		thumbnailHeight: 96,
		thumbnailWidth: 96
	}
}

export const prepareWAMessageMedia = async (
	message: AnyMediaMessageContent,
	options: MessageContentGenerationOptions
) => {
	const logger = options.logger

	let mediaType: (typeof MEDIA_KEYS)[number] | undefined
	for (const key of MEDIA_KEYS) {
		if (key in message) {
			mediaType = key
		}
	}

	if (!mediaType) {
		throw new Boom('Invalid media type', { statusCode: 400 })
	}

	const uploadData: MediaUploadData = {
		...message,
		media: (message as any)[mediaType]
	}
	delete (uploadData as any)[mediaType]
	const cacheableKey =
		typeof uploadData.media === 'object' &&
		'url' in uploadData.media &&
		!!uploadData.media.url &&
		!!options.mediaCache &&
		mediaType + ':' + uploadData.media.url.toString()

	if (mediaType === 'document' && !uploadData.fileName) {
		uploadData.fileName = 'file'
	}

	if (!uploadData.mimetype) {
		uploadData.mimetype = MIMETYPE_MAP[mediaType]
	}

	let pttTranscodedPath: string | undefined
	if (mediaType === 'audio' && uploadData.ptt === true) {
		const media: any = uploadData.media
		const mediaUrl = typeof media === 'string' ? media : media?.url?.toString?.() || ''
		const sourceLooksLikeOpus = /\.(opus|ogg)(\?|$)/i.test(mediaUrl)

		if (!sourceLooksLikeOpus) {
			const sourceForTranscode: string | Buffer = Buffer.isBuffer(media) ? media : typeof media === 'string' ? media : mediaUrl
			pttTranscodedPath = await transcodeAudioToOpus(sourceForTranscode)
			uploadData.media = { url: pttTranscodedPath } as unknown as typeof uploadData.media
		}

		uploadData.mimetype = 'audio/ogg; codecs=opus'
	}

	if (cacheableKey) {
		const mediaBuff = await options.mediaCache!.get<Buffer>(cacheableKey)
		if (mediaBuff) {
			logger?.debug({ cacheableKey }, 'got media cache hit')

			const obj = proto.Message.decode(mediaBuff)
			const key = `${mediaType}Message`

			Object.assign(obj[key as keyof proto.Message]!, { ...uploadData, media: undefined })

			return obj
		}
	}

	const isNewsletter = !!options.jid && isJidNewsletter(options.jid)
	if (isNewsletter) {
		logger?.info({ key: cacheableKey }, 'Preparing raw media for newsletter')
		const { filePath, fileSha256, fileLength } = await getRawMediaUploadData(
			uploadData.media,
			options.mediaTypeOverride || mediaType,
			logger
		)

		const fileSha256B64 = fileSha256.toString('base64')
		const { mediaUrl, directPath, thumbnailDirectPath, thumbnailSha256 } = await options.upload(filePath, {
			fileEncSha256B64: fileSha256B64,
			mediaType: mediaType,
			timeoutMs: options.mediaUploadTimeoutMs,
			newsletter: isNewsletter
		})

		await fs.unlink(filePath)

		const obj = WAProto.Message.fromObject({
			[`${mediaType}Message`]: (MessageTypeProto as any)[mediaType].fromObject({
				url: mediaUrl,
				directPath,
				fileSha256,
				fileLength,
				thumbnailDirectPath,
				thumbnailSha256,
				...uploadData,
				media: undefined
			})
		})

		if (uploadData.ptv) {
			obj.ptvMessage = obj.videoMessage
			delete obj.videoMessage
		}

		if (obj.stickerMessage) {
			obj.stickerMessage.stickerSentTs = Date.now()
		}

		if (cacheableKey) {
			logger?.debug({ cacheableKey }, 'set cache')
			await options.mediaCache!.set(cacheableKey, WAProto.Message.encode(obj).finish())
		}

		return obj
	}

	const requiresDurationComputation = mediaType === 'audio' && typeof uploadData.seconds === 'undefined'
	const requiresThumbnailComputation =
		(mediaType === 'image' || mediaType === 'video') && typeof uploadData['jpegThumbnail'] === 'undefined'
	const requiresWaveformProcessing =
		mediaType === 'audio' && uploadData.ptt === true && typeof uploadData.waveform === 'undefined'
	const requiresAudioBackground = options.backgroundColor && mediaType === 'audio' && uploadData.ptt === true
	const requiresOriginalForSomeProcessing = requiresDurationComputation || requiresThumbnailComputation
	const { mediaKey, encFilePath, originalFilePath, fileEncSha256, fileSha256, fileLength } = await encryptedStream(
		uploadData.media,
		options.mediaTypeOverride || mediaType,
		{
			logger,
			saveOriginalFileIfRequired: requiresOriginalForSomeProcessing,
			opts: options.options
		}
	)

	const fileEncSha256B64 = fileEncSha256.toString('base64')
	const [{ mediaUrl, directPath }] = await Promise.all([
		(async () => {
			const result = await options.upload(encFilePath, {
				fileEncSha256B64,
				mediaType,
				timeoutMs: options.mediaUploadTimeoutMs
			})
			logger?.debug({ mediaType, cacheableKey }, 'uploaded media')
			return result
		})(),
		(async () => {
			try {
				if (requiresThumbnailComputation) {
					const { thumbnail, originalImageDimensions } = await generateThumbnail(
						originalFilePath!,
						mediaType as 'image' | 'video',
						options
					)
					uploadData.jpegThumbnail = thumbnail
					if (!uploadData.width && originalImageDimensions) {
						uploadData.width = originalImageDimensions.width
						uploadData.height = originalImageDimensions.height
						logger?.debug('set dimensions')
					}

					logger?.debug('generated thumbnail')
				}

				if (requiresDurationComputation) {
					uploadData.seconds = await getAudioDuration(originalFilePath!)
					logger?.debug('computed audio duration')
				}

				if (requiresWaveformProcessing) {
					uploadData.waveform = await getAudioWaveform(originalFilePath!, logger)
					logger?.debug('processed waveform')
				}

				if (requiresAudioBackground) {
					uploadData.backgroundArgb = await assertColor(options.backgroundColor)
					logger?.debug('computed backgroundColor audio status')
				}
			} catch (error) {
				logger?.warn({ trace: (error as any).stack }, 'failed to obtain extra info')
			}
		})()
	]).finally(async () => {
		try {
			await fs.unlink(encFilePath)
			if (originalFilePath) {
				await fs.unlink(originalFilePath)
			}
			if (pttTranscodedPath) {
				await fs.unlink(pttTranscodedPath)
			}

			logger?.debug('removed tmp files')
		} catch (error) {
			logger?.warn('failed to remove tmp file')
		}
	})

	const obj = WAProto.Message.fromObject({
		[`${mediaType}Message`]: MessageTypeProto[mediaType as keyof typeof MessageTypeProto].fromObject({
			url: mediaUrl,
			directPath,
			mediaKey,
			fileEncSha256,
			fileSha256,
			fileLength,
			mediaKeyTimestamp: unixTimestampSeconds(),
			...uploadData,
			media: undefined
		} as any)
	})

	if (uploadData.ptv) {
		obj.ptvMessage = obj.videoMessage
		delete obj.videoMessage
	}

	if (cacheableKey) {
		logger?.debug({ cacheableKey }, 'set cache')
		await options.mediaCache!.set(cacheableKey, WAProto.Message.encode(obj).finish())
	}

	return obj
}

export const prepareDisappearingMessageSettingContent = (ephemeralExpiration?: number) => {
	ephemeralExpiration = ephemeralExpiration || 0
	const content: WAMessageContent = {
		ephemeralMessage: {
			message: {
				protocolMessage: {
					type: WAProto.Message.ProtocolMessage.Type.EPHEMERAL_SETTING,
					ephemeralExpiration
				}
			}
		}
	}
	return WAProto.Message.fromObject(content)
}


export const generateForwardMessageContent = (message: WAMessage, forceForward?: boolean) => {
	let content = message.message
	if (!content) {
		throw new Boom('no content in message', { statusCode: 400 })
	}

	content = normalizeMessageContent(content)
	content = proto.Message.decode(proto.Message.encode(content!).finish())

	let key = Object.keys(content)[0] as keyof proto.IMessage

	let score = (content?.[key] as { contextInfo: proto.IContextInfo })?.contextInfo?.forwardingScore || 0
	score += message.key.fromMe && !forceForward ? 0 : 1
	if (key === 'conversation') {
		content.extendedTextMessage = { text: content[key] }
		delete content.conversation

		key = 'extendedTextMessage'
	}

	const key_ = content?.[key] as { contextInfo: proto.IContextInfo }
	if (score > 0) {
		key_.contextInfo = { forwardingScore: score, isForwarded: true }
	} else {
		key_.contextInfo = {}
	}

	return content
}

export const hasNonNullishProperty = <K extends PropertyKey>(
	message: AnyMessageContent,
	key: K
): message is ExtractByKey<AnyMessageContent, K> => {
	return (
		typeof message === 'object' &&
		message !== null &&
		key in message &&
		(message as any)[key] !== null &&
		(message as any)[key] !== undefined
	)
}

function hasOptionalProperty<T, K extends PropertyKey>(obj: T, key: K): obj is WithKey<T, K> {
	return typeof obj === 'object' && obj !== null && key in obj && (obj as any)[key] !== null
}

const prepareNativeFlowButtons = (message: any) => {
	const buttons = message.nativeFlow
	const correctedField = Array.isArray(buttons) ? buttons : buttons.buttons

	return {
		buttons: correctedField.map((button: any) => {
			const buttonText = button.text || button.buttonText
			const icon = button.icon?.toUpperCase()

			if (button.id) {
				return {
					name: 'quick_reply',
					buttonParamsJson: JSON.stringify({ display_text: buttonText || 'Click', id: button.id, icon })
				}
			} else if (button.copy) {
				return {
					name: 'cta_copy',
					buttonParamsJson: JSON.stringify({ display_text: buttonText || 'Copy', copy_code: button.copy, icon })
				}
			} else if (button.url) {
				return {
					name: 'cta_url',
					buttonParamsJson: JSON.stringify({
						display_text: buttonText || 'Visit',
						url: button.url,
						merchant_url: button.url,
						webview_interaction: button.useWebview,
						icon
					})
				}
			} else if (button.call) {
				return {
					name: 'cta_call',
					buttonParamsJson: JSON.stringify({ display_text: buttonText || 'Call', phone_number: button.call, icon })
				}
			} else if (button.sections) {
				return {
					name: 'single_select',
					buttonParamsJson: JSON.stringify({ title: buttonText || 'Select', sections: button.sections, icon })
				}
			}

			return { name: button.name, buttonParamsJson: button.paramsJson }
		})
	}
}

export const hasValidInteractiveHeader = (message: any) => {
	return !!(
		message.imageMessage ||
		message.videoMessage ||
		message.documentMessage ||
		message.productMessage ||
		message.locationMessage
	)
}

export const hasValidCarouselHeader = (message: any) => {
	return !!(message.imageMessage || message.videoMessage || message.productMessage)
}

export const generateWAMessageContent = async (
	message: AnyMessageContent,
	options: MessageContentGenerationOptions
) => {
	let m: WAMessageContent = {}
	if (hasNonNullishProperty(message, 'raw')) {
		delete (message as { raw?: boolean }).raw
		return message as unknown as WAMessageContent
	} else if (hasNonNullishProperty(message, 'buttons')) {
		const nativeButtons = (message as any).buttons.map((button: any) => {
			if (button.nativeFlowInfo) {
				return { name: button.nativeFlowInfo.name, buttonParamsJson: button.nativeFlowInfo.paramsJson }
			}

			if (button.name && (button.buttonParamsJson || button.paramsJson)) {
				return { name: button.name, buttonParamsJson: button.buttonParamsJson || button.paramsJson }
			}

			const buttonText =
				button.text || (typeof button.buttonText === 'string' ? button.buttonText : button.buttonText?.displayText)
			const id = button.id || button.buttonId || buttonText
			const icon = button.icon?.toUpperCase()

			if (button.sections) {
				return {
					name: 'single_select',
					buttonParamsJson: JSON.stringify({ title: buttonText || 'Select', sections: button.sections, icon })
				}
			} else if (button.url) {
				return {
					name: 'cta_url',
					buttonParamsJson: JSON.stringify({
						display_text: buttonText || 'Visit',
						url: button.url,
						merchant_url: button.url,
						webview_interaction: button.useWebview,
						icon
					})
				}
			} else if (button.call) {
				return {
					name: 'cta_call',
					buttonParamsJson: JSON.stringify({ display_text: buttonText || 'Call', phone_number: button.call, icon })
				}
			} else if (button.copy) {
				return {
					name: 'cta_copy',
					buttonParamsJson: JSON.stringify({ display_text: buttonText || 'Copy', copy_code: button.copy, icon })
				}
			}

			return {
				name: 'quick_reply',
				buttonParamsJson: JSON.stringify({ display_text: buttonText || 'Click', id, icon })
			}
		})

		const interactiveMessage: any = {
			nativeFlowMessage: { buttons: nativeButtons, messageParamsJson: '{}' }
		}

		if ((message as any).text) {
			interactiveMessage.body = { text: (message as any).text }
			interactiveMessage.header = { title: '', subtitle: '', hasMediaAttachment: false }
		} else {
			const media = await prepareWAMessageMedia(message as unknown as AnyMediaMessageContent, options)
			const mediaKey = Object.keys(media)[0]
			if (!mediaKey) {
				throw new Boom('buttons message needs either "text" or a media field (image/video/document) as header', {
					statusCode: 400
				})
			}

			interactiveMessage.body = { text: (message as any).caption || '' }
			interactiveMessage.header = {
				title: '',
				subtitle: '',
				hasMediaAttachment: true,
				...media
			}
		}

		if ((message as any).footer) {
			interactiveMessage.footer = { text: (message as any).footer }
		}

		m.interactiveMessage = interactiveMessage
	} else if (hasNonNullishProperty(message, 'sections')) {
		m.listMessage = {
			sections: (message as any).sections,
			buttonText: (message as any).buttonText,
			title: (message as any).title,
			footerText: (message as any).footer,
			description: (message as any).description,
			listType: ListType.SINGLE_SELECT
		}
	} else if (hasNonNullishProperty(message, 'templateButtons')) {
		const hydratedTemplate: any = {
			hydratedButtons: (message as any).templateButtons.map((button: any, i: number) => {
				const buttonText = button.text || button.buttonText
				if (button.id) {
					return { index: i, quickReplyButton: { displayText: buttonText || 'Click', id: button.id } }
				} else if (button.url) {
					return { index: i, urlButton: { displayText: buttonText || 'Visit', url: button.url } }
				} else if (button.call) {
					return { index: i, callButton: { displayText: buttonText || 'Call', phoneNumber: button.call } }
				}

				button.index = button.index || i
				return button
			})
		}

		if ((message as any).text) {
			hydratedTemplate.hydratedContentText = (message as any).text
		} else {
			const media = await prepareWAMessageMedia(message as unknown as AnyMediaMessageContent, options)
			if ((message as any).caption) {
				hydratedTemplate.hydratedTitleText = (message as any).title
				hydratedTemplate.hydratedContentText = (message as any).caption
			}

			Object.assign(hydratedTemplate, media)
		}

		if ((message as any).footer) {
			hydratedTemplate.hydratedFooterText = (message as any).footer
		}

		hydratedTemplate.templateId = (message as any).id || `template-${Date.now()}`
		m.templateMessage = {
			hydratedFourRowTemplate: hydratedTemplate,
			hydratedTemplate
		} as any
	} else if (hasNonNullishProperty(message, 'nativeFlow')) {
		const interactiveMessage: any = {
			nativeFlowMessage: prepareNativeFlowButtons(message)
		}

		if ((message as any).text) {
			interactiveMessage.body = { text: (message as any).text }
		} else {
			const media = await prepareWAMessageMedia(message as unknown as AnyMediaMessageContent, options)
			if ((message as any).caption) {
				const isValidHeader = hasValidInteractiveHeader(media)
				if (!isValidHeader) {
					throw new Boom('Invalid media type for interactive message header', { statusCode: 400 })
				}

				interactiveMessage.header = {
					title: (message as any).title || '',
					subtitle: (message as any).subtitle || '',
					hasMediaAttachment: isValidHeader
				}
				interactiveMessage.body = { text: (message as any).caption }
			}

			Object.assign(interactiveMessage.header || (interactiveMessage.header = {}), media)
		}

		if ((message as any).audioFooter) {
			const { audioMessage } = await prepareWAMessageMedia({ audio: (message as any).audioFooter }, options)
			interactiveMessage.footer = { audioMessage, hasMediaAttachment: true }
		} else if ((message as any).footer) {
			interactiveMessage.footer = { text: (message as any).footer }
		}

		m.interactiveMessage = interactiveMessage
	} else if (hasNonNullishProperty(message, 'cards')) {
		const interactiveMessage: any = {
			carouselMessage: {
				cards: await Promise.all(
					(message as any).cards.map(async (card: any) => {
						const carouselHeader = await prepareWAMessageMedia(card, options).catch(() => ({}) as any)
						const isValidHeader = hasValidCarouselHeader(carouselHeader)
						if (!isValidHeader) {
							throw new Boom('Invalid media type for carousel card', { statusCode: 400 })
						}

						const carouselCard: any = {
							nativeFlowMessage: prepareNativeFlowButtons({ nativeFlow: card.nativeFlow || [] })
						}

						if (card.text) {
							carouselCard.body = { text: card.text }
						} else if (card.caption) {
							carouselCard.header = {
								title: card.title || '',
								subtitle: card.subtitle || '',
								hasMediaAttachment: isValidHeader,
								...carouselHeader
							}
							carouselCard.body = { text: card.caption }
						}

						if (card.audioFooter) {
							const { audioMessage } = await prepareWAMessageMedia({ audio: card.audioFooter }, options)
							carouselCard.footer = { audioMessage, hasMediaAttachment: true }
						} else if (card.footer) {
							carouselCard.footer = { text: card.footer }
						}

						if (card.contextInfo) {
							carouselCard.contextInfo = card.contextInfo
						}

						return carouselCard
					})
				),
				carouselCardType: CarouselCardType.UNKNOWN,
				messageVersion: 1
			}
		}

		if ((message as any).footer) {
			interactiveMessage.footer = { text: (message as any).footer }
		}

		m.interactiveMessage = interactiveMessage
	} else if (hasNonNullishProperty(message, 'text')) {
		const extContent = { text: message.text } as WATextMessage

		let urlInfo = message.linkPreview
		if (typeof urlInfo === 'undefined') {
			urlInfo = await generateLinkPreviewIfRequired(message.text, options.getUrlInfo, options.logger)
		}

		if (urlInfo) {
			extContent.matchedText = urlInfo['matched-text']
			extContent.jpegThumbnail = urlInfo.jpegThumbnail
			extContent.description = urlInfo.description
			extContent.title = urlInfo.title
			extContent.previewType = 0

			const img = urlInfo.highQualityThumbnail
			if (img) {
				extContent.thumbnailDirectPath = img.directPath
				extContent.mediaKey = img.mediaKey
				extContent.mediaKeyTimestamp = img.mediaKeyTimestamp
				extContent.thumbnailWidth = img.width
				extContent.thumbnailHeight = img.height
				extContent.thumbnailSha256 = img.fileSha256
				extContent.thumbnailEncSha256 = img.fileEncSha256
			}
		}

		if (options.backgroundColor) {
			extContent.backgroundArgb = await assertColor(options.backgroundColor)
		}

		if (options.font) {
			extContent.font = options.font
		}

		m.extendedTextMessage = extContent
	} else if (hasNonNullishProperty(message, 'contacts')) {
		const contactLen = message.contacts.contacts.length
		if (!contactLen) {
			throw new Boom('require atleast 1 contact', { statusCode: 400 })
		}

		if (contactLen === 1) {
			m.contactMessage = WAProto.Message.ContactMessage.create(message.contacts.contacts[0])
		} else {
			m.contactsArrayMessage = WAProto.Message.ContactsArrayMessage.create(message.contacts)
		}
	} else if (hasNonNullishProperty(message, 'location')) {
		m.locationMessage = WAProto.Message.LocationMessage.create(message.location)
	} else if (hasNonNullishProperty(message, 'react')) {
		if (!message.react.senderTimestampMs) {
			message.react.senderTimestampMs = Date.now()
		}

		m.reactionMessage = WAProto.Message.ReactionMessage.create(message.react)
	} else if (hasNonNullishProperty(message, 'delete')) {
		m.protocolMessage = {
			key: message.delete,
			type: WAProto.Message.ProtocolMessage.Type.REVOKE
		}
	} else if (hasNonNullishProperty(message, 'forward')) {
		m = generateForwardMessageContent(message.forward, message.force)
	} else if (hasNonNullishProperty(message, 'disappearingMessagesInChat')) {
		const exp =
			typeof message.disappearingMessagesInChat === 'boolean'
				? message.disappearingMessagesInChat
					? WA_DEFAULT_EPHEMERAL
					: 0
				: message.disappearingMessagesInChat
		m = prepareDisappearingMessageSettingContent(exp)
	} else if (hasNonNullishProperty(message, 'groupInvite')) {
		m.groupInviteMessage = {}
		m.groupInviteMessage.inviteCode = message.groupInvite.inviteCode
		m.groupInviteMessage.inviteExpiration = message.groupInvite.inviteExpiration
		m.groupInviteMessage.caption = message.groupInvite.text

		m.groupInviteMessage.groupJid = message.groupInvite.jid
		m.groupInviteMessage.groupName = message.groupInvite.subject
		if (options.getProfilePicUrl) {
			const pfpUrl = await options.getProfilePicUrl(message.groupInvite.jid, 'preview')
			if (pfpUrl) {
				const resp = await fetch(pfpUrl, { method: 'GET', dispatcher: options?.options?.dispatcher })
				if (resp.ok) {
					const buf = Buffer.from(await resp.arrayBuffer())
					m.groupInviteMessage.jpegThumbnail = buf
				}
			}
		}
	} else if (hasNonNullishProperty(message, 'pin')) {
		m.pinInChatMessage = {}
		m.messageContextInfo = {}

		m.pinInChatMessage.key = message.pin
		m.pinInChatMessage.type = message.type
		m.pinInChatMessage.senderTimestampMs = Date.now()

		m.messageContextInfo.messageAddOnDurationInSecs = message.type === 1 ? message.time || 86400 : 0
	} else if (hasOptionalProperty(message, 'ptv') && message.ptv) {
		const { videoMessage } = await prepareWAMessageMedia({ video: message.video }, options)
		m.ptvMessage = videoMessage
	} else if (hasNonNullishProperty(message, 'product')) {
		const { imageMessage } = await prepareWAMessageMedia({ image: message.product.productImage }, options)
		m.productMessage = WAProto.Message.ProductMessage.create({
			...message,
			product: {
				...message.product,
				productImage: imageMessage
			}
		})
	} else if (hasNonNullishProperty(message, 'listReply')) {
		m.listResponseMessage = { ...message.listReply }
	} else if (hasNonNullishProperty(message, 'event')) {
		m.eventMessage = {}
		const startTime = Math.floor(message.event.startDate.getTime() / 1000)

		if (message.event.call && options.getCallLink) {
			const token = await options.getCallLink(message.event.call, { startTime })
			m.eventMessage.joinLink = (message.event.call === 'audio' ? CALL_AUDIO_PREFIX : CALL_VIDEO_PREFIX) + token
		}

		m.messageContextInfo = {
			messageSecret: message.event.messageSecret || randomBytes(32)
		}

		m.eventMessage.name = message.event.name
		m.eventMessage.description = message.event.description
		m.eventMessage.startTime = startTime
		m.eventMessage.endTime = message.event.endDate ? message.event.endDate.getTime() / 1000 : undefined
		m.eventMessage.isCanceled = message.event.isCancelled ?? false
		m.eventMessage.extraGuestsAllowed = message.event.extraGuestsAllowed
		m.eventMessage.isScheduleCall = message.event.isScheduleCall ?? false
		m.eventMessage.location = message.event.location
	} else if (hasNonNullishProperty(message, 'buttonReply')) {
		switch ((message as any).type) {
			case 'template':
				m.templateButtonReplyMessage = {
					selectedDisplayText: (message as any).buttonReply.displayText,
					selectedId: (message as any).buttonReply.id,
					selectedIndex: (message as any).buttonReply.index
				}
				break
			case 'plain':
				m.buttonsResponseMessage = {
					selectedButtonId: (message as any).buttonReply.id,
					selectedDisplayText: (message as any).buttonReply.displayText,
					type: proto.Message.ButtonsResponseMessage.Type.DISPLAY_TEXT
				}
				break
		}
	} else if (hasNonNullishProperty(message, 'poll')) {
		message.poll.selectableCount ||= 0
		message.poll.toAnnouncementGroup ||= false

		if (!Array.isArray(message.poll.values)) {
			throw new Boom('Invalid poll values', { statusCode: 400 })
		}

		if (message.poll.selectableCount < 0 || message.poll.selectableCount > message.poll.values.length) {
			throw new Boom(`poll.selectableCount in poll should be >= 0 and <= ${message.poll.values.length}`, {
				statusCode: 400
			})
		}

		m.messageContextInfo = {
			messageSecret: message.poll.messageSecret || randomBytes(32)
		}

		const pollCreationMessage = {
			name: message.poll.name,
			selectableOptionsCount: message.poll.selectableCount,
			options: message.poll.values.map(optionName => ({ optionName }))
		}

		if (message.poll.toAnnouncementGroup) {
			m.pollCreationMessageV2 = pollCreationMessage
		} else {
			if (message.poll.selectableCount === 1) {
				m.pollCreationMessageV3 = pollCreationMessage
			} else {
				m.pollCreationMessage = pollCreationMessage
			}
		}
	} else if (hasNonNullishProperty(message, 'album')) {
		m.albumMessage = {
			expectedImageCount: message.album.expectedImageCount,
			expectedVideoCount: message.album.expectedVideoCount
		}
	} else if (hasNonNullishProperty(message, 'sharePhoneNumber')) {
		m.protocolMessage = {
			type: proto.Message.ProtocolMessage.Type.SHARE_PHONE_NUMBER
		}
	} else if (hasNonNullishProperty(message, 'requestPhoneNumber')) {
		m.requestPhoneNumberMessage = {}
	} else if (hasNonNullishProperty(message, 'limitSharing')) {
		m.protocolMessage = {
			type: proto.Message.ProtocolMessage.Type.LIMIT_SHARING,
			limitSharing: {
				sharingLimited: message.limitSharing === true,
				trigger: 1,
				limitSharingSettingTimestamp: Date.now(),
				initiatedByMe: true
			}
		}
	} else if (hasNonNullishProperty(message, 'stickerPack')) {
		m.stickerPackMessage = await generateStickerPackMessage(message.stickerPack, options)
		m.stickerPackMessage.contextInfo = {
			...(message.contextInfo || {}),
			...(message.mentions ? { mentionedJid: message.mentions } : {})
		}
	} else {
		m = await prepareWAMessageMedia(message, options)
	}

	if (hasOptionalProperty(message, 'isLottie') && !!message.isLottie) {
		m = { lottieStickerMessage: { message: m } }
	}

	if (hasOptionalProperty(message, 'viewOnceV2Extension') && !!message.viewOnceV2Extension) {
		m = { viewOnceMessageV2Extension: { message: m } }
	} else if (hasOptionalProperty(message, 'viewOnceV2') && !!message.viewOnceV2) {
		m = { viewOnceMessageV2: { message: m } }
	} else if (hasOptionalProperty(message, 'viewOnce') && !!message.viewOnce) {
		m = { viewOnceMessage: { message: m } }
	}

	if (
		(hasOptionalProperty(message, 'mentions') && message.mentions?.length) ||
		(hasOptionalProperty(message, 'mentionAll') && message.mentionAll)
	) {
		const messageType = Object.keys(m)[0]! as Extract<keyof proto.IMessage, MessageWithContextInfo>
		const key = m[messageType]
		if (key && 'contextInfo' in key) {
			key.contextInfo = key.contextInfo || {}
			if (message.mentions?.length) {
				key.contextInfo.mentionedJid = message.mentions
			}

			if (message.mentionAll) {
				key.contextInfo.nonJidMentions = 1
			}
		} else if (key!) {
			key.contextInfo = {
				mentionedJid: message.mentions,
				nonJidMentions: message.mentionAll ? 1 : 0
			}
		}
	}

	if (hasOptionalProperty(message, 'edit')) {
		m = {
			protocolMessage: {
				key: message.edit,
				editedMessage: m,
				timestampMs: Date.now(),
				type: WAProto.Message.ProtocolMessage.Type.MESSAGE_EDIT
			}
		}
	}

	if (hasOptionalProperty(message, 'contextInfo') && !!message.contextInfo) {
		const messageType = Object.keys(m)[0]! as Extract<keyof proto.IMessage, MessageWithContextInfo>
		const key = m[messageType]
		if ('contextInfo' in key! && !!key.contextInfo) {
			key.contextInfo = { ...key.contextInfo, ...message.contextInfo }
		} else if (key!) {
			key.contextInfo = message.contextInfo
		}
	}

	if (hasOptionalProperty(message, 'albumParentKey') && !!message.albumParentKey) {
		m.messageContextInfo = {
			...m.messageContextInfo,
			messageAssociation: {
				associationType: WAProto.MessageAssociation.AssociationType.MEDIA_ALBUM,
				parentMessageKey: message.albumParentKey
			}
		}
	}

	if (shouldIncludeReportingToken(m)) {
		m.messageContextInfo = m.messageContextInfo || {}
		if (!m.messageContextInfo.messageSecret) {
			m.messageContextInfo.messageSecret = randomBytes(32)
		}
	}

	return WAProto.Message.create(m)
}

export const generateWAMessageFromContent = (
	jid: string,
	message: WAMessageContent,
	options: MessageGenerationOptionsFromContent
) => {
	if (!options.timestamp) {
		options.timestamp = new Date()
	}

	const innerMessage = normalizeMessageContent(message)!
	const key = getContentType(innerMessage)! as Exclude<keyof proto.IMessage, 'conversation'>
	const timestamp = unixTimestampSeconds(options.timestamp)
	const { quoted, userJid } = options

	if (quoted && !isJidNewsletter(jid)) {
		const participant = quoted.key.fromMe
			? userJid
			: quoted.participant || quoted.key.participant || quoted.key.remoteJid

		let quotedMsg = normalizeMessageContent(quoted.message)!
		const msgType = getContentType(quotedMsg)!
		quotedMsg = proto.Message.create({ [msgType]: quotedMsg[msgType] })

		const quotedContent = quotedMsg[msgType]
		if (typeof quotedContent === 'object' && quotedContent && 'contextInfo' in quotedContent) {
			delete quotedContent.contextInfo
		}

		const contextInfo: proto.IContextInfo =
			('contextInfo' in innerMessage[key]! && innerMessage[key]?.contextInfo) || {}
		contextInfo.participant = jidNormalizedUser(participant!)
		contextInfo.stanzaId = quoted.key.id
		contextInfo.quotedMessage = quotedMsg

		if (jid !== quoted.key.remoteJid) {
			contextInfo.remoteJid = quoted.key.remoteJid
		}

		if (contextInfo && innerMessage[key]) {
			;(innerMessage[key] as { contextInfo?: proto.IContextInfo }).contextInfo = contextInfo
		}
	}

	if (
		!!options?.ephemeralExpiration &&
		key !== 'protocolMessage' &&
		key !== 'ephemeralMessage' &&
		!isJidNewsletter(jid) &&
		innerMessage[key]
	) {
		const target = innerMessage[key] as { contextInfo?: proto.IContextInfo }
		target.contextInfo = {
			...(target.contextInfo || {}),
			expiration: Number(options.ephemeralExpiration) || WA_DEFAULT_EPHEMERAL
		}
	}

	const messageContextInfo = message.messageContextInfo
	if (messageContextInfo?.messageSecret && (isPnUser(jid) || isLidUser(jid))) {
		messageContextInfo.deviceListMetadata = {
			recipientKeyHash: randomBytes(10),
			recipientTimestamp: unixTimestampSeconds()
		}
		messageContextInfo.deviceListMetadataVersion = 2
	}

	message = WAProto.Message.create(message)

	const messageJSON = {
		key: {
			remoteJid: jid,
			fromMe: true,
			id: options?.messageId || generateMessageIDV2()
		},
		message: message,
		messageTimestamp: timestamp,
		messageStubParameters: [],
		participant: isJidGroup(jid) || isJidStatusBroadcast(jid) ? userJid : undefined,
		status: WAMessageStatus.PENDING
	}
	return WAProto.WebMessageInfo.fromObject(messageJSON) as WAMessage
}

export const generateWAMessage = async (jid: string, content: AnyMessageContent, options: MessageGenerationOptions) => {
	options.logger = options?.logger?.child({ msgId: options.messageId })
	return generateWAMessageFromContent(jid, await generateWAMessageContent(content, { ...options, jid }), options)
}


export const getContentType = (content: proto.IMessage | undefined) => {
	if (content) {
		const keys = Object.keys(content)
		const key = keys.find(k => (k === 'conversation' || k.includes('Message')) && k !== 'senderKeyDistributionMessage')
		return key as keyof typeof content
	}
}


export const normalizeMessageContent = (content: WAMessageContent | null | undefined): WAMessageContent | undefined => {
	if (!content) {
		return undefined
	}

	for (let i = 0; i < 5; i++) {
		const inner = getFutureProofMessage(content)
		if (!inner) {
			break
		}

		content = inner.message
	}

	return content!

	function getFutureProofMessage(message: typeof content) {
		return (
			message?.ephemeralMessage ||
			message?.viewOnceMessage ||
			message?.documentWithCaptionMessage ||
			message?.viewOnceMessageV2 ||
			message?.viewOnceMessageV2Extension ||
			message?.editedMessage ||
			message?.associatedChildMessage ||
			message?.groupStatusMessage ||
			message?.groupStatusMessageV2 ||
			message?.lottieStickerMessage
		)
	}
}


export const extractMessageContent = (content: WAMessageContent | undefined | null): WAMessageContent | undefined => {
	const extractFromTemplateMessage = (
		msg: proto.Message.TemplateMessage.IHydratedFourRowTemplate | proto.Message.IButtonsMessage
	) => {
		if (msg.imageMessage) {
			return { imageMessage: msg.imageMessage }
		} else if (msg.documentMessage) {
			return { documentMessage: msg.documentMessage }
		} else if (msg.videoMessage) {
			return { videoMessage: msg.videoMessage }
		} else if (msg.locationMessage) {
			return { locationMessage: msg.locationMessage }
		} else {
			return {
				conversation:
					'contentText' in msg ? msg.contentText : 'hydratedContentText' in msg ? msg.hydratedContentText : ''
			}
		}
	}

	content = normalizeMessageContent(content)

	if (content?.buttonsMessage) {
		return extractFromTemplateMessage(content.buttonsMessage)
	}

	if (content?.templateMessage?.hydratedFourRowTemplate) {
		return extractFromTemplateMessage(content?.templateMessage?.hydratedFourRowTemplate)
	}

	if (content?.templateMessage?.hydratedTemplate) {
		return extractFromTemplateMessage(content?.templateMessage?.hydratedTemplate)
	}

	if (content?.templateMessage?.fourRowTemplate) {
		return extractFromTemplateMessage(content?.templateMessage?.fourRowTemplate)
	}

	return content
}


export const getDevice = (id: string) =>
	/^3A.{18}$/.test(id)
		? 'ios'
		: /^3E.{20}$/.test(id)
			? 'web'
			: /^(.{21}|.{32})$/.test(id)
				? 'android'
				: /^(3F|.{18}$)/.test(id)
					? 'desktop'
					: 'unknown'


export const updateMessageWithReceipt = (msg: Pick<WAMessage, 'userReceipt'>, receipt: MessageUserReceipt) => {
	msg.userReceipt = msg.userReceipt || []
	const recp = msg.userReceipt.find(m => m.userJid === receipt.userJid)
	if (recp) {
		Object.assign(recp, receipt)
	} else {
		msg.userReceipt.push(receipt)
	}
}


export const updateMessageWithReaction = (msg: Pick<WAMessage, 'reactions'>, reaction: proto.IReaction) => {
	const authorID = getKeyAuthor(reaction.key)

	const reactions = (msg.reactions || []).filter(r => getKeyAuthor(r.key) !== authorID)
	reaction.text = reaction.text || ''
	reactions.push(reaction)
	msg.reactions = reactions
}


export const updateMessageWithPollUpdate = (msg: Pick<WAMessage, 'pollUpdates'>, update: proto.IPollUpdate) => {
	const authorID = getKeyAuthor(update.pollUpdateMessageKey)

	const reactions = (msg.pollUpdates || []).filter(r => getKeyAuthor(r.pollUpdateMessageKey) !== authorID)
	if (update.vote?.selectedOptions?.length) {
		reactions.push(update)
	}

	msg.pollUpdates = reactions
}


export const updateMessageWithEventResponse = (
	msg: Pick<WAMessage, 'eventResponses'>,
	update: proto.IEventResponse
) => {
	const authorID = getKeyAuthor(update.eventResponseMessageKey)

	const responses = (msg.eventResponses || []).filter(r => getKeyAuthor(r.eventResponseMessageKey) !== authorID)
	responses.push(update)

	msg.eventResponses = responses
}

type VoteAggregation = {
	name: string
	voters: string[]
}


export function getAggregateVotesInPollMessage(
	{ message, pollUpdates }: Pick<WAMessage, 'pollUpdates' | 'message'>,
	meId?: string
) {
	const opts =
		message?.pollCreationMessage?.options ||
		message?.pollCreationMessageV2?.options ||
		message?.pollCreationMessageV3?.options ||
		[]
	const voteHashMap = opts.reduce(
		(acc, opt) => {
			const hash = sha256(Buffer.from(opt.optionName || '')).toString()
			acc[hash] = {
				name: opt.optionName || '',
				voters: []
			}
			return acc
		},
		{} as { [_: string]: VoteAggregation }
	)

	for (const update of pollUpdates || []) {
		const { vote } = update
		if (!vote) {
			continue
		}

		for (const option of vote.selectedOptions || []) {
			const hash = option.toString()
			let data = voteHashMap[hash]
			if (!data) {
				voteHashMap[hash] = {
					name: 'Unknown',
					voters: []
				}
				data = voteHashMap[hash]
			}

			voteHashMap[hash]!.voters.push(getKeyAuthor(update.pollUpdateMessageKey, meId))
		}
	}

	return Object.values(voteHashMap)
}

type ResponseAggregation = {
	response: string
	responders: string[]
}


export function getAggregateResponsesInEventMessage(
	{ eventResponses }: Pick<WAMessage, 'eventResponses'>,
	meId?: string
) {
	const responseTypes = ['GOING', 'NOT_GOING', 'MAYBE']
	const responseMap: { [_: string]: ResponseAggregation } = {}

	for (const type of responseTypes) {
		responseMap[type] = {
			response: type,
			responders: []
		}
	}

	for (const update of eventResponses || []) {
		const responseType = (update as any).eventResponse || 'UNKNOWN'
		if (responseType !== 'UNKNOWN' && responseMap[responseType]) {
			responseMap[responseType].responders.push(getKeyAuthor(update.eventResponseMessageKey, meId))
		}
	}

	return Object.values(responseMap)
}


export const aggregateMessageKeysNotFromMe = (keys: WAMessageKey[]) => {
	const keyMap: { [id: string]: { jid: string; participant: string | undefined; messageIds: string[] } } = {}
	for (const { remoteJid, id, participant, fromMe } of keys) {
		if (!fromMe) {
			const uqKey = `${remoteJid}:${participant || ''}`
			if (!keyMap[uqKey]) {
				keyMap[uqKey] = {
					jid: remoteJid!,
					participant: participant!,
					messageIds: []
				}
			}

			keyMap[uqKey].messageIds.push(id!)
		}
	}

	return Object.values(keyMap)
}

type DownloadMediaMessageContext = {
	reuploadRequest: (msg: WAMessage) => Promise<WAMessage>
	logger: ILogger
}

const REUPLOAD_REQUIRED_STATUS = [410, 404]


export const downloadMediaMessage = async <Type extends 'buffer' | 'stream'>(
	message: WAMessage,
	type: Type,
	options: MediaDownloadOptions,
	ctx?: DownloadMediaMessageContext
) => {
	const result = await downloadMsg().catch(async error => {
		if (
			ctx &&
			typeof error?.status === 'number' &&
			REUPLOAD_REQUIRED_STATUS.includes(error.status as number)
		) {
			ctx.logger.info({ key: message.key }, 'sending reupload media request...')
			message = await ctx.reuploadRequest(message)
			const result = await downloadMsg()
			return result
		}

		throw error
	})

	return result as Type extends 'buffer' ? Buffer : Transform

	async function downloadMsg() {
		const mContent = extractMessageContent(message.message)
		if (!mContent) {
			throw new Boom('No message present', { statusCode: 400, data: message })
		}

		const contentType = getContentType(mContent)
		let mediaType = contentType?.replace('Message', '') as MediaType
		const media = mContent[contentType!]

		if (!media || typeof media !== 'object' || (!('url' in media) && !('thumbnailDirectPath' in media))) {
			throw new Boom(`"${contentType}" message is not a media message`)
		}

		let download: DownloadableMessage
		if ('thumbnailDirectPath' in media && !('url' in media)) {
			download = {
				directPath: media.thumbnailDirectPath,
				mediaKey: media.mediaKey
			}
			mediaType = 'thumbnail-link'
		} else {
			download = media
		}

		const stream = await downloadContentFromMessage(download, mediaType, options)
		if (type === 'buffer') {
			const bufferArray: Buffer[] = []
			for await (const chunk of stream) {
				bufferArray.push(chunk)
			}

			return Buffer.concat(bufferArray)
		}

		return stream
	}
}


export const assertMediaContent = (content: proto.IMessage | null | undefined) => {
	content = extractMessageContent(content)
	const mediaContent =
		content?.documentMessage ||
		content?.imageMessage ||
		content?.videoMessage ||
		content?.audioMessage ||
		content?.stickerMessage
	if (!mediaContent) {
		throw new Boom('given message is not a media message', { statusCode: 400, data: content })
	}

	return mediaContent
}

