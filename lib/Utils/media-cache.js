import { LRUCache } from 'lru-cache';
import { downloadMediaMessage, extractMessageContent, getContentType } from './messages.js';
const getMediaHash = (message) => {
    const mContent = extractMessageContent(message.message);
    if (!mContent) {
        return undefined;
    }
    const contentType = getContentType(mContent);
    if (!contentType) {
        return undefined;
    }
    const media = mContent[contentType];
    if (!media?.fileSha256) {
        return undefined;
    }
    return Buffer.from(media.fileSha256).toString('base64');
};
export const makeMediaCache = (opts = {}) => {
    const cache = new LRUCache({
        max: opts.maxItems ?? 200,
        maxSize: opts.maxBytes ?? 200 * 1024 * 1024,
        sizeCalculation: (value) => value.byteLength || 1
    });
    const inflight = new Map();
    const download = async (message, options) => {
        const hash = getMediaHash(message);
        if (!hash) {
            return downloadMediaMessage(message, 'buffer', options, {
                reuploadRequest: opts.reuploadRequest || (async (m) => m),
                logger: opts.logger || { info: () => undefined, debug: () => undefined }
            });
        }
        const cached = cache.get(hash);
        if (cached) {
            return cached;
        }
        const running = inflight.get(hash);
        if (running) {
            return running;
        }
        const promise = downloadMediaMessage(message, 'buffer', options, {
            reuploadRequest: opts.reuploadRequest || (async (m) => m),
            logger: opts.logger || { info: () => undefined, debug: () => undefined }
        })
            .then(buf => {
            cache.set(hash, buf);
            inflight.delete(hash);
            return buf;
        })
            .catch(err => {
            inflight.delete(hash);
            throw err;
        });
        inflight.set(hash, promise);
        return promise;
    };
    const has = (message) => {
        const hash = getMediaHash(message);
        return hash ? cache.has(hash) : false;
    };
    const clear = () => {
        cache.clear();
        inflight.clear();
    };
    return {
        download,
        has,
        clear,
        size: () => cache.size
    };
};
//# sourceMappingURL=media-cache.js.map