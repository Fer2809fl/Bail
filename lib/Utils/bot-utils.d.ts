export declare function parseCommand(text: string, prefix?: string): {
    isCommand: boolean;
    command?: string;
    args?: string[];
    fullArgs?: string;
    flags?: Record<string, string | boolean>;
    raw?: string;
    prefix?: string;
};

export declare function extractMentions(message: any): string[];
export declare function extractText(message: any): string;
export declare function extractQuotedMessage(message: any): {
    message: any;
    stanzaId?: string;
    participant?: string;
    remoteJid?: string;
    text: string;
} | null;

export declare function isGroupAdmin(sock: any, jid: string, participantJid: string): Promise<boolean>;
export declare function isBotAdmin(sock: any, jid: string): Promise<boolean>;
export declare function getSenderJid(msg: any): string;
export declare function formatJid(jid: string): string;
export declare function generateMessageId(): string;
export declare function truncateText(text: string, maxLength?: number, suffix?: string): string;
export declare function escapeMarkdown(text: string): string;
export declare function formatPhoneNumber(jid: string): string;

export declare class CooldownManager {
    isOnCooldown(key: string, cooldownMs: number): boolean;
    setCooldown(key: string, cooldownMs: number): void;
    getRemainingTime(key: string): number;
    cleanup(): void;
}

export declare class PermissionManager {
    constructor(config?: { owners?: string[]; admins?: string[]; banned?: string[]; premiums?: string[] });
    isOwner(jid: string): boolean;
    isAdmin(jid: string): boolean;
    isBanned(jid: string): boolean;
    isPremium(jid: string): boolean;
    addOwner(jid: string): void;
    removeOwner(jid: string): void;
    addAdmin(jid: string): void;
    removeAdmin(jid: string): void;
    ban(jid: string): void;
    unban(jid: string): void;
    addPremium(jid: string): void;
    removePremium(jid: string): void;
    toJSON(): { owners: string[]; admins: string[]; banned: string[]; premiums: string[] };
}

export declare function createReply(options: { text: string; mentions?: string[]; quoted?: any }): { text: string; mentions?: string[]; quoted?: any };
export declare function parseTime(timeStr: string): number;
export declare function formatDuration(ms: number): string;
export declare function sendFast(sock: any, jid: string, content: string | object, opts?: { quoted?: any; markRead?: boolean }): Promise<any>;
