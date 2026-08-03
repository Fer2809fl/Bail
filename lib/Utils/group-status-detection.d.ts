export declare function isGroupStatusValue(value: unknown): boolean;
export declare function hasGroupStatusFlag(value: unknown, depth?: number, seenObjects?: WeakSet<object>): boolean;
export declare function getCurrentMessageContentVariants(message: unknown, depth?: number, seenObjects?: WeakSet<object>): Record<string, any>[];
export declare function hasGroupStatusMessage(webMessage: {
    message?: unknown;
} | undefined): boolean;
//# sourceMappingURL=group-status-detection.d.ts.map