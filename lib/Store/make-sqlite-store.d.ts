import type { Chat } from '../Types/Chat.js';
import type { Contact } from '../Types/Contact.js';
import type { BaileysEventEmitter } from '../Types/Events.js';
import type { GroupMetadata } from '../Types/GroupMetadata.js';
import type { WAMessage, WAMessageKey } from '../Types/Message.js';
import type DatabaseCtor from 'better-sqlite3';
export type SqliteDatabase = InstanceType<typeof DatabaseCtor>;
export type SqliteStoreOptions = {
    dbPath: string;
} | {
    database: SqliteDatabase;
};
export interface SqliteStoreApi {
    db: SqliteDatabase;
    bind: (ev: BaileysEventEmitter) => void;
    chats: {
        get: (id: string) => Chat | undefined;
        all: () => Chat[];
    };
    contacts: {
        get: (id: string) => Contact | undefined;
        all: () => Contact[];
    };
    groupMetadata: {
        get: (id: string) => GroupMetadata | undefined;
    };
    messages: {
        get: (jid: string, id: string) => WAMessage | undefined;
        page: (jid: string, limit?: number) => WAMessage[];
        mostRecent: (jid: string) => WAMessage | undefined;
    };
    loadMessages: (jid: string, count: number, cursor?: {
        before: WAMessageKey | undefined;
    } | {
        after: WAMessageKey | undefined;
    }) => Promise<WAMessage[]>;
    close: () => void;
}
export declare function makeSqliteStore(opts: SqliteStoreOptions): Promise<SqliteStoreApi>;
export type SqliteStore = Awaited<ReturnType<typeof makeSqliteStore>>;
//# sourceMappingURL=make-sqlite-store.d.ts.map