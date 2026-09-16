# Roadmap — Fork `@Fer2809fl/bail` con soporte nativo para HTML dinámico en WhatsApp

> Fork de `Fer2809fl/bail` (v7.0.4) orientado a habilitar **aplicaciones web completas dentro del chat de WhatsApp**: HTML + JS + backend + base de datos + estado persistente por usuario, usando el campo interno `GenAIaeacdsnwHtmlPrimitive` del protocolo AIRichResponseMessage.

---

## 0. Contexto y motivación

El cliente de WhatsApp expone un renderer HTML interno (diseñado originalmente para Meta AI) accesible vía el campo opaco `unifiedResponse.data` de `AIRichResponseMessage`. Cuando el JSON embebido contiene un `__typename: "GenAIaeacdsnwHtmlPrimitive"`, el cliente levanta un WebView dentro del bocadillo del mensaje y renderiza el HTML+JS indicado en `payload`, con permiso de red limitado a los dominios listados en `trusted_sources`.

El fork original (`Fer2809fl/bail`) **no expone ningún helper** para construir este tipo de mensajes — los desarrolladores deben armar el JSON a mano cada vez (como en el comando `dino` compartido por el usuario). Tampoco existe guía ni ejemplo de cómo resolver las limitaciones estructurales:

- El WebView es efímero (no persiste `localStorage` entre sesiones de chat).
- No hay puente HTML → bot (el HTML no puede disparar eventos directos al bot).
- `fetch()` solo anda hacia dominios listados en `trusted_sources`.
- El HTML no recibe identidad del usuario (no hay JID inyectado).

Este fork resuelve esos 4 huecos y convierte la capacidad en una API de primer nivel.

---

## 1. Objetivos

### Objetivos primarios
1. Exponer `sock.sendHtml(jid, html, trustedSources, quoted, options)` como API pública.
2. Proveer helper `generateHtmlContent()` en `lib/Utils/rich-messages.js` con tipos TypeScript completos.
3. Documentar el patrón de **estado dinámico con backend + BD** que resuelve las 4 limitaciones estructurales.
4. Incluir un ejemplo completo y funcional: un mini-juego con ranking persistente por JID.

### Objetivos secundarios
5. Soporte de inyección de datos iniciales (`initialState`) firmados con JWT.
6. Documentación anti-patrones (qué NO hacer y por qué).
7. Tests mínimos del helper.

### No-objetivos (out of scope)
- No se modifica la lógica de Signal, encriptación ni auth existente.
- No se cambia el formato de `botForwardedMessage` ni la impersonación `forwardOrigin = META_AI` (se mantiene el patrón ya usado por `rich-messages.js`).
- No se rompe retrocompatibilidad con los helpers `generateTableContentV2`, `generateCodeBlockContentV2`, etc.

---

## 2. Alcance por fases

| Fase | Entregable | Tiempo estimado | Riesgo |
|------|------------|-----------------|--------|
| F1 | Helper `generateHtmlContent` + tipos | 30 min | Bajo |
| F2 | Método `sock.sendHtml` + tipos + socket wiring | 20 min | Bajo |
| F3 | Demo dinámico completo (HTML + backend Express + SQLite) | 60 min | Medio |
| F4 | Documentación (README + sección dedicada) | 20 min | Bajo |
| F5 | Commit + push al fork + PR opcional al upstream | 10 min | Bajo |

---

## 3. Fases detalladas

### Fase 1 — Helper `generateHtmlContent`

**Archivos a tocar:**
- `lib/Utils/rich-messages.js` — añadir función.
- `lib/Utils/rich-messages.d.ts` — añadir interfaz y declaración.

**API propuesta:**

```typescript
export interface HtmlContentOptions extends RichMessageOptions {
  /** Lista de dominios que el WebView puede contactar (fetch, imágenes, fuentes, etc.) */
  trustedSources?: string[];
  /** Cabecera opcional arriba del HTML */
  headerText?: string;
  /** Pie opcional debajo del HTML */
  footer?: string;
  /** Texto mostrado en el submessage de respaldo (si el cliente no soporta HTML) */
  fallbackText?: string;
}

export declare const generateHtmlContent: (
  html: string,
  quoted: any,
  options?: HtmlContentOptions
) => {
  message: any;
  messageId: string;
};
```

**Implementación clave:**

