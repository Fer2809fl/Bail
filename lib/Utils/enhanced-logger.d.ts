export declare const LOG_LEVELS: {
    fatal: number; error: number; warn: number; info: number; debug: number; trace: number; silent: number;
};
export declare const COLORS: Record<string, string>;
export declare const CATEGORY_ICONS: Record<string, string>;

export type LogLevel = 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace';

export declare class RyzeLogger {
    constructor(options?: {
        level?: LogLevel;
        prettyPrint?: boolean;
        category?: string;
        colors?: boolean;
        timestamps?: boolean;
        filters?: string[];
        maxHistory?: number;
    });
    fatal(messageOrData: string | object, data?: object): void;
    error(messageOrData: string | object, data?: object): void;
    warn(messageOrData: string | object, data?: object): void;
    info(messageOrData: string | object, data?: object): void;
    debug(messageOrData: string | object, data?: object): void;
    trace(messageOrData: string | object, data?: object): void;
    success(message: string, data?: object): void;
    child(bindings: { class?: string; category?: string }): RyzeLogger;
    setLevel(level: LogLevel): void;
    addFilter(pattern: string): void;
    removeFilter(pattern: string): void;
    getHistory(options?: { level?: LogLevel; category?: string; since?: string | number | Date; limit?: number }): Array<{ timestamp: string; level: LogLevel; category: string; message: string; data: any }>;
    clearHistory(): void;
    exportLogs(format?: 'json' | 'text'): string;
    time(label: string): { end: (message?: string) => number };
    if(condition: boolean, level: LogLevel, message: string, data?: object): void;
    throttle(key: string, message: string, data?: object, intervalMs?: number): void;
}

export declare function createLogger(options?: ConstructorParameters<typeof RyzeLogger>[0]): RyzeLogger;

declare const defaultLogger: RyzeLogger;
export default defaultLogger;
