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

## 🆕 Novedades — v7.0.5

Tanda de mantenimiento: se revisó el fork "beta" del proyecto en busca de utilidades que este repo todavía no tenía, y se portaron una por una (evitando duplicar nombres ya existentes) en vez de reemplazar archivos completos.

### 🔧 Segunda pasada de mantenimiento (esta actualización)
- **`messages-send.js`** — se corrigió un caso donde el nodo `biz` (usado por los botones nativos) podía duplicarse dentro del stanza si ya venía agregado por otra parte del mensaje; ahora se verifica que no exista antes de agregarlo.
- Se documentaron en este README funciones que **ya existían en el código** desde la fusión con el fork beta pero no tenían ejemplo de uso: tablas, bloques de código, carruseles, álbumes y canales/newsletters (ver secciones nuevas más abajo).

### 🔧 Tercera pasada de mantenimiento — auditoría completa de código (no solo README)
- Se comparó **archivo por archivo** todo `lib/` entre este fork y el fork beta (no solo lo que aparecía documentado). Confirmado: no faltaba ninguna función real, solo faltaban exports y tipos.
- Fix: `Utils/reporting-utils.js` existía en el código pero **no se exportaba** desde el paquete (`Utils/index.js` / `Utils/index.d.ts`) — quien instalaba `@fer2809fl/baileys` no podía importar sus funciones. Ya se agregó.
- Fix: `Utils/companion-reg-client-utils.js` tampoco se exportaba en `Utils/index.d.ts` (sí en el `.js`) — corregido.
- **Tipos de TypeScript nuevos**: se escribieron los `.d.ts` que faltaban para los 9 módulos portados del beta que solo venían en JavaScript — `anti-ban`, `smart-reconnect`, `message-queue`, `enhanced-cache`, `enhanced-logger`, `bot-utils`, `banner`, `rich-message-utils` y `use-sqlite-auth-state` — verificados con `tsc` para que compilen sin errores. Ahora sí tienen autocompletado y chequeo de tipos en TypeScript.
- Limpieza de marca: `banner.js` y `enhanced-logger.js` traían branding y un link de repo del proyecto original de donde se portó el código; se actualizó a este fork.

Próximas tandas (se irán agregando poco a poco): documentación de Grupos avanzados, Comunidades, Negocios, Perfil/Privacidad, Estados (stories) y Eventos.

### 🆕 Cuarta pasada — actualización de protocolo + funciones nuevas
- **Versión de WhatsApp Web actualizada** a `2.3000.1047406223` (la más reciente confirmada al momento de esta actualización), reduciendo el riesgo de rechazo de conexión por versión vieja.
- **Nuevas funciones de chat** (no existían ni en este fork ni en el beta — son de cosecha propia esta vez): atajos simples para las operaciones de chat más comunes, en vez de tener que armar el objeto de `chatModify` a mano:
  ```javascript
  await sock.pinChat(jid)              // fijar chat
  await sock.pinChat(jid, false)       // desfijar
  await sock.archiveChat(jid)          // archivar
  await sock.archiveChat(jid, false)   // desarchivar
  await sock.muteChat(jid, Date.now() + 8 * 60 * 60 * 1000) // silenciar 8 horas
  await sock.muteChat(jid)             // quitar silencio
  await sock.markChatRead(jid)         // marcar como leído
  await sock.markChatUnread(jid)       // marcar como no leído
  await sock.clearChat(jid)            // vaciar el historial del chat
  await sock.deleteChat(jid)           // eliminar el chat de la lista
  ```
  Todas usan por debajo el mismo `chatModify` de siempre (mismo protocolo, mismos parches de estado), solo que ahora no hay que recordar la forma exacta del objeto `mod`.
- **Fijar un mensaje dentro del chat** (`pinInChatMessage`) — esta ya existía en el código pero no estaba documentada:
  ```javascript
  // Fijar el mensaje citado por 24 horas (86400 segundos)
  await sock.sendMessage(jid, { pin: quotedMsg.key, type: 1, time: 86400 })
  // Desfijar
  await sock.sendMessage(jid, { pin: quotedMsg.key, type: 2 })
  ```

### ✅ Nuevas funciones añadidas

