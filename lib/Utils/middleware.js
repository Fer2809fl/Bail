export const makeMiddlewareStack = (sock, opts = {}) => {
    const incoming = [];
    const outgoing = [];
    const use = (mw) => {
        incoming.push(mw);
        return () => {
            const idx = incoming.indexOf(mw);
            if (idx >= 0) {
                incoming.splice(idx, 1);
            }
        };
    };
    const useOutgoing = (mw) => {
        outgoing.push(mw);
        return () => {
            const idx = outgoing.indexOf(mw);
            if (idx >= 0) {
                outgoing.splice(idx, 1);
            }
        };
    };
    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type !== 'notify') {
            return;
        }
        for (const message of messages) {
            const rawJid = message.key.remoteJidAlt || message.key.remoteJid;
            if (!rawJid) {
                continue;
            }
            let stopped = false;
            const ctx = {
                jid: rawJid,
                message,
                stop: () => {
                    stopped = true;
                }
            };
            for (const mw of incoming) {
                try {
                    await mw(ctx);
                }
                catch (err) {
                    // A misbehaving middleware must not stop the rest of the chain from
                    // running, or crash the process via an unhandled rejection.
                    opts.logger?.error({ err, jid: rawJid }, 'middleware threw, continuing chain');
                }
                if (stopped) {
                    break;
                }
            }
        }
    });
    const runOutgoing = async (jid, content, options) => {
        const ctx = { jid, content, options };
        for (const mw of outgoing) {
            try {
                await mw(ctx);
            }
            catch (err) {
                opts.logger?.error({ err, jid }, 'outgoing middleware threw, continuing chain');
            }
        }
        return ctx;
    };
    return {
        use,
        useOutgoing,
        runOutgoing
    };
};
//# sourceMappingURL=middleware.js.map