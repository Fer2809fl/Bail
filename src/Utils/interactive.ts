import type makeWASocket from '../Socket/index'

type WASocket = ReturnType<typeof makeWASocket>

const BRAND = '⚡ ASTA-BOTS'

/**
 * generateWAMessageContent (Utils/messages.ts) solo reconoce interactiveMessage
 * cuando se le pasa el atajo `nativeFlow`; un objeto `{ interactiveMessage: {...} }`
 * ya "armado" (con body/header/footer/nativeFlowMessage tal como espera el proto)
 * no calza con ninguna de sus ramas y termina cayendo en prepareWAMessageMedia,
 * que lo trata como un mensaje de medios vacío. Resultado: el mensaje se envía
 * pero WhatsApp no renderiza ningún botón (o no llega nada visible).
 *
 * La forma correcta y la que los clientes Multi-Device sí renderizan de forma
 * consistente es envolver el interactiveMessage en un viewOnceMessage con
 * messageContextInfo.deviceListMetadata, y marcar el contenido como `raw`
 * para que generateWAMessageContent lo devuelva tal cual sin tocarlo.
 */
function wrapInteractive(interactiveMessage: Record<string, any>) {
	return {
		raw: true,
		viewOnceMessage: {
			message: {
				messageContextInfo: {
					deviceListMetadata: {},
					deviceListMetadataVersion: 2
				},
				interactiveMessage
			}
		}
	} as any
}

export interface QuickReplyButton {
	text: string
	id: string
}

export interface ListRow {
	title: string
	id: string
	description?: string
	header?: string
}

export interface ListSection {
	title: string
	rows: ListRow[]
}

export type InteractiveButtonConfig =
	| { type: 'copy'; text: string; value: string }
	| { type: 'url'; text: string; value: string }
	| { type: 'call'; text: string; value: string }
	| { type: 'quick'; text: string; value?: string; id?: string }

/**
 * Envía un mensaje con botón que copia texto al portapapeles
 */
export async function sendCopyButton(
	sock: WASocket,
	jid: string,
	text: string,
	copyText: string,
	buttonText?: string
) {
	try {
		await sock.sendMessage(jid, wrapInteractive({
			body: { text },
			footer: { text: BRAND },
			header: {
				title: '📋 Copiar Código',
				hasMediaAttachment: false
			},
			nativeFlowMessage: {
				buttons: [
					{
						name: 'cta_copy',
						buttonParamsJson: JSON.stringify({
							display_text: buttonText || '📋 Copiar',
							copy_code: copyText
						})
					}
				]
			}
		}))
	} catch (error) {
		console.error('[interactive] Error en sendCopyButton:', error)
		await sock.sendMessage(jid, { text: `${text}\n\n📋 Copia esto: ${copyText}` })
	}
}

/**
 * Envía un mensaje con botón de enlace (URL)
 */
export async function sendUrlButton(sock: WASocket, jid: string, text: string, url: string, buttonText?: string) {
	try {
		await sock.sendMessage(jid, wrapInteractive({
			body: { text },
			footer: { text: BRAND },
			header: {
				title: '🔗 Enlace Rápido',
				hasMediaAttachment: false
			},
			nativeFlowMessage: {
				buttons: [
					{
						name: 'cta_url',
						buttonParamsJson: JSON.stringify({
							display_text: buttonText || '🔗 Abrir Enlace',
							url,
							merchant_url: url
						})
					}
				]
			}
		}))
	} catch (error) {
		console.error('[interactive] Error en sendUrlButton:', error)
		await sock.sendMessage(jid, { text: `${text}\n\n🔗 Enlace: ${url}` })
	}
}

/**
 * Envía un mensaje con botones de respuesta rápida
 */
export async function sendQuickReplyButtons(sock: WASocket, jid: string, text: string, buttons: QuickReplyButton[]) {
	try {
		const interactiveButtons = buttons.map(btn => ({
			name: 'quick_reply',
			buttonParamsJson: JSON.stringify({
				display_text: btn.text,
				id: btn.id
			})
		}))

		await sock.sendMessage(jid, wrapInteractive({
			body: { text },
			footer: { text: `${BRAND} - Selecciona una opción` },
			header: {
				hasMediaAttachment: false
			},
			nativeFlowMessage: {
				buttons: interactiveButtons
			}
		}))
	} catch (error) {
		console.error('[interactive] Error en sendQuickReplyButtons:', error)
		const buttonsText = buttons.map(b => `• ${b.text} → ${b.id}`).join('\n')
		await sock.sendMessage(jid, { text: `${text}\n\n${buttonsText}` })
	}
}

/**
 * Envía un mensaje con botón de llamada telefónica
 */
export async function sendCallButton(
	sock: WASocket,
	jid: string,
	text: string,
	phoneNumber: string,
	buttonText?: string
) {
	try {
		await sock.sendMessage(jid, wrapInteractive({
			body: { text },
			footer: { text: BRAND },
			header: {
				title: '📞 Llamar',
				hasMediaAttachment: false
			},
			nativeFlowMessage: {
				buttons: [
					{
						name: 'cta_call',
						buttonParamsJson: JSON.stringify({
							display_text: buttonText || '📞 Llamar Ahora',
							phone_number: phoneNumber
						})
					}
				]
			}
		}))
	} catch (error) {
		console.error('[interactive] Error en sendCallButton:', error)
		await sock.sendMessage(jid, { text: `${text}\n\n📞 Llama a: ${phoneNumber}` })
	}
}

/**
 * Envía un mensaje con lista desplegable (single select)
 */