**Anti-Ban** (`Utils/anti-ban.js`)
- `randomDelay`, `messageDelay`, `typingDelay` — retrasos aleatorios "humanizados" antes de enviar.
- `RateLimiter`, `globalRateLimiter`, `groupRateLimiter`, `broadcastRateLimiter` — limitadores de tasa listos para usar por chat/grupo/difusión.
- `PresenceManager`, `generateSessionFingerprint`, `isValidJid`, `sanitizeMessage` — utilidades de apoyo para reducir el riesgo de baneo por comportamiento de bot.

**Reconexión inteligente** (`Utils/smart-reconnect.js`)
- `SmartReconnect`, `createConnectionHandler`, `withRetry` — backoff exponencial con jitter y detección de causas de desconexión recuperables vs definitivas.

**Cola de mensajes** (`Utils/message-queue.js`)
- `MessageQueue`, `createMessageQueue` — colas con prioridad (`PRIORITY.CRITICAL` a `PRIORITY.BACKGROUND`) y control de tasa por tipo de contenido.

**Caché mejorada** (`Utils/enhanced-cache.js`)
- `EnhancedCache`, `CacheManager` — caché en memoria con TTL/stale-TTL basada en `lru-cache`, con snapshot a disco.

**Logger mejorado** (`Utils/enhanced-logger.js`)
- `createLogger`, `RyzeLogger` — logger con niveles, colores en consola e iconos por categoría (no reemplaza tu logger `pino` existente, es una alternativa opcional).

**Mensajes programados** (`Utils/scheduled-messages.js`)
```javascript
import { startScheduler, scheduleMessage, recurringMessage } from '@fer2809fl/baileys'

startScheduler(sock) // arranca el scheduler una vez tengas el sock conectado

// una sola vez, en una fecha exacta
scheduleMessage('123@s.whatsapp.net', { text: 'Recordatorio' }, Date.now() + 60_000)

// recurrente con cron simple: "MIN HOUR DOM MON DOW"
recurringMessage('123@s.whatsapp.net', { text: 'Buenos días' }, '0 9 * * *')
```
También: `cancelScheduledMessage`, `deleteScheduledMessage`, `listScheduledMessages`, `getScheduledMessage`, `updateScheduledMessage`, `getSchedulerStats`. Persiste en `database/scheduled-messages.json`.

**Utilidades de LID** (`Utils/lid-utils.js`)
- `isLid`, `lidToJid`, `resolveAnyLidToJid`, `resolveParticipant`, `getParticipantJid(s)`, `cacheParticipantLids`, `findParticipantByNumber`, entre otras — resolución y cacheo de `@lid` ↔ número real con persistencia en `database/lid-cache.json`. Complementa (no reemplaza) la resolución de admins/JID-LID nativa que ya tenía este fork desde v1.10.0.

**Utilidades para bots** (`Utils/bot-utils.js`)
- `parseCommand(text, prefix)` — parseo de comandos con flags (`--flag=valor`) y argumentos.
- `CooldownManager`, `PermissionManager` (owners/admins/baneados/premium).
- `extractMentions`, `extractQuotedMessage`, `isGroupAdmin`, `isBotAdmin`, `formatPhoneNumber`, `parseTime('10m')`, `formatDuration(ms)`, `sendFast(sock, jid, contenido)`.

**Auth state en SQLite** (`Utils/use-sqlite-auth-state.js`)
```javascript
import { useSqliteAuthState } from '@fer2809fl/baileys'
const { state, saveCreds } = await useSqliteAuthState({ dbPath: './auth.db' })
```
Requiere `better-sqlite3` (peer dependency opcional: `npm i better-sqlite3`).

**Banner de inicio** (`Utils/banner.js`) — `printBanner()` opcional para mostrar un logo ASCII al arrancar el bot.

**AI Rich Response — helpers de bajo nivel** (`Utils/rich-message-utils.js`)
- `prepareRichResponseMessage(contenido)` — arma un `AIRichResponseMessage` completo (texto + código + tabla + links) en un solo llamado, incluyendo la firma/certificado de `botMetadata`.
- `toUnified`, `wrapToBotForwardedMessage`, `botMetadataSignature`, `botMetadataCertificate` — piezas internas reutilizables si armas tus propios mensajes enriquecidos.
- Se ampliaron los lenguajes soportados para resaltado de código en `LANGUAGE_KEYWORDS` (`Utils/rich-messages.js`): ahora incluye `rust`, `c`, `cpp`/`c++`, `csharp`/`c#`, `html` y `css`, además de los que ya tenías.

