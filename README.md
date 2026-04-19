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

## 🆕 Novedades — v1.8.9

### ✅ Nuevas funciones añadidas
- **Botones interactivos** — Se agregaron funciones nativas para enviar botones de WhatsApp:
  - `sendCopyButton` — Botón que copia texto al portapapeles
  - `sendUrlButton` — Botón que abre un enlace en el navegador
  - `sendQuickReplyButtons` — Botones de respuesta rápida
  - `sendCallButton` — Botón para iniciar una llamada telefónica
  - `sendListMenu` — Menú desplegable con secciones y filas
  - `sendInteractiveMessage` — Combinación de botones mixtos (URL + Copiar + Rápido)

### 🐛 Correcciones
- **Error en macOS** — Se reparó un bug crítico que impedía iniciar sesión correctamente en dispositivos Mac. El proceso de pairing/QR ahora funciona de forma estable en macOS.

---

## ⚠️ Nota Importante

ꕤ Esta librería está basada en Baileys. No está afiliada ni aprobada oficialmente por WhatsApp.

> **@fer2809fl/baileys** y su desarrollador no se hacen responsables por el mal uso de esta librería.
> Úsala de forma responsable — nada de spam ni actividades maliciosas.

---

## 📦 Instalación

Puedes instalarla de varias formas, todas funcionan igual:

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

**Opción 3 — También funciona con el paquete original**
```bash
npm install @whiskeysockets/baileys
yarn add @whiskeysockets/baileys
```

**Opción — En tu package.json** (elige una de estas formas):
```json
{
  "dependencies": {
    "@fer2809fl/baileys": "^1.8.9"
  }
}
```
```json
{
  "dependencies": {
    "@whiskeysockets/baileys": "github:Fer2809fl/Baileys"
  }
}
```

---

## ⚡ Inicio Rápido

### JavaScript
```javascript
const { makeWASocket, useMultiFileAuthState } = require('@fer2809fl/baileys')

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('session-mymelody')
    
    const melody = makeWASocket({
        auth: state,
        printQRInTerminal: true
    })

    melody.ev.on('connection.update', ({ connection }) => {
        if (connection === 'open') console.log('✅ ¡Conectado con éxito!')
        if (connection === 'close') console.log('❌ Conexión cerrada, reconectando...')
    })

    melody.ev.on('messages.upsert', async ({ messages }) => {
        const m = messages[0]
        if (!m.message) return

        await melody.sendMessage(m.key.remoteJid, { 
            text: '¡Hola! Soy un bot de Delta!' 
        })
    })

    melody.ev.on('creds.update', saveCreds)
}

startBot()
```

### TypeScript
```typescript
import makeWASocket, { useMultiFileAuthState, DisconnectReason } from '@fer2809fl/baileys'
import { Boom } from '@hapi/boom'

async function startBot(): Promise<void> {
    const { state, saveCreds } = await useMultiFileAuthState('session-mymelody')
    
    const melody = makeWASocket({
        auth: state,
        printQRInTerminal: true
    })

    melody.ev.on('connection.update', ({ connection, lastDisconnect }) => {
        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut
            if (shouldReconnect) startBot()
        }
        if (connection === 'open') console.log('✅ ¡Conectado!')
    })

    melody.ev.on('messages.upsert', async ({ messages }) => {
        const m = messages[0]
        if (!m.message) return

        await melody.sendMessage(m.key.remoteJid!, { 
            text: '¡Hola! Soy un bot de Delta!' 
        })
    })

    melody.ev.on('creds.update', saveCreds)
}

startBot()
```

---

## ✨ Características

### General
- 🚀 Optimizado para mayor velocidad y estabilidad
- 📸 Mensajes multimedia (imágenes, video, audio, documentos)
- 🤖 Comandos personalizados fáciles de implementar
- 👥 Soporte para grupos y chats privados
- 🔘 **Mensajes interactivos con botones, listas y más** *(nuevo en v1.8.9)*

### Técnicas
- ⚡ Sin Selenium — Conexión directa vía WebSocket
- 💾 Super eficiente — Bajo consumo de RAM
- 📱 Soporte multi-dispositivo — Compatible con WhatsApp Web
- 🔷 Totalmente tipado — TypeScript y JavaScript
- 🔄 Reconexión automática ante desconexiones
- 🔐 Sesiones persistentes guardadas localmente
- 🌐 API completa de WhatsApp Web
- 🍎 **Compatible con macOS** — Error de pairing reparado *(fix en v1.8.9)*

---

## 🔘 Botones Interactivos *(nuevo en v1.8.9)*

Desde la versión **1.8.9** puedes importar y usar funciones nativas para enviar botones interactivos de WhatsApp.

