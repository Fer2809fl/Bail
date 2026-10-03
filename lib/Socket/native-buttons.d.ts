import type { MiscMessageGenerationOptions } from "../Types/index.js";

type Extra = Record<string, any> & {
  /** Vida del botón con acción. Por defecto "7d". Ej: "30m", "2d". */
  actionTtl?: string | number;
  /** true = el botón solo funciona una vez. */
  actionOnce?: boolean;
};
type Opts = MiscMessageGenerationOptions;

export interface LocationInput {
  latitude?: number;
  longitude?: number;
  degreesLatitude?: number;
  degreesLongitude?: number;
  name?: string;
  address?: string;
}
export interface PollInput {
  name: string;
  /** 2 a 12 opciones distintas. */
  values: string[];
  /** 1 por defecto. 0 = sin límite. */
  selectableCount?: number;
  toAnnouncementGroup?: boolean;
}
export interface ReminderInput {
  /** Lo que se le recordará al usuario. */
  text: string;
  /** Duración: "10m", "1h30m", "2d" o milisegundos. Por defecto "10m". */
  in?: string | number;
  /** Fecha exacta (tiene prioridad sobre `in`). */
  at?: Date | string | number;
  /** false = no manda el mensaje de confirmación. */
  confirm?: boolean;
  /** Admite {when} y {text}. */
  confirmText?: string;
  timeZone?: string;
}
export interface ButtonActionContext {
  sock: any;
  msg: any;
  chat: string;
  user: string;
  id: string;
  response: ButtonResponse;
}
export type ButtonAction =
  | { type: "poll"; poll: PollInput }
  | { type: "location"; location: LocationInput }
  | { type: "text"; text: string; mentions?: string[] }
  | ({ type: "reminder" } & ReminderInput)
  /** Cancela un recordatorio. Solo lo puede cancelar quien lo creó. */
  | { type: "cancel_reminder"; reminderId: string }
  | ((ctx: ButtonActionContext) => any | Promise<any>);

export interface ButtonResponse {
  kind: "native_flow" | "buttons" | "list" | "template";
  id: string | null;
  text: string | null;
  name?: string;
  params?: Record<string, any>;
}
export interface ReminderRecord {
  id: string;
  jid: string;
  to: string;
  text: string;
  at: number;
  createdAt: number;
  tries?: number;
}

export declare const parseDuration: (value: string | number) => number;
export declare const parseButtonResponse: (message: any) => ButtonResponse | null;

export interface NativeButtonsApi {
  sendQuickReplyButtons: (jid: string, text: string, replies: { id?: string; text: string }[], extra?: Extra, options?: Opts) => Promise<any>;
  sendUrlButton: (jid: string, text: string, buttonText: string, url: string, extra?: Extra, options?: Opts) => Promise<any>;
  sendCallButton: (jid: string, text: string, buttonText: string, phoneNumber: string, extra?: Extra, options?: Opts) => Promise<any>;
  sendCopyButton: (jid: string, text: string, buttonText: string, copyText: string, extra?: Extra, options?: Opts) => Promise<any>;
  /** cta_reminder nativo (lo pinta el cliente). Para uno que SÍ programa algo usa sendReminderMenu / sendReminderActionButton. */
  sendReminderButton: (jid: string, text: string, buttonText: string, extra?: Extra, options?: Opts) => Promise<any>;
  sendListButton: (
    jid: string,
    text: string,
    buttonText: string,
    sections: { title?: string; rows: { title: string; header?: string; description?: string; id?: string }[] }[],
    extra?: Extra,
    options?: Opts,
  ) => Promise<any>;
  sendMixedButtons: (jid: string, text: string, rawButtons: { name: string; params: object }[], extra?: Extra, options?: Opts) => Promise<any>;
  sendLinkPreview: (jid: string, text: string, url?: string, extra?: Extra, options?: Opts) => Promise<any>;

  sendActionButtons: (jid: string, text: string, items: { text: string; id?: string; action?: ButtonAction }[], extra?: Extra, options?: Opts) => Promise<any>;
  sendLocationButton: (jid: string, text: string, buttonText: string, location: LocationInput, extra?: Extra, options?: Opts) => Promise<any>;
  sendPollButton: (jid: string, text: string, buttonText: string, poll: PollInput, extra?: Extra, options?: Opts) => Promise<any>;
  sendReminderActionButton: (jid: string, text: string, buttonText: string, reminder: ReminderInput, extra?: Extra, options?: Opts) => Promise<any>;
  sendReminderMenu: (
    jid: string,
    text: string,
    buttonText: string,
    reminderText: string,
    cfg?: { title?: string; timeZone?: string; rows?: { title: string; in?: string | number; at?: Date | string | number; description?: string }[] },
    extra?: Extra,
    options?: Opts,
  ) => Promise<any>;
  onButton: (id: string, handler: (ctx: ButtonActionContext) => any | Promise<any>, opts?: { ttl?: string | number; once?: boolean }) => string;
  parseButtonResponse: typeof parseButtonResponse;
  /** Pendientes ordenados por fecha. Devuelve copias. */
  listReminders: (jid?: string) => ReminderRecord[];
  cancelReminder: (id: string) => boolean;

  sendNativeFlowButtons: (jid: string, text: string, buttons: { name: string; buttonParamsJson?: string | object; params?: object }[], extra?: Extra, options?: Opts) => Promise<any>;
  sendRequestLocationButton: (jid: string, text: string, buttonText?: string, extra?: Extra, options?: Opts) => Promise<any>;
  sendCancelReminderButton: (jid: string, text: string, buttonText?: string, extra?: Extra, options?: Opts) => Promise<any>;
  sendAddressButton: (jid: string, text: string, buttonText?: string, extra?: Extra, options?: Opts) => Promise<any>;
  sendWebviewButton: (jid: string, text: string, title: string, url: string, extra?: Extra, options?: Opts) => Promise<any>;
  sendCatalogButton: (jid: string, text: string, businessPhone: string, extra?: Extra, options?: Opts) => Promise<any>;
  sendProductListButton: (jid: string, text: string, productId: string, extra?: Extra, options?: Opts) => Promise<any>;
  sendPaymentDetailsButton: (jid: string, text: string, transactionId: string, extra?: Extra, options?: Opts) => Promise<any>;
  sendViewCatalogButton: (jid: string, text: string, businessPhone: string, productId: string, extra?: Extra, options?: Opts) => Promise<any>;
}

export declare const makeNativeButtons: (sock: any, fetchLinkPreview?: (url: string) => Promise<any>) => NativeButtonsApi;