**Builder "Modded"** (`Modded/message_builder.js`) — clases con API encadenable para armar botones, carruseles y respuestas AI-Rich sin construir el objeto a mano: `Button`, `ButtonV2`, `Carousel`, `AIRich`, `ORich`, `Toolkit`. *(Este archivo trae una nota de autoría de su creador original — se mantuvo intacta tal cual, junto con los términos: uso libre para proyectos propios, pero no puede revenderse ni redistribuirse como librería independiente.)*

**VoIP — llamadas de voz** (`VoIP/`) — cliente experimental de llamadas de voz de WhatsApp sobre el motor WASM oficial:
```javascript
import { VoipClient, CallState } from '@fer2809fl/baileys'

const voip = new VoipClient(sock)
const call = await voip.call('123@s.whatsapp.net')
call.on('stateChange', (state) => console.log(CallState[state]))
```
Incluye `ActiveCall`, manejo de señalización, y el binario WASM necesario (`lib/assets/wasm/`). Es una función pesada y experimental: úsala solo si tu bot realmente necesita hacer/recibir llamadas.

### 🔧 Notas de mantenimiento
- Se revisó cuidadosamente cada función nueva contra el código ya existente para no pisar ni duplicar exports (por ejemplo, `BufferJSON` y los tipos de resaltado de código se reutilizan de los archivos que ya tenías, en vez de crear una segunda copia).
- Las funciones marcadas arriba con ejemplo de código ya están 100% cableadas y listas para usar; el resto se documentará con más ejemplos en la próxima revisión.
- Los archivos `anti-ban.js`, `smart-reconnect.js`, `message-queue.js`, `enhanced-cache.js`, `enhanced-logger.js`, `bot-utils.js`, `banner.js`, `rich-message-utils.js` y `use-sqlite-auth-state.js` se distribuyen por ahora solo en JavaScript (igual que en el fork de origen); los tipos de TypeScript para estos módulos llegarán en una futura actualización.

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

## 🌐 HTML embebido en WhatsApp *(nuevo en v7.1.0)*

WhatsApp expone un renderer HTML interno (diseñado originalmente para Meta AI)
accesible vía el campo opaco `unifiedResponse.data` de `AIRichResponseMessage`.
Cuando el JSON embebido contiene un `__typename: "GenAIaeacdsnwHtmlPrimitive"`,
el cliente levanta un **WebView sandboxed dentro del bocadillo del mensaje** y
renderiza el HTML+JS indicado en `payload`, con permiso de red limitado a los
dominios listados en `trusted_sources`.

Este fork expone esa capacidad como API de primer nivel:

### `sock.sendHtml` — envía un WebView dentro del chat

```javascript
await sock.sendHtml(
  jid,
  html,                  // string con <style>, <body>, <script>
  trustedSources,        // ["api.tuyo.com"]  ← dominios permitidos para fetch
  quoted,                // mensaje a responder (opcional)
  { headerText, footer } // opciones (opcional)
)
```

O construí el mensaje por tu cuenta con `generateHtmlContent` (exportado desde
`@nyxthor-dev/baileys`) y mandalo con `relayMessage` si querés más control.

### Ejemplo mínimo

```javascript
const html = `
  <body style="margin:0;font-family:sans-serif">
    <h1 style="color:#a3e635">¡Hola desde el WebView!</h1>
    <p>Esto se renderiza dentro del bocadillo de WhatsApp.</p>
  </body>
`;
await sock.sendHtml(jid, html, [], msg);
```

### ⚠️ Limitaciones estructurales (importante)

El WebView tiene 4 restricciones que **no se pueden evitar desde el lado del
HTML**. El patrón recomendado para resolverlas es mover la lógica a un backend
HTTP (ver `examples/html-dynamic/` para un demo completo):

| Limitación | Qué NO hacer | Patrón recomendado |
|---|---|---|
| El WebView es efímero: `localStorage` a menudo se borra al cerrar el chat | Confiar en `localStorage` como única persistencia | Mover la persistencia a un backend HTTP en `trusted_sources` |
| No existe puente HTML → bot (`window.WhatsApp.postMessage` no existe) | Esperar callbacks automáticos al bot | El HTML hace `fetch` a tu API, y tu API llama `sock.sendMessage(...)` |
| `fetch()` solo anda hacia dominios listados en `trusted_sources` | Hacer `fetch` a dominios arbitrarios | Listar todos los dominios necesarios al llamar `sendHtml` |
| El HTML no recibe identidad del usuario automáticamente | Generar el mismo HTML para todos los usuarios | Inyectar `window.__INITIAL__ = { jid, token, ... }` al renderizar |

