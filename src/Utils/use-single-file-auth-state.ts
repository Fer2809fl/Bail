import { Mutex } from 'async-mutex'
import { readFile, rename, stat, writeFile } from 'fs/promises'
import { LRUCache } from 'lru-cache'
import { proto } from '../../WAProto/index.js'
import type { AuthenticationCreds, AuthenticationState, SignalDataTypeMap } from '../Types'
import { DEFAULT_CACHE_TTLS } from '../Defaults/index.js'
import { initAuthCreds } from './auth-utils.js'
import { BufferJSON } from './generics.js'

const FLUSH_TIMEOUT_MS = 3000

export const useSingleFileAuthState = async (
	fileName: string
): Promise<{ state: AuthenticationState; saveCreds: () => void }> => {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const cache = new LRUCache<string, any>({
		max: 20000,
		ttl: 1000 * DEFAULT_CACHE_TTLS.SIGNAL_STORE,
		updateAgeOnGet: false,
		updateAgeOnHas: false,
		ttlAutopurge: true
	})

	const mutex = new Mutex()

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let fileData: { [_: string]: any } = {}
	let isLoaded = false
	let flushTimeout: NodeJS.Timeout | null = null

	const loadKey = async () => {
		return await mutex.runExclusive(async () => {
			if (isLoaded) {
				return
			}

			try {
				const data = JSON.parse(await readFile(fileName, 'utf-8'), BufferJSON.reviver)
				fileData = data || {}
				for (const [keyName, value] of Object.entries(fileData)) {
					cache.set(keyName, value)
				}
			} catch {
				fileData = {}
			}

			isLoaded = true
		})
	}

	const flushKey = () => {
		if (flushTimeout) {
			return
		}

		flushTimeout = setTimeout(async () => {
			flushTimeout = null
			await mutex.runExclusive(async () => {
				try {
					const tempFile = fileName + '.temp'
					await writeFile(tempFile, JSON.stringify(fileData, BufferJSON.replacer))
					await rename(tempFile, fileName)
				} catch {}
			})
		}, FLUSH_TIMEOUT_MS)
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const writeKey = (keyName: string, value: any) => {
		cache.set(keyName, value)
		fileData[keyName] = value
		flushKey()
	}

	const removeKey = (keyName: string) => {
		cache.delete(keyName)
		delete fileData[keyName]
		flushKey()
	}

	const fileInfo = await stat(fileName).catch(() => null)
	if (!fileInfo) {
		await writeFile(fileName, '{}')
	} else if (!fileInfo.isFile()) {
		throw new Error(`found something that is not a file at ${fileName}, either delete it or specify a different location`)
	}

	await loadKey()

	const creds: AuthenticationCreds = fileData['creds'] || initAuthCreds()

	return {
		state: {
			creds,
			keys: {
				get: async (type, ids) => {
					const data: { [_: string]: SignalDataTypeMap[typeof type] } = {}
					for (const id of ids) {
						const keyName = type + id
						let value = cache.get(keyName)
						if (value === undefined && fileData[keyName] !== undefined) {
							value = fileData[keyName]
							cache.set(keyName, value)
						}

						if (type === 'app-state-sync-key' && value) {
							value = proto.Message.AppStateSyncKeyData.fromObject(value)
						}

						data[id] = value
					}

					return data
				},
				set: async data => {
					for (const category in data) {
						for (const id in data[category as keyof SignalDataTypeMap]) {
							const keyName = category + id
							const value = data[category as keyof SignalDataTypeMap]![id]
							value ? writeKey(keyName, value) : removeKey(keyName)
						}
					}
				}
			}
		},
		saveCreds: () => writeKey('creds', creds)
	}
}
