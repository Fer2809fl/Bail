export declare const RECONNECT_CONFIG: {
    MAX_RETRIES: number;
    INITIAL_DELAY: number;
    MAX_DELAY: number;
    BACKOFF_FACTOR: number;
    JITTER_FACTOR: number;
    STABLE_CONNECTION_TIME: number;
    RECOVERABLE_REASONS: number[];
    FATAL_REASONS: number[];
};

export declare class SmartReconnect {
    constructor(logger?: any, config?: Partial<typeof RECONNECT_CONFIG>);
    retryCount: number;
    connectionStable: boolean;
    calculateDelay(): number;
    shouldReconnect(reason: string, statusCode?: number): { shouldReconnect: boolean; reason?: string; delay?: number };
    handleDisconnect(reason: string, statusCode: number | undefined, reconnectCallback: () => Promise<void>): Promise<{ reconnecting: boolean; reason?: string; success?: boolean; error?: any }>;
    onSuccessfulReconnect(): void;
    cancelPendingReconnect(): void;
    reset(): void;
    getStats(): {
        totalReconnects: number;
        successfulReconnects: number;
        failedReconnects: number;
        lastSuccessfulConnect: string | null;
        averageDowntime: number;
        currentRetryCount: number;
        isStable: boolean;
        lastDisconnect: { reason: string; statusCode?: number; time: number } | null;
    };
    startHealthCheck(pingCallback: () => Promise<void>, interval?: number): void;
    stopHealthCheck(): void;
    cleanup(): void;
}

export declare function createConnectionHandler(sock: any, logger?: any, options?: Partial<typeof RECONNECT_CONFIG>): {
    reconnect: SmartReconnect;
    handleConnectionUpdate(update: any, startSock: () => Promise<void>): Promise<any>;
    getStatus(): { stats: ReturnType<SmartReconnect['getStats']>; isHealthy: boolean };
};

export declare function withRetry<T>(fn: () => Promise<T>, options?: {
    maxRetries?: number;
    delay?: number;
    backoff?: number;
    onRetry?: ((error: any, attempt: number, waitTime: number) => void) | null;
}): Promise<T>;
