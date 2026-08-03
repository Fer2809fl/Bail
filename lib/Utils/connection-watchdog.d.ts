import type { ILogger } from './logger.js';
export type ReconnectDecision = {
    action: 'reconnect';
    delayMs: number;
} | {
    action: 'stop';
    reason: string;
};
export type ConnectionWatchdogOptions = {
    baseDelayMs?: number;
    maxDelayMs?: number;
    backoffFactor?: number;
    rateLimitCooldownMs?: number;
    logger?: ILogger;
    livenessCheckIntervalMs?: number;
    zombieThresholdMs?: number;
};
export declare class ConnectionWatchdog {
    private consecutiveFailures;
    private readonly opts;
    private livenessTimer?;
    private lastAliveAt;
    constructor(options?: ConnectionWatchdogOptions);
    notifyConnected(): void;
    notifyActivity(): void;
    decide(statusCode: number | undefined): ReconnectDecision;
    startLivenessCheck(onZombie: () => void): void;
    stopLivenessCheck(): void;
}
//# sourceMappingURL=connection-watchdog.d.ts.map