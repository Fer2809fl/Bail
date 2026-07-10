import { proto } from '../../WAProto/index.js'
import type { AuthenticationCreds, AuthenticationState, SignalDataTypeMap } from '../Types'
import { initAuthCreds } from './auth-utils.js'
import { BufferJSON } from './generics.js'

import type DatabaseCtor from 'better-sqlite3'

type SqliteDatabase = InstanceType<typeof DatabaseCtor>

export type SqliteAuthStateOptions =
	| {
			dbPath: string
	  }
	| {
			database: SqliteDatabase
	  }

async function loadBetterSqlite3(): Promise<typeof DatabaseCtor> {
	try {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const mod: any = await import('better-sqlite3')
		return mod.default ?? mod
	} catch (err) {
		const helpful = new Error(
			'`better-sqlite3` is required for `useSqliteAuthState`. Install it as a peer dependency: `npm install better-sqlite3` (or `yarn add better-sqlite3`).'
		)
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		;(helpful as any).cause = err
		throw helpful
	}
}

const CREDS_ROW_KEY = '__creds__'

const CREATE_SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS creds (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS signal_keys (
  type TEXT NOT NULL,
  id TEXT NOT NULL,
  value TEXT NOT NULL,
  PRIMARY KEY (type, id)
);
CREATE INDEX IF NOT EXISTS signal_keys_type_idx ON signal_keys(type);
`

export async function useSqliteAuthState(
	opts: SqliteAuthStateOptions
): Promise<{ state: AuthenticationState; saveCreds: () => void }> {
	let db: SqliteDatabase
	if ('database' in opts) {
		db = opts.database
	} else {
		const Database = await loadBetterSqlite3()
		db = new Database(opts.dbPath)
	}

	// WAL mode allows concurrent reads alongside a single writer; matches
	// what SQLite recommends for read-heavy workloads with sporadic writes.
	db.pragma('journal_mode = WAL')
	db.pragma('synchronous = NORMAL')
	db.exec(CREATE_SCHEMA_SQL)

	const stmts = {
		credsSelect: db.prepare<[string], { value: string }>('SELECT value FROM creds WHERE key = ?'),
		credsUpsert: db.prepare<[string, string]>(
			'INSERT INTO creds (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value'
		),
		keySelect: db.prepare<[string, string], { value: string }>('SELECT value FROM signal_keys WHERE type = ? AND id = ?'),
		keyUpsert: db.prepare<[string, string, string]>(
			'INSERT INTO signal_keys (type, id, value) VALUES (?, ?, ?) ON CONFLICT(type, id) DO UPDATE SET value = excluded.value'
		),
		keyDelete: db.prepare<[string, string]>('DELETE FROM signal_keys WHERE type = ? AND id = ?'),
		keyListIds: db.prepare<[string], { id: string }>('SELECT id FROM signal_keys WHERE type = ?'),
		keyList: db.prepare<[string], { id: string; value: string }>('SELECT id, value FROM signal_keys WHERE type = ?'),
		clearKeys: db.prepare('DELETE FROM signal_keys')
	}

	const loadCreds = (): AuthenticationCreds => {
		const row = stmts.credsSelect.get(CREDS_ROW_KEY)
		if (!row) {
			return initAuthCreds()
		}

		return JSON.parse(row.value, BufferJSON.reviver)
	}

	const persistCreds = (creds: AuthenticationCreds) => {
		stmts.credsUpsert.run(CREDS_ROW_KEY, JSON.stringify(creds, BufferJSON.replacer))
	}

	const creds = loadCreds()

	return {
		state: {
			creds,
			keys: {
				get: async (type, ids) => {
					const data: { [_: string]: SignalDataTypeMap[typeof type] } = {}
					for (const id of ids) {
						const row = stmts.keySelect.get(type, id)
						if (row) {
							let value = JSON.parse(row.value, BufferJSON.reviver)
							if (type === 'app-state-sync-key' && value) {
								value = proto.Message.AppStateSyncKeyData.fromObject(value)
							}

							data[id] = value
						}
					}

					return data
				},
				set: async data => {
					const writeTx = db.transaction(() => {
						for (const category in data) {
							for (const id in data[category as keyof SignalDataTypeMap]) {
								const value = data[category as keyof SignalDataTypeMap]![id]
								if (value) {
									const stringified = JSON.stringify(value, BufferJSON.replacer)
									stmts.keyUpsert.run(category, id, stringified)
								} else {
									stmts.keyDelete.run(category, id)
								}
							}
						}
					})

					writeTx()
				}
			}
		},
		saveCreds: () => {
			persistCreds(creds)
		}
	}
}
