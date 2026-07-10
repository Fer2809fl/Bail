import type makeWASocket from '../Socket/index'

type WASocket = ReturnType<typeof makeWASocket>

const BRAND = '⚡ ASTA-BOTS'

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
		await sock.sendMessage(jid, {
			interactiveMessage: {
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
			}
		} as any)
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
		await sock.sendMessage(jid, {
			interactiveMessage: {
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
			}
		} as any)
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

		await sock.sendMessage(jid, {
			interactiveMessage: {
				body: { text },
				footer: { text: `${BRAND} - Selecciona una opción` },
				header: {
					hasMediaAttachment: false
				},
				nativeFlowMessage: {
					buttons: interactiveButtons
				}
			}
		} as any)
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
		await sock.sendMessage(jid, {
			interactiveMessage: {
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
			}
		} as any)
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

		await sock.sendMessage(jid, {
			interactiveMessage: {
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
			}
		} as any)
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

		await sock.sendMessage(jid, {
			interactiveMessage: {
				body: { text },
				footer: { text: BRAND },
				header: {
					hasMediaAttachment: false
				},
				nativeFlowMessage: { buttons }
			}
		} as any)
	} catch (error) {
		console.error('[interactive] Error en sendInteractiveMessage:', error)
		await sock.sendMessage(jid, { text })
	}
}
