# Changelog

## 7.0.7

### Agregado
- **Botones con acción** (`lib/Socket/native-buttons.js`): el socket escucha la respuesta del usuario y ejecuta la acción solo.
  - `sendPollButton` — al tocar, el bot envía una encuesta personalizable (2–12 opciones).
  - `sendLocationButton` — al tocar, el bot envía una ubicación.
  - `sendReminderMenu` / `sendReminderActionButton` — programan un recordatorio (mención al usuario, botón para cancelar, persistente en `database/native-reminders.json`).
  - `sendActionButtons` — varios botones, cada uno con su acción (`poll`, `location`, `text`, `reminder` o una función).
  - `onButton`, `parseButtonResponse`, `listReminders`, `cancelReminder`.
  - Las acciones persisten en `database/native-button-actions.json` y sobreviven a reinicios/reconexiones.
- **Wrappers Native Flow**: `sendNativeFlowButtons`, `sendRequestLocationButton`, `sendCancelReminderButton`, `sendAddressButton`, `sendWebviewButton`, `sendCatalogButton`, `sendProductListButton`, `sendPaymentDetailsButton`, `sendViewCatalogButton`.
- Typings completos en `lib/Socket/native-buttons.d.ts` (antes los botones no estaban tipados en `Socket/index.d.ts`).
- README: secciones "Botones con Acción" y "Botones Native Flow crudos".

### Mejorado (botones con acción)
- **Seguridad:** solo quien creó un recordatorio puede cancelarlo (antes cualquiera en el grupo podía tocar "Cancelar recordatorio").
- **Anti-spam:** cooldown de 1,5 s por usuario y botón; si alguien machaca el botón solo cuenta el primer toque.
- **Tope de 20 recordatorios pendientes por usuario**, con aviso claro al llegar al límite.
- **Avisos al usuario:** si toca un botón expirado responde "⌛ Este botón ya expiró"; si es un botón `actionOnce` ya gastado, "✅ Este botón ya se usó". Antes no pasaba nada.
- **Persistencia más segura:** los JSON de `database/` se escriben de forma atómica (archivo temporal + rename) y se guardan al instante cuando el proceso se cierra; ya no quedan corruptos si se corta a mitad de escritura.
- **Validación al enviar** en `sendUrlButton` (URL http/https), `sendCallButton` (teléfono), `sendCopyButton`, `sendQuickReplyButtons`, `sendListButton`, `sendMixedButtons`; `sendActionButtons` rechaza ids repetidos. Los errores salen claros en español en vez de un mensaje roto que WhatsApp ignora.
- `listReminders()` ahora devuelve copias ordenadas por fecha.
- Tipos: `{ type: "cancel_reminder", reminderId }` agregado a `ButtonAction`.
- `examples/Ibtn.ts` ahora es un solo comando con 3 modos: `ibtn` (acciones), `ibtn native` y `ibtn recordatorios` (ver y cancelar tus recordatorios).

### Corregido
- `messages-send.js`: los botones especiales enviados solos (`send_location`, `cta_catalog`, `mpm`, `wa_payment_transaction_details`, `automated_greeting_message_view_catalog`, `call_permission_request`) ahora usan su propio `native_flow name` en el nodo `biz` en lugar de `mixed`.
