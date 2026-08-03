import makeWASocket from '../Socket/index.js';
import { type UserFacingSocketConfig } from '../Types/index.js';
import type { ILogger } from './logger.js';
type WASocket = ReturnType<typeof makeWASocket>;
export type ReconnectOptions = {
    config: UserFacingSocketConfig;
    shouldReconnect?: (statusCode: number | undefined) => boolean;
    minDelayMs?: number;
    maxDelayMs?: number;
    maxAttempts?: number;
    onSocket?: (sock: WASocket) => void;
    onMaxAttemptsReached?: () => void;
    onStopped?: (statusCode: number | undefined) => void;
    logger?: ILogger;
};
export declare const makeResilientSocket: (opts: ReconnectOptions) => {
    readonly socket: WASocket;
    stop: () => void;
};
export {};
//# sourceMappingURL=reconnect-manager.d.ts.map