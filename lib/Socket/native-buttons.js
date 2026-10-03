// Helpers de alto nivel para botones nativos de WhatsApp (native flow).
// Construyen el `content` esperado por Dugong.handleInteractiveButtons
// y lo despachan a través de sock.sendMessage, que ya sabe enrutar
// content.interactiveButtons -> INTERACTIVE_BUTTONS.
//
// También arman la "tarjeta" de previsualización de link (imagen, título,
// descripción) vía contextInfo.externalAdReply, igual que hace WhatsApp
// con los mensajes de texto normales que llevan un link.
//
// Actualización 7.0.7:
//  - Botones con ACCIÓN (recordatorio, ubicación, encuesta, texto, función):
//    el socket escucha la respuesta del usuario y ejecuta la acción solo.
//  - Wrappers de los botones Native Flow "crudos" (send_location, cta_reminder,
//    cta_cancel_reminder, address_message, open_webview, cta_catalog, mpm, ...).
//  - parseButtonResponse() para leer cualquier respuesta de botón/lista.
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "fs";
import { join } from "path";
import { normalizeMessageContent } from "../Utils/index.js";

const genId = () =>
  Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

const toButton = (name, params) => ({
  name,
  buttonParamsJson: JSON.stringify(params),
});

const URL_RE = /https?:\/\/[^\s]+/i;
const firstUrl = (text) => text?.match(URL_RE)?.[0];

// ─────────────────────────── utilidades / validación ───────────────────────────

const need = (value, label) => {
  const s = String(value ?? "").trim();
  if (!s) throw new Error(`[native-buttons] "${label}" es obligatorio`);
  return s;
};
const onlyDigits = (value, label = "teléfono") => {
  const d = String(value ?? "").replace(/\D/g, "");
  if (d.length < 5) throw new Error(`[native-buttons] ${label} inválido`);
  return d;
};
const httpUrl = (value, label = "url") => {
  const s = need(value, label);
  let ok = false;
  try {
    ok = /^https?:$/.test(new URL(s).protocol);
  } catch {}
  if (!ok) throw new Error(`[native-buttons] ${label} inválida: ${s}`);
  return s;
};

const UNITS = { ms: 1, s: 1e3, m: 6e4, h: 36e5, d: 864e5, w: 6048e5 };
const MAX_DELAY = 365 * UNITS.d;
const MAX_TIMEOUT = 2 ** 31 - 1; // límite de setTimeout (~24.8 días)

/** "10m" | "1h30m" | "2d" | 90000 (ms) -> milisegundos */
export const parseDuration = (value) => {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return Math.min(value, MAX_DELAY);
  }
  const str = String(value ?? "").trim().toLowerCase();
  const re = /(\d+(?:\.\d+)?)\s*(ms|s|m|h|d|w)/g;
  let total = 0;
  let consumed = "";
  let hit;
  while ((hit = re.exec(str))) {
    total += parseFloat(hit[1]) * UNITS[hit[2]];
    consumed += hit[0];
  }
  if (!total || consumed.replace(/\s/g, "") !== str.replace(/\s/g, "")) {
    throw new Error(`[native-buttons] duración inválida: "${value}" (ej: "10m", "1h30m", "2d")`);
  }
  return Math.min(total, MAX_DELAY);
};

const normalizePoll = (poll) => {
  if (!poll || typeof poll !== "object") {
    throw new Error("[native-buttons] poll requiere { name, values[], selectableCount? }");
  }
  const name = need(poll.name, "poll.name");
  const values = [
    ...new Set((poll.values ?? []).map((v) => String(v).trim()).filter(Boolean)),
  ];
  if (values.length < 2 || values.length > 12) {
    throw new Error("[native-buttons] la encuesta necesita entre 2 y 12 opciones distintas");
  }
  const raw = Number(poll.selectableCount ?? 1);
  const selectableCount = Number.isFinite(raw)
    ? Math.min(Math.max(Math.trunc(raw), 0), values.length) // 0 = sin límite
    : 1;
  const out = { name, values, selectableCount };
  if (poll.toAnnouncementGroup) out.toAnnouncementGroup = true;
  return out;
};

