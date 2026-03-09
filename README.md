<div align="center">

<img src="https://nexy-ar7z.b-cdn.net/storage/b99a0660.jpg" alt="Baileys" width="200" style="border-radius: 20px;"/>

# @fer2809fl/baileys
### API de WhatsApp Web para Node.js

[![npm version](https://img.shields.io/npm/v/@fer2809fl/baileys?color=blueviolet&label=version)](https://www.npmjs.com/package/@fer2809fl/baileys)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D20-brightgreen)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-supported-blue)](https://www.typescriptlang.org)

*Conéctate a WhatsApp Web directamente desde Node.js sin navegadores ni Selenium*

</div>

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

**Opción 4 — En tu package.json** (elige una de estas formas):
```json
{
  "dependencies": {
    "@fer2809fl/baileys": "^1.4.5"
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
- 🔘 Mensajes interactivos con botones y listas

### Técnicas
- ⚡ Sin Selenium — Conexión directa vía WebSocket
- 💾 Super eficiente — Bajo consumo de RAM
- 📱 Soporte multi-dispositivo — Compatible con WhatsApp Web
- 🔷 Totalmente tipado — TypeScript y JavaScript
- 🔄 Reconexión automática ante desconexiones
- 🔐 Sesiones persistentes guardadas localmente
- 🌐 API completa de WhatsApp Web

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
            await melody.sendMessage(m.key.remoteJid, {
                text: '🏓 Pong!'
            })
            break

        case 'stickers':
            await melody.sendMessage(m.key.remoteJid, {
                text: '¡Aquí tienes stickers lindos!'
            })
            break

        default:
            await melody.sendMessage(m.key.remoteJid, {
                text: `Comando desconocido: ${cmd}`
            })
    }
})
```

### TypeScript
```typescript
melody.ev.on('messages.upsert', async ({ messages }) => {
    const m = messages[0]
    const body: string = m.message?.conversation
        ?? m.message?.extendedTextMessage?.text
        ?? ''

    const prefix = '!'
    if (!body.startsWith(prefix)) return

    const [cmd, ...args]: string[] = body.slice(prefix.length).trim().split(' ')

    const commands: Record<string, () => Promise<void>> = {
        hola: async () => {
            await melody.sendMessage(m.key.remoteJid!, {
                text: '¡Hola! Soy My Melody, ¿en qué puedo ayudarte?'
            })
        },
        ping: async () => {
            await melody.sendMessage(m.key.remoteJid!, { text: '🏓 Pong!' })
        },
        info: async () => {
            await melody.sendMessage(m.key.remoteJid!, {
                text: `📌 JID: ${m.key.remoteJid}\n👤 Sender: ${m.key.participant ?? m.key.remoteJid}`
            })
        }
    }

    await commands[cmd.toLowerCase()]?.()
})
```

---

## ⚙️ Configuración Avanzada

### JavaScript
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

### TypeScript
```typescript
import pino from 'pino'

const melody = makeWASocket({
    auth: state,
    printQRInTerminal: true,
    markOnlineOnConnect: false,
    browser: ["Delta", "Chrome", "1.0.0"] as [string, string, string],
    logger: pino({ level: 'silent' }),
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

## 📘 TypeScript — Tipos Personalizados

```typescript
import makeWASocket, { WASocket, proto } from '@fer2809fl/baileys'

// Tipo para un mensaje con datos del remitente
type MessageWithSender = proto.IWebMessageInfo & {
    senderName?: string
    isGroup?: boolean
}

// Función tipada para procesar mensajes
async function processMessage(
    sock: WASocket,
    msg: MessageWithSender
): Promise<void> {
    const jid = msg.key.remoteJid!
    const text = msg.message?.conversation ?? ''

    if (text === '!tipo') {
        await sock.sendMessage(jid, {
            text: `Tipo de chat: ${msg.isGroup ? 'Grupo' : 'Privado'}`
        })
    }
}
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
│   └── stickers.js
├── events/
│   ├── messages.js
│   └── connection.js
├── utils/
│   └── helpers.js
└── session-mymelody/ # Sesión guardada automáticamente
```

---

## 🔗 Links

- 📦 npm: [npmjs.com/package/@fer2809fl/baileys](https://www.npmjs.com/package/@fer2809fl/baileys)
- 💻 Repositorio: [github.com/Fer2809fl/Baileys](https://github.com/Fer2809fl/Baileys)
- 🐛 Issues: [github.com/Fer2809fl/Baileys/issues](https://github.com/Fer2809fl/Baileys/issues)

---

<div align="center">

Desarrollado con 🤍 por [Fer2809fl](https://github.com/Fer2809fl)

</div>
