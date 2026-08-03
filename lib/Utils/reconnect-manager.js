import { Boom } from '@hapi/boom';
import makeWASocket from '../Socket/index.js';
import { DisconnectReason } from '../Types/index.js';
const DISCONNECT_STATUS_LOGGED_OUT = 401;
const defaultShouldReconnect = (statusCode) => statusCode !== DISCONNECT_STATUS_LOGGED_OUT;
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
export const makeResilientSocket = (opts) => {
    const minDelay = opts.minDelayMs ?? 1000;
    const maxDelay = opts.maxDelayMs ?? 60000;
    const shouldReconnect = opts.shouldReconnect ?? defaultShouldReconnect;
    let attempt = 0;
    let stopped = false;
    let currentSock;
    const computeDelay = () => {
        const exp = Math.min(maxDelay, minDelay * 2 ** attempt);
        const jitter = Math.random() * exp * 0.2;
        return Math.min(maxDelay, exp + jitter);
    };
    const connect = () => {
        const sock = makeWASocket(opts.config);
        currentSock = sock;
        opts.onSocket?.(sock);
        sock.ev.on('connection.update', update => {
            const { connection, lastDisconnect } = update;
            if (connection === 'open') {
                attempt = 0;
            }
            if (connection === 'close' && !stopped) {
                const statusCode = lastDisconnect?.error?.output?.statusCode;
                if (!shouldReconnect(statusCode)) {
                    stopped = true;
                    opts.logger?.warn({ statusCode }, 'reconnect not allowed for this status code, stopping');
                    opts.onStopped?.(statusCode);
                    return;
                }
                if (opts.maxAttempts !== undefined && attempt >= opts.maxAttempts) {
                    stopped = true;
                    opts.logger?.error({ attempt }, 'max reconnect attempts reached');
                    opts.onMaxAttemptsReached?.();
                    return;
                }
                if (statusCode === DisconnectReason.restartRequired) {
                    attempt = 0;
                    opts.logger?.info({ statusCode }, 'restart required, reconnecting immediately');
                    connect();
                    return;
                }
                const wait = computeDelay();
                attempt += 1;
                opts.logger?.warn({ attempt, wait, statusCode }, 'reconnecting');
                delay(wait).then(() => {
                    if (!stopped) {
                        connect();
                    }
                });
            }
        });
        return sock;
    };
    connect();
    return {
        get socket() {
            return currentSock;
        },
        stop: () => {
            stopped = true;
            currentSock?.end(undefined);
        }
    };
};
//# sourceMappingURL=reconnect-manager.js.map