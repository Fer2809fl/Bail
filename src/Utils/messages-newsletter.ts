import type { AnyMessageContent, MiscMessageGenerationOptions, WAMessage } from '../Types'

function nl(jid: string): string {
	return jid.endsWith('@newsletter') ? jid : `${jid}@newsletter`
}

export interface NewsletterSendCapableSocket {
	sendMessage: (jid: string, content: AnyMessageContent, options?: MiscMessageGenerationOptions) => Promise<WAMessage | undefined>
	newsletterReactMessage: (jid: string, serverId: string, reaction?: string) => Promise<void>
}

export type NewsletterButtonInput = { id?: string; text?: string; displayText?: string }
export type NewsletterListSection = { title?: string; rows?: Array<{ id?: string; rowId?: string; title?: string; description?: string }> }

export function makeNewsletterUtils(conn: NewsletterSendCapableSocket) {
	async function send(jid: string, content: AnyMessageContent, options: MiscMessageGenerationOptions = {}) {
		return conn.sendMessage(nl(jid), content, options)
	}

	async function sendNewsletterText(jid: string, text: string, options: MiscMessageGenerationOptions = {}) {
		return send(jid, { text }, options)
	}

	async function sendNewsletterImage(
		jid: string,
		image: AnyMessageContent extends { image: infer I } ? I : never,
		options: MiscMessageGenerationOptions & { caption?: string; mimetype?: string; jpegThumbnail?: Buffer } = {}
	) {
		return send(jid, { image, caption: options.caption, mimetype: options.mimetype, jpegThumbnail: options.jpegThumbnail } as AnyMessageContent, options)
	}

	async function sendNewsletterVideo(
		jid: string,
		video: unknown,
		options: MiscMessageGenerationOptions & { caption?: string; mimetype?: string; gifPlayback?: boolean } = {}
	) {
		return send(
			jid,
			{ video, caption: options.caption, mimetype: options.mimetype, gifPlayback: options.gifPlayback } as unknown as AnyMessageContent,
			options
		)
	}

	async function sendNewsletterPtv(jid: string, video: unknown, options: MiscMessageGenerationOptions & { mimetype?: string } = {}) {
		return send(jid, { video, ptv: true, mimetype: options.mimetype || 'video/mp4' } as unknown as AnyMessageContent, options)
	}

	async function sendNewsletterAudio(
		jid: string,
		audio: unknown,
		options: MiscMessageGenerationOptions & { mimetype?: string; seconds?: number; ptt?: boolean } = {}
	) {
		return send(jid, { audio, mimetype: options.mimetype, seconds: options.seconds, ptt: options.ptt } as unknown as AnyMessageContent, options)
	}

	async function sendNewsletterDocument(
		jid: string,
		document: unknown,
		options: MiscMessageGenerationOptions & { mimetype?: string; fileName?: string; caption?: string } = {}
	) {
		return send(
			jid,
			{
				document,
				mimetype: options.mimetype || 'application/octet-stream',
				fileName: options.fileName || 'file',
				caption: options.caption
			} as unknown as AnyMessageContent,
			options
		)
	}

	async function sendNewsletterSticker(jid: string, sticker: unknown, options: MiscMessageGenerationOptions & { isAnimated?: boolean } = {}) {
		return send(jid, { sticker, isAnimated: options.isAnimated } as unknown as AnyMessageContent, options)
	}

	async function sendNewsletterButtons(
		jid: string,
		params: { body?: string; buttons?: NewsletterButtonInput[]; title?: string; footer?: string },
		options: MiscMessageGenerationOptions = {}
	) {
		const { body, buttons = [], title, footer } = params
		const nativeButtons = buttons.map(b => ({
			name: 'quick_reply',
			buttonParamsJson: JSON.stringify({ display_text: b.text || b.displayText || '', id: b.id || b.text || '' })
		}))

		const interactiveMessage = {
			nativeFlowMessage: { buttons: nativeButtons, messageParamsJson: '', messageVersion: 1 },
			body: { text: body || '' },
			...(footer ? { footer: { text: footer } } : {}),
			...(title ? { header: { title, hasMediaAttachment: false, subtitle: '' } } : {})
		}

		return send(jid, { interactiveMessage } as unknown as AnyMessageContent, options)
	}

	async function sendNewsletterList(
		jid: string,
		params: { body?: string; buttonText?: string; sections?: NewsletterListSection[]; title?: string; footer?: string },
		options: MiscMessageGenerationOptions = {}
	) {
		const { body, buttonText, sections = [], title, footer } = params

		const interactiveMessage = {
			nativeFlowMessage: {
				buttons: [
					{
						name: 'single_select',
						buttonParamsJson: JSON.stringify({
							title: buttonText || 'Select',
							sections: sections.map(sec => ({
								title: sec.title || '',
								highlight_label: '',
								rows: (sec.rows || []).map(row => ({
									header: '',
									title: row.title || '',
									description: row.description || '',
									id: row.id || row.rowId || row.title || ''
								}))
							}))
						})
					}
				],
				messageParamsJson: '',
				messageVersion: 1
			},
			body: { text: body || '' },
			...(footer ? { footer: { text: footer } } : {}),
			...(title ? { header: { title, hasMediaAttachment: false, subtitle: '' } } : {})
		}

		return send(jid, { interactiveMessage } as unknown as AnyMessageContent, options)
	}

	async function sendNewsletterCtaUrl(
		jid: string,
		params: { body?: string; buttonText?: string; url?: string; title?: string; footer?: string },
		options: MiscMessageGenerationOptions = {}
	) {
		const { body, buttonText, url, title, footer } = params

		const interactiveMessage = {
			nativeFlowMessage: {
				buttons: [
					{
						name: 'cta_url',
						buttonParamsJson: JSON.stringify({ display_text: buttonText || 'Open', url: url || '', merchant_url: url || '' })
					}
				],
				messageParamsJson: '',
				messageVersion: 1
			},
			body: { text: body || '' },
			...(footer ? { footer: { text: footer } } : {}),
			...(title ? { header: { title, hasMediaAttachment: false, subtitle: '' } } : {})
		}

		return send(jid, { interactiveMessage } as unknown as AnyMessageContent, options)
	}

	async function sendNewsletterReact(jid: string, serverId: string, emoji?: string) {
		return conn.newsletterReactMessage(nl(jid), serverId, emoji)
	}

	async function editNewsletterMessage(jid: string, messageId: string, newText: string) {
		return send(jid, {
			text: newText,
			edit: { remoteJid: nl(jid), fromMe: true, id: messageId }
		} as unknown as AnyMessageContent)
	}

	async function deleteNewsletterMessage(jid: string, messageId: string) {
		return send(jid, {
			delete: { remoteJid: nl(jid), fromMe: true, id: messageId }
		} as unknown as AnyMessageContent)
	}

	return {
		sendNewsletterText,
		sendNewsletterImage,
		sendNewsletterVideo,
		sendNewsletterPtv,
		sendNewsletterAudio,
		sendNewsletterDocument,
		sendNewsletterSticker,
		sendNewsletterButtons,
		sendNewsletterList,
		sendNewsletterCtaUrl,
		sendNewsletterReact,
		editNewsletterMessage,
		deleteNewsletterMessage
	}
}

			
