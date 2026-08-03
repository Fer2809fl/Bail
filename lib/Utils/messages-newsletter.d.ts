import type { AnyMessageContent, MiscMessageGenerationOptions, WAMessage } from '../Types/index.js';
export interface NewsletterSendCapableSocket {
    sendMessage: (jid: string, content: AnyMessageContent, options?: MiscMessageGenerationOptions) => Promise<WAMessage | undefined>;
    newsletterReactMessage: (jid: string, serverId: string, reaction?: string) => Promise<void>;
}
export type NewsletterButtonInput = {
    id?: string;
    text?: string;
    displayText?: string;
};
export type NewsletterListSection = {
    title?: string;
    rows?: Array<{
        id?: string;
        rowId?: string;
        title?: string;
        description?: string;
    }>;
};
export declare function makeNewsletterUtils(conn: NewsletterSendCapableSocket): {
    sendNewsletterText: (jid: string, text: string, options?: MiscMessageGenerationOptions) => Promise<WAMessage | undefined>;
    sendNewsletterImage: (jid: string, image: AnyMessageContent extends {
        image: infer I;
    } ? I : never, options?: MiscMessageGenerationOptions & {
        caption?: string;
        mimetype?: string;
        jpegThumbnail?: Buffer;
    }) => Promise<WAMessage | undefined>;
    sendNewsletterVideo: (jid: string, video: unknown, options?: MiscMessageGenerationOptions & {
        caption?: string;
        mimetype?: string;
        gifPlayback?: boolean;
    }) => Promise<WAMessage | undefined>;
    sendNewsletterPtv: (jid: string, video: unknown, options?: MiscMessageGenerationOptions & {
        mimetype?: string;
    }) => Promise<WAMessage | undefined>;
    sendNewsletterAudio: (jid: string, audio: unknown, options?: MiscMessageGenerationOptions & {
        mimetype?: string;
        seconds?: number;
        ptt?: boolean;
    }) => Promise<WAMessage | undefined>;
    sendNewsletterDocument: (jid: string, document: unknown, options?: MiscMessageGenerationOptions & {
        mimetype?: string;
        fileName?: string;
        caption?: string;
    }) => Promise<WAMessage | undefined>;
    sendNewsletterSticker: (jid: string, sticker: unknown, options?: MiscMessageGenerationOptions & {
        isAnimated?: boolean;
    }) => Promise<WAMessage | undefined>;
    sendNewsletterButtons: (jid: string, params: {
        body?: string;
        buttons?: NewsletterButtonInput[];
        title?: string;
        footer?: string;
    }, options?: MiscMessageGenerationOptions) => Promise<WAMessage | undefined>;
    sendNewsletterList: (jid: string, params: {
        body?: string;
        buttonText?: string;
        sections?: NewsletterListSection[];
        title?: string;
        footer?: string;
    }, options?: MiscMessageGenerationOptions) => Promise<WAMessage | undefined>;
    sendNewsletterCtaUrl: (jid: string, params: {
        body?: string;
        buttonText?: string;
        url?: string;
        title?: string;
        footer?: string;
    }, options?: MiscMessageGenerationOptions) => Promise<WAMessage | undefined>;
    sendNewsletterReact: (jid: string, serverId: string, emoji?: string) => Promise<void>;
    editNewsletterMessage: (jid: string, messageId: string, newText: string) => Promise<WAMessage | undefined>;
    deleteNewsletterMessage: (jid: string, messageId: string) => Promise<WAMessage | undefined>;
};
//# sourceMappingURL=messages-newsletter.d.ts.map