const normalizeLocation = (loc) => {
  if (!loc || typeof loc !== "object") {
    throw new Error("[native-buttons] location requiere { latitude, longitude, name?, address? }");
  }
  const lat = Number(loc.degreesLatitude ?? loc.latitude ?? loc.lat);
  const lng = Number(loc.degreesLongitude ?? loc.longitude ?? loc.lng ?? loc.lon);
  if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
    throw new Error("[native-buttons] latitud inválida (-90..90)");
  }
  if (!Number.isFinite(lng) || lng < -180 || lng > 180) {
    throw new Error("[native-buttons] longitud inválida (-180..180)");
  }
  const out = { degreesLatitude: lat, degreesLongitude: lng };
  if (loc.name) out.name = String(loc.name);
  if (loc.address) out.address = String(loc.address);
  return out;
};

const resolveReminderTime = (spec) => {
  if (spec.at !== undefined && spec.at !== null) {
    const at = spec.at instanceof Date ? spec.at.getTime() : new Date(spec.at).getTime();
    if (!Number.isFinite(at)) throw new Error("[native-buttons] reminder.at inválido");
    return at;
  }
  return Date.now() + parseDuration(spec.in ?? "10m");
};

/** Valida un spec de acción en el momento de ENVIAR (no cuando alguien toca). */
const validateSpec = (spec) => {
  if (typeof spec === "function") return spec;
  if (!spec || typeof spec !== "object") {
    throw new Error("[native-buttons] action debe ser un objeto { type } o una función");
  }
  switch (spec.type) {
    case "poll":
      return { ...spec, poll: normalizePoll(spec.poll) };
    case "location":
      return { ...spec, location: normalizeLocation(spec.location) };
    case "text":
      return { ...spec, text: need(spec.text, "action.text") };
    case "reminder":
      need(spec.text, "action.text");
      if (spec.at === undefined) parseDuration(spec.in ?? "10m");
      return { ...spec };
    case "cancel_reminder": // interno: lo crea el mensaje de confirmación del recordatorio
      return { ...spec, reminderId: need(spec.reminderId, "action.reminderId") };
    default:
      throw new Error(`[native-buttons] tipo de acción desconocido: ${spec.type}`);
  }
};

// ───────────────────────── estado compartido (por proceso) ─────────────────────────
// Se comparte entre sockets: si el bot reconecta y se crea un socket nuevo,
// los botones ya enviados siguen funcionando.

const DB_DIR = () => join(process.cwd(), "database");
const ACTIONS_FILE = () => join(DB_DIR(), "native-button-actions.json");
const REMINDERS_FILE = () => join(DB_DIR(), "native-reminders.json");
const DEFAULT_TTL = 7 * UNITS.d;
const COOLDOWN_MS = 1500; // anti-spam: mismo usuario + mismo botón
const MAX_REMINDERS_PER_USER = 20;

const userPart = (jid) => String(jid ?? "").split("@")[0].split(":")[0];
const sameUser = (a, b) => !!userPart(a) && userPart(a) === userPart(b);

const ACTIONS = new Map(); // id -> { spec?, fn?, expires, once }
const REMINDERS = new Map(); // id -> { id, jid, to, text, at, createdAt, tries }
const TIMERS = new Map(); // id -> Timeout
const HANDLED = new Set(); // ids de mensajes ya procesados (anti-duplicado)
const LAST_TAP = new Map(); // "usuario|botón" -> timestamp del último toque (cooldown)
const USED = new Set(); // ids de botones "actionOnce" ya gastados (para avisar al usuario)
const remember = (set, value, max) => {
  set.add(value);
  if (set.size > max) set.delete(set.values().next().value);
};
let stateLoaded = false;

const readJson = (file, fallback) => {
  try {
    return existsSync(file) ? JSON.parse(readFileSync(file, "utf8")) : fallback;
  } catch {
    return fallback;
  }
};
// Escritura atómica: se escribe a un temporal y se renombra, así un corte de luz
// o un kill a mitad de escritura no deja el JSON corrupto.
const writeJson = (file, data) => {
  try {
    mkdirSync(DB_DIR(), { recursive: true });
    const tmp = `${file}.${process.pid}.tmp`;
    writeFileSync(tmp, JSON.stringify(data, null, 2));
    renameSync(tmp, file);
  } catch {}
};
const FLUSHERS = new Set();
const debounced = (fn) => {
  let t = null;
  const schedule = () => {
    if (t) return;
    t = setTimeout(() => {
      t = null;
      fn();
    }, 300);
    t.unref?.();
  };
  // Guarda ya mismo si hay un guardado pendiente (se usa al cerrar el proceso).
  FLUSHERS.add(() => {
    if (!t) return;
    clearTimeout(t);
    t = null;
    fn();
  });
  return schedule;
};
let exitHooked = false;
const hookExit = () => {
  if (exitHooked) return;
  exitHooked = true;
  process.once("exit", () => {
    for (const flush of FLUSHERS) {
      try {
        flush();
      } catch {}
    }
  });
};
const saveActions = debounced(() => {
  const out = [];
  for (const [id, e] of ACTIONS) if (e.spec) out.push({ id, spec: e.spec, expires: e.expires, once: e.once });
  writeJson(ACTIONS_FILE(), out);
});
const saveReminders = debounced(() => {
  writeJson(REMINDERS_FILE(), [...REMINDERS.values()]);
});

