// bot-command.js — bot mínimo que expone el comando !dinopro.
//
// Demuestra el patrón completo:
//   1. Lee el estado del usuario desde SQLite.
//   2. Firma un JWT corto (5 min) con su JID.
//   3. Carga game.html e inyecta window.__INITIAL__ = { jid, best, token, apiBase }.
//   4. Llama sock.sendHtml(jid, html, [apiHost], msg, { headerText }).
//
// El WebView, al morir, hace fetch POST al backend con el token en el header
// Authorization. El backend verifica el JWT, extrae el jid y guarda el score.
//
// Requisitos:
//   - npm install en este directorio (instala @nyxthor-dev/baileys local).
//   - Tener corriendo server.js en paralelo.
//   - Variables de entorno (ver .env.example).
import { makeWASocket, useMultiFileAuthState, DisconnectReason } from "@nyxthor-dev/baileys";
import { spawn } from "node:child_process";
import pino from "pino";
import qrTerminal from "qrcode-terminal";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { getBest } from "./db.js";
import { issueToken } from "./jwt.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const GAME_HTML_PATH = join(__dirname, "game.html");

// El dominio donde está corriendo server.js, SIN esquema. Debe coincidir
// exactamente con el host que se pasa en apiBase (el WebView hace fetch a
// `https://${apiHost}/score`, por lo que apiHost debe ser un dominio público
// con HTTPS si vas a probar en WhatsApp móvil — el WebView bloquea http en
// producción).
const API_HOST = process.env.API_HOST ?? "localhost:3001";
const API_BASE = process.env.API_BASE ?? `http://${API_HOST}`;

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState(
    join(__dirname, "auth-state"),
  );

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: false,
    logger: pino({ level: "warn" }),
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", ({ connection, qr, lastDisconnect }) => {
    if (qr) {
      console.log("\nEscaneá este QR con WhatsApp:\n");
      qrTerminal.generate(qr, { small: true });
    }
    if (connection === "open") {
      console.log("\n✅ Bot conectado. Enviá !dinopro desde tu WhatsApp.");
    }
    if (connection === "close") {
      const code = lastDisconnect?.error?.output?.statusCode;
      if (code !== DisconnectReason.loggedOut) {
        console.log("[bot] reconectando…");
        startBot();
      } else {
        console.log("[bot] sesión cerrada definitivamente.");
      }
    }
  });

  sock.ev.on("messages.upsert", async ({ messages }) => {
    const m = messages?.[0];
    if (!m?.message || m.key.fromMe) return;
    const text =
      m.message.conversation ??
      m.message.extendedTextMessage?.text ??
      "";
    if (text.trim().toLowerCase() !== "!dinopro") return;

    const jid = m.key.remoteJid;
    const senderJid = m.key.participant ?? jid; // en grupo es el participant

    // 1. Estado actual del usuario desde SQLite.
    const best = getBest(senderJid);

    // 2. JWT corto para que el HTML pueda identificarse contra el backend.
    const token = issueToken(senderJid);

    // 3. Cargar plantilla HTML e inyectar window.__INITIAL__.
    let html = readFileSync(GAME_HTML_PATH, "utf8");
    const initial = JSON.stringify({ jid: senderJid, best, token, apiBase: API_BASE });
    html = html.replace("__USER__", senderJid.split("@")[0]);
    // Insertar el script de inicialización antes de </body>.
    html = html.replace("</body>", `<script>window.__INITIAL__ = ${initial};</script></body>`);

    // 4. Enviar con sock.sendHtml. trustedSources incluye el host del backend.
    await sock.sendHtml(jid, html, [API_HOST], m, {
      headerText: "🎮 Dino Runner Pro",
      footer: "Estado persistente vía SQLite + JWT",
      fallbackText: "Dino Runner Pro — abrí en WhatsApp móvil para jugar",
    });
    console.log(`[bot] HTML enviado a ${senderJid} (best=${best})`);
  });
}

startBot().catch((err) => {
  console.error("[bot] error fatal:", err);
  process.exit(1);
});
