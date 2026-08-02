import { proto } from '../../WAProto/index.js'
import type { Chat } from '../Types/Chat'
import type { Contact } from '../Types/Contact'
import type { BaileysEventEmitter } from '../Types/Events'
import type { GroupMetadata } from '../Types/GroupMetadata'
import type { WAMessage, WAMessageKey } from '../Types/Message'
import { jidNormalizedUser } from '../WABinary/index.js'
import { BufferJSON } from '../Utils/generics.js'

import type DatabaseCtor from 'better-sqlite3'

export type SqliteDatabase = InstanceType<typeof DatabaseCtor>

export type SqliteStoreOptions =
	| {
			dbPath: string
	  }
	| {
			database: SqliteDatabase
	  }

export interface SqliteStoreApi {
	db: SqliteDatabase
	bind: (ev: BaileysEventEmitter) => void
	chats: {
		get: (id: string) => Chat | undefined
		all: () => Chat[]
	}
	contacts: {
		get: (id: string) => Contact | undefined
		all: () => Contact[]
	}
	groupMetadata: {
		get: (id: string) => GroupMetadata | undefined
	}
	messages: {
		get: (jid: string, id: string) => WAMessage | undefined
		page: (jid: string, limit?: number) => WAMessage[]
		mostRecent: (jid: string) => WAMessage | undefined
	}
	loadMessages: (
		jid: string,
		count: number,
		cursor?: { before: WAMessageKey | undefined } | { after: WAMessageKey | undefined }
	) => Promise<WAMessage[]>
	close: () => void
}

