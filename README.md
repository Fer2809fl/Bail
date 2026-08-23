<div align="center">

<img src="https://raw.githubusercontent.com/Fer2809fl/Baileys/refs/heads/main/lib/Baileys.jpeg" alt="Baileys" width="500" style="border-radius: 20px;"/>

# @fer2809fl/baileys
### API de WhatsApp Web para Node.js

[![npm version](https://img.shields.io/npm/v/@fer2809fl/baileys?color=blueviolet&label=version)](https://www.npmjs.com/package/@fer2809fl/baileys)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D20-brightgreen)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-supported-blue)](https://www.typescriptlang.org)

*Conéctate a WhatsApp Web directamente desde Node.js sin navegadores ni Selenium*

</div>

---

## 🆕 Novedades — v7.0.4

Actualización de estabilidad y sincronización con las últimas mejoras del protocolo de WhatsApp Web.

### ✅ Nuevas funciones añadidas
- **`withUsernameProtocol()`** en `USyncQuery` — permite sincronizar contactos por *username* de WhatsApp (la nueva forma de identificar cuentas, además del número de teléfono):
  ```javascript
  const result = await sock.executeUSyncQuery(
    new USyncQuery().withUsernameProtocol().withUser(new USyncUser().withPhone('+123...'))
  )
  ```
- **`sock.fetchAccountReachoutTimelock()`** — consulta si tu cuenta tiene alguna restricción activa para iniciar chats nuevos, y hasta cuándo dura.
- **`sock.fetchNewChatMessageCap()`** — consulta el límite de mensajes que puedes enviar a chats/números nuevos (cupo anti-spam de WhatsApp).
- **`sock.registerSocketEndHandler(handler)`** — registra una función que se ejecuta automáticamente cada vez que la conexión se cierra (útil para limpieza de recursos propios sin tener que escuchar `connection.update` a mano).
- **Nuevo formato de código QR de emparejamiento** — el QR ahora incluye el identificador de plataforma del companion, igual que el WhatsApp Web oficial (mejora la tasa de éxito al vincular).

### 🐛 Correcciones de estabilidad y memoria
- **Fuga de memoria en el buffer de eventos** — se agregó limpieza real de timers, cachés y listeners al cerrar una conexión (`ev.destroy()`), evitando que la memoria crezca con reconexiones frecuentes.
- **Loop de reintentos por fallas de descifrado (MAC)** — se agregó detección de colisión de "base key" en reintentos de mensajes: si WhatsApp reenvía el mismo mensaje repetidamente por un fallo de sesión, la librería ahora detecta el patrón y fuerza una sesión nueva en vez de reintentar indefinidamente.
- **Duplicados al sincronizar historial de grupos** — se corrigió el merge de "participantes que salieron" (`pastParticipants`) para no duplicar entradas cuando WhatsApp envía el historial en varios paquetes.
- **IDs de consulta de canales (newsletters) desactualizados** — los IDs internos de `FOLLOW`/`UNFOLLOW` de canales estaban vencidos y podían empezar a fallar silenciosamente; se actualizaron a los vigentes.
- **Versión de protocolo de WhatsApp Web actualizada** — reduce el riesgo de desconexiones forzadas por versión obsoleta.
- **Dependencias actualizadas**: `libsignal` ahora se instala desde npm (antes requería `git` instalado en el servidor), `whatsapp-rust-bridge`, `protobufjs` y otras al día.

> Nota: las funciones de auto-follow de canales, el motor de envío de mensajes (`sendMessage` y helpers internos) y el manejo avanzado de negocios (`business.js`) son personalizaciones propias de este fork — se mantuvieron intactas durante esta actualización.

### 🔧 Fusión profunda adicional
- **`chats.js` reconstruido sobre la base oficial**: recuperación automática de sincronización de estado cuando falta una clave (antes fallaba silenciosamente), resolución correcta de bloqueo de contactos por LID/PN, y tracking de finalización de sincronización de historial.
- **`groups.js` reconstruido**: mejor resolución de LID/PN en metadata de grupos + tus funciones `isGroupAdmin`, `getGroupAdmins`, `resolveParticipantJid`, `groupMetadataCached` intactas.
- **`business.js` alineado al oficial** (era funcionalmente idéntico, solo cambiaba el estilo del código).
- **Endpoint de canales actualizado**: WhatsApp movió `newsletterFollow`/`newsletterUnfollow` a un endpoint nuevo (`_v2`); se actualizó, incluyendo tu sistema de auto-follow interno, para que siga funcionando.

---



### ✅ Nuevas funciones añadidas
- **Detección de admins y resolución de JID/LID 100% nativa** — Antes, cada bot tenía que reimplementar a mano la comparación de `jid`, `@lid` y número de teléfono contra `groupMetadata` para saber si alguien es admin. Ahora esa lógica vive directamente en el socket:
  - `isGroupAdmin(chatId, jid)` — `true`/`false` si ese participante (venga como número o como `@lid`) es admin o superadmin del grupo.
  - `getGroupAdmins(chatId)` — lista de admins del grupo, ya resueltos a su jid de número de teléfono real (nunca `@lid`).
  - `resolveParticipantJid(chatIdOrParticipants, jid)` — convierte cualquier `@lid` a su número real. Primero busca en los participantes del grupo; si no encuentra coincidencia, usa el mapeo LID↔PN nativo de WhatsApp (`signalRepository.lidMapping`) en vez de adivinar.
  - `groupMetadataCached(chatId)` — igual que `groupMetadata`, pero con cache de 30s que se invalida solo apenas hay un alta, baja, ascenso o descenso real de participantes (via `group-participants.update`), para no golpear a WhatsApp en cada mensaje.

  Esto es lo mismo que antes hacían los bots "a mano" con `groupMetadata` + comparaciones manuales de `id`/`lid`/`phoneNumber`, pero ahora resuelto por la librería, con cache y con el mapeo oficial de WhatsApp como respaldo.

---

## 🆕 Novedades — v7.0.1

### ✅ Nuevas funciones añadidas
- **Botones nativos reales** — Se agregaron métodos directos en el socket para enviar botones interactivos de WhatsApp (native flow), reemplazando el viejo formato `buttons: [{text, id}]` que ya no renderiza en WhatsApp:
  - `sendQuickReplyButtons` — Botones de respuesta rápida
  - `sendUrlButton` — Botón que abre un enlace
  - `sendCallButton` — Botón para iniciar una llamada
  - `sendCopyButton` — Botón que copia texto al portapapeles
  - `sendReminderButton` — Botón de recordatorio
  - `sendListButton` — Menú desplegable con secciones y filas
  - `sendMixedButtons` — Combinación libre de varios tipos en un solo mensaje
- **Previsualización automática de links** — `sendLinkPreview` y todos los botones de arriba arman solos la tarjeta grande (imagen + título + descripción) de cualquier URL que detecten en el texto, con el mismo motor que usa WhatsApp para los links normales.

### 🐛 Correcciones
- **Error en macOS** — Se reparó un bug crítico que impedía iniciar sesión correctamente en dispositivos Mac. El proceso de pairing/QR ahora funciona de forma estable en macOS.

---

## ⚠️ Nota Importante

ꕤ Esta librería está basada en Baileys. No está afiliada ni aprobada oficialmente por WhatsApp.

> **@fer2809fl/baileys** y su desarrollador no se hacen responsables por el mal uso de esta librería.
> Úsala de forma responsable — nada de spam ni actividades maliciosas.

---

## 📦 Instalación

**Opción 1 — Desde npm (recomendado)**
```bash
npm install @fer2809fl/baileys
yarn add @fer2809fl/baileys
```

**Opción 2 — Desde GitHub directamente**
```bash
npm install github:Fer2809fl/Baileys
yarn add github:Fer2809fl/Baileys
```

**En tu package.json**
```json
{
  "dependencies": {
    "@fer2809fl/baileys": "^1.11.0"
  }
}
```

Repositorio: [github.com/Fer2809fl/Baileys](https://github.com/Fer2809fl/Baileys)
Paquete npm: [npmjs.com/package/@fer2809fl/baileys](https://www.npmjs.com/package/@fer2809fl/baileys)

---

## ⚡ Inicio Rápido

```javascript
const { makeWASocket, useMultiFileAuthState } = require('@fer2809fl/baileys')

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('session-myfer')

    const fer = makeWASocket({
        auth: state,
        printQRInTerminal: true,
        generateHighQualityLinkPreview: true // recomendado para que las previews se vean mejor
    })

    fer.ev.on('connection.update', ({ connection }) => {
        if (connection === 'open') console.log('✅ ¡Conectado con éxito!')
        if (connection === 'close') console.log('❌ Conexión cerrada, reconectando...')
    })

    fer.ev.on('messages.upsert', async ({ messages }) => {
        const m = messages[0]
        if (!m.message) return

        await fer.sendMessage(m.key.remoteJid, {
            text: '¡Hola! Soy un bot de Fer!'
        })
    })

    fer.ev.on('creds.update', saveCreds)
}

startBot()
```

---

## 🔘 Botones Interactivos *(actualizado en v1.9.0)*

A diferencia de otras librerías, acá **no se importan funciones sueltas**: los botones son métodos que ya están directamente en el socket que devuelve `makeWASocket`. Solo llamalos desde `sock` (o como hayas nombrado tu conexión, `fer` en los ejemplos).

Todos aceptan al final un objeto `extra` opcional (`footer`, `image`, `video`, `document`, `quoted`) y uno de `options` para lo que ya soporta `sendMessage` normalmente.

---

### ⚡ `sendQuickReplyButtons` — Botones de Respuesta Rápida

```javascript
await fer.sendQuickReplyButtons(
    jid,
    '🎮 *MENÚ DE OPCIONES*\n\n¿Qué deseas hacer?',
    [
        { id: 'menu',  text: '📋 Ver Menú'    },
        { id: 'info',  text: 'ℹ️ Información' },
        { id: 'owner', text: '👑 Owner'       }
    ]
)
```

---

### 🔗 `sendUrlButton` — Botón URL (con previsualización automática)

Genera solo la tarjeta de previsualización (imagen, título, descripción) del link del botón.

```javascript
await fer.sendUrlButton(
    jid,
    '🔗 *ENLACES IMPORTANTES*\n\nVisita nuestro repositorio oficial:',
    '🌐 Ver GitHub',                             // etiqueta del botón
    'https://github.com/Fer2809fl/Baileys'       // URL de destino
)
```

---

### 📞 `sendCallButton` — Botón de Llamada

```javascript
await fer.sendCallButton(
    jid,
    '📞 *SOPORTE TÉCNICO*\n\n¿Necesitas ayuda? Llámanos:',
    '📞 Llamar Ahora',   // etiqueta del botón
    '+5214183357841'     // número de teléfono
)
```

---

### 📋 `sendCopyButton` — Botón Copiar

```javascript
await fer.sendCopyButton(
    jid,
    '📋 *CÓDIGO DE INSTALACIÓN*\n\nEjecuta este comando en tu terminal:',
    '📋 Copiar Comando',      // etiqueta del botón
    'npm install asta-bot'    // texto que se copiará
)
```

---

### ⏰ `sendReminderButton` — Botón de Recordatorio

```javascript
await fer.sendReminderButton(
    jid,
    '⏰ *RECORDATORIO*\n\nActiva un aviso para no olvidarlo:',
    '⏰ Recordarme'
)
```

---

### 📋 `sendListButton` — Menú Desplegable (Lista)

```javascript
await fer.sendListButton(
    jid,
    '📋 *SELECCIONA UNA OPCIÓN*',
    'Menú Principal',  // título del botón que abre la lista
    [
        {
            title: '📱 COMANDOS BÁSICOS',
            rows: [
                { id: '#menu',  title: '📋 Menú',  description: 'Ver todos los comandos' },
                { id: '#ping',  title: '🏓 Ping',  description: 'Ver latencia del bot'   },
                { id: '#owner', title: '👑 Owner', description: 'Info del creador'       }
            ]
        },
        {
            title: '🎮 COMANDOS DE GRUPO',
            rows: [
                { id: '#add',     title: '➕ Agregar',  description: 'Agregar usuario al grupo'  },
                { id: '#kick',    title: '👢 Expulsar', description: 'Expulsar usuario del grupo' },
                { id: '#promote', title: '⭐ Promover', description: 'Dar admin a un usuario'    }
            ]
        }
    ]
)
```

---

### 🎯 `sendMixedButtons` — Múltiples Botones Combinados

Para armar cualquier combinación libre de tipos (o alguno que no tenga método propio) en un solo mensaje.

```javascript
await fer.sendMixedButtons(
    jid,
    '🎯 *PANEL DE CONTROL*\n\nSelecciona una acción rápida:',
    [
        { name: 'cta_url',    params: { display_text: '🌐 GitHub', url: 'https://github.com/Fer2809fl/Baileys', merchant_url: 'https://github.com/Fer2809fl/Baileys' } },
        { name: 'cta_copy',   params: { display_text: '📋 Comando Inicio', copy_code: 'npm start' } },
        { name: 'quick_reply', params: { display_text: '📋 Ver Menú', id: 'menu' } }
    ]
)
```

---

## 🖼️ Previsualización de Links *(nuevo en v1.9.0)*

`sendLinkPreview` manda solo texto + una tarjeta grande y prolija con la imagen, título y descripción de cualquier URL — igual que un mensaje normal de WhatsApp con link, pero forzando `renderLargerThumbnail` para que se vea mejor. Sirve para links a fotos, artículos, redes sociales, lo que sea.

```javascript
await fer.sendLinkPreview(
    jid,
    '¡Mirá esto! 👀',
    'https://github.com/Fer2809fl/Baileys'
)
```

Si el texto ya trae el link adentro, no hace falta pasarlo aparte:

```javascript
await fer.sendLinkPreview(
    jid,
    'Repo oficial: https://github.com/Fer2809fl/Baileys'
)
```

Esta misma previsualización se activa automáticamente en `sendUrlButton` y en cualquier otro botón si el texto trae un link. Para desactivarla en un envío puntual:

```javascript
await fer.sendUrlButton(jid, texto, '🌐 Ver más', url, { preview: false })
```

---

### Plugin de ejemplo completo

```javascript
// plugins/botones.js
let handler = async (m, { conn, usedPrefix }) => {

    if (m.text === `${usedPrefix}boton1`) {
        await conn.sendCopyButton(m.chat,
            '📋 *CÓDIGO DE INSTALACIÓN*\n\nEjecuta este comando en tu terminal:',
            '📋 Copiar Comando',
            'npm install asta-bot'
        )
    }

    else if (m.text === `${usedPrefix}boton2`) {
        await conn.sendUrlButton(m.chat,
            '🔗 *ENLACES IMPORTANTES*\n\nVisita nuestro repositorio oficial:',
            '🌐 Ver GitHub',
            'https://github.com/Fer2809fl/Baileys'
        )
    }

    else if (m.text === `${usedPrefix}boton3`) {
        await conn.sendQuickReplyButtons(m.chat,
            '🎮 *MENÚ DE OPCIONES*\n\n¿Qué deseas hacer?',
            [
                { id: 'menu',  text: '📋 Ver Menú'    },
                { id: 'info',  text: 'ℹ️ Información' },
                { id: 'owner', text: '👑 Owner'       }
            ]
        )
    }

    else if (m.text === `${usedPrefix}boton4`) {
        await conn.sendCallButton(m.chat,
            '📞 *SOPORTE TÉCNICO*\n\n¿Necesitas ayuda? Llámanos:',
            '📞 Llamar Ahora',
            '+5214183357841'
        )
    }

    else if (m.text === `${usedPrefix}boton5`) {
        await conn.sendListButton(m.chat,
            '📋 *SELECCIONA UNA OPCIÓN*',
            'Menú Principal',
            [
                {
                    title: '📱 COMANDOS BÁSICOS',
                    rows: [
                        { id: '#menu',  title: '📋 Menú',  description: 'Ver todos los comandos' },
                        { id: '#ping',  title: '🏓 Ping',  description: 'Ver latencia del bot'   }
                    ]
                }
            ]
        )
    }

    else if (m.text === `${usedPrefix}boton6`) {
        await conn.sendLinkPreview(m.chat,
            '¡Mirá el repo! 👀',
            'https://github.com/Fer2809fl/Baileys'
        )
    }
}

handler.command = ['boton1', 'boton2', 'boton3', 'boton4', 'boton5', 'boton6']
export default handler
```

---

## 👑 Admins y resolución de JID/LID *(nuevo en v1.10.0)*

No hace falta comparar `jid`/`@lid`/número a mano contra `groupMetadata`: usá estas funciones directo desde el socket.

```javascript
// ¿Es admin del grupo? (acepta jid normal o @lid, resuelve solo)
const esAdmin = await fer.isGroupAdmin(m.chat, m.sender)

// Lista de admins ya resueltos a número (nunca @lid)
const admins = await fer.getGroupAdmins(m.chat)
// [{ jid: '521418xxxxxxx@s.whatsapp.net', admin: 'superadmin' }, ...]

// Resolver un @lid puntual (mención, quoted, etc.) a su número real
const numeroReal = await fer.resolveParticipantJid(m.chat, mentionedJid)

// groupMetadata con cache de 30s (se invalida solo con altas/bajas/promociones reales)
const meta = await fer.groupMetadataCached(m.chat)
```

```javascript
// plugins/admin-only.js
let handler = async (m, { conn }) => {
    if (!(await conn.isGroupAdmin(m.chat, m.sender))) {
        return conn.sendMessage(m.chat, { text: '🔒 Solo admins pueden usar este comando.' })
    }
    // ...
}
handler.command = ['ejemplo']
export default handler
```

---

## ✨ Características

### General
- 🚀 Optimizado para mayor velocidad y estabilidad
- 📸 Mensajes multimedia (imágenes, video, audio, documentos)
- 🔘 **Botones nativos reales, sin imports sueltos** *(v1.9.0)*
- 🖼️ **Previsualización automática de links en botones y mensajes** *(v1.9.0)*
- 👥 Soporte para grupos y chats privados

### Técnicas
- ⚡ Sin Selenium — Conexión directa vía WebSocket
- 💾 Super eficiente — Bajo consumo de RAM
- 📱 Soporte multi-dispositivo — Compatible con WhatsApp Web
- 🔷 Totalmente tipado — TypeScript y JavaScript
- 🔄 Reconexión automática ante desconexiones
- 🔐 Sesiones persistentes guardadas localmente
- 🍎 Compatible con macOS

---

## 📖 Enlaces

- Repositorio: [https://github.com/Fer2809fl/Baileys](https://github.com/Fer2809fl/Baileys)
- Paquete npm: [https://www.npmjs.com/package/@fer2809fl/baileys](https://www.npmjs.com/package/@fer2809fl/baileys)
