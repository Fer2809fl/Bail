export const makeLoggerWithSinks = (opts) => {
    const sinks = opts.sinks ? [...opts.sinks] : [];
    const wrap = (base) => {
        const dispatch = (level, obj, msg) => {
            base[level](obj, msg);
            for (const sink of sinks) {
                try {
                    sink(level, obj, msg);
                }
                catch {
                    continue;
                }
            }
        };
        return {
            level: base.level,
            child: (bindings) => wrap(base.child(bindings)),
            trace: (obj, msg) => dispatch('trace', obj, msg),
            debug: (obj, msg) => dispatch('debug', obj, msg),
            info: (obj, msg) => dispatch('info', obj, msg),
            warn: (obj, msg) => dispatch('warn', obj, msg),
            error: (obj, msg) => dispatch('error', obj, msg)
        };
    };
    return wrap(opts.base);
};
export const addLogSink = (logger, sink) => {
    return makeLoggerWithSinks({ base: logger, sinks: [sink] });
};
//# sourceMappingURL=logger-sinks.js.map