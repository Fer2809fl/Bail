# Changelog

Todas las versiones notables de `@fer2809fl/baileys`. El detalle extendido de cada versión, con ejemplos de código, vive en el `README.md`.

## [7.0.5] — Mantenimiento: funciones portadas desde el fork beta

Revisión del fork "beta" del proyecto para traer utilidades que este repositorio no tenía todavía, integradas una por una (sin pisar exports existentes).

### Añadido
- `Utils/anti-ban.js` — retrasos humanizados, rate limiters (`globalRateLimiter`, `groupRateLimiter`, `broadcastRateLimiter`), `PresenceManager`, `generateSessionFingerprint`.
- `Utils/smart-reconnect.js` — reconexión con backoff exponencial + jitter (`SmartReconnect`, `withRetry`).
- `Utils/message-queue.js` — colas de mensajes con prioridad y control de tasa (`MessageQueue`).
- `Utils/enhanced-cache.js` — caché en memoria con TTL/stale-TTL sobre `lru-cache` (`EnhancedCache`, `CacheManager`).
- `Utils/enhanced-logger.js` — logger alternativo con niveles y colores (`createLogger`).
- `Utils/scheduled-messages.js` — mensajes programados y recurrentes (cron simple) con persistencia en disco.
- `Utils/lid-utils.js` — resolución y cacheo de `@lid` ↔ número real, con persistencia en disco.
- `Utils/bot-utils.js` — `parseCommand`, `CooldownManager`, `PermissionManager` y helpers varios para bots de comandos.
- `Utils/use-sqlite-auth-state.js` — `useSqliteAuthState` (requiere `better-sqlite3`, ahora peer dependency opcional).
- `Utils/banner.js` — `printBanner()` opcional.
- `Utils/rich-message-utils.js` — `prepareRichResponseMessage` y helpers internos de AI Rich Response.
- `Modded/message_builder.js` — builder encadenable (`Button`, `ButtonV2`, `Carousel`, `AIRich`, `ORich`, `Toolkit`).
- `VoIP/` — cliente experimental de llamadas de voz (`VoipClient`, `ActiveCall`, `CallState`) sobre el motor WASM oficial, con sus assets (`lib/assets/wasm/`).
- Lenguajes adicionales en el resaltado de código de `rich-messages.js`: `rust`, `c`, `cpp`, `csharp`, `html`, `css`.
- `better-sqlite3` agregado como `peerDependency` opcional.

### Notas técnicas
- `BufferJSON`, `LANGUAGE_KEYWORDS`, `CodeHighlightType` y `RichSubMessageType` ya existían en este fork con su propia implementación; los módulos nuevos se ajustaron para **reutilizarlos** en vez de duplicarlos (evita exports ambiguos / rotos en `export *`).
- No se tocó ninguna función existente de `Socket/`, `chats.js`, `groups.js`, `business.js` ni el motor de envío de mensajes: esta tanda es aditiva.
- `anti-ban.js`, `smart-reconnect.js`, `message-queue.js`, `enhanced-cache.js`, `enhanced-logger.js`, `bot-utils.js`, `banner.js`, `rich-message-utils.js` y `use-sqlite-auth-state.js` se distribuyen por ahora solo en JavaScript (sin `.d.ts`), igual que en el fork de origen.

### Segunda pasada de mantenimiento (v7.0.5)
- Fix: en `Socket/messages-send.js`, el nodo `biz` de botones nativos podía agregarse duplicado al stanza; ahora se verifica que no exista antes de insertarlo (paridad con el fork beta).
- Documentación: se agregaron al README ejemplos de uso reales para funciones que ya existían en el código pero no estaban documentadas — tablas (`sendTable`/`sendTableV2`), listas, bloques de código (`sendCodeBlock`/`sendCodeBlockV2`), links enriquecidos, LaTeX, carruseles, álbumes y el set completo de Newsletters/Canales (`newsletterCreate`, `newsletterAction`, `newsletterMetadata`, etc.).

### Tercera pasada de mantenimiento (v7.0.5) — auditoría de código completa
- Comparación archivo por archivo de todo `lib/` contra el fork beta (no solo el README). Resultado: no había funciones reales faltantes, solo exports y tipos.
- Fix: `Utils/reporting-utils.js` no estaba re-exportado desde `Utils/index.js` ni `Utils/index.d.ts` (existía en el archivo pero no era importable desde el paquete). Corregido.
- Fix: `Utils/companion-reg-client-utils.js` no estaba en `Utils/index.d.ts`. Corregido.
- Se agregaron `.d.ts` (verificados con `tsc`) para los 9 módulos que solo tenían implementación en JS: `anti-ban.js`, `smart-reconnect.js`, `message-queue.js`, `enhanced-cache.js`, `enhanced-logger.js`, `bot-utils.js`, `banner.js`, `rich-message-utils.js`, `use-sqlite-auth-state.js`.
- Se quitó branding y un link de repo ajeno que había quedado en `banner.js` y `enhanced-logger.js` desde el port original.
- Pendiente para próximas tandas: documentar en el README Grupos avanzados, Comunidades, Negocios, Perfil/Privacidad, Estados (stories) y Eventos — se irá agregando de a poco.

### Cuarta pasada de mantenimiento (v7.0.5) — actualización de versión + funciones nuevas de chat
- Actualizada la versión pineada de WhatsApp Web a `2.3000.1047406223` (`Defaults/index.js`), la más reciente confirmada.
- Nuevas funciones (no existían en este fork ni en el beta): `pinChat`, `archiveChat`, `muteChat`, `markChatRead`, `markChatUnread`, `clearChat`, `deleteChat` en `Socket/chats.js` — atajos sobre `chatModify` para las operaciones de chat más comunes, con sus tipos en `chats.d.ts`.
- Documentado en el README el envío de `pinInChatMessage` (fijar/desfijar un mensaje del chat), que ya existía en `Utils/messages.js` pero no tenía ejemplo de uso.

## [7.0.4]
Ver README — sincronización de protocolo, correcciones de memoria/reconexión, `withUsernameProtocol`, `fetchAccountReachoutTimelock`, `fetchNewChatMessageCap`, `registerSocketEndHandler`.

## [7.0.1]
Ver README — botones nativos (`sendQuickReplyButtons`, `sendUrlButton`, `sendCallButton`, `sendCopyButton`, `sendReminderButton`, `sendListButton`, `sendMixedButtons`), previsualización automática de links, fix de login en macOS.
