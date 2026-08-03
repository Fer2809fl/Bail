<div align="center">

# ? ASTA-BOTS

### Librer¨ªa de WhatsApp Web para bots, en TypeScript

![Node](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen)
![License](https://img.shields.io/badge/license-MIT-blue)
![TypeScript](https://img.shields.io/badge/-TypeScript-3178C6?logo=typescript&logoColor=white)
![ASTA-BOTS](https://img.shields.io/badge/?-ASTA--BOTS-00FFFF)

</div>

<br/>

> [!NOTE]
> ASTA-BOTS no requiere Selenium, Puppeteer ni ning¨²n navegador para funcionar. Se conecta directamente a WhatsApp Web mediante un **WebSocket**, lo que la hace mucho m¨¢s liviana en consumo de RAM y CPU en comparaci¨®n con soluciones basadas en navegador.

## ?ndice

- [?Qu¨¦ es ASTA-BOTS?](#qu¨¦-es-asta-bots)
- [Caracter¨ªsticas](#caracter¨ªsticas)
- [Instalaci¨®n](#instalaci¨®n)
- [Inicio r¨¢pido](#inicio-r¨¢pido)
  - [Vinculaci¨®n de la cuenta](#vinculaci¨®n-de-la-cuenta)
  - [Guardado de credenciales](#guardado-de-credenciales)
- [M¨¦todos de mensajer¨ªa](#m¨¦todos-de-mensajer¨ªa)
  - [`sendMessage`](#sendmessage-el-m¨¦todo-principal)
  - [Mensajes de texto](#mensajes-de-texto)
  - [Mensajes multimedia](#mensajes-multimedia)
  - [Procesar medios sin enviarlos](#procesar-medios-sin-enviarlos)
  - [Ubicaci¨®n y contactos](#ubicaci¨®n-y-contactos)
  - [Encuestas, reacciones y respuestas a botones](#encuestas-reacciones-y-respuestas-a-botones)
  - [Botones, listas, templates y carousel](#botones-listas-templates-y-carousel)
  - [Mensajes crudos (smgss): pagos, productos, ¨¢lbumes, eventos y m¨¢s](#mensajes-crudos-smgss-pagos-productos-¨¢lbumes-eventos-y-m¨¢s)
  - [Mensajes "raw" (proto armado a mano)](#mensajes-raw-proto-armado-a-mano)
  - [Editar, eliminar, reenviar y fijar](#editar-eliminar-reenviar-y-fijar)
  - [Mensajes enriquecidos](#mensajes-enriquecidos)
  - [Marcar un mensaje como generado por IA](#marcar-un-mensaje-como-generado-por-ia)
  - [Estados (historias)](#estados-historias)
  - [Recibos, lectura y presencia](#recibos-lectura-y-presencia)
- [Grupos, comunidades y canales](#grupos-comunidades-y-canales)
- [Perfil, privacidad y negocios](#perfil-privacidad-y-negocios)
- [Store (cach¨¦ en memoria)](#store-cach¨¦-en-memoria)
- [Utilidades ASTA-BOTS](#utilidades-asta-bots)
  - [`resolveJid`: resoluci¨®n autom¨¢tica de JID](#resolvejid-resoluci¨®n-autom¨¢tica-de-jid)
  - [Sistema de botones de conveniencia](#sistema-de-botones-de-conveniencia)
  - [C¨®digo de vinculaci¨®n de marca](#c¨®digo-de-vinculaci¨®n-de-marca)
- [Aviso legal](#aviso-legal)
- [Cr¨¦ditos](#cr¨¦ditos)

## ?Qu¨¦ es ASTA-BOTS?

**ASTA-BOTS** es una librer¨ªa para conectarse a WhatsApp Web de forma directa, sin depender de un navegador ni de librer¨ªas de automatizaci¨®n como Selenium o Puppeteer. Toda la comunicaci¨®n con WhatsApp ocurre a trav¨¦s de un **WebSocket**, tal como lo hace la propia versi¨®n web de WhatsApp, lo que se traduce en una librer¨ªa r¨¢pida y liviana en recursos.

Es un fork de **Baileys**, y conserva casi toda su base: el protocolo, el cifrado, la arquitectura del socket y el manejo de credenciales. Adem¨¢s, incorpora algunos m¨¦todos para enviar mensajes con contenido enriquecido (tablas, listas, c¨®digo y LaTeX), botones/listas/carousel nativos de WhatsApp, un dispatcher para contenido avanzado (pagos, productos, ¨¢lbumes, eventos), y utilidades propias de **ASTA-BOTS** para resoluci¨®n autom¨¢tica de JID y botones de conveniencia ¡ª m¨¢s detalle en las secciones correspondientes.

Este README est¨¢ enfocado principalmente en explicar **c¨®mo enviar cada tipo de mensaje**, ya que es lo que m¨¢s se necesita a la hora de integrar la librer¨ªa en un proyecto real.

## Caracter¨ªsticas

- ? Conexi¨®n directa por WebSocket, sin navegador de por medio.
- ? Env¨ªo de todo tipo de mensajes: texto, im¨¢genes, video, audio, notas de voz, documentos, stickers, ubicaci¨®n, contactos, encuestas y m¨¢s.
- ? Botones, listas de selecci¨®n, templates y carousel (interactive/native_flow), con el nodo `biz` necesario para que WhatsApp los acepte y renderice.
- ? **Resoluci¨®n autom¨¢tica de JID** (`resolveJid`): detecta el destinatario de un comando por citado, menci¨®n o argumento, sin pasar el n¨²mero a mano.
- ? **Helpers de botones listos para usar** (`sendQuickReplyButtons`, `sendUrlButton`, `sendListMenu`, etc.) y un detector de respuestas de bot¨®n (`setupButtonHandler`) para enrutarlas directo a tus comandos.
- ? Contenido avanzado v¨ªa `smgss`: pedidos de pago, cards de producto, ¨¢lbumes, eventos, resultados de encuesta e historias por grupo.
- ?? Procesamiento de medios (`resize`, `convert`, `toSticker`, `compress`, `metadata`) sobre cualquier `Buffer`, sin necesidad de enviarlo.
- ?? Salida de emergencia `raw: true` para mandar un mensaje armado a mano cuando ning¨²n builder alcanza.
- ? M¨¦todos para enviar mensajes enriquecidos: tablas, listas, c¨®digo y LaTeX.
- ? Marca de "generado por IA" en mensajes de chats individuales.
- ? Publicaci¨®n de estados (historias) con notificaci¨®n por menciones, tanto a contactos individuales como a grupos.
- ? Administraci¨®n completa de grupos, comunidades y canales de difusi¨®n.
- ? 2 m¨¦todos de vinculaci¨®n: c¨®digo QR o c¨®digo de emparejamiento (con c¨®digo de marca **`ASTABOTS`** por defecto).
- ?? 3 formas de guardar credenciales: por archivos m¨²ltiples, un solo archivo o SQLite.

## Instalaci¨®n

Instalaci¨®n directa desde GitHub:

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

## Inicio r¨¢pido

Para conectar una cuenta de WhatsApp a ASTA-BOTS hacen falta dos cosas: **c¨®mo se guardan las credenciales de la sesi¨®n** y **c¨®mo se vincula el dispositivo** (que puede ser con c¨®digo QR o con c¨®digo de emparejamiento).

### Vinculaci¨®n de la cuenta

ASTA-BOTS soporta los **2 m¨¦todos de vinculaci¨®n** que ofrece WhatsApp:

#### 1. Con c¨®digo QR

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

Al iniciar, se imprime un c¨®digo QR en la terminal que hay que escanear desde WhatsApp (Dispositivos vinculados ¡ú Vincular un dispositivo).

#### 2. Con c¨®digo de emparejamiento

```ts
const sock = makeWASocket({
  auth: state,
  printQRInTerminal: false
})

if (!sock.authState?.creds?.registered) {
  const codigo = await sock.requestPairingCode('5215512345678') // n¨²mero con c¨®digo de pa¨ªs, sin +
  console.log('Tu c¨®digo de emparejamiento es:', codigo)
}
```

En este caso, en vez de escanear un QR, WhatsApp te muestra en el celular un c¨®digo de 8 caracteres que hay que ingresar desde la opci¨®n "Vincular con n¨²mero de tel¨¦fono".

### Guardado de credenciales

Una vez vinculada la cuenta, ASTA-BOTS necesita persistir las credenciales para no tener que volver a escanear el QR o pedir el c¨®digo cada vez. Hay **3 formas** de hacerlo, todas exportadas por la librer¨ªa:

| M¨¦todo | C¨®mo guarda los datos | Cu¨¢ndo conviene |
|---|---|---|
| `useMultiFileAuthState('carpeta')` | Un archivo por cada clave, dentro de una carpeta | Uso por defecto, ideal para desarrollo y bots simples |
| `useSingleFileAuthState('archivo.json')` | Todo en un ¨²nico archivo JSON | Cuando quer¨¦s portar la sesi¨®n f¨¢cilmente como un solo archivo |
| `useSqliteAuthState({ dbPath: 'sesion.db' })` | En una base de datos SQLite (requiere `better-sqlite3`) | Bots con mucho volumen de claves o que necesitan acceso concurrente |

Ejemplo con SQLite:

```ts
import makeWASocket, { useSqliteAuthState } from 'baileys'

const { state, saveCreds } = await useSqliteAuthState({ dbPath: 'sesion.db' })

const sock = makeWASocket({ auth: state })
sock.ev.on('creds.update', saveCreds)
```

## M¨¦todos de mensajer¨ªa

Todos los m¨¦todos de env¨ªo viven dentro del objeto `sock` que devuelve `makeWASocket()`. La firma general es siempre parecida: reciben el **JID** (identificador del chat) y el contenido del mensaje.

Formatos de JID m¨¢s comunes:

| Tipo de chat | Formato de JID |
|---|---|
| Contacto individual | `5215512345678@s.whatsapp.net` |
| Grupo | `1234567890@g.us` |
| Canal de difusi¨®n (newsletter) | `1234567890@newsletter` |
| Estado (historia) | `status@broadcast` |
| Identificador LID | `123456789@lid` |

> **?Qu¨¦ es un LID?** Es un identificador que WhatsApp usa como capa de privacidad: en ciertos contextos (por ejemplo, dentro de comunidades) un contacto no se identifica con su n¨²mero de tel¨¦fono (`@s.whatsapp.net`) sino con un `@lid`, un ID que no revela el n¨²mero real. ASTA-BOTS mantiene internamente una tabla de equivalencias entre el LID y el n¨²mero de tel¨¦fono real (`LIDMappingStore`) para poder cifrar y enviar los mensajes correctamente sin que tengas que hacer nada manualmente. Si necesit¨¢s revisarlo, `isLidUser(jid)` te dice si un JID es de tipo LID.

### `sendMessage` ¡ª el m¨¦todo principal

```ts
await sock.sendMessage(jid, contenido, opciones)
```

- **`jid`** *(string)*: destinatario del mensaje (contacto, grupo, canal o `status@broadcast` para estados).
- **`contenido`** *(`AnyMessageContent`)*: define qu¨¦ tipo de mensaje se env¨ªa (texto, imagen, video, encuesta, botones, etc. ¡ª ver detalle abajo).
- **`opciones`** *(`MiscMessageGenerationOptions`, opcional)*: permite, entre otras cosas:
  - `quoted`: el mensaje al que se responde (citar).
  - `messageId`: forzar un ID de mensaje propio.
  - `ephemeralExpiration`: duraci¨®n de los mensajes ef¨ªmeros.
  - `mediaUploadTimeoutMs`: tiempo m¨¢ximo para subir archivos.

Todos los m¨¦todos de env¨ªo devuelven una promesa que se resuelve con el mensaje ya construido y enviado (`WAMessage`), el cual pod¨¦s guardar para citarlo, editarlo o eliminarlo m¨¢s adelante.

El resto de los m¨¦todos de esta secci¨®n (`sendTable`, `sendList`, `sendCodeBlock`, etc.) son en realidad **atajos**: por debajo construyen el `contenido` correcto y llaman a `relayMessage` por vos, para que no tengas que armar la estructura del mensaje a mano.

> Si el `contenido` incluye botones, lista, template o carousel, `sendMessage` agrega autom¨¢ticamente el nodo `biz` que WhatsApp exige para aceptarlos y renderizarlos ¡ª no hace falta que hagas nada extra para eso.

### Mensajes de texto

```ts
await sock.sendMessage(jid, { text: 'Hola, esto es ASTA-BOTS ?' })
```

Con vista previa de enlace desactivada:

```ts
await sock.sendMessage(jid, { text: 'Mir¨¢ esto: https://ejemplo.com', linkPreview: null })
```

Citando un mensaje:

```ts
await sock.sendMessage(jid, { text: 'Respondiendo a tu mensaje' }, { quoted: mensajeOriginal })
```

### Mensajes multimedia

| Tipo | Campo | Ejemplo |
|---|---|---|
| Imagen | `image` | `{ image: { url: './foto.jpg' }, caption: 'Mir¨¢ esto' }` |
| Video | `video` | `{ video: { url: './video.mp4' }, caption: 'Un video', gifPlayback: false }` |
| Nota de voz | `audio` + `ptt: true` | `{ audio: { url: './audio.mp3' }, ptt: true }` |
| Audio normal | `audio` | `{ audio: { url: './cancion.mp3' }, mimetype: 'audio/mp4' }` |
| Video nota (c¨ªrculo) | `video` + `ptv: true` | `{ video: { url: './nota.mp4' }, ptv: true }` |
| Sticker | `sticker` | `{ sticker: { url: './sticker.webp' } }` |
| Documento | `document` | `{ document: { url: './archivo.pdf' }, mimetype: 'application/pdf', fileName: 'informe.pdf' }` |
| Paquete de stickers | `stickerPack` | `{ stickerPack: { name: 'Mi pack', cover: {...}, stickers: [...] } }` |
| ?lbum (varias fotos/videos) | `album` | `{ album: { images: [...], videos: [...] } }` |

Ejemplo completo:

```ts
await sock.sendMessage(jid, {
  image: { url: './foto.jpg' },
  caption: 'Foto enviada desde ASTA-BOTS'
})
```

> `WAMediaUpload` acepta una URL (`{ url: '...' }`), un `Buffer` o un `Stream`, tanto para archivos locales como remotos.

### Procesar medios sin enviarlos

Adem¨¢s de enviar, el socket expone helpers para procesar im¨¢genes y video directamente sobre un `Buffer`, sin que eso implique mandar ning¨²n mensaje:

```ts
const redimensionada = await sock.resize(buffer, 512, 512, { quality: 80 })
const convertida = await sock.convert(buffer, { to: 'webp' })
const sticker = await sock.toSticker(buffer, { quality: 80 })
const comprimida = await sock.compress(buffer, { quality: 50 })
const info = await sock.metadata(buffer) // { size, mimetype, width, height, duration, ... }
```

Usan `sharp` (si est¨¢ instalado) y caen a `ffmpeg`/`ffprobe` para lo que `sharp` no soporta (video). No afectan la velocidad de la conexi¨®n ni del env¨ªo de mensajes ¡ª son solo utilidades de conveniencia para procesar archivos.

### Ubicaci¨®n y contactos

```ts
// Ubicaci¨®n
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
  poll: { name: '?Cu¨¢l prefieres?', values: ['Opci¨®n A', 'Opci¨®n B'], selectableCount: 1 }
})

// Reacci¨®n a un mensaje
await sock.sendMessage(jid, { react: { text: '?', key: mensaje.key } })

// Respuesta a un bot¨®n / lista (uso interno al procesar interacciones)
await sock.sendMessage(jid, { buttonReply: { displayText: 'S¨ª', id: 'btn_si', index: 0 }, type: 'plain' })
```

### Botones, listas, templates y carousel

ASTA-BOTS puede armar botones nativos (`native_flow`), listas de selecci¨®n, templates legados y carousel directamente desde `sock.sendMessage`, sin tener que construir el protobuf a mano. En todos los casos se agrega autom¨¢ticamente el nodo `biz` necesario para que WhatsApp los acepte.

**Botones** ¡ª soporta respuesta r¨¢pida (`id`), enlace (`url`), llamada (`call`), copiar texto (`copy`), una mini-lista embebida (`sections`), un flow crudo (`name` + `paramsJson`), o un bot¨®n ya armado con `nativeFlowInfo` (por ejemplo, reenviado de otro lado) ¡ª en ese caso se respeta tal cual viene:

```ts
await sock.sendMessage(jid, {
  text: 'Eleg¨ª una opci¨®n',
  footer: 'Powered by ASTA-BOTS',
  buttons: [
    { text: 'Visitar sitio', url: 'https://ejemplo.com' },
    { text: 'Llamar', call: '+50488888888' },
    { text: 'Copiar c¨®digo', copy: 'ABC123' },
    { text: 'Responder', id: 'opt_1' }
  ]
})
```

> `buttons`/`sections`/`templateButtons`/`nativeFlow`/`cards` se eval¨²an **antes** que `text` en el armado interno del mensaje, as¨ª que combinar `text` (el cuerpo) junto con cualquiera de estos tipos funciona sin que el texto se coma al resto del contenido.

**Lista de selecci¨®n ¨²nica:**

```ts
await sock.sendMessage(jid, {
  description: 'Eleg¨ª un producto del cat¨¢logo',
  title: 'Cat¨¢logo',
  buttonText: 'Ver opciones',
  footer: 'ASTA-BOTS',
  sections: [
    {
      title: 'Secci¨®n 1',
      rows: [
        { title: 'Producto A', rowId: 'a' },
        { title: 'Producto B', rowId: 'b' }
      ]
    }
  ]
})
```

**Template buttons** (formato legado ¡ª solo se renderiza en WhatsApp Web, Desktop e iOS):

```ts
await sock.sendMessage(jid, {
  text: 'Confirm¨¢ tu pedido',
  templateButtons: [
    { text: 'S¨ª', id: 'yes' },
    { text: 'Visitar', url: 'https://ejemplo.com' },
    { text: 'Llamar', call: '+50488888888' }
  ]
})
```

**Interactive message gen¨¦rico** (`nativeFlow`), con header de imagen/video/documento:

```ts
await sock.sendMessage(jid, {
  image: { url: 'https://ejemplo.com/foto.jpg' },
  caption: 'Mir¨¢ esto',
  title: 'T¨ªtulo',
  subtitle: 'Subt¨ªtulo',
  footer: 'ASTA-BOTS',
  nativeFlow: [
    { text: 'Ver m¨¢s', url: 'https://ejemplo.com' }
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

### Mensajes crudos (smgss): pagos, productos, ¨¢lbumes, eventos y m¨¢s

Para contenido que no tiene un atajo declarativo simple, ASTA-BOTS incluye un dispatcher (`smgss`) que reconoce el contenido a partir de su forma y lo arma internamente. Se usa igual que cualquier otro contenido, pas¨¢ndolo directo a `sock.sendMessage(jid, contenido)`:

| Contenido | Qu¨¦ hace |
|---|---|
| `{ requestPaymentMessage: {...} }` | Pedido de pago, con nota de texto o sticker adjunto opcional. |
| `{ productMessage: {...} }` | Card de un producto individual (imagen, precio, descripci¨®n). |
| `{ interactiveButtons: [...] }` | Botones declarativos con header de imagen/video/documento/ubicaci¨®n/producto. |
| `{ interactiveMessage: {...} }` | Interactive message armado a mano (media header + botones nativos propios). |
| `{ interactiveMessage: { carouselMessage: {...} } }` | Carousel armado a mano, con cards en formato de proto crudo. |
| `{ albumMessage: [...] }` o `{ album: [...] }` | ?lbum: manda el contenedor y despu¨¦s cada foto/video asociado. |
| `{ eventMessage: {...} }` | Evento de WhatsApp (nombre, descripci¨®n, fecha, ubicaci¨®n, link para unirse). |
| `{ pollResultMessage: {...} }` | Snapshot de resultados de una encuesta. |
| `{ groupStatusMessage: {...} }` | Historia visible solo para un grupo puntual (distinto al estado normal). |

Ejemplo de pedido de pago:

```ts
await sock.sendMessage(jid, {
  requestPaymentMessage: {
    amount: 50000, // en la unidad m¨ªnima de la moneda (ej. centavos)
    currency: 'USD',
    from: '0@s.whatsapp.net',
    note: 'Pago por el servicio de este mes'
  }
})
```

Ejemplo de ¨¢lbum:

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

Para casos que ning¨²n builder cubre todav¨ªa, se puede pasar el contenido del mensaje ya armado como protobuf, agregando `raw: true`. ASTA-BOTS no lo interpreta ni lo transforma ¡ª lo manda tal cual:

```ts
await sock.sendMessage(jid, {
  raw: true,
  extendedTextMessage: { text: 'Mensaje armado a mano' }
})
```

Es una salida de emergencia para power users; para el 99% de los casos alcanza con los m¨¦todos normales de `sendMessage`.

### Editar, eliminar, reenviar y fijar

```ts
// Editar un mensaje ya enviado
await sock.sendMessage(jid, { text: 'Texto corregido', edit: mensajeAnterior.key })

// Eliminar (para todos)
await sock.sendMessage(jid, { delete: mensaje.key })

// Reenviar un mensaje
await sock.sendMessage(jid, { forward: mensajeOriginal })

// Fijar un mensaje en el chat (24h, 7 d¨ªas o 30 d¨ªas)
await sock.sendMessage(jid, { pin: mensaje.key, type: 1, time: 86400 })
```

### Mensajes enriquecidos

Estos m¨¦todos permiten enviar contenido "enriquecido" reutilizando el mismo formato interno que WhatsApp usa para las respuestas de Meta AI (tablas, c¨®digo con resaltado de sintaxis, LaTeX, etc.), sin tener que armar el protobuf a mano.

**`sendTable`** ¡ª env¨ªa una tabla con encabezados y filas:

```ts
await sock.sendTable(
  jid,
  'Precios',
  ['Producto', 'Precio'],
  [['Caf¨¦', '$50'], ['T¨¦', '$40']],
  undefined,
  { footer: 'Precios sujetos a cambio' }
)
```

**`sendList`** ¡ª env¨ªa una lista simple de elementos:

```ts
await sock.sendList(jid, 'Tareas pendientes', ['Comprar pan', 'Enviar reporte', 'Llamar al cliente'])
```

> No confundir con la lista de selecci¨®n de WhatsApp (`sections`) explicada en [Botones, listas, templates y carousel](#botones-listas-templates-y-carousel) ¡ª `sendList` arma un mensaje enriquecido de solo lectura, no una lista interactiva con opciones seleccionables.

**`sendCodeBlock`** ¡ª env¨ªa c¨®digo con resaltado de sintaxis (soporta `javascript`, `typescript`, `python`, entre otros):

```ts
await sock.sendCodeBlock(jid, 'console.log("Hola mundo")', undefined, { language: 'javascript', title: 'Ejemplo' })
```

**`sendLatex`** ¡ª env¨ªa una o m¨¢s expresiones matem¨¢ticas en formato LaTeX:

```ts
await sock.sendLatex(jid, undefined, {
  text: 'La f¨®rmula cuadr¨¢tica es:',
  expressions: [{ latexExpression: 'x = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}' }]
})
```

**`sendRichMessage`** ¡ª env¨ªa una combinaci¨®n libre de sub-mensajes (texto, tabla, c¨®digo, LaTeX, im¨¢genes) en un solo mensaje:

```ts
await sock.sendRichMessage(jid, [
  { messageType: RichSubMessageType.TEXT, messageText: 'Resultado del an¨¢lisis:' },
  { messageType: RichSubMessageType.TABLE, tableMetadata: { title: 'Datos', rows: [...] } }
])
```

**`captureUnifiedResponse`** / **`sendUnifiedResponse`** ¡ª permiten capturar la respuesta enriquecida de un mensaje recibido y reenviarla o reutilizarla tal cual:

```ts
const capturado = sock.captureUnifiedResponse(mensajeRecibido.message)
if (capturado) {
  await sock.sendUnifiedResponse(otroJid, undefined, capturado)
}
```

**`updateMediaMessage`** ¡ª re-sube un archivo multimedia cuyo enlace venci¨®, para poder reenviarlo:

```ts
await sock.updateMediaMessage(mensajeConMediaVencido)
```

### Marcar un mensaje como generado por IA

Cualquier mensaje regular (texto, imagen, video, etc.) puede llevar la etiqueta/icono de "generado por IA" que WhatsApp muestra junto al mensaje, agregando la propiedad `ai: true` al contenido:

```ts
await sock.sendMessage(jid, { text: 'Esta respuesta la gener¨® un modelo de IA', ai: true })
```

> ?? Esta marca **solo funciona en chats individuales** (no en grupos). Si se intenta usar `ai: true` en un grupo, ASTA-BOTS lanza un error indicando que el icono de IA solo est¨¢ permitido en chats privados.

### Estados (historias)

`sendStatusWhatsApp` publica un estado (historia) en tu cuenta. A diferencia de `sendMessage`, este m¨¦todo est¨¢ pensado para trabajar junto con **menciones**: el segundo par¨¢metro es un arreglo de JIDs (contactos o grupos) a los que se les notifica que fueron mencionados en el estado.

```ts
await sock.sendStatusWhatsApp(
  { text: 'Nuevo estado ?', backgroundColor: '#25D366' },
  [contactoJid, grupoJid] // se les notifica el estado como menci¨®n
)
```

- Si se pasa un JID de **contacto individual**, recibe la notificaci¨®n de menci¨®n de estado como corresponde a un chat privado.
- Si se pasa un JID de **grupo**, el grupo entero recibe una ¨²nica notificaci¨®n de menci¨®n de estado a nivel de grupo (no se le manda una notificaci¨®n repetida a cada miembro por separado).
- Si no se pasa ning¨²n JID, el estado no se publica ya que requiere pasar las menciones necesarias.
- Para contenido multimedia (imagen, video, audio) en el estado, se pueden combinar los mismos campos que en `sendMessage` (`image`, `video`, `audio`), y ASTA-BOTS ajusta autom¨¢ticamente el color de fondo y la fuente cuando corresponde.

### Recibos, lectura y presencia


```ts
// Marcar mensajes como le¨ªdos (doble check azul)
await sock.readMessages([mensaje.key])

// Enviar un recibo manualmente
await sock.sendReceipt(jid, participante, [id], 'read')

// Actualizar presencia (escribiendo, grabando audio, en l¨ªnea)
await sock.sendPresenceUpdate('composing', jid) // 'available' | 'unavailable' | 'composing' | 'recording' | 'paused'

// Suscribirse a la presencia de un contacto
await sock.presenceSubscribe(jid)
```

## Grupos, comunidades y canales

ASTA-BOTS conserva toda la funcionalidad est¨¢ndar de Baileys para administrar grupos, comunidades (grupos con subgrupos) y canales de difusi¨®n (newsletters):

```ts
await sock.groupCreate('Mi grupo', [jid1, jid2])
await sock.groupParticipantsUpdate(jid, [participante], 'add') // 'add' | 'remove' | 'promote' | 'demote'
await sock.groupInviteCode(jid)

await sock.communityCreate('Mi comunidad', 'Descripci¨®n')

await sock.newsletterCreate('Mi canal', 'Descripci¨®n del canal')
```

## Perfil, privacidad y negocios

```ts
await sock.updateProfileName('Mi Bot')
await sock.updateProfileStatus('Disponible 24/7')
await sock.updateProfilePicture(jid, { url: './avatar.jpg' })

await sock.updateBlockStatus(jid, 'block') // o 'unblock'

// API de negocios (cat¨¢logo, pedidos)
await sock.getCatalog({ jid })
await sock.productCreate({ ... })
```

## Store (cach¨¦ en memoria)

El **Store** es un cach¨¦ en memoria de chats, contactos, mensajes y metadata de grupos, que se va llenando solo a medida que van llegando eventos (`sock.ev`). El Baileys oficial m¨¢s reciente **elimin¨® este m¨®dulo** de la librer¨ªa; en ASTA-BOTS se mantiene disponible porque resuelve un problema muy com¨²n al hacer un bot: no depender de volver a pedirle todo a WhatsApp (mensaje anterior, foto de perfil, metadata de un grupo) cada vez que se necesita.

### ?Cu¨¢ndo conviene usarlo?

- Si tu bot necesita **buscar mensajes anteriores** (por ejemplo, para citar o reenviar algo que no ten¨¦s a mano).
- Si quer¨¦s **listar los chats o contactos** sin tener que reconstruirlos manualmente desde los eventos.
- Si hac¨¦s muchas consultas de `groupMetadata` o `profilePictureUrl` y no quer¨¦s golpear la API de WhatsApp cada vez.

Si tu bot es simple y solo responde a mensajes entrantes sin necesitar historial, pod¨¦s omitirlo sin problema; el store consume RAM porque guarda todo en memoria.

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

Estas utilidades son propias de **ASTA-BOTS** y no existen en el Baileys original: nacieron para resolver lo m¨¢s repetitivo al armar un bot de comandos.

### `resolveJid`: resoluci¨®n autom¨¢tica de JID

Detecta el JID objetivo de un comando sin que tengas que pasarlo a mano, siguiendo esta prioridad: **mensaje citado ¡ú primera menci¨®n ¡ú argumento num¨¦rico ¡ú remitente**.

```ts
import { resolveJid } from 'baileys'

// .ban (respondiendo a alguien) ¡ú toma el citado
// .ban @usuario                  ¡ú toma la menci¨®n
// .ban 5216141234567             ¡ú toma el argumento
// .ban                           ¡ú cae al remitente
const targetJid = resolveJid(m, args[0])
```

### Sistema de botones de conveniencia

Adem¨¢s del soporte nativo de `sock.sendMessage` (ver [Botones, listas, templates y carousel](#botones-listas-templates-y-carousel)), ASTA-BOTS trae funciones listas para usar cuando quer¨¦s algo r¨¢pido sin armar el objeto del mensaje:

```ts
import { sendQuickReplyButtons, setupButtonHandler } from 'baileys'

// Engancha el detector de respuestas de bot¨®n una sola vez, al iniciar
setupButtonHandler(sock, plugins, db)

await sendQuickReplyButtons(sock, jid, '?Qu¨¦ quer¨¦s hacer?', [
  { text: '? Men¨²', id: 'menu' },
  { text: '?? Ajustes', id: 'settings' }
])
```

| Funci¨®n | Qu¨¦ hace |
|---|---|
| `sendCopyButton` | Bot¨®n que copia texto al portapapeles |
| `sendUrlButton` | Bot¨®n de enlace |
| `sendQuickReplyButtons` | Botones de respuesta r¨¢pida |
| `sendCallButton` | Bot¨®n de llamada |
| `sendListMenu` | Lista desplegable con secciones |
| `sendInteractiveMessage` | Combinaci¨®n de varios tipos de bot¨®n |
| `handleButtonResponse` | Detecta y ejecuta el comando de un bot¨®n presionado |
| `setupButtonHandler` | Engancha el detector de botones al socket sin pisar tu handler de mensajes |

Todas caen a texto plano autom¨¢ticamente si WhatsApp rechaza el mensaje interactivo.

### C¨®digo de vinculaci¨®n de marca

Al pedir un c¨®digo de emparejamiento sin especificar uno propio, ASTA-BOTS usa por defecto el c¨®digo de marca **`ASTABOTS`** (8 caracteres, cumple el requisito de WhatsApp):

```ts
const code = await sock.requestPairingCode('5216141234567')
// code === 'ASTABOTS'

// o con tu propio c¨®digo de 8 caracteres:
const code2 = await sock.requestPairingCode('5216141234567', 'MIPROPIO')
```

## Aviso legal

Este proyecto no est¨¢ afiliado, asociado, autorizado ni respaldado de ninguna forma por WhatsApp Inc. ni por Meta. "WhatsApp" y las marcas relacionadas son propiedad de sus respectivos due?os.

El uso de esta librer¨ªa es responsabilidad exclusiva de quien la implementa. Se recomienda no usarla para spam, mensajer¨ªa masiva no solicitada ni cualquier pr¨¢ctica que viole los T¨¦rminos de Servicio de WhatsApp.

## Cr¨¦ditos

**ASTA-BOTS** es un fork de **[Baileys](https://github.com/WhiskeySockets/Baileys)**, la librer¨ªa original mantenida por la comunidad de **WhiskeySockets**. Gran parte de la base de este proyecto ¡ªel manejo del protocolo de WhatsApp Web, el cifrado, la arquitectura del socket y la mayor¨ªa del c¨®digo¡ª proviene de ese trabajo original.

- Repositorio oficial: https://github.com/WhiskeySockets/Baileys
- Licencia: MIT

Si esta librer¨ªa te resulta ¨²til, consider¨¢ tambi¨¦n dar reconocimiento y apoyo al proyecto original que es de this-xys/bails. ?

---

<div align="center">Hecho con ? por <b>ASTA-BOTS</b></div>

## cr¨¦ditos

this-xys/bails

