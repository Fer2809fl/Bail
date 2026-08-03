import { proto } from '../../WAProto/index.js';
import { jidNormalizedUser } from '../WABinary/index.js';
import { BufferJSON } from '../Utils/generics.js';
async function loadBetterSqlite3() {
    try {
        const mod = await import('better-sqlite3');
        return mod.default ?? mod;
    }
    catch (err) {
        const helpful = new Error('`better-sqlite3` is required for `makeSqliteStore`. Install it as a peer dependency: `npm install better-sqlite3`');
        helpful.cause = err;
        throw helpful;
    }
}
const CREATE_SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS chats (
  id TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS contacts (
  id TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS group_metadata (
  id TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS messages (
  jid TEXT NOT NULL,
  msg_id TEXT NOT NULL,
  ts INTEGER,
  value TEXT NOT NULL,
  PRIMARY KEY (jid, msg_id)
);
CREATE INDEX IF NOT EXISTS messages_jid_ts_idx ON messages(jid, ts);
`;
export async function makeSqliteStore(opts) {
    let db;
    if ('database' in opts) {
        db = opts.database;
    }
    else {
        const Database = await loadBetterSqlite3();
        db = new Database(opts.dbPath);
    }
    db.pragma('journal_mode = WAL');
    db.pragma('synchronous = NORMAL');
    db.exec(CREATE_SCHEMA_SQL);
    const stmts = {
        chatUpsert: db.prepare('INSERT INTO chats (id, value) VALUES (?, ?) ON CONFLICT(id) DO UPDATE SET value = excluded.value'),
        chatGet: db.prepare('SELECT value FROM chats WHERE id = ?'),
        chatAll: db.prepare('SELECT value FROM chats'),
        chatDelete: db.prepare('DELETE FROM chats WHERE id = ?'),
        contactUpsert: db.prepare('INSERT INTO contacts (id, value) VALUES (?, ?) ON CONFLICT(id) DO UPDATE SET value = excluded.value'),
        contactGet: db.prepare('SELECT value FROM contacts WHERE id = ?'),
        contactAll: db.prepare('SELECT value FROM contacts'),
        groupUpsert: db.prepare('INSERT INTO group_metadata (id, value) VALUES (?, ?) ON CONFLICT(id) DO UPDATE SET value = excluded.value'),
        groupGet: db.prepare('SELECT value FROM group_metadata WHERE id = ?'),
        msgUpsert: db.prepare('INSERT INTO messages (jid, msg_id, ts, value) VALUES (?, ?, ?, ?) ON CONFLICT(jid, msg_id) DO UPDATE SET value = excluded.value, ts = excluded.ts'),
        msgGet: db.prepare('SELECT value FROM messages WHERE jid = ? AND msg_id = ?'),
        msgGetTs: db.prepare('SELECT ts FROM messages WHERE jid = ? AND msg_id = ?'),
        msgDelete: db.prepare('DELETE FROM messages WHERE jid = ? AND msg_id = ?'),
        msgClearJid: db.prepare('DELETE FROM messages WHERE jid = ?'),
        msgPage: db.prepare('SELECT value FROM messages WHERE jid = ? ORDER BY ts DESC LIMIT ?'),
        msgPageBefore: db.prepare('SELECT value FROM messages WHERE jid = ? AND ts < ? ORDER BY ts DESC LIMIT ?'),
        msgPageAfter: db.prepare('SELECT value FROM messages WHERE jid = ? AND ts > ? ORDER BY ts ASC LIMIT ?'),
        msgLatest: db.prepare('SELECT value FROM messages WHERE jid = ? ORDER BY ts DESC LIMIT 1')
    };
    const toJson = (v) => JSON.stringify(v, BufferJSON.replacer);
    const fromJson = (v) => JSON.parse(v, BufferJSON.reviver);
    const upsertChats = (chats) => {
        const tx = db.transaction((items) => {
            for (const chat of items) {
                if (!chat.id) {
                    continue;
                }
                stmts.chatUpsert.run(chat.id, toJson(chat));
            }
        });
        tx(chats);
    };
    const upsertContacts = (contacts) => {
        const tx = db.transaction((items) => {
            for (const contact of items) {
                if (!contact.id) {
                    continue;
                }
                stmts.contactUpsert.run(contact.id, toJson(contact));
            }
        });
        tx(contacts);
    };
    const upsertMessages = (messages) => {
        const tx = db.transaction((items) => {
            for (const msg of items) {
                const rawJid = msg.key.remoteJidAlt || msg.key.remoteJid;
                if (!rawJid || !msg.key.id) {
                    continue;
                }
                const jid = jidNormalizedUser(rawJid);
                const ts = Number(msg.messageTimestamp || 0);
                stmts.msgUpsert.run(jid, msg.key.id, ts, toJson(msg));
            }
        });
        tx(messages);
    };
    const bind = (ev) => {
        ev.on('messaging-history.set', ({ chats, contacts, messages, isLatest, syncType }) => {
            if (syncType === proto.HistorySync.HistorySyncType.ON_DEMAND) {
                return;
            }
            upsertChats(chats);
            upsertContacts(contacts);
            upsertMessages(messages);
        });
        ev.on('chats.upsert', newChats => {
            upsertChats(newChats);
        });
        ev.on('chats.update', updates => {
            for (const update of updates) {
                if (!update.id) {
                    continue;
                }
                const row = stmts.chatGet.get(update.id);
                const existing = row ? fromJson(row.value) : { id: update.id };
                const merged = Object.assign({}, existing, update);
                stmts.chatUpsert.run(update.id, toJson(merged));
            }
        });
        ev.on('chats.delete', ids => {
            for (const id of ids) {
                stmts.chatDelete.run(id);
            }
        });
        ev.on('contacts.upsert', newContacts => {
            upsertContacts(newContacts);
        });
        ev.on('contacts.update', updates => {
            for (const update of updates) {
                if (!update.id) {
                    continue;
                }
                const row = stmts.contactGet.get(update.id);
                const existing = row ? fromJson(row.value) : { id: update.id };
                const merged = Object.assign({}, existing, update);
                stmts.contactUpsert.run(update.id, toJson(merged));
            }
        });
        ev.on('messages.upsert', ({ messages }) => {
            upsertMessages(messages);
        });
        ev.on('messages.update', updates => {
            for (const { update, key } of updates) {
                const rawJid = key.remoteJidAlt || key.remoteJid;
                if (!rawJid || !key.id) {
                    continue;
                }
                const jid = jidNormalizedUser(rawJid);
                const row = stmts.msgGet.get(jid, key.id);
                if (!row) {
                    continue;
                }
                const merged = Object.assign({}, fromJson(row.value), update);
                stmts.msgUpsert.run(jid, key.id, Number(merged.messageTimestamp || 0), toJson(merged));
            }
        });
        ev.on('messages.delete', item => {
            if ('all' in item) {
                stmts.msgClearJid.run(jidNormalizedUser(item.jid));
            }
            else {
                for (const key of item.keys) {
                    const rawJid = key.remoteJidAlt || key.remoteJid;
                    if (rawJid && key.id) {
                        stmts.msgDelete.run(jidNormalizedUser(rawJid), key.id);
                    }
                }
            }
        });
        ev.on('groups.update', updates => {
            for (const update of updates) {
                if (!update.id) {
                    continue;
                }
                const row = stmts.groupGet.get(update.id);
                const existing = row ? fromJson(row.value) : { id: update.id };
                const merged = Object.assign({}, existing, update);
                stmts.groupUpsert.run(update.id, toJson(merged));
            }
        });
    };
    return {
        db,
        bind,
        chats: {
            get: (id) => {
                const row = stmts.chatGet.get(id);
                return row ? fromJson(row.value) : undefined;
            },
            all: () => stmts.chatAll.all().map((r) => fromJson(r.value))
        },
        contacts: {
            get: (id) => {
                const row = stmts.contactGet.get(id);
                return row ? fromJson(row.value) : undefined;
            },
            all: () => stmts.contactAll.all().map((r) => fromJson(r.value))
        },
        groupMetadata: {
            get: (id) => {
                const row = stmts.groupGet.get(id);
                return row ? fromJson(row.value) : undefined;
            }
        },
        messages: {
            get: (jid, id) => {
                const row = stmts.msgGet.get(jidNormalizedUser(jid), id);
                return row ? fromJson(row.value) : undefined;
            },
            page: (jid, limit = 50) => stmts.msgPage.all(jidNormalizedUser(jid), limit).map((r) => fromJson(r.value)),
            mostRecent: (jid) => {
                const row = stmts.msgLatest.get(jidNormalizedUser(jid));
                return row ? fromJson(row.value) : undefined;
            }
        },
        loadMessages: async (jid, count, cursor) => {
            const normalizedJid = jidNormalizedUser(jid);
            if (!cursor) {
                return stmts.msgPage.all(normalizedJid, count).map((r) => fromJson(r.value));
            }
            const cursorKey = 'before' in cursor ? cursor.before : cursor.after;
            if (!cursorKey?.id) {
                return stmts.msgPage.all(normalizedJid, count).map((r) => fromJson(r.value));
            }
            const cursorRow = stmts.msgGetTs.get(normalizedJid, cursorKey.id);
            if (!cursorRow) {
                return stmts.msgPage.all(normalizedJid, count).map((r) => fromJson(r.value));
            }
            if ('before' in cursor) {
                return stmts.msgPageBefore
                    .all(normalizedJid, cursorRow.ts, count)
                    .map((r) => fromJson(r.value));
            }
            return stmts.msgPageAfter
                .all(normalizedJid, cursorRow.ts, count)
                .map((r) => fromJson(r.value))
                .reverse();
        },
        close: () => {
            db.close();
        }
    };
}
//# sourceMappingURL=make-sqlite-store.js.map