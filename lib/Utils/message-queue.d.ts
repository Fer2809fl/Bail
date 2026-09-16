export declare const PRIORITY: {
    CRITICAL: 0;
    HIGH: 1;
    NORMAL: 2;
    LOW: 3;
    BACKGROUND: 4;
};

export declare const QUEUE_CONFIG: {
    MAX_QUEUE_SIZE: number;
    PROCESS_INTERVAL: number;
    RATE_LIMITS: Record<'message' | 'group' | 'media' | 'broadcast', { count: number; window: number }>;
    DELAYS: Record<'message' | 'group' | 'media' | 'broadcast', number>;
};

export declare class QueueItem {
    constructor(task: (() => Promise<any>) | any, priority?: number, metadata?: { jid?: string; type?: string; maxAttempts?: number; allowDuplicate?: boolean; contentHash?: string });
    id: string;
    task: (() => Promise<any>) | any;
    priority: number;
    metadata: Record<string, any>;
    createdAt: number;
    attempts: number;
    maxAttempts: number;
    status: 'pending' | 'processing' | 'completed' | 'failed';
}

export declare class MessageQueue {
    constructor(logger?: any, config?: Partial<typeof QUEUE_CONFIG>);
    enqueue(task: (() => Promise<any>) | any, priority?: number, metadata?: { jid?: string; type?: string; maxAttempts?: number; allowDuplicate?: boolean; contentHash?: string }): string | null;
    pause(): void;
    resume(): void;
    clear(priority?: number | null): void;
    getStats(): {
        totalQueued: number;
        totalProcessed: number;
        totalFailed: number;
        averageWaitTime: number;
        currentQueueSize: number;
        isProcessing: boolean;
        isPaused: boolean;
        pendingByPriority: Record<'critical' | 'high' | 'normal' | 'low' | 'background', number>;
    };
    cleanup(): void;
}

export declare function createMessageQueue(logger?: any, customConfig?: Partial<typeof QUEUE_CONFIG>): MessageQueue;
