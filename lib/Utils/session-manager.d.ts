import makeWASocket from '../Socket/index.js';
import type { UserFacingSocketConfig } from '../Types/index.js';
type WASocket = ReturnType<typeof makeWASocket>;
export type SessionEntry = {
    id: string;
    sock: WASocket;
    stop: () => Promise<void>;
};
export type SessionManagerOptions = {
    baseAuthDir: string;
    config?: Omit<Partial<UserFacingSocketConfig>, 'auth'>;
};
export declare const makeSessionManager: (opts: SessionManagerOptions) => {
    start: (id: string, overrideConfig?: Omit<Partial<UserFacingSocketConfig>, "auth">) => Promise<SessionEntry>;
    stop: (id: string) => Promise<void>;
    stopAll: () => Promise<void>;
    get: (id: string) => SessionEntry | undefined;
    list: () => string[];
};
export type SessionManager = ReturnType<typeof makeSessionManager>;
export {};
//# sourceMappingURL=session-manager.d.ts.map