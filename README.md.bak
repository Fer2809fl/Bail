<div align="center">

# BaileysX

<img src="./assets/banner.png" alt="BaileysX banner" width="100%" />

**Librería de WebSockets para WhatsApp Web, con [`libsignal-node-ts`](https://github.com/Neykoor/libsignal-node) como backend de Signal Protocol**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![ESM](https://img.shields.io/badge/Module-ESM-yellow)](https://nodejs.org/api/esm.html)
[![Node](https://img.shields.io/badge/Node-%3E%3D20-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-MIT-blue)](./LICENSE)
[![Status](https://img.shields.io/badge/Estado-Estable-success)]()

</div>

---

## ✨ ¿Qué cambió en este paquete?

`BaileysX` consume [`libsignal-node-ts`](https://www.npmjs.com/package/@neykoor/libsignal-node) el port 100% TypeScript de `libsignal-node`

## 🔧 Cambios de compatibilidad aplicados

`libsignal-node-ts` no expone todo por el barrel `index.ts` (por ejemplo `protobufs`, `curve` y `crypto` internos no se re-exportan), así que algunos imports que antes apuntaban al código fuente sin compilar (`libsignal/src/...`) ahora apuntan al build compilado (`libsignal/lib/...js`), que es lo que realmente existe una vez instalado el paquete:

| Antes | Ahora |
|---|---|
| `libsignal/src/curve` | `libsignal/lib/curve.js` |
| `libsignal/src/crypto` | `libsignal/lib/crypto.js` |
| `libsignal/src/protobufs` | `libsignal/lib/protobufs.js` |

Archivos tocados:

- `src/Utils/crypto.ts`
- `src/Signal/libsignal.ts`
- `src/Signal/Group/keyhelper.ts`
- `src/Signal/Group/sender-message-key.ts`
- `src/Signal/Group/sender-key-message.ts`
- `src/Signal/Group/sender-chain-key.ts`
- `src/Signal/Group/group_cipher.ts`
- `package.json` → dependencia `libsignal`

El resto de la API (`ProtocolAddress`, `SessionBuilder`, `SessionCipher`, `SessionRecord`, `keyhelper`, `curve`) se sigue importando igual con `import * as libsignal from 'libsignal'`, porque esos sí están exportados desde el `index.ts` del paquete.

## 📖 Uso básico

```ts
import makeWASocket from 'baileysx'

const sock = makeWASocket({
  // tu configuración
})

sock.ev.on('connection.update', (update) => {
  console.log(update)
})
```

Internamente, `sock` usa `makeLibSignalRepository` (`src/Signal/libsignal.ts`) para cifrar/descifrar sesiones y mensajes de grupo con `libsignal-node-ts`, con el mismo API que antes.

## 🔘 Botones interactivos

`sock.sendMessage` detecta la propiedad `buttons` y arma un `interactiveMessage` con `nativeFlowMessage` automáticamente — no hace falta construir el payload de WhatsApp a mano.

```ts
await sock.sendMessage(jid, {
  image: { url: './media/menu.jpg' },
  caption: '✿ *Menú de botones*\n> Elegí una opción:',
  title: '𝐁𝐨𝐭 𝐌𝐞𝐧𝐮',
  subtitle: 'Cafirexos',
  footer: 'Neykoor · BaileysX',
  buttons: [
    { text: '📜 Ver comandos', id: '.menu' },
    { text: '👤 Mi perfil', id: '.perfil' },
    { text: '📢 Canal oficial', url: 'https://whatsapp.com/channel/0029Vb7NOUpF1YlXOQHW6d3O' }
  ]
}, { quoted: msg })
```

Cada botón se resuelve según qué propiedad traiga:

| Propiedad en el botón | Tipo generado | Comportamiento |
|---|---|---|
| `id` | `quick_reply` | Envía `id` como si el usuario lo hubiera escrito |
| `url` | `cta_url` | Abre el link en el navegador |
| `call` | `cta_call` | Inicia una llamada al número |
| `copy` | `cta_copy` | Copia el texto al portapapeles |
| `sections` | `single_select` | Lista desplegable con secciones |

El header acepta `text` (solo texto, sin media) o cualquier campo de media (`image`, `video`, `document`) junto con `caption`. Si no se pasa ninguno de los dos, tira error porque el header necesita `text` o media.

---

## 🙌 Créditos

Bails es un fork de Baileys, la librería original mantenida por la comunidad de WhiskeySockets. Gran parte de la base de este proyecto —el manejo del protocolo de WhatsApp Web, el cifrado, la arquitectura del socket y la mayoría del código— proviene de ese trabajo original.

<div align="center">

| <img src="https://github.com/WhiskeySockets.png" width="80" /><br>**WhiskeySockets**<br>Autor original de Baileys<br>[GitHub ↗](https://github.com/WhiskeySockets) | <img src="https://github.com/Neykoor.png" width="80" /><br>**Neykoor**<br>Mantenido y extendido por mí<br>[GitHub ↗](https://github.com/Neykoor) |
|:---:|:---:|

</div>

- Repositorio oficial: https://github.com/WhiskeySockets/Baileys
- Licencia: MIT

Si esta librería te resulta útil, considerá también dar reconocimiento y apoyo al proyecto original. 🙌

---

<div align="center">
Hecho con ☕ para el ecosistema <b>Eris-MD</b> / <b>BaileysX</b>
</div>
