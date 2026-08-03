import type { AnyMessageContent, MiscMessageGenerationOptions, WAMessage } from '../Types/index.js';
export type ScheduledMessageStatus = 'pending' | 'sent' | 'failed' | 'cancelled';
export type ScheduledMessage = {
    id: string;
    jid: string;
    content: AnyMessageContent;
    options?: MiscMessageGenerationOptions;
    scheduledTime: Date;
    createdAt: Date;
    status: ScheduledMessageStatus;
    messageId?: string;
    error?: string;
};
export type SendMessageFn = (jid: string, content: AnyMessageContent, options?: MiscMessageGenerationOptions) => Promise<WAMessage | undefined>;
export type MessageSchedulerOptions = {
    maxQueue?: number;
    checkInterval?: number;
    onSent?: (scheduled: ScheduledMessage, message: WAMessage | undefined) => void;
    onFailed?: (scheduled: ScheduledMessage, error: unknown) => void;
    logger?: {
        debug: (...args: any[]) => void;
        warn: (...args: any[]) => void;
    };
};
export declare class MessageScheduler {
    private queue;
    private timer?;
    private readonly sendMessage;
    private readonly options;
    constructor(sendMessage: SendMessageFn, options?: MessageSchedulerOptions);
    private generateId;
    schedule(jid: string, content: AnyMessageContent, scheduledTime: Date, options?: MiscMessageGenerationOptions): ScheduledMessage;
    scheduleDelay(jid: string, content: AnyMessageContent, delayMs: number, options?: MiscMessageGenerationOptions): ScheduledMessage;
    cancel(id: string): boolean;
    cancelForJid(jid: string): number;
    getPending(): ScheduledMessage[];
    get(id: string): ScheduledMessage | undefined;
    clearAll(): number;
    private isProcessing;
    private processQueue;
    private ensureTimerRunning;
    private stopTimer;
    stop(): void;
    start(): void;
}
export declare const createMessageScheduler: (sendMessage: SendMessageFn, options?: MessageSchedulerOptions) => MessageScheduler;
//# sourceMappingURL=scheduling.d.ts.map