### Importar las funciones

```javascript
// JavaScript (CommonJS)
const {
    sendCopyButton,
    sendUrlButton,
    sendQuickReplyButtons,
    sendCallButton,
    sendListMenu,
    sendInteractiveMessage
} = require('@fer2809fl/baileys')
```

```typescript
// TypeScript / ESM
import {
    sendCopyButton,
    sendUrlButton,
    sendQuickReplyButtons,
    sendCallButton,
    sendListMenu,
    sendInteractiveMessage
} from '@fer2809fl/baileys'
```

---

### 📋 `sendCopyButton` — Botón Copiar
Muestra un botón que al tocarlo copia un texto al portapapeles del usuario.

```javascript
await sendCopyButton(
    conn,
    jid,
    '📋 *CÓDIGO DE INSTALACIÓN*\n\nEjecuta este comando en tu terminal:',
    'npm install asta-bot',   // texto que se copiará
    '📋 Copiar Comando'       // etiqueta del botón
)
```

---

### 🔗 `sendUrlButton` — Botón URL
Abre un enlace en el navegador al tocar el botón.

```javascript
await sendUrlButton(
    conn,
    jid,
    '🔗 *ENLACES IMPORTANTES*\n\nVisita nuestro repositorio oficial:',
    'https://github.com/Fer2809fl/Asta_bot',  // URL de destino
    '🌐 Ver GitHub'                            // etiqueta del botón
)
```

---

### ⚡ `sendQuickReplyButtons` — Botones de Respuesta Rápida
Muestra varios botones de respuesta rápida debajo del mensaje.

```javascript
await sendQuickReplyButtons(
    conn,
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

### 📞 `sendCallButton` — Botón de Llamada
Inicia una llamada al número indicado al tocar el botón.

```javascript
await sendCallButton(
    conn,
    jid,
    '📞 *SOPORTE TÉCNICO*\n\n¿Necesitas ayuda? Llámanos:',
    '+5214183357841',  // número de teléfono
    '📞 Llamar Ahora'  // etiqueta del botón
)
```

---

### 📋 `sendListMenu` — Menú Desplegable (Lista)
Muestra un menú con secciones y opciones seleccionables.

```javascript
await sendListMenu(
    conn,
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
                { id: '#add',     title: '➕ Agregar', description: 'Agregar usuario al grupo'  },
                { id: '#kick',    title: '👢 Expulsar', description: 'Expulsar usuario del grupo' },
                { id: '#promote', title: '⭐ Promover', description: 'Dar admin a un usuario'   }
            ]
        },
        {
            title: '🔧 CONFIGURACIÓN',
            rows: [
                { id: '#sinprefix', title: '⚙️ Sin Prefijo', description: 'Activar/desactivar prefijo' },
                { id: '#antilink', title: '🔗 Anti Link',    description: 'Bloquear enlaces'           }
            ]
        }
    ]
)
```

---

### 🎯 `sendInteractiveMessage` — Múltiples Botones Mixtos
Combina distintos tipos de botones en un solo mensaje.

```javascript
await sendInteractiveMessage(
    conn,
    jid,
    '🎯 *PANEL DE CONTROL*\n\nSelecciona una acción rápida:',
    [
        { type: 'url',   text: '🌐 GitHub',        value: 'https://github.com/Fer2809fl/Asta_bot' },
        { type: 'copy',  text: '📋 Comando Inicio', value: 'npm start'                             },
        { type: 'quick', text: '📋 Ver Menú',       value: 'menu'                                  }
    ]
)
```

---

### Plugin de ejemplo completo

Aquí un plugin listo para usar en tu bot con todos los tipos de botones:

```javascript
// plugins/botones.js
import { 
    sendCopyButton,
    sendUrlButton,
    sendQuickReplyButtons,
    sendCallButton,
    sendListMenu,
    sendInteractiveMessage
} from '@fer2809fl/baileys'

