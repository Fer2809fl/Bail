import type makeWASocket from '../Socket/index'

type WASocket = ReturnType<typeof makeWASocket>

export interface ButtonPlugin {
	command: string | RegExp | (string | RegExp)[]
	rowner?: boolean
	owner?: boolean
	admin?: boolean
	botAdmin?: boolean
	group?: boolean
	private?: boolean
	call: (sock: WASocket, m: any, extra: Record<string, any>) => Promise<any>
}

export type ButtonPlugins = Record<string, ButtonPlugin>

/**
 * Detecta si un mensaje entrante es una respuesta de botón (quick_reply,
 * buttonsResponse o listResponse) y, de ser así, ejecuta el plugin asociado
 * a ese id de botón.
 *
 * Retorna `true` si el mensaje era un botón (ya procesado), `false` si no.
 */
export async function handleButtonResponse(
	sock: WASocket,
	m: any,
	plugins: ButtonPlugins,
	db?: any
): Promise<boolean> {
	// ========== DETECTAR SOLO BOTONES ==========
	let seleccion: string | null = null
	let tipoBoton: string | null = null

	// Botón tipo quick_reply (interactive)
	if (m.mtype === 'interactiveResponseMessage') {
		const resp = m.message?.interactiveResponseMessage?.nativeFlowResponseMessage
		if (resp?.name === 'quick_reply') {
			seleccion = resp.id
			tipoBoton = 'quick_reply'
		}
	}

	// Botón tipo buttonsResponse (estilo antiguo)
	if (m.mtype === 'buttonsResponseMessage') {
		seleccion = m.message?.buttonsResponseMessage?.selectedButtonId
		tipoBoton = 'buttonsResponse'
	}

	// Lista desplegable
	if (m.mtype === 'listResponseMessage') {
		seleccion = m.message?.listResponseMessage?.singleSelectReply?.selectedRowId
		tipoBoton = 'listResponse'
	}

	// Si no es botón, salir
	if (!seleccion) {
		return false
	}

	console.log(`[ASTA-BOTS] Botón detectado [${tipoBoton}]:`, seleccion)

	// Limpiar el ID del botón
	const cmd = seleccion.toString().toLowerCase().replace(/^[.#!/]/, '').trim()

	// ========== BUSCAR PLUGIN ==========
	let pluginFound: ButtonPlugin | null = null

	for (const name in plugins) {
		const plugin = plugins[name]
		if (!plugin || !plugin.command) {
			continue
		}

		const commands = Array.isArray(plugin.command) ? plugin.command : [plugin.command]

		const isMatch = commands.some(c => {
			if (c instanceof RegExp) {
				return c.test(cmd)
			}

			return c.toString().toLowerCase() === cmd
		})

		if (isMatch) {
			pluginFound = plugin
			break
		}
	}

	if (!pluginFound) {
		console.log(`[ASTA-BOTS] No se encontró plugin para: ${cmd}`)
		await sock.sendMessage(
			m.chat,
			{ text: `❌ *Comando no encontrado*\n\nEl botón "${seleccion}" no tiene un comando asociado.` },
			{ quoted: m }
		)
		return true
	}

	// ========== OBTENER PERMISOS ==========
	const groupMetadata = m.isGroup ? (await sock.groupMetadata(m.chat).catch(() => null)) || {} : ({} as any)
	const participants = groupMetadata?.participants || []

	const isAdmin = m.isGroup
		? participants.find((p: any) => p.id === m.sender)?.admin === 'admin' ||
		  participants.find((p: any) => p.id === m.sender)?.admin === 'superadmin'
		: false
	const isBotAdmin = m.isGroup
		? participants.find((p: any) => p.id === sock.user?.id)?.admin === 'admin' ||
		  participants.find((p: any) => p.id === sock.user?.id)?.admin === 'superadmin'
		: false
	const isOwner = [...((global as any).owner || [])].map((v: string) => v + '@s.whatsapp.net').includes(m.sender)

	// ========== VALIDAR PERMISOS ==========
	if (pluginFound.rowner && !isOwner) {
		await sock.sendMessage(
			m.chat,
			{ text: '🔒 *Acceso denegado*\n\nEste comando es solo para los creadores del bot.' },
			{ quoted: m }
		)
		return true
	}

	if (pluginFound.owner && !isOwner) {
		await sock.sendMessage(
			m.chat,
			{ text: '🔒 *Acceso denegado*\n\nEste comando es solo para el owner del bot.' },
			{ quoted: m }
		)
		return true
	}

	if (pluginFound.admin && !isAdmin) {
		await sock.sendMessage(
			m.chat,
			{ text: '⚠️ *Permiso denegado*\n\nEste comando solo puede ser usado por administradores del grupo.' },
			{ quoted: m }
		)
		return true
	}

	if (pluginFound.botAdmin && !isBotAdmin) {
		await sock.sendMessage(
			m.chat,
			{ text: '🤖 *Bot sin permisos*\n\nNecesito ser administrador del grupo para ejecutar este comando.' },
			{ quoted: m }
		)
		return true
	}

	if (pluginFound.group && !m.isGroup) {
		await sock.sendMessage(m.chat, { text: '👥 *Solo grupos*\n\nEste comando solo puede usarse en grupos.' }, { quoted: m })
		return true
	}

	if (pluginFound.private && m.isGroup) {
		await sock.sendMessage(m.chat, { text: '🔒 *Solo privado*\n\nEste comando solo puede usarse en chat privado.' }, { quoted: m })
		return true
	}

	// ========== EJECUTAR PLUGIN ==========
	try {
		await pluginFound.call(sock, m, {
			conn: sock,
			usedPrefix: '',
			command: cmd,
			args: [],
			text: '',
			participants,
			groupMetadata,
			isAdmin,
			isBotAdmin,
			isOwner,
			db
		})
		console.log(`[ASTA-BOTS] Plugin ejecutado: ${cmd}`)
	} catch (error: any) {
		console.error('[ASTA-BOTS] Error:', error)
		await sock.sendMessage(m.chat, { text: `❌ *Error al ejecutar el comando*\n\n${error?.message || error}` }, { quoted: m })
	}

	return true
}

/**
 * Configura el handler de botones sobre el socket, envolviendo el listener
 * de 'messages.upsert' existente sin eliminarlo.
 */
export function setupButtonHandler(sock: WASocket, plugins: ButtonPlugins, db?: any) {
	const originalHandler = ((sock.ev as any).listeners?.('messages.upsert') || [])[0]

	if (originalHandler) {
		;(sock.ev as any).off('messages.upsert', originalHandler)
	}

	sock.ev.on('messages.upsert', async ({ messages }: any) => {
		for (const m of messages) {
			const fueBoton = await handleButtonResponse(sock, m, plugins, db)
			if (!fueBoton && originalHandler) {
				await originalHandler({ messages: [m] })
			}
		}
	})
}