async function loadBetterSqlite3(): Promise<typeof DatabaseCtor> {
	try {
		const mod: any = await import('better-sqlite3')
		return mod.default ?? mod
	} catch (err) {
		const helpful = new Error(
			'`better-sqlite3` is required for `makeSqliteStore`. Install it as a peer dependency: `npm install better-sqlite3`'
		)
		;(helpful as any).cause = err
		throw helpful
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
`

export async function makeSqliteStore(opts: SqliteStoreOptions): Promise<SqliteStoreApi> {
	let db: SqliteDatabase
	if ('database' in opts) {
		db = opts.database
	} else {
		const Database = await loadBetterSqlite3()
		db = new Database(opts.dbPath)
	}

	db.pragma('journal_mode = WAL')
	db.pragma('synchronous = NORMAL')
	db.exec(CREATE_SCHEMA_SQL)

	const stmts = {
		chatUpsert: db.prepare<[string, string]>(
			'INSERT INTO chats (id, value) VALUES (?, ?) ON CONFLICT(id) DO UPDATE SET value = excluded.value'
		),
		chatGet: db.prepare<[string], { value: string }>('SELECT value FROM chats WHERE id = ?'),
		chatAll: db.prepare<[], { value: string }>('SELECT value FROM chats'),
		chatDelete: db.prepare<[string]>('DELETE FROM chats WHERE id = ?'),
		contactUpsert: db.prepare<[string, string]>(
			'INSERT INTO contacts (id, value) VALUES (?, ?) ON CONFLICT(id) DO UPDATE SET value = excluded.value'
		),
		contactGet: db.prepare<[string], { value: string }>('SELECT value FROM contacts WHERE id = ?'),
		contactAll: db.prepare<[], { value: string }>('SELECT value FROM contacts'),
		groupUpsert: db.prepare<[string, string]>(
			'INSERT INTO group_metadata (id, value) VALUES (?, ?) ON CONFLICT(id) DO UPDATE SET value = excluded.value'
		),
		groupGet: db.prepare<[string], { value: string }>('SELECT value FROM group_metadata WHERE id = ?'),
		msgUpsert: db.prepare<[string, string, number, string]>(
			'INSERT INTO messages (jid, msg_id, ts, value) VALUES (?, ?, ?, ?) ON CONFLICT(jid, msg_id) DO UPDATE SET value = excluded.value, ts = excluded.ts'
		),
		msgGet: db.prepare<[string, string], { value: string }>('SELECT value FROM messages WHERE jid = ? AND msg_id = ?'),
		msgGetTs: db.prepare<[string, string], { ts: number }>('SELECT ts FROM messages WHERE jid = ? AND msg_id = ?'),
		msgDelete: db.prepare<[string, string]>('DELETE FROM messages WHERE jid = ? AND msg_id = ?'),
		msgClearJid: db.prepare<[string]>('DELETE FROM messages WHERE jid = ?'),
		msgPage: db.prepare<[string, number], { value: string }>(
			'SELECT value FROM messages WHERE jid = ? ORDER BY ts DESC LIMIT ?'
		),
		msgPageBefore: db.prepare<[string, number, number], { value: string }>(
			'SELECT value FROM messages WHERE jid = ? AND ts < ? ORDER BY ts DESC LIMIT ?'
		),
		msgPageAfter: db.prepare<[string, number, number], { value: string }>(
			'SELECT value FROM messages WHERE jid = ? AND ts > ? ORDER BY ts ASC LIMIT ?'
		),
		msgLatest: db.prepare<[string], { value: string }>(
			'SELECT value FROM messages WHERE jid = ? ORDER BY ts DESC LIMIT 1'
		)
	}

	const toJson = (v: unknown) => JSON.stringify(v, BufferJSON.replacer)
	const fromJson = <T>(v: string): T => JSON.parse(v, BufferJSON.reviver)

	const upsertChats = (chats: Chat[]) => {
		const tx = db.transaction((items: Chat[]) => {
			for (const chat of items) {
				if (!chat.id) {
					continue
				}

				stmts.chatUpsert.run(chat.id, toJson(chat))
			}
		})
		tx(chats)
	}

	const upsertContacts = (contacts: Contact[]) => {
		const tx = db.transaction((items: Contact[]) => {
			for (const contact of items) {
				if (!contact.id) {
					continue
				}

				stmts.contactUpsert.run(contact.id, toJson(contact))
			}
		})
		tx(contacts)
	}

	const upsertMessages = (messages: WAMessage[]) => {
		const tx = db.transaction((items: WAMessage[]) => {
			for (const msg of items) {
				const rawJid = msg.key.remoteJidAlt || msg.key.remoteJid
				if (!rawJid || !msg.key.id) {
					continue
				}

				const jid = jidNormalizedUser(rawJid)
				const ts = Number(msg.messageTimestamp || 0)
				stmts.msgUpsert.run(jid, msg.key.id, ts, toJson(msg))
			}
		})
		tx(messages)
	}

	const bind = (ev: BaileysEventEmitter) => {
		ev.on('messaging-history.set', ({ chats, contacts, messages, isLatest, syncType }) => {
			if (syncType === proto.HistorySync.HistorySyncType.ON_DEMAND) {
				return
			}

			upsertChats(chats)
			upsertContacts(contacts)
			upsertMessages(messages as WAMessage[])
		})

		ev.on('chats.upsert', newChats => {
			upsertChats(newChats)
		})

		ev.on('chats.update', updates => {
			for (const update of updates) {
				if (!update.id) {
					continue
				}

				const row = stmts.chatGet.get(update.id)
				const existing = row ? fromJson<Chat>(row.value) : ({ id: update.id } as Chat)
				const merged = Object.assign({}, existing, update)
				stmts.chatUpsert.run(update.id, toJson(merged))
			}
		})

		ev.on('chats.delete', ids => {
			for (const id of ids) {
				stmts.chatDelete.run(id)
			}
		})

		ev.on('contacts.upsert', newContacts => {
			upsertContacts(newContacts)
		})

		ev.on('contacts.update', updates => {
			for (const update of updates) {
				if (!update.id) {
					continue
				}

				const row = stmts.contactGet.get(update.id)
				const existing = row ? fromJson<Contact>(row.value) : ({ id: update.id } as Contact)
				const merged = Object.assign({}, existing, update)
				stmts.contactUpsert.run(update.id, toJson(merged))
			}
		})

		ev.on('messages.upsert', ({ messages }) => {
			upsertMessages(messages as WAMessage[])
		})

		ev.on('messages.update', updates => {
			for (const { update, key } of updates) {
				const rawJid = key.remoteJidAlt || key.remoteJid
				if (!rawJid || !key.id) {
					continue
				}

				const jid = jidNormalizedUser(rawJid)
				const row = stmts.msgGet.get(jid, key.id)
				if (!row) {
					continue
				}

				const merged = Object.assign({}, fromJson<WAMessage>(row.value), update)
				stmts.msgUpsert.run(jid, key.id, Number(merged.messageTimestamp || 0), toJson(merged))
			}
		})

		ev.on('messages.delete', item => {
			if ('all' in item) {
				stmts.msgClearJid.run(jidNormalizedUser(item.jid))
			} else {
				for (const key of item.keys) {
					const rawJid = key.remoteJidAlt || key.remoteJid
					if (rawJid && key.id) {
						stmts.msgDelete.run(jidNormalizedUser(rawJid), key.id)
					}
				}
			}
		})

		ev.on('groups.update', updates => {
			for (const update of updates) {
				if (!update.id) {
					continue
				}

				const row = stmts.groupGet.get(update.id)
				const existing = row ? fromJson<GroupMetadata>(row.value) : ({ id: update.id } as GroupMetadata)
				const merged = Object.assign({}, existing, update)
				stmts.groupUpsert.run(update.id, toJson(merged))
			}
		})
	}

	return {
		db,
		bind,
		chats: {
			get: (id: string): Chat | undefined => {
				const row = stmts.chatGet.get(id)
				return row ? fromJson<Chat>(row.value) : undefined
			},
			all: (): Chat[] => stmts.chatAll.all().map((r: { value: string }) => fromJson<Chat>(r.value))
		},
		contacts: {
			get: (id: string): Contact | undefined => {
				const row = stmts.contactGet.get(id)
				return row ? fromJson<Contact>(row.value) : undefined
			},
			all: (): Contact[] => stmts.contactAll.all().map((r: { value: string }) => fromJson<Contact>(r.value))
		},
		groupMetadata: {
			get: (id: string): GroupMetadata | undefined => {
				const row = stmts.groupGet.get(id)
				return row ? fromJson<GroupMetadata>(row.value) : undefined
			}
		},
		messages: {
			get: (jid: string, id: string): WAMessage | undefined => {
				const row = stmts.msgGet.get(jidNormalizedUser(jid), id)
				return row ? fromJson<WAMessage>(row.value) : undefined
			},
			page: (jid: string, limit = 50): WAMessage[] =>
				stmts.msgPage.all(jidNormalizedUser(jid), limit).map((r: { value: string }) => fromJson<WAMessage>(r.value)),
			mostRecent: (jid: string): WAMessage | undefined => {
				const row = stmts.msgLatest.get(jidNormalizedUser(jid))
				return row ? fromJson<WAMessage>(row.value) : undefined
			}
		},
		loadMessages: async (
			jid: string,
			count: number,
			cursor?: { before: WAMessageKey | undefined } | { after: WAMessageKey | undefined }
		): Promise<WAMessage[]> => {
			const normalizedJid = jidNormalizedUser(jid)

			if (!cursor) {
				return stmts.msgPage.all(normalizedJid, count).map((r: { value: string }) => fromJson<WAMessage>(r.value))
			}

			const cursorKey = 'before' in cursor ? cursor.before : cursor.after
			if (!cursorKey?.id) {
				return stmts.msgPage.all(normalizedJid, count).map((r: { value: string }) => fromJson<WAMessage>(r.value))
			}

			const cursorRow = stmts.msgGetTs.get(normalizedJid, cursorKey.id)
			if (!cursorRow) {
				return stmts.msgPage.all(normalizedJid, count).map((r: { value: string }) => fromJson<WAMessage>(r.value))
			}

			if ('before' in cursor) {
				return stmts.msgPageBefore
					.all(normalizedJid, cursorRow.ts, count)
					.map((r: { value: string }) => fromJson<WAMessage>(r.value))
			}

			return stmts.msgPageAfter
				.all(normalizedJid, cursorRow.ts, count)
				.map((r: { value: string }) => fromJson<WAMessage>(r.value))
				.reverse()
		},
		close: () => {
			db.close()
		}
	}
}

export type SqliteStore = Awaited<ReturnType<typeof makeSqliteStore>>
		
