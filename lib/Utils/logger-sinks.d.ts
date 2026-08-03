import type { ILogger } from './logger.js';
export type LogSink = (level: 'trace' | 'debug' | 'info' | 'warn' | 'error', obj: unknown, msg?: string) => void;
export type LoggerWithSinksOptions = {
    base: ILogger;
    sinks?: LogSink[];
};
export declare const makeLoggerWithSinks: (opts: LoggerWithSinksOptions) => ILogger;
export declare const addLogSink: (logger: ILogger, sink: LogSink) => ILogger;
//# sourceMappingURL=logger-sinks.d.ts.map