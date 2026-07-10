<div align="center">

# ⚡ ASTA-BOTS

### Librería de WhatsApp Web para bots, en TypeScript

![Node](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen)
![License](https://img.shields.io/badge/license-MIT-blue)
![TypeScript](https://img.shields.io/badge/-TypeScript-3178C6?logo=typescript&logoColor=white)
![ASTA-BOTS](https://img.shields.io/badge/⚡-ASTA--BOTS-00FFFF)

</div>

<br/>

> [!NOTE]
> ASTA-BOTS no requiere Selenium, Puppeteer ni ningún navegador para funcionar. Se conecta directamente a WhatsApp Web mediante un **WebSocket**, lo que la hace mucho más liviana en consumo de RAM y CPU en comparación con soluciones basadas en navegador.

## Índice

- [¿Qué es ASTA-BOTS?](#qué-es-asta-bots)
- [Características](#características)
- [Instalación](#instalación)
- [Inicio rápido](#inicio-rápido)
  - [Vinculación de la cuenta](#vinculación-de-la-cuenta)
  - [Guardado de credenciales](#guardado-de-credenciales)
- [Métodos de mensajería](#métodos-de-mensajería)
  - [`sendMessage`](#sendmessage-el-método-principal)
  - [Mensajes de texto](#mensajes-de-texto)
  - [Mensajes multimedia](#mensajes-multimedia)
  - [Procesar medios sin enviarlos](#procesar-medios-sin-enviarlos)
  - [Ubicación y contactos](#ubicación-y-contactos)
  - [Encuestas, reacciones y respuestas a botones](#encuestas-reacciones-y-respuestas-a-botones)
  - [Botones, listas, templates y carousel](#botones-listas-templates-y-carousel)
  - [Mensajes crudos (smgss): pagos, productos, álbumes, eventos y más](#mensajes-crudos-smgss-pagos-productos-álbumes-eventos-y-más)
  - [Mensajes "raw" (proto armado a mano)](#mensajes-raw-proto-armado-a-mano)
  - [Editar, eliminar, reenviar y fijar](#editar-eliminar-reenviar-y-fijar)
  - [Mensajes enriquecidos](#mensajes-enriquecidos)
  - [Marcar un mensaje como generado por IA](#marcar-un-mensaje-como-generado-por-ia)
  - [Estados (historias)](#estados-historias)
  - [Recibos, lectura y presencia](#recibos-lectura-y-presencia)
- [Grupos, comunidades y canales](#grupos-comunidades-y-canales)
- [Perfil, privacidad y negocios](#perfil-privacidad-y-negocios)
- [Store (caché en memoria)](#store-caché-en-memoria)
- [Utilidades ASTA-BOTS](#utilidades-asta-bots)
  - [`resolveJid`: resolución automática de JID](#resolvejid-resolución-automática-de-jid)
  - [Sistema de botones de conveniencia](#sistema-de-botones-de-conveniencia)
  - [Código de vinculación de marca](#código-de-vinculación-de-marca)
- [Aviso legal](#aviso-legal)
- [Créditos](#créditos)

## ¿Qué es ASTA-BOTS?

**ASTA-BOTS** es una librería para conectarse a WhatsApp Web de forma directa, sin depender de un navegador ni de librerías de automatización como Selenium o Puppeteer. Toda la comunicación con WhatsApp ocurre a través de un **WebSocket**, tal como lo hace la propia versión web de WhatsApp, lo que se traduce en una librería rápida y liviana en recursos.

Es un fork de **Baileys**, y conserva casi toda su base: el protocolo, el cifrado, la arquitectura del socket y el manejo de credenciales. Además, incorpora algunos métodos para enviar mensajes con contenido enriquecido (tablas, listas, código y LaTeX), botones/listas/carousel nativos de WhatsApp, un dispatcher para contenido avanzado (pagos, productos, álbumes, eventos), y utilidades propias de **ASTA-BOTS** para resolución automática de JID y botones de conveniencia — más detalle en las secciones correspondientes.

Este README está enfocado principalmente en explicar **cómo enviar cada tipo de mensaje**, ya que es lo que más se necesita a la hora de integrar la librería en un proyecto real.

## Características

- 🔌 Conexión directa por WebSocket, sin navegador de por medio.
- 💬 Envío de todo tipo de mensajes: texto, imágenes, video, audio, notas de voz, documentos, stickers, ubicación, contactos, encuestas y más.
- 🔘 Botones, listas de selección, templates y carousel (interactive/native_flow), con el nodo `biz` necesario para que WhatsApp los acepte y renderice.
- ⚡ **Resolución automática de JID** (`resolveJid`): detecta el destinatario de un comando por citado, mención o argumento, sin pasar el número a mano.
- ⚡ **Helpers de botones listos para usar** (`sendQuickReplyButtons`, `sendUrlButton`, `sendListMenu`, etc.) y un detector de respuestas de botón (`setupButtonHandler`) para enrutarlas directo a tus comandos.
- 💳 Contenido avanzado vía `smgss`: pedidos de pago, cards de producto, álbumes, eventos, resultados de encuesta e historias por grupo.
- 🖼️ Procesamiento de medios (`resize`, `convert`, `toSticker`, `compress`, `metadata`) sobre cualquier `Buffer`, sin necesidad de enviarlo.
- 🛠️ Salida de emergencia `raw: true` para mandar un mensaje armado a mano cuando ningún builder alcanza.
- 🧩 Métodos para enviar mensajes enriquecidos: tablas, listas, código y LaTeX.
- 🤖 Marca de "generado por IA" en mensajes de chats individuales.
- 📸 Publicación de estados (historias) con notificación por menciones, tanto a contactos individuales como a grupos.
- 👥 Administración completa de grupos, comunidades y canales de difusión.
- 🔐 2 métodos de vinculación: código QR o código de emparejamiento (con código de marca **`ASTABOTS`** por defecto).
- 🗂️ 3 formas de guardar credenciales: por archivos múltiples, un solo archivo o SQLite.

## Instalación

Instalación directa desde GitHub:

```bash
npm install github:TU-USUARIO/asta-bots
```

> Cambia `TU-USUARIO/asta-bots` por la ruta de tu propio repositorio de ASTA-BOTS en GitHub.
>
> **Requisito:** Node.js **20** o superior.

Una vez instalada, importala en tu proyecto:

```ts
import makeWASocket from 'baileys'
```

## Inicio rápido

Para conectar una cuenta de WhatsApp a ASTA-BOTS hacen falta dos cosas: **cómo se guardan las credenciales de la sesión** y **cómo se vincula el dispositivo** (que puede ser con código QR o con código de emparejamiento).

### Vinculación de la cuenta

ASTA-BOTS soporta los **2 métodos de vinculación** que ofrece WhatsApp:

#### 1. Con código QR

```ts
import makeWASocket, { useMultiFileAuthState } from 'baileys'

async function iniciar() {
  const { state, saveCreds } = await useMultiFileAuthState('sesion')

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: true
  })

  sock.ev.on('creds.update', saveCreds)

  sock.ev.on('connection.update', (update) => {
    console.log(update)
  })
}

iniciar()
```

Al iniciar, se imprime un código QR en la terminal que hay que escanear desde WhatsApp (Dispositivos vinculados → Vincular un dispositivo).

#### 2. Con código de emparejamiento

```ts
const sock = makeWASocket({
  auth: state,
  printQRInTerminal: false
})

if (!sock.authState?.creds?.registered) {
  const codigo = await sock.requestPairingCode('5215512345678') // número con código de país, sin +
  console.log('Tu código de emparejamiento es:', codigo)
}
```

En este caso, en vez de escanear un QR, WhatsApp te muestra en el celular un código de 8 caracteres que hay que ingresar desde la opción "Vincular con número de teléfono".

### Guardado de credenciales

Una vez vinculada la cuenta, ASTA-BOTS necesita persistir las credenciales para no tener que volver a escanear el QR o pedir el código cada vez. Hay **3 formas** de hacerlo, todas exportadas por la librería:

| Método | Cómo guarda los datos | Cuándo conviene |
|---|---|---|
| `useMultiFileAuthState('carpeta')` | Un archivo por cada clave, dentro de una carpeta | Uso por defecto, ideal para desarrollo y bots simples |
| `useSingleFileAuthState('archivo.json')` | Todo en un único archivo JSON | Cuando querés portar la sesión fácilmente como un solo archivo |
| `useSqliteAuthState({ dbPath: 'sesion.db' })` | En una base de datos SQLite (requiere `better-sqlite3`) | Bots con mucho volumen de claves o que necesitan acceso concurrente |

Ejemplo con SQLite:

```ts
import makeWASocket, { useSqliteAuthState } from 'baileys'

const { state, saveCreds } = await useSqliteAuthState({ dbPath: 'sesion.db' })

const sock = makeWASocket({ auth: state })
sock.ev.on('creds.update', saveCreds)
```

## Métodos de mensajería

Todos los métodos de envío viven dentro del objeto `sock` que devuelve `makeWASocket()`. La firma general es siempre parecida: reciben el **JID** (identificador del chat) y el contenido del mensaje.

Formatos de JID más comunes:

| Tipo de chat | Formato de JID |
|---|---|
| Contacto individual | `5215512345678@s.whatsapp.net` |
| Grupo | `1234567890@g.us` |
| Canal de difusión (newsletter) | `1234567890@newsletter` |
| Estado (historia) | `status@broadcast` |
| Identificador LID | `123456789@lid` |

> **¿Qué es un LID?** Es un identificador que WhatsApp usa como capa de privacidad: en ciertos contextos (por ejemplo, dentro de comunidades) un contacto no se identifica con su número de teléfono (`@s.whatsapp.net`) sino con un `@lid`, un ID que no revela el número real. ASTA-BOTS mantiene internamente una tabla de equivalencias entre el LID y el número de teléfono real (`LIDMappingStore`) para poder cifrar y enviar los mensajes correctamente sin que tengas que hacer nada manualmente. Si necesitás revisarlo, `isLidUser(jid)` te dice si un JID es de tipo LID.

### `sendMessage` — el método principal

```ts
await sock.sendMessage(jid, contenido, opciones)
```

- **`jid`** *(string)*: destinatario del mensaje (contacto, grupo, canal o `status@broadcast` para estados).
- **`contenido`** *(`AnyMessageContent`)*: define qué tipo de mensaje se envía (texto, imagen, video, encuesta, botones, etc. — ver detalle abajo).
- **`opciones`** *(`MiscMessageGenerationOptions`, opcional)*: permite, entre otras cosas:
  - `quoted`: el mensaje al que se responde (citar).
  - `messageId`: forzar un ID de mensaje propio.
  - `ephemeralExpiration`: duración de los mensajes efímeros.
  - `mediaUploadTimeoutMs`: tiempo máximo para subir archivos.

Todos los métodos de envío devuelven una promesa que se resuelve con el mensaje ya construido y enviado (`WAMessage`), el cual podés guardar para citarlo, editarlo o eliminarlo más adelante.

El resto de los métodos de esta sección (`sendTable`, `sendList`, `sendCodeBlock`, etc.) son en realidad **atajos**: por debajo construyen el `contenido` correcto y llaman a `relayMessage` por vos, para que no tengas que armar la estructura del mensaje a mano.

> Si el `contenido` incluye botones, lista, template o carousel, `sendMessage` agrega automáticamente el nodo `biz` que WhatsApp exige para aceptarlos y renderizarlos — no hace falta que hagas nada extra para eso.

### Mensajes de texto

```ts
await sock.sendMessage(jid, { text: 'Hola, esto es ASTA-BOTS 👋' })
```

Con vista previa de enlace desactivada:

```ts
await sock.sendMessage(jid, { text: 'Mirá esto: https://ejemplo.com', linkPreview: null })
```

Citando un mensaje:

```ts
await sock.sendMessage(jid, { text: 'Respondiendo a tu mensaje' }, { quoted: mensajeOriginal })
```

### Mensajes multimedia

| Tipo | Campo | Ejemplo |
|---|---|---|
| Imagen | `image` | `{ image: { url: './foto.jpg' }, caption: 'Mirá esto' }` |
| Video | `video` | `{ video: { url: './video.mp4' }, caption: 'Un video', gifPlayback: false }` |
| Nota de voz | `audio` + `ptt: true` | `{ audio: { url: './audio.mp3' }, ptt: true }` |
| Audio normal | `audio` | `{ audio: { url: './cancion.mp3' }, mimetype: 'audio/mp4' }` |
| Video nota (círculo) | `video` + `ptv: true` | `{ video: { url: './nota.mp4' }, ptv: true }` |
| Sticker | `sticker` | `{ sticker: { url: './sticker.webp' } }` |
| Documento | `document` | `{ document: { url: './archivo.pdf' }, mimetype: 'application/pdf', fileName: 'informe.pdf' }` |
| Paquete de stickers | `stickerPack` | `{ stickerPack: { name: 'Mi pack', cover: {...}, stickers: [...] } }` |
| Álbum (varias fotos/videos) | `album` | `{ album: { images: [...], videos: [...] } }` |

Ejemplo completo:

```ts
await sock.sendMessage(jid, {
  image: { url: './foto.jpg' },
  caption: 'Foto enviada desde ASTA-BOTS'
})
```

> `WAMediaUpload` acepta una URL (`{ url: '...' }`), un `Buffer` o un `Stream`, tanto para archivos locales como remotos.

### Procesar medios sin enviarlos

Además de enviar, el socket expone helpers para procesar imágenes y video directamente sobre un `Buffer`, sin que eso implique mandar ningún mensaje:

```ts
const redimensionada = await sock.resize(buffer, 512, 512, { quality: 80 })
const convertida = await sock.convert(buffer, { to: 'webp' })
const sticker = await sock.toSticker(buffer, { quality: 80 })
const comprimida = await sock.compress(buffer, { quality: 50 })
const info = await sock.metadata(buffer) // { size, mimetype, width, height, duration, ... }
```

Usan `sharp` (si está instalado) y caen a `ffmpeg`/`ffprobe` para lo que `sharp` no soporta (video). No afectan la velocidad de la conexión ni del envío de mensajes — son solo utilidades de conveniencia para procesar archivos.

### Ubicación y contactos

```ts
// Ubicación
await sock.sendMessage(jid, {
  location: { degreesLatitude: 19.4326, degreesLongitude: -99.1332, name: 'CDMX' }
})

// Contacto (vCard)
await sock.sendMessage(jid, {
  contacts: {
    displayName: 'Soporte',
    contacts: [{ vcard: 'BEGIN:VCARD\nVERSION:3.0\nFN:Soporte\nTEL:+521234567890\nEND:VCARD' }]
  }
})
```

### Encuestas, reacciones y respuestas a botones

```ts
// Encuesta
await sock.sendMessage(jid, {
  poll: { name: '¿Cuál prefieres?', values: ['Opción A', 'Opción B'], selectableCount: 1 }
})

// Reacción a un mensaje
await sock.sendMessage(jid, { react: { text: '🔥', key: mensaje.key } })

// Respuesta a un botón / lista (uso interno al procesar interacciones)
await sock.sendMessage(jid, { buttonReply: { displayText: 'Sí', id: 'btn_si', index: 0 }, type: 'plain' })
```

### Botones, listas, templates y carousel

ASTA-BOTS puede armar botones nativos (`native_flow`), listas de selección, templates legados y carousel directamente desde `sock.sendMessage`, sin tener que construir el protobuf a mano. En todos los casos se agrega automáticamente el nodo `biz` necesario para que WhatsApp los acepte.

**Botones** — soporta respuesta rápida (`id`), enlace (`url`), llamada (`call`), copiar texto (`copy`), una mini-lista embebida (`sections`), un flow crudo (`name` + `paramsJson`), o un botón ya armado con `nativeFlowInfo` (por ejemplo, reenviado de otro lado) — en ese caso se respeta tal cual viene:

```ts
await sock.sendMessage(jid, {
  text: 'Elegí una opción',
  footer: 'Powered by ASTA-BOTS',
  buttons: [
    { text: 'Visitar sitio', url: 'https://ejemplo.com' },
    { text: 'Llamar', call: '+50488888888' },
    { text: 'Copiar código', copy: 'ABC123' },
    { text: 'Responder', id: 'opt_1' }
  ]
})
```

> `buttons`/`sections`/`templateButtons`/`nativeFlow`/`cards` se evalúan **antes** que `text` en el armado interno del mensaje, así que combinar `text` (el cuerpo) junto con cualquiera de estos tipos funciona sin que el texto se coma al resto del contenido.

**Lista de selección única:**

```ts
await sock.sendMessage(jid, {
  description: 'Elegí un producto del catálogo',
  title: 'Catálogo',
  buttonText: 'Ver opciones',
  footer: 'ASTA-BOTS',
  sections: [
    {
      title: 'Sección 1',
      rows: [
        { title: 'Producto A', rowId: 'a' },
        { title: 'Producto B', rowId: 'b' }
      ]
    }
  ]
})
```

**Template buttons** (formato legado — solo se renderiza en WhatsApp Web, Desktop e iOS):

```ts
await sock.sendMessage(jid, {
  text: 'Confirmá tu pedido',
  templateButtons: [
    { text: 'Sí', id: 'yes' },
    { text: 'Visitar', url: 'https://ejemplo.com' },
    { text: 'Llamar', call: '+50488888888' }
  ]
})
```

**Interactive message genérico** (`nativeFlow`), con header de imagen/video/documento:

```ts
await sock.sendMessage(jid, {
  image: { url: 'https://ejemplo.com/foto.jpg' },
  caption: 'Mirá esto',
  title: 'Título',
  subtitle: 'Subtítulo',
  footer: 'ASTA-BOTS',
  nativeFlow: [
    { text: 'Ver más', url: 'https://ejemplo.com' }
  ]
})
```

**Carousel** (varias cards, cada una con su propio header y botones):

```ts
await sock.sendMessage(jid, {
  cards: [
    { image: { url: 'https://ejemplo.com/1.jpg' }, caption: 'Carta 1', nativeFlow: [{ text: 'Comprar', id: 'buy_1' }] },
    { image: { url: 'https://ejemplo.com/2.jpg' }, caption: 'Carta 2', nativeFlow: [{ text: 'Comprar', id: 'buy_2' }] }
  ]
})
```

### Mensajes crudos (smgss): pagos, productos, álbumes, eventos y más

Para contenido que no tiene un atajo declarativo simple, ASTA-BOTS incluye un dispatcher (`smgss`) que reconoce el contenido a partir de su forma y lo arma internamente. Se usa igual que cualquier otro contenido, pasándolo directo a `sock.sendMessage(jid, contenido)`:

| Contenido | Qué hace |
|---|---|
| `{ requestPaymentMessage: {...} }` | Pedido de pago, con nota de texto o sticker adjunto opcional. |
| `{ productMessage: {...} }` | Card de un producto individual (imagen, precio, descripción). |
| `{ interactiveButtons: [...] }` | Botones declarativos con header de imagen/video/documento/ubicación/producto. |
| `{ interactiveMessage: {...} }` | Interactive message armado a mano (media header + botones nativos propios). |
| `{ interactiveMessage: { carouselMessage: {...} } }` | Carousel armado a mano, con cards en formato de proto crudo. |
| `{ albumMessage: [...] }` o `{ album: [...] }` | Álbum: manda el contenedor y después cada foto/video asociado. |
| `{ eventMessage: {...} }` | Evento de WhatsApp (nombre, descripción, fecha, ubicación, link para unirse). |
| `{ pollResultMessage: {...} }` | Snapshot de resultados de una encuesta. |
| `{ groupStatusMessage: {...} }` | Historia visible solo para un grupo puntual (distinto al estado normal). |

Ejemplo de pedido de pago:

```ts
await sock.sendMessage(jid, {
  requestPaymentMessage: {
    amount: 50000, // en la unidad mínima de la moneda (ej. centavos)
    currency: 'USD',
    from: '0@s.whatsapp.net',
    note: 'Pago por el servicio de este mes'
  }
})
```

Ejemplo de álbum:

```ts
await sock.sendMessage(jid, {
  album: [
    { image: { url: './foto1.jpg' } },
    { image: { url: './foto2.jpg' } },
    { video: { url: './video1.mp4' } }
  ]
})
```

### Mensajes "raw" (proto armado a mano)

Para casos que ningún builder cubre todavía, se puede pasar el contenido del mensaje ya armado como protobuf, agregando `raw: true`. ASTA-BOTS no lo interpreta ni lo transforma — lo manda tal cual:

```ts
await sock.sendMessage(jid, {
  raw: true,
  extendedTextMessage: { text: 'Mensaje armado a mano' }
})
```

Es una salida de emergencia para power users; para el 99% de los casos alcanza con los métodos normales de `sendMessage`.

### Editar, eliminar, reenviar y fijar

```ts
// Editar un mensaje ya enviado
await sock.sendMessage(jid, { text: 'Texto corregido', edit: mensajeAnterior.key })

// Eliminar (para todos)
await sock.sendMessage(jid, { delete: mensaje.key })

// Reenviar un mensaje
await sock.sendMessage(jid, { forward: mensajeOriginal })

// Fijar un mensaje en el chat (24h, 7 días o 30 días)
await sock.sendMessage(jid, { pin: mensaje.key, type: 1, time: 86400 })
```

### Mensajes enriquecidos

Estos métodos permiten enviar contenido "enriquecido" reutilizando el mismo formato interno que WhatsApp usa para las respuestas de Meta AI (tablas, código con resaltado de sintaxis, LaTeX, etc.), sin tener que armar el protobuf a mano.

**`sendTable`** — envía una tabla con encabezados y filas:

```ts
await sock.sendTable(
  jid,
  'Precios',
  ['Producto', 'Precio'],
  [['Café', '$50'], ['Té', '$40']],
  undefined,
  { footer: 'Precios sujetos a cambio' }
)
```

**`sendList`** — envía una lista simple de elementos:

```ts
await sock.sendList(jid, 'Tareas pendientes', ['Comprar pan', 'Enviar reporte', 'Llamar al cliente'])
```

> No confundir con la lista de selección de WhatsApp (`sections`) explicada en [Botones, listas, templates y carousel](#botones-listas-templates-y-carousel) — `sendList` arma un mensaje enriquecido de solo lectura, no una lista interactiva con opciones seleccionables.

**`sendCodeBlock`** — envía código con resaltado de sintaxis (soporta `javascript`, `typescript`, `python`, entre otros):

```ts
await sock.sendCodeBlock(jid, 'console.log("Hola mundo")', undefined, { language: 'javascript', title: 'Ejemplo' })
```

**`sendLatex`** — envía una o más expresiones matemáticas en formato LaTeX:

```ts
await sock.sendLatex(jid, undefined, {
  text: 'La fórmula cuadrática es:',
  expressions: [{ latexExpression: 'x = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}' }]
})
```

**`sendRichMessage`** — envía una combinación libre de sub-mensajes (texto, tabla, código, LaTeX, imágenes) en un solo mensaje:

```ts
await sock.sendRichMessage(jid, [
  { messageType: RichSubMessageType.TEXT, messageText: 'Resultado del análisis:' },
  { messageType: RichSubMessageType.TABLE, tableMetadata: { title: 'Datos', rows: [...] } }
])
```

**`captureUnifiedResponse`** / **`sendUnifiedResponse`** — permiten capturar la respuesta enriquecida de un mensaje recibido y reenviarla o reutilizarla tal cual:

```ts
const capturado = sock.captureUnifiedResponse(mensajeRecibido.message)
if (capturado) {
  await sock.sendUnifiedResponse(otroJid, undefined, capturado)
}
```

**`updateMediaMessage`** — re-sube un archivo multimedia cuyo enlace venció, para poder reenviarlo:

```ts
await sock.updateMediaMessage(mensajeConMediaVencido)
```

### Marcar un mensaje como generado por IA

Cualquier mensaje regular (texto, imagen, video, etc.) puede llevar la etiqueta/icono de "generado por IA" que WhatsApp muestra junto al mensaje, agregando la propiedad `ai: true` al contenido:

```ts
await sock.sendMessage(jid, { text: 'Esta respuesta la generó un modelo de IA', ai: true })
```

> ⚠️ Esta marca **solo funciona en chats individuales** (no en grupos). Si se intenta usar `ai: true` en un grupo, ASTA-BOTS lanza un error indicando que el icono de IA solo está permitido en chats privados.

### Estados (historias)

`sendStatusWhatsApp` publica un estado (historia) en tu cuenta. A diferencia de `sendMessage`, este método está pensado para trabajar junto con **menciones**: el segundo parámetro es un arreglo de JIDs (contactos o grupos) a los que se les notifica que fueron mencionados en el estado.

```ts
await sock.sendStatusWhatsApp(
  { text: 'Nuevo estado 🚀', backgroundColor: '#25D366' },
  [contactoJid, grupoJid] // se les notifica el estado como mención
)
```

- Si se pasa un JID de **contacto individual**, recibe la notificación de mención de estado como corresponde a un chat privado.
- Si se pasa un JID de **grupo**, el grupo entero recibe una única notificación de mención de estado a nivel de grupo (no se le manda una notificación repetida a cada miembro por separado).
- Si no se pasa ningún JID, el estado no se publica ya que requiere pasar las menciones necesarias.
- Para contenido multimedia (imagen, video, audio) en el estado, se pueden combinar los mismos campos que en `sendMessage` (`image`, `video`, `audio`), y ASTA-BOTS ajusta automáticamente el color de fondo y la fuente cuando corresponde.

### Recibos, lectura y presencia


```ts
// Marcar mensajes como leídos (doble check azul)
await sock.readMessages([mensaje.key])

// Enviar un recibo manualmente
await sock.sendReceipt(jid, participante, [id], 'read')

// Actualizar presencia (escribiendo, grabando audio, en línea)
await sock.sendPresenceUpdate('composing', jid) // 'available' | 'unavailable' | 'composing' | 'recording' | 'paused'

// Suscribirse a la presencia de un contacto
await sock.presenceSubscribe(jid)
```

## Grupos, comunidades y canales

ASTA-BOTS conserva toda la funcionalidad estándar de Baileys para administrar grupos, comunidades (grupos con subgrupos) y canales de difusión (newsletters):

```ts
await sock.groupCreate('Mi grupo', [jid1, jid2])
await sock.groupParticipantsUpdate(jid, [participante], 'add') // 'add' | 'remove' | 'promote' | 'demote'
await sock.groupInviteCode(jid)

await sock.communityCreate('Mi comunidad', 'Descripción')

await sock.newsletterCreate('Mi canal', 'Descripción del canal')
```

## Perfil, privacidad y negocios

```ts
await sock.updateProfileName('Mi Bot')
await sock.updateProfileStatus('Disponible 24/7')
await sock.updateProfilePicture(jid, { url: './avatar.jpg' })

await sock.updateBlockStatus(jid, 'block') // o 'unblock'

// API de negocios (catálogo, pedidos)
await sock.getCatalog({ jid })
await sock.productCreate({ ... })
```

## Store (caché en memoria)

El **Store** es un caché en memoria de chats, contactos, mensajes y metadata de grupos, que se va llenando solo a medida que van llegando eventos (`sock.ev`). El Baileys oficial más reciente **eliminó este módulo** de la librería; en ASTA-BOTS se mantiene disponible porque resuelve un problema muy común al hacer un bot: no depender de volver a pedirle todo a WhatsApp (mensaje anterior, foto de perfil, metadata de un grupo) cada vez que se necesita.

### ¿Cuándo conviene usarlo?

- Si tu bot necesita **buscar mensajes anteriores** (por ejemplo, para citar o reenviar algo que no tenés a mano).
- Si querés **listar los chats o contactos** sin tener que reconstruirlos manualmente desde los eventos.
- Si hacés muchas consultas de `groupMetadata` o `profilePictureUrl` y no querés golpear la API de WhatsApp cada vez.

Si tu bot es simple y solo responde a mensajes entrantes sin necesitar historial, podés omitirlo sin problema; el store consume RAM porque guarda todo en memoria.

### Uso

```ts
import makeWASocket, { makeInMemoryStore, useMultiFileAuthState } from 'baileys'

const store = makeInMemoryStore({})
store.readFromFile('./store.json') // opcional: cargar datos guardados de una corrida anterior

const { state, saveCreds } = await useMultiFileAuthState('sesion')
const sock = makeWASocket({ auth: state })

store.bind(sock.ev) // conecta el store a todos los eventos del socket

sock.ev.on('creds.update', saveCreds)

// Guardar el store a disco cada cierto tiempo
setInterval(() => {
  store.writeToFile('./store.json')
}, 10_000)

// Ejemplos de consulta
const chats = store.chats.all()
const contacto = store.contacts['5215512345678@s.whatsapp.net']
const mensaje = await store.loadMessage(jid, mensajeId)
```

## Utilidades ASTA-BOTS

Estas utilidades son propias de **ASTA-BOTS** y no existen en el Baileys original: nacieron para resolver lo más repetitivo al armar un bot de comandos.

### `resolveJid`: resolución automática de JID

Detecta el JID objetivo de un comando sin que tengas que pasarlo a mano, siguiendo esta prioridad: **mensaje citado → primera mención → argumento numérico → remitente**.

```ts
import { resolveJid } from 'baileys'

// .ban (respondiendo a alguien) → toma el citado
// .ban @usuario                  → toma la mención
// .ban 5216141234567             → toma el argumento
// .ban                           → cae al remitente
const targetJid = resolveJid(m, args[0])
```

### Sistema de botones de conveniencia

Además del soporte nativo de `sock.sendMessage` (ver [Botones, listas, templates y carousel](#botones-listas-templates-y-carousel)), ASTA-BOTS trae funciones listas para usar cuando querés algo rápido sin armar el objeto del mensaje:

```ts
import { sendQuickReplyButtons, setupButtonHandler } from 'baileys'

// Engancha el detector de respuestas de botón una sola vez, al iniciar
setupButtonHandler(sock, plugins, db)

await sendQuickReplyButtons(sock, jid, '¿Qué querés hacer?', [
  { text: '📋 Menú', id: 'menu' },
  { text: '⚙️ Ajustes', id: 'settings' }
])
```

| Función | Qué hace |
|---|---|
| `sendCopyButton` | Botón que copia texto al portapapeles |
| `sendUrlButton` | Botón de enlace |
| `sendQuickReplyButtons` | Botones de respuesta rápida |
| `sendCallButton` | Botón de llamada |
| `sendListMenu` | Lista desplegable con secciones |
| `sendInteractiveMessage` | Combinación de varios tipos de botón |
| `handleButtonResponse` | Detecta y ejecuta el comando de un botón presionado |
| `setupButtonHandler` | Engancha el detector de botones al socket sin pisar tu handler de mensajes |

Todas caen a texto plano automáticamente si WhatsApp rechaza el mensaje interactivo.

### Código de vinculación de marca

Al pedir un código de emparejamiento sin especificar uno propio, ASTA-BOTS usa por defecto el código de marca **`ASTABOTS`** (8 caracteres, cumple el requisito de WhatsApp):

```ts
const code = await sock.requestPairingCode('5216141234567')
// code === 'ASTABOTS'

// o con tu propio código de 8 caracteres:
const code2 = await sock.requestPairingCode('5216141234567', 'MIPROPIO')
```

## Aviso legal

Este proyecto no está afiliado, asociado, autorizado ni respaldado de ninguna forma por WhatsApp Inc. ni por Meta. "WhatsApp" y las marcas relacionadas son propiedad de sus respectivos dueños.

El uso de esta librería es responsabilidad exclusiva de quien la implementa. Se recomienda no usarla para spam, mensajería masiva no solicitada ni cualquier práctica que viole los Términos de Servicio de WhatsApp.

## Créditos

**ASTA-BOTS** es un fork de **[Baileys](https://github.com/WhiskeySockets/Baileys)**, la librería original mantenida por la comunidad de **WhiskeySockets**. Gran parte de la base de este proyecto —el manejo del protocolo de WhatsApp Web, el cifrado, la arquitectura del socket y la mayoría del código— proviene de ese trabajo original.

- Repositorio oficial: https://github.com/WhiskeySockets/Baileys
- Licencia: MIT

Si esta librería te resulta útil, considerá también dar reconocimiento y apoyo al proyecto original que es de this-xys/bails. 🙌

---

<div align="center">Hecho con 💙 por <b>ASTA-BOTS</b></div>

## créditos

this-xys/bails