const loadState = () => {
  if (stateLoaded) return;
  stateLoaded = true;
  hookExit();
  const now = Date.now();
  for (const a of readJson(ACTIONS_FILE(), [])) {
    if (a?.id && a.spec && a.expires > now) {
      ACTIONS.set(a.id, { spec: a.spec, expires: a.expires, once: !!a.once });
    }
  }
  for (const r of readJson(REMINDERS_FILE(), [])) {
    if (r?.id && r.jid && r.text) REMINDERS.set(r.id, r);
  }
};

const registerAction = (id, target, { ttl, once } = {}) => {
  const now = Date.now();
  for (const [k, e] of ACTIONS) if (e.expires <= now) ACTIONS.delete(k);
  const entry = {
    expires: now + (ttl !== undefined ? parseDuration(ttl) : DEFAULT_TTL),
    once: !!once,
  };
  if (typeof target === "function") entry.fn = target;
  else entry.spec = validateSpec(target);
  ACTIONS.set(id, entry);
  if (entry.spec) saveActions();
  return id;
};

// ───────────────────────────── lectura de respuestas ─────────────────────────────

/**
 * Lee la respuesta de un botón/lista de cualquier tipo.
 * Devuelve { kind, id, text, name?, params? } o null si el mensaje no es una respuesta.
 *  - quick_reply / single_select / cta_* llegan como interactiveResponseMessage
 *  - buttonsMessage / listMessage / templateButtons (legacy) también están cubiertos
 */
export const parseButtonResponse = (m) => {
  const msg = normalizeMessageContent(m?.message ?? m);
  if (!msg) return null;
  const ir = msg.interactiveResponseMessage;
  if (ir?.nativeFlowResponseMessage) {
    const nf = ir.nativeFlowResponseMessage;
    let params = {};
    try {
      params = JSON.parse(nf.paramsJson || "{}");
    } catch {}
    return {
      kind: "native_flow",
      name: nf.name,
      id: params.id ?? params.selectedRowId ?? null,
      text: params.display_text ?? params.title ?? ir.body?.text ?? null,
      params,
    };
  }
  if (msg.buttonsResponseMessage) {
    return {
      kind: "buttons",
      id: msg.buttonsResponseMessage.selectedButtonId ?? null,
      text: msg.buttonsResponseMessage.selectedDisplayText ?? null,
    };
  }
  if (msg.listResponseMessage) {
    return {
      kind: "list",
      id: msg.listResponseMessage.singleSelectReply?.selectedRowId ?? null,
      text: msg.listResponseMessage.title ?? null,
    };
  }
  if (msg.templateButtonReplyMessage) {
    return {
      kind: "template",
      id: msg.templateButtonReplyMessage.selectedId ?? null,
      text: msg.templateButtonReplyMessage.selectedDisplayText ?? null,
    };
  }
  return null;
};

// ───────────────────────────────── recordatorios ─────────────────────────────────

const whenText = (at, timeZone) =>
  new Date(at).toLocaleString("es", { dateStyle: "medium", timeStyle: "short", ...(timeZone ? { timeZone } : {}) });

const armReminder = (sock, r) => {
  clearTimeout(TIMERS.get(r.id));
  const timer = setTimeout(async () => {
    TIMERS.delete(r.id);
    if (!REMINDERS.has(r.id)) return; // cancelado
    if (r.at - Date.now() > 1000) return armReminder(sock, r); // delays > 24 días
    try {
      const num = String(r.to).split("@")[0];
      await sock.sendMessage(r.jid, {
        text: `⏰ *RECORDATORIO*\n\n@${num}\n${r.text}`,
        mentions: [r.to],
      });
      REMINDERS.delete(r.id);
      saveReminders();
    } catch (err) {
      r.tries = (r.tries ?? 0) + 1;
      sock.logger?.warn?.({ err, id: r.id }, "native-buttons: falló el envío del recordatorio");
      if (r.tries < 20) {
        r.at = Date.now() + 30_000; // reintenta en 30 s (p. ej. si se cayó la conexión)
        saveReminders();
        armReminder(sock, r);
      } else {
        REMINDERS.delete(r.id);
        saveReminders();
      }
    }
  }, Math.max(0, Math.min(r.at - Date.now(), MAX_TIMEOUT)));
  timer.unref?.();
  TIMERS.set(r.id, timer);
};

