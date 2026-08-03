// Helpers de alto nivel para botones nativos de WhatsApp (native flow).
// Construyen el `content` esperado por Dugong.handleInteractiveButtons
// y lo despachan a través de sock.sendMessage, que ya sabe enrutar
// content.interactiveButtons -> INTERACTIVE_BUTTONS.
//
// También arman la "tarjeta" de previsualización de link (imagen, título,
// descripción) vía contextInfo.externalAdReply, igual que hace WhatsApp
// con los mensajes de texto normales que llevan un link.

const genId = () =>
  Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

const toButton = (name, params) => ({
  name,
  buttonParamsJson: JSON.stringify(params),
});

const URL_RE = /https?:\/\/[^\s]+/i;
const firstUrl = (text) => text?.match(URL_RE)?.[0];

/**
 * @param {object} sock socket ya construido (debe tener sendMessage)
 * @param {(url: string) => Promise<any>} fetchLinkPreview obtiene metadata de un link (mismo motor que usan los mensajes de texto normales)
 */
export const makeNativeButtons = (sock, fetchLinkPreview) => {
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
      const buttons = replies.map((r) =>
        toButton("quick_reply", {
          display_text: r.text,
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
      const buttons = [
        toButton("cta_url", {
          display_text: buttonText,
          url,
          merchant_url: url,
        }),
      ];
      return send(jid, buttons, { text, previewUrl: url, ...extra }, options);
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
          display_text: buttonText,
          id: genId(),
          phone_number: phoneNumber,
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
          display_text: buttonText,
          copy_code: copyText,
          id: genId(),
        }),
      ];
      return send(jid, buttons, { text, ...extra }, options);
    },

    /** Botón de recordatorio (cta_reminder). */
    sendReminderButton: (jid, text, buttonText, extra = {}, options = {}) => {
      const buttons = [
        toButton("cta_reminder", {
          display_text: buttonText,
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
          title: buttonText,
          sections: sections.map((s) => ({
            title: s.title ?? "",
            rows: s.rows.map((r) => ({
              header: r.header ?? "",
              title: r.title,
              description: r.description ?? "",
              id: r.id ?? genId(),
            })),
          })),
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
      const buttons = rawButtons.map((b) => toButton(b.name, b.params));
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
  };
};