```javascript
export const generateHtmlContent = (html, quoted, options = {}) => {
  const {
    trustedSources = [],
    headerText,
    footer,
    fallbackText = "Contenido interactivo"
  } = options;

  const sections = [];

  if (headerText) {
    sections.push({
      view_model: {
        primitive: { text: headerText, __typename: "GenAIMarkdownTextUXPrimitive" },
        __typename: "GenAISingleLayoutViewModel"
      }
    });
  }

  sections.push({
    view_model: {
      primitive: {
        __typename: "GenAIaeacdsnwHtmlPrimitive",
        payload: html,
        trusted_sources: trustedSources
      },
      __typename: "GenAISingleLayoutViewModel"
    }
  });

  if (footer) {
    sections.push({
      view_model: {
        primitive: { text: footer, __typename: "GenAIMarkdownTextUXPrimitive" },
        __typename: "GenAISingleLayoutViewModel"
      }
    });
  }

  const unifiedData = {
    response_id: randomUUID(),
    sections,
    version: "1",
    is_final: true
  };

  const data = Buffer.from(JSON.stringify(unifiedData));
  const ctxInfo = buildRichContextInfo(quoted);

  const submessages = [{
    messageType: 2, // AI_RICH_RESPONSE_TEXT
    messageText: fallbackText
  }];

  return {
    message: buildBotForwardedMessage(submessages, ctxInfo, { data }),
    messageId: generateMessageIDV2()
  };
};
```

**Criterios de aceptación:**
- El helper produce un mensaje equivalente al que tu `dino.js` arma manualmente.
- TypeScript compila sin errores.
- `trustedSources` puede omitirse (default `[]`).

---

### Fase 2 — Método `sock.sendHtml`

**Archivos a tocar:**
- `lib/Socket/messages-send.js` — añadir método al socket.
- `lib/Socket/messages-send.d.ts` — añadir declaración.
- `lib/Socket/index.d.ts` — reexportar tipo.

**API propuesta:**

```typescript
sendHtml: (
  jid: string,
  html: string,
  trustedSources?: string[],
  quoted?: WAMessage,
  options?: HtmlContentOptions
) => Promise<{ message: proto.Message; messageId: string }>;
```

**Implementación:**

```javascript
sendHtml: async (jid, html, trustedSources = [], quoted, options = {}) => {
  const { message, messageId } = generateHtmlContent(html, quoted, {
    ...options,
    trustedSources
  });
  await relayMessage(jid, message, { messageId });
  return { message, messageId };
},
```

**Criterios de aceptación:**
- `await sock.sendHtml(jid, '<h1>hola</h1>', ['https://api.tuyo.com'])` envía correctamente.
- El patrón de `forwardOrigin: META_AI` se hereda de `buildRichContextInfo` (igual que el resto de los helpers).

---

### Fase 3 — Demo dinámico completo

**Objetivo:** demostrar que el patrón resuelve las 4 limitaciones estructurales (efímero, sin puente, trusted_sources, sin identidad).

**Estructura:**

```
examples/html-dynamic/
├── README.md           # cómo correr el demo
├── bot-command.js       # comando del bot que genera el HTML con estado inyectado
├── server.js           # Express + SQLite
├── db.js               # esquema y queries
├── game.html           # plantilla HTML con marcadores __INITIAL__ y __API_BASE__
├── jwt.js              # helper para firmar/verificar tokens cortos
├── package.json
└── schema.sql
```

**Flujo:**

1. Usuario ejecuta `!dino2` en el chat.
2. El bot:
   - Lee `SELECT best FROM scores WHERE jid = ?` en SQLite.
   - Firma un JWT corto (5 min) con `{ jid }`.
   - Carga `game.html` y reemplaza `__INITIAL__` por `{ jid, best, token, apiBase }`.
   - Llama `sock.sendHtml(jid, html, [apiBase], msg, { headerText: "Dino Runner Pro" })`.
3. El WebView renderiza el juego.
4. Al morir, el juego hace `fetch('https://api.tuyo.com/score', { method:'POST', headers: { Authorization: 'Bearer '+token }, body: JSON.stringify({ score }) })`.
5. El backend verifica el JWT, extrae el `jid`, hace `UPSERT` en SQLite.
6. (Opcional) El backend, si el score supera el récord global, llama `sock.sendMessage(...)` para anunciar en el chat.

**Esquema SQL:**

```sql
CREATE TABLE IF NOT EXISTS scores (
  jid TEXT PRIMARY KEY,
  best INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL
);
```

**Criterios de aceptación:**
- Cerrar WhatsApp, abrirlo de nuevo, ejecutar `!dino2` → el "MEJOR" refleja lo guardado en SQLite (no lo que tenía el WebView).
- Si dos usuarios distintos juegan en el mismo grupo, cada uno ve su propio récord.

---

### Fase 4 — Documentación

