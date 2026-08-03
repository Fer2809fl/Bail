import { proto } from '../../WAProto/index.js';
import type { Chat, PresenceData } from '../Types/Chat.js';
import type { Contact } from '../Types/Contact.js';
import type { BaileysEventEmitter } from '../Types/Events.js';
import type { GroupMetadata } from '../Types/GroupMetadata.js';
import type { Label } from '../Types/Label.js';
import { type LabelAssociation } from '../Types/LabelAssociation.js';
import type { WAMessage, WAMessageKey } from '../Types/Message.js';
import type { ILogger } from '../Utils/logger.js';
import { type OrderedDictionary } from './make-ordered-dictionary.js';
import { ObjectRepository } from './object-repository.js';
type Comparable<T, K> = {
    key: (v: T) => K;
    compare: (a: K, b: K) => number;
};
export type MinimalStoreSocket = {
    profilePictureUrl: (jid: string, type?: 'preview' | 'image', timeoutMs?: number) => Promise<string | undefined>;
    groupMetadata: (jid: string) => Promise<GroupMetadata>;
};
export declare const waChatKey: (pin: boolean) => Comparable<Chat, string>;
export declare const waMessageID: (m: WAMessage) => string;
export declare const waLabelAssociationKey: Comparable<LabelAssociation, string>;
export type InMemoryStoreConfig = {
    chatKey?: Comparable<Chat, string>;
    labelAssociationKey?: Comparable<LabelAssociation, string>;
    logger?: ILogger;
    socket?: MinimalStoreSocket;
};
export declare const makeInMemoryStore: (config?: InMemoryStoreConfig) => {
    chats: any;
    contacts: {
        [jid: string]: Contact;
    };
    messages: {
        [jid: string]: OrderedDictionary<WAMessage>;
    };
    groupMetadata: {
        [jid: string]: GroupMetadata;
    };
    state: {
        connection: string;
    };
    presences: {
        [jid: string]: {
            [participant: string]: PresenceData;
        };
    };
    labels: ObjectRepository<Label>;
    labelAssociations: any;
    bind: (ev: BaileysEventEmitter) => void;
    loadMessages: (jid: string, count: number, cursor: {
        before: WAMessageKey | undefined;
    } | {
        after: WAMessageKey | undefined;
    } | undefined) => Promise<WAMessage[]>;
    getLabels: () => ObjectRepository<Label>;
    getChatLabels: (chatId: string) => any;
    getMessageLabels: (messageId: string) => any;
    loadMessage: (jid: string, id: string) => Promise<WAMessage | undefined>;
    mostRecentMessage: (jid: string) => Promise<WAMessage | undefined>;
    fetchImageUrl: (jid: string, sock?: MinimalStoreSocket) => Promise<string | null | undefined>;
    fetchGroupMetadata: (jid: string, sock?: MinimalStoreSocket) => Promise<GroupMetadata | undefined>;
    fetchMessageReceipts: ({ remoteJid, id }: {
        remoteJid: string;
        id: string;
    }) => Promise<proto.IUserReceipt[] | null | undefined>;
    toJSON: () => {
        chats: any;
        contacts: {
            [jid: string]: Contact;
        };
        messages: {
            [jid: string]: OrderedDictionary<WAMessage>;
        };
        labels: ObjectRepository<Label>;
        labelAssociations: any;
    };
    fromJSON: (json: {
        chats: Chat[];
        contacts: {
            [jid: string]: Contact;
        };
        messages: {
            [jid: string]: WAMessage[];
        };
        labels?: {
            [id: string]: Label;
        };
        labelAssociations?: LabelAssociation[];
    }) => void;
    writeToFile: (path: string) => void;
    readFromFile: (path: string) => void;
};
export type InMemoryStore = ReturnType<typeof makeInMemoryStore>;
export {};
//# sourceMappingURL=make-in-memory-store.d.ts.map