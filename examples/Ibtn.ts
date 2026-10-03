import { config } from "../../config.js";
import type { Command } from "../../core/types.js";

/**
 * Comando de botones para @fer2809fl/baileys (7.0.7+).
 *
 *   ibtn                -> botones con ACCIÓN: ubicación, encuesta y recordatorio (funcionan solos)
 *   ibtn native         -> los botones Native Flow "crudos" del ibtn original
 *   ibtn recordatorios  -> lista tus recordatorios pendientes y cancela los 3 más próximos con un toque
 *
 * Ya NO hace falta importar `proto` ni `generateWAMessageFromContent`: los métodos
 * viven directamente en el socket de tu fork.
 */

const phone = (v: string) => v.replace(/[^0-9]/g, "");
const userPart = (jid: string) => String(jid ?? "").split("@")[0].split(":")[0];
const fmtDate = (at: number) => new Date(at).toLocaleString("es", { dateStyle: "medium", timeStyle: "short" });

const MODES = {
  native: ["native"],
  reminders: ["recordatorios", "recordatorio", "reminders", "reminder", "lista"],
};

const command: Command = {
  name: "ibtn",
  aliases: ["interactivebuttons", "nativebuttons"],
  description: "Prueba botones con acción, Native Flow y administra tus recordatorios",
  category: "desarrollo",
  ownerOnly: true,

  execute: async (ctx) => {
    const { sock, chatId, msg } = ctx;
    const s = sock as any; // los typings nuevos viven en lib/Socket/native-buttons.d.ts
    const args = (ctx as any).args as string[] | undefined;
    const arg = String(args?.[0] ?? "").toLowerCase();
    const mode = MODES.reminders.includes(arg) ? "reminders" : MODES.native.includes(arg) ? "native" : "actions";
    const quoted = { quoted: msg as any };

    try {
      // ───────────────────────────── ibtn recordatorios ─────────────────────────────
      if (mode === "reminders") {
        const user = (msg as any).key?.participant || (msg as any).key?.remoteJid;
        const mine = (s.listReminders() as any[]).filter((r) => userPart(r.to) === userPart(user));

        if (!mine.length) {
          await ctx.reply("⏰ *RECORDATORIOS*\n\nNo tienes recordatorios pendientes.\n\n💡 Usa *ibtn* para crear uno de prueba.");
          return;
        }

        const lista = mine.map((r, i) => `${i + 1}. 🕒 ${fmtDate(r.at)}\n   📝 ${r.text}`).join("\n\n");
        const extra = mine.length > 3 ? `\n\n_Mostrando botones para los 3 más próximos (${mine.length} en total)._` : "";

        await s.sendActionButtons(
          chatId,
          `⏰ *TUS RECORDATORIOS* (${mine.length})\n\n${lista}${extra}`,
          mine.slice(0, 3).map((r, i) => ({
            text: `❌ Cancelar #${i + 1}`,
            action: { type: "cancel_reminder", reminderId: r.id },
          })),
          { footer: "ibtn • recordatorios", actionTtl: "1d" },
          quoted,
        );
        return;
      }

      // ───────────────────────────────── ibtn native ─────────────────────────────────
      if (mode === "native") {
        await s.sendNativeFlowButtons(
          chatId,
          " Botones Test",
          [
            { name: "cta_copy", params: { display_text: "copy", copy_code: "Nose" } },
            { name: "cta_catalog", params: { business_phone_number: phone("573133374132") } },
            { name: "cta_url", params: { display_text: "Vercel", url: "https://vercel.com", merchant_url: "https://vercel.com" } },
            { name: "cta_reminder", params: { display_text: "Recordatorio nativo" } },
            { name: "address_message", params: { display_text: "Dirección" } },
            { name: "send_location", params: { display_text: "Enviar ubicación" } },
            { name: "open_webview", params: { title: "API!", link: { in_app_webview: true, url: config.webUrl } } },
            { name: "cta_cancel_reminder", params: { display_text: "Cancelar recordatorio" } },
            { name: "mpm", params: { product_id: "8816262248471474" } },
            { name: "wa_payment_transaction_details", params: { transaction_id: "12345848" } },
            { name: "automated_greeting_message_view_catalog", params: { business_phone_number: phone("62000"), catalog_product_id: "12345" } },
          ],
          { footer: "-----" },
          quoted,
        );
        return;
      }

      // ─────────────────────────────────── ibtn (acciones) ───────────────────────────────────
      // 1) Tres botones con acción en un solo mensaje
      await s.sendActionButtons(
        chatId,
        "🧪 *IBTN*\n\nToca un botón, el bot responde solo:",
        [
          {
            text: "📍 Ubicación",
            action: {
              type: "location",
              // Cambia estas coordenadas por las tuyas
              location: { latitude: 4.5981, longitude: -74.076, name: "Ubicación de prueba", address: "Bogotá" },
            },
          },
          {
            text: "📊 Encuesta",
            action: {
              type: "poll",
              poll: {
                name: "¿Qué te parece el bot?",
                values: ["🔥 Genial", "👍 Bien", "😐 Regular", "👎 Mejorable"],
                selectableCount: 1,
              },
            },
          },
          {
            text: "⏰ Recordarme (1 min)",
            action: { type: "reminder", text: "Esto es una prueba de ibtn", in: "1m" },
          },
        ],
        { footer: "ibtn • acciones" },
        quoted,
      );

      // 2) Recordatorio con el tiempo a elegir
      await s.sendReminderMenu(
        chatId,
        "⏰ *RECORDATORIO*\n\n¿Cuándo te aviso?",
        "⏰ Recordarme",
        "Revisar el bot",
        {},
        { footer: "ibtn • recordatorio" },
        quoted,
      );
    } catch (error) {
      console.error("[ibtn] Error:", error);

      await ctx.reply(
        "「❌」 *IBTN*\n" +
          "  ➥ No se pudo enviar el mensaje.\n\n" +
          `🧾 *Detalle:* ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  },
};

export default command;
