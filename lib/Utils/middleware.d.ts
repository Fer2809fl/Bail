import type { BaileysEventEmitter } from '../Types/Events.js';
import type { WAMessage } from '../Types/Message.js';
import type { AnyMessageContent, MiscMessageGenerationOptions } from '../Types/Message.js';
import type { ILogger } from './logger.js';
export type MiddlewareContext = {
    jid: string;
    message: WAMessage;
    stop: () => void;
};
export type Middleware = (ctx: MiddlewareContext) => void | Promise<void>;
export type OutgoingMiddlewareContext = {
    jid: string;
    content: AnyMessageContent;
    options?: MiscMessageGenerationOptions;
};
export type OutgoingMiddleware = (ctx: OutgoingMiddlewareContext) => void | Promise<void>;
export type MinimalMiddlewareSocket = {
    ev: BaileysEventEmitter;
};
export type MiddlewareStackOptions = {
    logger?: ILogger;
};
export declare const makeMiddlewareStack: (sock: MinimalMiddlewareSocket, opts?: MiddlewareStackOptions) => {
    use: (mw: Middleware) => () => void;
    useOutgoing: (mw: OutgoingMiddleware) => () => void;
    runOutgoing: (jid: string, content: AnyMessageContent, options?: MiscMessageGenerationOptions) => Promise<OutgoingMiddlewareContext>;
};
export type MiddlewareStack = ReturnType<typeof makeMiddlewareStack>;
//# sourceMappingURL=middleware.d.ts.map