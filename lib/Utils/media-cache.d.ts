import type { WAMessage } from '../Types/Message.js';
import type { MediaDownloadOptions } from './messages-media.js';
import type { ILogger } from './logger.js';
export type MediaCacheOptions = {
    maxItems?: number;
    maxBytes?: number;
    reuploadRequest?: (msg: WAMessage) => Promise<WAMessage>;
    logger?: ILogger;
};
export declare const makeMediaCache: (opts?: MediaCacheOptions) => {
    download: (message: WAMessage, options: MediaDownloadOptions) => Promise<Buffer>;
    has: (message: WAMessage) => boolean;
    clear: () => void;
    size: () => any;
};
export type MediaCache = ReturnType<typeof makeMediaCache>;
//# sourceMappingURL=media-cache.d.ts.map