**Archivos a tocar:**
- `README.md` — añadir nueva sección `## 🌐 HTML embebido en WhatsApp` con:
  - Qué es `GenAIaeacdsnwHtmlPrimitive`.
  - Ejemplo mínimo de uso con `sock.sendHtml`.
  - Limitaciones estructurales (las 4 de arriba).
  - Patrón recomendado (backend + inyección de estado + JWT).
  - Anti-patrones (`localStorage` solo, `fetch` a dominios no listados, HTML sin identidad).
- `examples/html-dynamic/README.md` — guía de setup paso a paso.

**Criterios de aceptación:**
- Un desarrollador nuevo puede reproducir el demo siguiendo el README sin leer el código fuente.

---

### Fase 5 — Commit, push y PR

1. Crear branch `feat/html-primitive`.
2. Commits atómicos por fase.
3. Push a `nyxthor-dev/baileys`.
4. Abrir PR hacia `Fer2809fl/bail` con descripción completa del cambio, motivación y demo.

**Mensaje de commit sugerido:**

```
feat(rich-messages): add GenAIaeacdsnwHtmlPrimitive helper and sock.sendHtml

Expose the internal HTML-rendering capability of WhatsApp's AIRichResponseMessage
as a first-class API. Includes:
- generateHtmlContent() in lib/Utils/rich-messages.js
- sock.sendHtml() in lib/Socket/messages-send.js
- TypeScript types
- Example: examples/html-dynamic with backend + SQLite + JWT pattern
```

---

## 4. Anti-patrones documentados (sección "Qué NO hacer")

| Anti-patrón | Por qué falla | Solución |
|---|---|---|
| Usar `localStorage` como única persistencia | WhatsApp iOS a menudo borra el storage del WebView al cerrar el chat | Mover la persistencia a un backend HTTP |
| `fetch` a dominios fuera de `trusted_sources` | El WebView bloquea silenciosamente el request | Listar todos los dominios necesarios en `trustedSources` |
| Generar HTML sin identidad de usuario | No hay forma de saber quién está interactuando | Inyectar `window.__INITIAL__ = { jid, token, ... }` al renderizar |
| Esperar callback automático del HTML al bot | No existe `window.WhatsApp.postMessage` | El HTML hace `fetch` a tu API, y tu API llama `sock.sendMessage` |
| Confiar en `forwardOrigin = META_AI` para uso masivo | Riesgo de ban por impersonación de Meta AI | Limitar a chats propios o privados; no usar en broadcast |
| Enviar HTML > 50KB | El `bytes` protobuf puede truncarse | Minificar o servir assets externamente vía `trusted_sources` |

---

## 5. Riesgos y mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|-------------|---------|------------|
| Meta elimina `GenAIaeacdsnwHtmlPrimitive` en un update del cliente | Media | Alto | Documentar como "experimental, sin soporte oficial" |
| Ban de la cuenta por impersonar `META_AI` | Media | Alto | README con advertencia clara; no usar en producción masiva |
| Diferencias entre Android / iOS / Web | Alta | Medio | Probar en los 3; documentar quirks conocidos |
| Fuga del JWT si el HTML lo expone en texto plano | Media | Alto | JWT con expiración corta (5 min); rotación por comando |
| El `bail` upstream rechaza el PR | Baja | Bajo | Mantener el fork como distribución paralela |

---

## 6. Métricas de éxito

- ✅ `sock.sendHtml(...)` responde en < 50ms y el mensaje llega al cliente en < 2s.
- ✅ El demo `html-dynamic` mantiene el récord de un usuario tras cerrar/abrir WhatsApp.
- ✅ TypeScript compila sin errores con `tsc --noEmit`.
- ✅ README explica el patrón en menos de 5 minutos de lectura.
- ✅ PR al upstream abierto con al menos 1 review solicitado.

---

## 7. Cronograma propuesto

| Hora | Actividad |
|------|-----------|
| T+0:00 | Crear roadmap (este documento) |
| T+0:05 | Autenticar gh CLI + forkear repo |
| T+0:10 | Fase 1: helper `generateHtmlContent` |
| T+0:40 | Fase 2: método `sock.sendHtml` |
| T+1:00 | Fase 3: demo dinámico (HTML + backend + SQLite) |
| T+2:00 | Fase 4: README y documentación |
| T+2:20 | Fase 5: commit + push + PR |

---

## 8. Estado

- [x] Roadmap creado
- [ ] Fork realizado
- [ ] Fase 1
- [ ] Fase 2
- [ ] Fase 3
- [ ] Fase 4
- [ ] Fase 5
