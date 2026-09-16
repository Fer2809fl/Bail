export declare const ANTI_BAN_CONFIG: {
    MIN_MESSAGE_DELAY: number;
    MAX_MESSAGE_DELAY: number;
    MIN_TYPING_DELAY: number;
    MAX_TYPING_DELAY: number;
    GROUP_MESSAGE_DELAY: number;
    GROUP_MAX_MESSAGES_PER_MINUTE: number;
    BROADCAST_DELAY: number;
    BROADCAST_MAX_PER_HOUR: number;
    PRESENCE_UPDATE_INTERVAL: number;
    JITTER_PERCENT: number;
};

export declare function randomDelay(min: number, max: number): number;
export declare function messageDelay(isGroup?: boolean): Promise<void>;
export declare function typingDelay(messageLength?: number): Promise<void>;

export declare class RateLimiter {
    constructor(maxRequests: number, windowMs: number);
    canSend(jid?: string): boolean;
    recordSend(jid?: string): void;
    getWaitTime(jid?: string): number;
    waitForSlot(jid?: string): Promise<void>;
    cleanup(): void;
}

export declare class PresenceManager {
    constructor(sock: any, logger?: any);
    simulatePresence(jid: string, action?: 'composing' | 'recording' | 'paused' | 'available' | 'unavailable'): Promise<void>;
    sendWithPresence<T = any>(jid: string, sendFunc: () => Promise<T>, messageContent: string | object): Promise<T>;
    startPeriodicPresence(): void;
    stopPeriodicPresence(): void;
}

export declare function generateSessionFingerprint(): string;
export declare function isValidJid(jid: string): boolean;
export declare function sanitizeMessage(text: string): string;

export declare const globalRateLimiter: RateLimiter;
export declare const groupRateLimiter: RateLimiter;
export declare const broadcastRateLimiter: RateLimiter;