const scheduleReminder = (sock, { jid, to, text, at }) => {
  const r = { id: genId(), jid, to: to ?? jid, text: need(text, "text"), at, createdAt: Date.now(), tries: 0 };
  REMINDERS.set(r.id, r);
  saveReminders();
  armReminder(sock, r);
  return r;
};

const cancelReminder = (id) => {
  clearTimeout(TIMERS.get(id));
  TIMERS.delete(id);
  const had = REMINDERS.delete(id);
  if (had) saveReminders();
  return had;
};

// ─────────────────────────── ejecución de acciones ───────────────────────────

const runAction = async (sock, id, entry, m, response) => {
  const chat = m.key.remoteJid;
  const user = m.key.participant || m.key.remoteJid;
  const opts = { quoted: m };
  if (entry.fn) {
    return entry.fn({ sock, msg: m, chat, user, id, response });
  }
  const s = entry.spec;
  switch (s.type) {
    case "poll":
      return sock.sendMessage(chat, { poll: normalizePoll(s.poll) }, opts);
    case "location":
      return sock.sendMessage(chat, { location: normalizeLocation(s.location) }, opts);
    case "text":
      return sock.sendMessage(chat, { text: s.text, ...(s.mentions ? { mentions: s.mentions } : {}) }, opts);
    case "reminder": {
      const at = resolveReminderTime(s);
      if (at <= Date.now() + 1000) {
        return sock.sendMessage(chat, { text: "⚠️ Esa hora ya pasó, elige una futura." }, opts);
      }
      const pending = [...REMINDERS.values()].filter((x) => sameUser(x.to, user)).length;
      if (pending >= MAX_REMINDERS_PER_USER) {
        return sock.sendMessage(
          chat,
          { text: `⚠️ Ya tienes ${pending} recordatorios pendientes (máximo ${MAX_REMINDERS_PER_USER}). Cancela alguno e inténtalo de nuevo.` },
          opts,
        );
      }
      const r = scheduleReminder(sock, { jid: chat, to: user, text: s.text, at });
      if (s.confirm === false) return;
      const when = whenText(at, s.timeZone);
      const confirmText = (s.confirmText ?? "✅ *Recordatorio guardado*\n\n🕒 {when}\n📝 {text}")
        .replace("{when}", when)
        .replace("{text}", s.text);
      const cancelId = genId();
      registerAction(cancelId, { type: "cancel_reminder", reminderId: r.id }, { ttl: Math.max(at - Date.now(), 60_000) + UNITS.h });
      return sock.sendMessage(
        chat,
        {
          text: confirmText,
          interactiveButtons: [toButton("quick_reply", { display_text: "❌ Cancelar recordatorio", id: cancelId })],
        },
        opts,
      );
    }
    case "cancel_reminder": {
      const target = REMINDERS.get(s.reminderId);
      if (target && !sameUser(target.to, user)) {
        return sock.sendMessage(chat, { text: "🚫 Solo quien creó el recordatorio puede cancelarlo." }, opts);
      }
      const ok = cancelReminder(s.reminderId);
      return sock.sendMessage(
        chat,
        { text: ok ? "🗑️ Recordatorio cancelado." : "ℹ️ Ese recordatorio ya no existe (ya se envió o se canceló)." },
        opts,
      );
    }
  }
};

const takeActionOpts = (extra = {}) => {
  const { actionTtl, actionOnce, ...rest } = extra;
  return [{ ttl: actionTtl, once: actionOnce }, rest];
};

const normalizeSections = (sections) => {
  if (!Array.isArray(sections) || !sections.length) {
    throw new Error("[native-buttons] sections debe ser un array con al menos una sección");
  }
  return sections.map((sec) => {
    if (!Array.isArray(sec?.rows) || !sec.rows.length) {
      throw new Error("[native-buttons] cada sección necesita al menos una fila (rows)");
    }
    return {
      title: sec.title ?? "",
      rows: sec.rows.map((r) => ({
        header: r.header ?? "",
        title: need(r.title, "rows[].title"),
        description: r.description ?? "",
        id: r.id ?? genId(),
      })),
    };
  });
};

