# Demo: HTML embebido en WhatsApp con estado dinámico

Este ejemplo demuestra cómo resolver las **4 limitaciones estructurales** del
renderer HTML interno de WhatsApp (`GenAIaeacdsnwHtmlPrimitive`):

| Limitación | Solución en este demo |
|---|---|
| El WebView es efímero (no persiste `localStorage`) | El puntaje se guarda en SQLite vía un backend HTTP |
| No hay puente HTML → bot | El HTML hace `fetch` al backend; el backend puede llamar `sock.sendMessage` si quiere reaccionar |
| `fetch()` solo anda hacia `trusted_sources` | El host del backend se lista en `trustedSources` |
| El HTML no recibe identidad del usuario | El bot inyecta `window.__INITIAL__ = { jid, token, ... }` al renderizar |

## Flujo

```
┌─ Usuario manda "!dinopro" en el chat ─────────────────────────┐
│                                                                │
│  1. bot-command.js lee getBest(jid) desde SQLite              │
│  2. issueToken(jid) firma un JWT de 5 min                     │
│  3. Carga game.html e inyecta:                                │
│       window.__INITIAL__ = { jid, best, token, apiBase }      │
│  4. sock.sendHtml(jid, html, [apiHost], msg, { headerText }) │
│                                                                │
└────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─ WebView dentro del bocadillo de WhatsApp ────────────────────┐
│                                                                │
│  El usuario juega. Al morir:                                  │
│    fetch(apiBase + '/score', {                                │
│      method:'POST',                                           │
│      headers:{ 'Authorization':'Bearer '+INIT.token },       │
│      body: JSON.stringify({ score })                          │
│    })                                                          │
│                                                                │
└────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─ server.js (Express) ─────────────────────────────────────────┐
│                                                                │
│  POST /score  → verifyToken → extract jid                     │
│                → UPSERT en SQLite                              │
│                → res.json({ ok, best, isNewRecord })          │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

## Setup

```bash
cd examples/html-dynamic
cp .env.example .env
# Editá .env con tu JWT_SECRET y tu API_HOST público (HTTPS)
npm install
npm run db:init   # crea la tabla scores en SQLite

# En dos terminales:
npm run start:server   # backend en :3001
npm run start:bot      # bot, escaneá el QR con tu WhatsApp
```

Desde WhatsApp, mandá `!dinopro` al número del bot. El HTML aparece en el
chat y el puntaje se persiste en SQLite entre sesiones.

## Notas importantes

- **HTTPS obligatorio para móvil.** El WebView de WhatsApp bloquea `http://`
  en producción. Para pruebas locales usá un túnel tipo
  `cloudflared tunnel --url http://localhost:3001` y poné la URL pública
  en `API_HOST` y `API_BASE`.
- **trustedSources sin esquema.** Si tu backend está en
  `https://api.tuyo.com`, el valor a pasar a `sock.sendHtml` es
  `"api.tuyo.com"` (sin `https://`). Pero el `apiBase` que se inyecta en
  el HTML sí debe incluir el esquema (`"https://api.tuyo.com"`).
- **JWT corto.** El token expira en 5 minutos. Si el usuario tarda más en
  jugar, el backend rechazará el score con 401. El bot puede emitir un
  nuevo token si el usuario manda `!dinopro` de nuevo.
- **Anti-patrón: no uses `localStorage`.** Aunque el WebView lo permite,
  en iOS a menudo se borra al cerrar el chat. Toda la persistencia debe
  vivir en el backend.