let handler = async (m, { conn, usedPrefix }) => {

    // #boton1 — Botón Copiar
    if (m.text === `${usedPrefix}boton1`) {
        await sendCopyButton(conn, m.chat,
            '📋 *CÓDIGO DE INSTALACIÓN*\n\nEjecuta este comando en tu terminal:',
            'npm install asta-bot',
            '📋 Copiar Comando'
        )
    }

    // #boton2 — Botón URL
    else if (m.text === `${usedPrefix}boton2`) {
        await sendUrlButton(conn, m.chat,
            '🔗 *ENLACES IMPORTANTES*\n\nVisita nuestro repositorio oficial:',
            'https://github.com/Fer2809fl/Asta_bot',
            '🌐 Ver GitHub'
        )
    }

    // #boton3 — Botones de Respuesta Rápida
    else if (m.text === `${usedPrefix}boton3`) {
        await sendQuickReplyButtons(conn, m.chat,
            '🎮 *MENÚ DE OPCIONES*\n\n¿Qué deseas hacer?',
            [
                { id: 'menu',  text: '📋 Ver Menú'    },
                { id: 'info',  text: 'ℹ️ Información' },
                { id: 'owner', text: '👑 Owner'       }
            ]
        )
    }

    // #boton4 — Botón de Llamada
    else if (m.text === `${usedPrefix}boton4`) {
        await sendCallButton(conn, m.chat,
            '📞 *SOPORTE TÉCNICO*\n\n¿Necesitas ayuda? Llámanos:',
            '+5214183357841',
            '📞 Llamar Ahora'
        )
    }

    // #boton5 — Lista Desplegable
    else if (m.text === `${usedPrefix}boton5`) {
        await sendListMenu(conn, m.chat,
            '📋 *SELECCIONA UNA OPCIÓN*',
            'Menú Principal',
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
                        { id: '#add',     title: '➕ Agregar', description: 'Agregar usuario al grupo'    },
                        { id: '#kick',    title: '👢 Expulsar', description: 'Expulsar usuario del grupo' },
                        { id: '#promote', title: '⭐ Promover', description: 'Dar admin a un usuario'    }
                    ]
                },
                {
                    title: '🔧 CONFIGURACIÓN',
                    rows: [
                        { id: '#sinprefix', title: '⚙️ Sin Prefijo', description: 'Activar/desactivar prefijo' },
                        { id: '#antilink',  title: '🔗 Anti Link',   description: 'Bloquear enlaces'           }
                    ]
                }
            ]
        )
    }

    // #boton6 — Botones Mixtos
    else if (m.text === `${usedPrefix}boton6`) {
        await sendInteractiveMessage(conn, m.chat,
            '🎯 *PANEL DE CONTROL*\n\nSelecciona una acción rápida:',
            [
                { type: 'url',   text: '🌐 GitHub',        value: 'https://github.com/Fer2809fl/Asta_bot' },
                { type: 'copy',  text: '📋 Comando Inicio', value: 'npm start'                             },
                { type: 'quick', text: '📋 Ver Menú',       value: 'menu'                                  }
            ]
        )
    }

    // #botones — Ayuda
    else if (m.text === `${usedPrefix}botones`) {
        await conn.reply(m.chat,
            `🧪 *COMANDOS DE PRUEBA - BOTONES INTERACTIVOS*\n\n` +
            `┌✦ *BOTÓN COPIAR*\n` +
            `│ ${usedPrefix}boton1 - Botón que copia texto\n│\n` +
            `├✦ *BOTÓN URL*\n` +
            `│ ${usedPrefix}boton2 - Botón que abre enlace\n│\n` +
            `├✦ *BOTONES RÁPIDOS*\n` +
            `│ ${usedPrefix}boton3 - Botones de respuesta\n│\n` +
            `├✦ *BOTÓN LLAMADA*\n` +
            `│ ${usedPrefix}boton4 - Botón para llamar\n│\n` +
            `├✦ *LISTA DESPLEGABLE*\n` +
            `│ ${usedPrefix}boton5 - Menú con opciones\n│\n` +
            `└✦ *MÚLTIPLES BOTONES*\n` +
            `  ${usedPrefix}boton6 - Combinación de botones\n\n` +
            `✨ *Prueba cada uno y mira cómo funcionan!*`, m)
    }
}

handler.command = ['boton1', 'boton2', 'boton3', 'boton4', 'boton5', 'boton6', 'botones']
handler.help    = ['boton1', 'boton2', 'boton3', 'boton4', 'boton5', 'boton6', 'botones']
handler.tags    = ['test']

export default handler
```

---

## 📖 Uso Básico

### Inicializar el bot

```javascript
// JavaScript
const { makeWASocket, useMultiFileAuthState } = require('@fer2809fl/baileys')

const { state, saveCreds } = await useMultiFileAuthState('session-mymelody')
const melody = makeWASocket({ auth: state, printQRInTerminal: true })
melody.ev.on('creds.update', saveCreds)
```

```typescript
// TypeScript
import makeWASocket, { useMultiFileAuthState } from '@fer2809fl/baileys'

const { state, saveCreds } = await useMultiFileAuthState('session-mymelody')
const melody = makeWASocket({ auth: state, printQRInTerminal: true })
melody.ev.on('creds.update', saveCreds)
```

### Enviar mensajes

```javascript
// Texto simple
await melody.sendMessage(jid, { text: '¡Hola mundo!' })