export async function sendListMenu(
	sock: WASocket,
	jid: string,
	text: string,
	title: string,
	sections: ListSection[]
) {
	try {
		const formattedSections = sections.map(section => ({
			title: section.title,
			rows: section.rows.map(row => ({
				header: row.header || '',
				title: row.title,
				description: row.description || '',
				id: row.id
			}))
		}))

		await sock.sendMessage(jid, wrapInteractive({
			body: { text },
			footer: { text: `${BRAND} - Menú Interactivo` },
			header: {
				title: title || '📋 Menú de Opciones',
				hasMediaAttachment: false
			},
			nativeFlowMessage: {
				buttons: [
					{
						name: 'single_select',
						buttonParamsJson: JSON.stringify({
							title: '📋 Ver opciones',
							sections: formattedSections
						})
					}
				]
			}
		}))
	} catch (error) {
		console.error('[interactive] Error en sendListMenu:', error)
		let fallbackText = `${text}\n\n`
		for (const sec of sections) {
			fallbackText += `\n*${sec.title}*\n`
			for (const row of sec.rows) {
				fallbackText += `• ${row.id} - ${row.title}\n`
			}
		}

		await sock.sendMessage(jid, { text: fallbackText })
	}
}

/**
 * Envía un mensaje con múltiples botones combinados (copy, url, call, quick)
 */
export async function sendInteractiveMessage(
	sock: WASocket,
	jid: string,
	text: string,
	buttonsConfig: InteractiveButtonConfig[]
) {
	try {
		const buttons = buttonsConfig.map(btn => {
			switch (btn.type) {
				case 'copy':
					return {
						name: 'cta_copy',
						buttonParamsJson: JSON.stringify({ display_text: btn.text, copy_code: btn.value })
					}
				case 'url':
					return {
						name: 'cta_url',
						buttonParamsJson: JSON.stringify({ display_text: btn.text, url: btn.value, merchant_url: btn.value })
					}
				case 'call':
					return {
						name: 'cta_call',
						buttonParamsJson: JSON.stringify({ display_text: btn.text, phone_number: btn.value })
					}
				case 'quick':
				default:
					return {
						name: 'quick_reply',
						buttonParamsJson: JSON.stringify({ display_text: btn.text, id: btn.id || btn.value })
					}
			}
		})

		await sock.sendMessage(jid, wrapInteractive({
			body: { text },
			footer: { text: BRAND },
			header: {
				hasMediaAttachment: false
			},
			nativeFlowMessage: { buttons }
		}))
	} catch (error) {
		console.error('[interactive] Error en sendInteractiveMessage:', error)
		await sock.sendMessage(jid, { text })
	}
}

/**
 * Construye el nodo binario (`biz` / `interactive` / `native_flow`) que WhatsApp
 * exige para renderizar botones. sock.sendMessage() lo agrega solo, pero
 * sock.relayMessage() (usado cuando se arma el mensaje a mano con
 * generateWAMessageFromContent, p.ej. para envolverlo en viewOnceMessage) NO
 * lo agrega — hay que pasarlo explícitamente en additionalNodes o el mensaje
 * llega sin errores pero sin ningún botón visible.
 *
 * Uso:
 *   const built = await generateWAMessageFromContent(jid, messageContent, {...})
 *   const additionalNodes = getInteractiveButtonNodes(built.message)
 *   await sock.relayMessage(jid, built.message, { messageId: built.key.id, additionalNodes })
 *
 * `message` puede ser el contenido ya desenvuelto (con `.interactiveMessage`
 * al nivel superior) o envuelto en viewOnceMessage/ephemeralMessage: esta
 * función lo desenvuelve sola.
 */
export function getInteractiveButtonNodes(message: any): any[] {
	let m = message
	for (let i = 0; i < 5 && m; i++) {
		const inner =
			m.viewOnceMessage || m.viewOnceMessageV2 || m.viewOnceMessageV2Extension || m.ephemeralMessage
		if (!inner) break
		m = inner.message
	}
	if (!m?.interactiveMessage) return []

	const nativeFlow = m.interactiveMessage.nativeFlowMessage
	const firstButtonName = nativeFlow?.buttons?.[0]?.name
	const nativeFlowSpecials = [
		'mpm',
		'cta_catalog',
		'send_location',
		'call_permission_request',
		'wa_payment_transaction_details',
		'automated_greeting_message_view_catalog'
	]
	const ts = Math.floor(Date.now() / 1000).toString()
	const bizBase = { actual_actors: '2', host_storage: '2', privacy_mode_ts: ts }
	const qualityControl = { tag: 'quality_control', attrs: { source_type: 'third_party' } }

	if (nativeFlow && (firstButtonName === 'review_and_pay' || firstButtonName === 'payment_info')) {
		return [
			{
				tag: 'biz',
				attrs: { native_flow_name: firstButtonName === 'review_and_pay' ? 'order_details' : firstButtonName }
			}
		]
	}
	if (nativeFlow && nativeFlowSpecials.includes(firstButtonName)) {
		return [
			{
				tag: 'biz',
				attrs: bizBase,
				content: [
					{
						tag: 'interactive',
						attrs: { type: 'native_flow', v: '1' },
						content: [{ tag: 'native_flow', attrs: { v: '2', name: firstButtonName } }]
					},
					qualityControl
				]
			}
		]
	}
	return [
		{
			tag: 'biz',
			attrs: bizBase,
			content: [
				{
					tag: 'interactive',
					attrs: { type: 'native_flow', v: '1' },
					content: [{ tag: 'native_flow', attrs: { v: '9', name: 'mixed' } }]
				},
				qualityControl
			]
		}
	]
}