### Patrón dinámico con estado persistente

```javascript
// En tu comando del bot:
const best = await db.scores.get(senderJid);          // 1. leer estado
const token = issueJwt(senderJid, { expiresIn: '5m' }); // 2. firmar identidad

let html = readFileSync('game.html', 'utf8');
const init = JSON.stringify({ jid: senderJid, best, token, apiBase });
html = html.replace('</body>',
  `<script>window.__INITIAL__ = ${init};</script></body>`);

await sock.sendHtml(jid, html, ['api.tuyo.com'], msg, {
  headerText: '🎮 Mini-juego con estado persistente',
});
```

```javascript
// Dentro del HTML (game.html):
async function saveScore(score) {
  await fetch(INIT.apiBase + '/score', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + INIT.token,
               'Content-Type': 'application/json' },
    body: JSON.stringify({ score })
  });
}
```

```javascript
// En tu backend (Express):
app.post('/score', authMiddleware, async (req, res) => {
  const { jid } = verifyJwt(req.headers.authorization);  // <- identidad del JWT
  const { score } = req.body;
  await db.query('INSERT INTO scores ... ON CONFLICT ...', [jid, score]);
  res.json({ ok: true });
});
```

Ver **`examples/html-dynamic/`** para un demo completo y funcional con SQLite.

### Anti-patrones (qué NO hacer)

- ❌ Usar `forwardOrigin = META_AI` para broadcast masivo — riesgo de ban.
- ❌ Enviar HTML > 50KB — puede truncarse.
- ❌ Confiar en `localStorage` para persistencia entre sesiones.
- ❌ Hacer `fetch` a dominios fuera de `trusted_sources`.
- ❌ Generar HTML sin identidad de usuario (no sabrás quién interactúa).
- ❌ Exponer tokens en texto plano dentro del HTML sin expiración corta.

### ⚠️ Advertencias

- Esta capacidad **no es oficial** y **no está documentada** por Meta. Puede
  romperse en cualquier update del cliente de WhatsApp.
- El renderer depende de `forwardOrigin = META_AI` + `forwardedAiBotMessageInfo`,
  que es una **impersonación** de un mensaje de Meta AI. Usalo en chats propios
  o privados, no en broadcast.
- Probá siempre en Android, iOS y WhatsApp Web — los tres WebViews tienen
  comportamientos distintos.

---

## 📊 Mensajes Enriquecidos (Tablas, Código, Links, LaTeX)

Estas funciones ya vienen integradas en el fork (heredadas de la fusión con el fork beta) — aquí quedan documentadas con ejemplos reales.

```javascript
// Tabla (formato clásico)
await sock.sendTable(
  jid,
  'Precios',
  ['Producto', 'Precio'],
  [['Plan A', '$10'], ['Plan B', '$20']],
  quotedMsg,
  { headerText: 'Nuestros planes', footer: 'Precios en USD' }
)

// Tabla V2 (respuesta unificada tipo "AI Rich")
await sock.sendTableV2(jid, tablaObjeto, quotedMsg, { title: 'Precios' })

// Lista simple
await sock.sendList(jid, 'Tareas', ['Comprar pan', 'Pagar luz'], quotedMsg)

// Bloque de código
await sock.sendCodeBlock(jid, 'console.log("hola")', quotedMsg, {
  language: 'javascript',
  title: 'Ejemplo'
})

// Bloque de código V2 (unified response)
await sock.sendCodeBlockV2(jid, 'SELECT * FROM users;', quotedMsg, { language: 'sql' })

// Texto con links enriquecidos (embeds inline)
await sock.sendLink(jid, 'Mira esto: ', [
  { url: 'https://github.com/Fer2809fl/Bail', displayName: 'Repo en GitHub' }
], quotedMsg)

// LaTeX (fórmulas)
await sock.sendLatex(quotedMsg, { formula: 'E = mc^2' })
```

## 🎠 Carruseles y 🖼️ Álbumes

**Carrusel** — se envía como un `interactiveMessage` con `carouselMessage`, cada tarjeta puede llevar imagen/video y sus propios botones nativos:

```javascript
await sock.sendMessage(jid, {
  interactiveMessage: {
    body: { text: 'Elegí un producto' },
    footer: { text: 'Catálogo 2026' },
    carouselMessage: {
      cards: [
        {
          header: { title: 'Producto 1', imageMessage: 'https://.../foto1.jpg' },
          body: { text: 'Descripción del producto 1' },
          nativeFlowMessage: { buttons: [/* botones nativos, ver sección de Botones */] }
        },
        {
          header: { title: 'Producto 2', videoMessage: 'https://.../video2.mp4' },
          body: { text: 'Descripción del producto 2' }
        }
      ]
    }
  }
})
```

**Álbum** — varias imágenes/videos agrupados en un mismo "paquete" visual (como el álbum nativo de WhatsApp):

```javascript
await sock.sendMessage(jid, {
  album: [
    { image: { url: './foto1.jpg' }, caption: 'Foto 1' },
    { image: { url: './foto2.jpg' } },
    { video: { url: './video1.mp4' } }
  ]
})
```

> Ambas funciones viven en `Socket/dugong.js` (el despachador interno que detecta el tipo de contenido especial que le mandás a `sock.sendMessage`) y ya estaban portadas desde la fusión con el fork beta — lo que faltaba era este ejemplo en el README.

---

## 📰 Newsletters / Canales

Todo el manejo de canales (newsletters) de WhatsApp ya está integrado en `Socket/newsletter.js`. Resumen de las funciones disponibles en `sock`:

```javascript
// Crear un canal
const canal = await sock.newsletterCreate('Mi Canal', 'Descripción del canal')

// Seguir / dejar de seguir / silenciar / activar notificaciones
await sock.newsletterAction(jid, 'follow')     // seguir
await sock.newsletterAction(jid, 'unfollow')   // dejar de seguir
await sock.newsletterAction(jid, 'mute')       // silenciar
await sock.newsletterAction(jid, 'unmute')     // reactivar notificaciones

// Seguir varios canales de una (separados por espacio en un solo string)
await sock.newsletterMultipleFollow('120363...@newsletter 120363...@newsletter')

// Ver todos los canales a los que estás suscrito
const misCanales = await sock.newsletterFetchAllSubscribe()

// Obtener metadata de un canal por su JID o por su código de invitación
const meta = await sock.newsletterMetadata('invite', 'codigoDeInvitacion')
// o, a partir de un link https://whatsapp.com/channel/xxxx o wa.me/channel/xxxx:
const metaPorLink = await sock.cekIDSaluran('https://whatsapp.com/channel/xxxxxxxx')

// Editar (nombre, descripción, foto)
await sock.newsletterUpdateName(jid, 'Nuevo nombre')
await sock.newsletterUpdateDescription(jid, 'Nueva descripción')
await sock.newsletterUpdatePicture(jid, fotoBuffer)
await sock.newsletterRemovePicture(jid)

// Administración
await sock.newsletterSubscribers(jid)          // cantidad/lista de suscriptores
await sock.newsletterAdminCount(jid)           // cantidad de admins
await sock.newsletterChangeOwner(jid, nuevoOwnerJid)
await sock.newsletterDemote(jid, userJid)
await sock.newsletterDelete(jid)

// Mensajes del canal
await sock.newsletterFetchMessages(jid, 20)    // últimos 20 mensajes
await sock.newsletterReactMessage(jid, serverId, '❤️')
```

**Enviar un mensaje a un canal** es igual que a cualquier chat, usando el JID del canal (termina en `@newsletter`):

```javascript
await sock.sendMessage(canalJid, { text: 'Novedades de hoy 🎉' })
```

> Nota de mantenimiento (heredada de v7.0.4): WhatsApp movió los endpoints internos de `follow`/`unfollow` a una versión `_v2`; este fork ya usa los IDs de consulta vigentes, así que el seguimiento de canales no debería fallar por IDs vencidos.

---

## ✨ Características

### General
- 🚀 Optimizado para mayor velocidad y estabilidad
- 📸 Mensajes multimedia (imágenes, video, audio, documentos)
- 🔘 **Botones nativos reales, sin imports sueltos** *(v1.9.0)*
- 🖼️ **Previsualización automática de links en botones y mensajes** *(v1.9.0)*
- 🌐 **HTML embebido en WhatsApp con `sock.sendHtml`** *(v7.1.0)* — WebView sandboxed dentro del bocadillo, con patrón documentado para sitios dinámicos + BD
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