// Imagen con caption
await melody.sendMessage(jid, {
    image: { url: './images/mymelody.jpg' },
    caption: '¡Mira mi nueva foto!'
})

// Video con caption
await melody.sendMessage(jid, {
    video: { url: './videos/clip.mp4' },
    caption: '¡Nuevo video!'
})

// Audio (PTT = nota de voz)
await melody.sendMessage(jid, {
    audio: { url: './audio/nota.mp3' },
    mimetype: 'audio/mp4',
    ptt: true
})

// Sticker
await melody.sendMessage(jid, {
    sticker: { url: './stickers/melody.webp' }
})

// Documento
await melody.sendMessage(jid, {
    document: { url: './archivo.pdf' },
    mimetype: 'application/pdf',
    fileName: 'archivo.pdf'
})

// Reaccionar a un mensaje
await melody.sendMessage(jid, {
    react: { text: '💖', key: m.key }
})
```

---

## 🤖 Comandos Personalizados

### JavaScript
```javascript
melody.ev.on('messages.upsert', async ({ messages }) => {
    const m = messages[0]
    const body = m.message?.conversation
        || m.message?.extendedTextMessage?.text
        || ''

    const prefix = '!'
    if (!body.startsWith(prefix)) return

    const [cmd, ...args] = body.slice(prefix.length).trim().split(' ')

    switch (cmd.toLowerCase()) {
        case 'hola':
            await melody.sendMessage(m.key.remoteJid, {
                text: '¡Hola! Soy Delta, ¿en qué puedo ayudarte?'
            })
            break
        case 'ping':
            await melody.sendMessage(m.key.remoteJid, { text: '🏓 Pong!' })
            break
        default:
            await melody.sendMessage(m.key.remoteJid, {
                text: `Comando desconocido: ${cmd}`
            })
    }
})
```

---

## ⚙️ Configuración Avanzada

```javascript
const melody = makeWASocket({
    auth: state,
    printQRInTerminal: true,
    markOnlineOnConnect: false,
    browser: ["Delta", "Chrome", "1.0.0"],
    logger: require('pino')({ level: 'silent' }),
    syncFullHistory: false,
    generateHighQualityLinkPreview: true
})
```

---

## 🛠️ Funciones Útiles

### Broadcast a múltiples chats
```javascript
async function broadcastMessage(jids, message) {
    for (const jid of jids) {
        await melody.sendMessage(jid, { text: message })
        await new Promise(r => setTimeout(r, 1000)) // delay para evitar ban
    }
}
```

### Descargar medios recibidos
```javascript
const { downloadMediaMessage } = require('@fer2809fl/baileys')

melody.ev.on('messages.upsert', async ({ messages }) => {
    const m = messages[0]
    if (!m.message?.imageMessage) return

    const buffer = await downloadMediaMessage(m, 'buffer', {})
    require('fs').writeFileSync('./imagen_recibida.jpg', buffer)
    console.log('✅ Imagen guardada')
})
```

### Obtener info de un grupo
```javascript
const metadata = await melody.groupMetadata(jid)
console.log('Nombre:', metadata.subject)
console.log('Participantes:', metadata.participants.length)
```

### Mencionar usuarios en un grupo
```javascript
await melody.sendMessage(jid, {
    text: '@1234567890 ¡Hola!',
    mentions: ['1234567890@s.whatsapp.net']
})
```

---

## 📁 Estructura Recomendada del Proyecto

```
mi-bot/
├── index.js          # Entrada principal
├── config.js         # Configuración general
├── commands/
│   ├── hola.js
│   ├── ping.js
│   ├── stickers.js
│   └── botones.js    
├── events/
│   ├── messages.js
│   └── connection.js
├── utils/
│   └── helpers.js
└── session-mymelody/ # Sesión guardada automáticamente
```

---

## 📝 Historial de Versiones

| Versión | Cambios |
|---------|---------|
| **1.8.9** | ✅ Botones interactivos (`sendCopyButton`, `sendUrlButton`, `sendQuickReplyButtons`, `sendCallButton`, `sendListMenu`, `sendInteractiveMessage`) — 🐛 Fix error de pairing en macOS |
| 1.4.5 | Versión estable anterior |

---

## 🔗 Links

- 📦 npm: [npmjs.com/package/@fer2809fl/baileys](https://www.npmjs.com/package/@fer2809fl/baileys)
- 💻 Repositorio: [github.com/Fer2809fl/Baileys](https://github.com/Fer2809fl/Baileys)
- 🐛 Issues: [github.com/Fer2809fl/Baileys/issues](https://github.com/Fer2809fl/Baileys/issues)

---

<div align="center">

Desarrollado con 🤍 por [Fer2809fl](https://github.com/Fer2809fl)

</div>
