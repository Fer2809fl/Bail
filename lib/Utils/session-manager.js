import makeWASocket from '../Socket/index.js';
import { useMultiFileAuthState } from './use-multi-file-auth-state.js';
const SAFE_ID_PATTERN = /^[a-zA-Z0-9_-]+$/;
const assertSafeId = (id) => {
    if (!id || !SAFE_ID_PATTERN.test(id)) {
        throw new Error(`invalid session id "${id}": only alphanumeric characters, "-" and "_" are allowed (no path separators or traversal sequences)`);
    }
};
export const makeSessionManager = (opts) => {
    const sessions = new Map();
    const pending = new Map();
    const start = async (id, overrideConfig) => {
        assertSafeId(id);
        const existing = sessions.get(id);
        if (existing) {
            return existing;
        }
        const inflight = pending.get(id);
        if (inflight) {
            return inflight;
        }
        const creation = (async () => {
            const authDir = `${opts.baseAuthDir}/${id}`;
            const { state, saveCreds } = await useMultiFileAuthState(authDir);
            const sock = makeWASocket({
                ...opts.config,
                ...overrideConfig,
                auth: state
            });
            sock.ev.on('creds.update', saveCreds);
            const entry = {
                id,
                sock,
                stop: async () => {
                    try {
                        sock.ev.removeAllListeners('creds.update');
                        sock.end(undefined);
                    }
                    finally {
                        sessions.delete(id);
                    }
                }
            };
            sessions.set(id, entry);
            return entry;
        })();
        pending.set(id, creation);
        try {
            return await creation;
        }
        finally {
            pending.delete(id);
        }
    };
    const stop = async (id) => {
        const entry = sessions.get(id);
        if (entry) {
            await entry.stop();
        }
    };
    const stopAll = async () => {
        await Promise.all(Array.from(sessions.keys()).map(id => stop(id)));
    };
    const get = (id) => sessions.get(id);
    const list = () => Array.from(sessions.keys());
    return {
        start,
        stop,
        stopAll,
        get,
        list
    };
};
//# sourceMappingURL=session-manager.js.map