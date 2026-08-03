import type { WAVersion } from '../Types/index.js';
import type { ILogger } from './logger.js';
export declare const WA_WEB_VERSION_CACHE_MS: number;
export type ResolveWaWebVersionOptions = {
    logger?: ILogger;
    options?: RequestInit;
    timeoutMs?: number;
    cacheMs?: number;
    force?: boolean;
};
export declare const fetchWaWebVersionFromCheckUpdate: (options?: RequestInit) => Promise<WAVersion>;
export declare const resolveWaWebVersion: ({ logger, options, timeoutMs, cacheMs, force }?: ResolveWaWebVersionOptions) => Promise<WAVersion | undefined>;
export declare const getCachedWaWebVersion: () => WAVersion | undefined;
export declare const clearWaWebVersionCache: () => void;
//# sourceMappingURL=wa-version.d.ts.map