const DEFAULT_REMINDER_ROWS = [
  { title: "En 10 minutos", in: "10m" },
  { title: "En 30 minutos", in: "30m" },
  { title: "En 1 hora", in: "1h" },
  { title: "En 3 horas", in: "3h" },
  { title: "Mañana (24 h)", in: "1d" },
  { title: "En 1 semana", in: "1w" },
];

const listenerCache = new WeakSet();

/**
 * @param {object} sock socket ya construido (debe tener sendMessage)
 * @param {(url: string) => Promise<any>} fetchLinkPreview obtiene metadata de un link (mismo motor que usan los mensajes de texto normales)
 */
export const makeNativeButtons = (sock, fetchLinkPreview) => {
  loadState();
  // Re-arma los recordatorios pendientes con el socket vigente (reconexión / reinicio).
  for (const r of REMINDERS.values()) armReminder(sock, r);

  // Escucha las respuestas a botones y ejecuta la acción registrada.
  if (sock.ev?.on && !listenerCache.has(sock.ev)) {
    listenerCache.add(sock.ev);
    sock.ev.on("messages.upsert", async ({ messages, type }) => {
      if (type !== "notify") return;
      for (const m of messages ?? []) {
        try {
          if (!m?.message || m.key?.fromMe) continue;
          const response = parseButtonResponse(m);
          if (!response?.id) continue;
          const entry = ACTIONS.get(response.id);
          const wasUsed = !entry && USED.has(response.id);
          if (!entry && !wasUsed) continue;
          if (m.key.id) {
            if (HANDLED.has(m.key.id)) continue;
            remember(HANDLED, m.key.id, 500);
          }
          // Cooldown: si alguien machaca el botón, solo cuenta el primer toque.
          const tapKey = `${userPart(m.key.participant || m.key.remoteJid)}|${response.id}`;
          const nowTs = Date.now();
          if (nowTs - (LAST_TAP.get(tapKey) ?? 0) < COOLDOWN_MS) continue;
          LAST_TAP.delete(tapKey);
          LAST_TAP.set(tapKey, nowTs);
          if (LAST_TAP.size > 1000) LAST_TAP.delete(LAST_TAP.keys().next().value);

          if (wasUsed) {
            await sock.sendMessage(m.key.remoteJid, { text: "✅ Este botón ya se usó." }, { quoted: m });
            continue;
          }
          if (entry.expires <= nowTs) {
            ACTIONS.delete(response.id);
            saveActions();
            await sock.sendMessage(
              m.key.remoteJid,
              { text: "⌛ Este botón ya expiró. Pide el menú otra vez." },
              { quoted: m },
            );
            continue;
          }
          if (entry.once) {
            ACTIONS.delete(response.id);
            remember(USED, response.id, 500);
            saveActions();
          }
          await runAction(sock, response.id, entry, m, response);
        } catch (err) {
          sock.logger?.warn?.({ err }, "native-buttons: error ejecutando la acción del botón");
        }
      }
    });
  }

  const buildPreview = async (url) => {
    if (!url || !fetchLinkPreview) return undefined;
    try {
      const info = await fetchLinkPreview(url);
      if (!info) return undefined;
      return {
        title: info.title || "",
        body: info.description || "",
        mediaType: info.jpegThumbnail || info.highQualityThumbnail ? 1 : 0,
        thumbnail: info.jpegThumbnail,
        thumbnailUrl: info.originalThumbnailUrl,
        mediaUrl: url,
        sourceUrl: info["canonical-url"] || url,
        showAdAttribution: false,
        renderLargerThumbnail: true,
      };
    } catch {
      return undefined;
    }
  };

  const send = async (jid, buttons, extra = {}, options = {}) => {
    const {
      text,
      caption,
      footer,
      image,
      video,
      document,
      mimetype,
      jpegThumbnail,
      location,
      quoted,
      preview,
      previewUrl,
      contextInfo,
      ...rest
    } = extra;
    const body = text ?? caption ?? "";
    let finalContextInfo = contextInfo;
    // Vista previa automática: se activa si hay un link en el texto (o uno
    // explícito en `previewUrl`) y no se pidió desactivarla con preview:false.
    if (preview !== false) {
      const url = previewUrl || firstUrl(body);
      const externalAdReply = await buildPreview(url);
      if (externalAdReply) {
        finalContextInfo = { externalAdReply, ...contextInfo };
      }
    }
    const content = {
      text: body,
      footer,
      interactiveButtons: buttons,
      image,
      video,
      document,
      mimetype,
      jpegThumbnail,
      location,
      contextInfo: finalContextInfo,
      ...rest,
    };
    return sock.sendMessage(jid, content, { quoted, ...options });
  };

  return {
    /**
     * Botón(es) de respuesta rápida.
     * @param {string} jid
     * @param {string} text cuerpo del mensaje
     * @param {{id?:string,text:string}[]} replies
     */
    sendQuickReplyButtons: (jid, text, replies, extra = {}, options = {}) => {
      if (!Array.isArray(replies) || !replies.length) {
        throw new Error("[native-buttons] replies debe ser un array con al menos un botón");
      }
      const buttons = replies.map((r) =>
        toButton("quick_reply", {
          display_text: need(r.text, "replies[].text"),
          id: r.id ?? genId(),
        }),
      );
      return send(jid, buttons, { text, ...extra }, options);
    },

    /**
     * Botón que abre un enlace. Genera automáticamente la tarjeta de
     * previsualización (imagen/título/descripción) de esa URL.
     */
    sendUrlButton: (jid, text, buttonText, url, extra = {}, options = {}) => {
      const safeUrl = httpUrl(url);
      const buttons = [
        toButton("cta_url", {
          display_text: need(buttonText, "buttonText"),
          url: safeUrl,
          merchant_url: safeUrl,
        }),
      ];
      return send(jid, buttons, { text, previewUrl: safeUrl, ...extra }, options);
    },

    /** Botón para llamar a un número. */
    sendCallButton: (
      jid,
      text,
      buttonText,
      phoneNumber,
      extra = {},
      options = {},
    ) => {
      const buttons = [
        toButton("cta_call", {
          display_text: need(buttonText, "buttonText"),
          id: genId(),
          phone_number: (onlyDigits(phoneNumber), String(phoneNumber).trim()),
        }),
      ];
      return send(jid, buttons, { text, ...extra }, options);
    },

    /** Botón para copiar un código/texto al portapapeles. */
    sendCopyButton: (
      jid,
      text,
      buttonText,
      copyText,
      extra = {},
      options = {},
    ) => {
      const buttons = [
        toButton("cta_copy", {
          display_text: need(buttonText, "buttonText"),
          copy_code: need(copyText, "copyText"),
          id: genId(),
        }),
      ];
      return send(jid, buttons, { text, ...extra }, options);
    },

    /** Botón de recordatorio (cta_reminder). */
    sendReminderButton: (jid, text, buttonText, extra = {}, options = {}) => {
      const buttons = [
        toButton("cta_reminder", {
          display_text: need(buttonText, "buttonText"),
          id: genId(),
        }),
      ];
      return send(jid, buttons, { text, ...extra }, options);
    },

    /**
     * Lista desplegable nativa (single_select).
     * @param {string} jid
     * @param {string} text
     * @param {string} buttonText texto del botón que abre la lista
     * @param {{title?:string, rows:{title:string, description?:string, id?:string}[]}[]} sections
     */
    sendListButton: (
      jid,
      text,
      buttonText,
      sections,
      extra = {},
      options = {},
    ) => {
      const buttons = [
        toButton("single_select", {
          title: need(buttonText, "buttonText"),
          sections: normalizeSections(sections),
        }),
      ];
      return send(jid, buttons, { text, ...extra }, options);
    },

    /**
     * Mezcla libre de botones nativos, ya armados con su `name` y `params`.
     * Útil para combinar tipos (mixed) o para tipos no cubiertos arriba.
     * @param {{name:string, params:object}[]} rawButtons
     */
    sendMixedButtons: (jid, text, rawButtons, extra = {}, options = {}) => {
      if (!Array.isArray(rawButtons) || !rawButtons.length) {
        throw new Error("[native-buttons] rawButtons debe ser un array con al menos un botón");
      }
      const buttons = rawButtons.map((b) => toButton(need(b.name, "button.name"), b.params ?? {}));
      return send(jid, buttons, { text, ...extra }, options);
    },

    /**
     * Solo texto + tarjeta de previsualización de link "grande" y prolija,
     * sin botones. Útil cuando solo quieres que el link se vea bien.
     */
    sendLinkPreview: async (jid, text, url, extra = {}, options = {}) => {
      const { quoted, contextInfo, ...rest } = extra;
      const externalAdReply = await buildPreview(url || firstUrl(text));
      const content = {
        text,
        contextInfo: externalAdReply
          ? { externalAdReply, ...contextInfo }
          : contextInfo,
        ...rest,
      };
      return sock.sendMessage(jid, content, { quoted, ...options });
    },
    // ═════════════ Botones con ACCIÓN (el socket responde solo al toque) ═════════════
    // Extra opcionales en `extra`: actionTtl ("7d" por defecto), actionOnce (true = un solo uso).

    /**
     * Botones de respuesta rápida donde cada uno ejecuta una acción al tocarlo.
     * action: { type:"poll"|"location"|"text"|"reminder", ... } o una función ({sock,msg,chat,user,id,response}) => any
     * @param {{text:string, id?:string, action?:object|Function}[]} items
     */
    sendActionButtons: (jid, text, items, extra = {}, options = {}) => {
      if (!Array.isArray(items) || !items.length) {
        throw new Error("[native-buttons] items debe ser un array con al menos un botón");
      }
      const [aopts, rest] = takeActionOpts(extra);
      const seen = new Set();
      const buttons = items.map((it) => {
        const id = it.id ?? genId();
        if (seen.has(id)) throw new Error(`[native-buttons] id de botón repetido: ${id}`);
        seen.add(id);
        if (it.action) registerAction(id, it.action, aopts);
        return toButton("quick_reply", { display_text: need(it.text, "items[].text"), id });
      });
      return send(jid, buttons, { text, ...rest }, options);
    },

    /** Al tocar, el bot ENVÍA la ubicación indicada. location: { latitude, longitude, name?, address? } */
    sendLocationButton: (jid, text, buttonText, location, extra = {}, options = {}) => {
      const [aopts, rest] = takeActionOpts(extra);
      const id = genId();
      registerAction(id, { type: "location", location }, aopts);
      return send(
        jid,
        [toButton("quick_reply", { display_text: need(buttonText, "buttonText"), id })],
        { text, ...rest },
        options,
      );
    },

    /**
     * Al tocar, el bot ENVÍA una encuesta (personalizable).
     * poll: { name, values: string[] (2-12), selectableCount?: 1 (0 = sin límite) }
     */
    sendPollButton: (jid, text, buttonText, poll, extra = {}, options = {}) => {
      const [aopts, rest] = takeActionOpts(extra);
      const id = genId();
      registerAction(id, { type: "poll", poll }, aopts);
      return send(
        jid,
        [toButton("quick_reply", { display_text: need(buttonText, "buttonText"), id })],
        { text, ...rest },
        options,
      );
    },

    /**
     * Un botón que, al tocarlo, programa un recordatorio y avisa con mención al usuario.
     * reminder: { text, in?: "10m" | ms, at?: Date|ISO|ms, confirm?: false, confirmText?: "…{when}…{text}", timeZone? }
     */
    sendReminderActionButton: (jid, text, buttonText, reminder, extra = {}, options = {}) => {
      const [aopts, rest] = takeActionOpts(extra);
      const id = genId();
      registerAction(id, { type: "reminder", ...reminder }, aopts);
      return send(
        jid,
        [toButton("quick_reply", { display_text: need(buttonText, "buttonText"), id })],
        { text, ...rest },
        options,
      );
    },

    /**
     * Lista desplegable "¿En cuánto te lo recuerdo?" — cada fila programa un recordatorio distinto.
     * @param {string} reminderText lo que se le recordará al usuario
     * @param {{rows?:{title:string, in?:string, at?:any, description?:string}[], title?:string, timeZone?:string}} cfg
     */
    sendReminderMenu: (jid, text, buttonText, reminderText, cfg = {}, extra = {}, options = {}) => {
      const [aopts, rest] = takeActionOpts(extra);
      const rows = (cfg.rows?.length ? cfg.rows : DEFAULT_REMINDER_ROWS).map((r) => {
        const id = genId();
        registerAction(
          id,
          { type: "reminder", text: need(reminderText, "reminderText"), in: r.in, at: r.at, timeZone: cfg.timeZone },
          aopts,
        );
        return { header: "", title: need(r.title, "rows[].title"), description: r.description ?? "", id };
      });
      const buttons = [
        toButton("single_select", {
          title: need(buttonText, "buttonText"),
          sections: [{ title: cfg.title ?? "Recordarme", rows }],
        }),
      ];
      return send(jid, buttons, { text, ...rest }, options);
    },

    /** Registra tu propio handler para un id de botón/fila (p. ej. los que mandas con sendQuickReplyButtons). */
    onButton: (id, handler, opts = {}) => {
      if (typeof handler !== "function") throw new Error("[native-buttons] handler debe ser función");
      return registerAction(need(id, "id"), handler, { ttl: opts.ttl ?? "30d", once: opts.once });
    },

    /** Lee una respuesta de botón/lista de cualquier mensaje entrante. */
    parseButtonResponse,

    /** Recordatorios pendientes (opcionalmente solo los de un chat). */
    listReminders: (jid) =>
      [...REMINDERS.values()]
        .filter((r) => !jid || r.jid === jid)
        .sort((a, b) => a.at - b.at)
        .map((r) => ({ ...r })), // copias: editar el resultado no toca los recordatorios reales
    cancelReminder,

    // ═════════════ Botones Native Flow "crudos" (los pinta el cliente de WhatsApp) ═════════════
    // Ojo: varios dependen de la cuenta/cliente (catálogo, pagos, mpm...). Ver README.

    /** Array libre de botones: [{ name, buttonParamsJson | params }]. Igual que el comando ibtn. */
    sendNativeFlowButtons: (jid, text, rawButtons, extra = {}, options = {}) => {
      if (!Array.isArray(rawButtons) || !rawButtons.length) {
        throw new Error("[native-buttons] rawButtons debe ser un array con al menos un botón");
      }
      const buttons = rawButtons.map((b) => ({
        name: need(b.name, "button.name"),
        buttonParamsJson:
          typeof b.buttonParamsJson === "string"
            ? b.buttonParamsJson
            : JSON.stringify(b.buttonParamsJson ?? b.params ?? {}),
      }));
      return send(jid, buttons, { text, ...extra }, options);
    },

    /** send_location: el cliente pide al usuario que comparta SU ubicación. */
    sendRequestLocationButton: (jid, text, buttonText = "📍 Enviar ubicación", extra = {}, options = {}) =>
      send(jid, [toButton("send_location", { display_text: need(buttonText, "buttonText") })], { text, ...extra }, options),

    /** cta_cancel_reminder (nativo del cliente). */
    sendCancelReminderButton: (jid, text, buttonText = "Cancelar recordatorio", extra = {}, options = {}) =>
      send(jid, [toButton("cta_cancel_reminder", { display_text: need(buttonText, "buttonText") })], { text, ...extra }, options),

    /** address_message (formulario de dirección nativo). */
    sendAddressButton: (jid, text, buttonText = "📦 Dirección", extra = {}, options = {}) =>
      send(jid, [toButton("address_message", { display_text: need(buttonText, "buttonText") })], { text, ...extra }, options),

    /** open_webview: abre una URL dentro de WhatsApp. */
    sendWebviewButton: (jid, text, title, url, extra = {}, options = {}) =>
      send(
        jid,
        [toButton("open_webview", { title: need(title, "title"), link: { in_app_webview: true, url: httpUrl(url) } })],
        { text, ...extra },
        options,
      ),

    /** cta_catalog: abre el catálogo de un número de WhatsApp Business. */
    sendCatalogButton: (jid, text, businessPhone, extra = {}, options = {}) =>
      send(jid, [toButton("cta_catalog", { business_phone_number: onlyDigits(businessPhone) })], { text, ...extra }, options),

    /** mpm: mensaje multi-producto del catálogo. */
    sendProductListButton: (jid, text, productId, extra = {}, options = {}) =>
      send(jid, [toButton("mpm", { product_id: need(productId, "productId") })], { text, ...extra }, options),

    /** wa_payment_transaction_details. */
    sendPaymentDetailsButton: (jid, text, transactionId, extra = {}, options = {}) =>
      send(jid, [toButton("wa_payment_transaction_details", { transaction_id: need(transactionId, "transactionId") })], { text, ...extra }, options),

    /** automated_greeting_message_view_catalog. */
    sendViewCatalogButton: (jid, text, businessPhone, productId, extra = {}, options = {}) =>
      send(
        jid,
        [
          toButton("automated_greeting_message_view_catalog", {
            business_phone_number: onlyDigits(businessPhone),
            catalog_product_id: need(productId, "productId"),
          }),
        ],
        { text, ...extra },
        options,
      ),
  };
};
