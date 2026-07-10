import KeyedDBImport from '@adiwajshing/keyed-db'
import { existsSync, readFileSync, writeFileSync } from 'fs'
import { proto } from '../../WAProto/index.js'
import { DEFAULT_CONNECTION_CONFIG } from '../Defaults/index.js'
import type { Chat, ChatUpdate, PresenceData } from '../Types/Chat'
import type { Contact } from '../Types/Contact'
import type { BaileysEventEmitter } from '../Types/Events'
import type { GroupMetadata } from '../Types/GroupMetadata'
import type { Label } from '../Types/Label'
import { LabelAssociationType, type LabelAssociation } from '../Types/LabelAssociation'
import type { MessageUserReceiptUpdate, WAMessage, WAMessageKey } from '../Types/Message'
import { md5, toNumber, updateMessageWithReaction, updateMessageWithReceipt } from '../Utils/index.js'
import type { ILogger } from '../Utils/logger'
import { jidDecode, jidNormalizedUser } from '../WABinary/index.js'
import { makeOrderedDictionary, type OrderedDictionary } from './make-ordered-dictionary.js'
import { ObjectRepository } from './object-repository.js'

type Comparable<T, K> = {
	key: (v: T) => K
	compare: (a: K, b: K) => number
}

type KeyedDBType<T, K> = {
	length: number
	first: T
	last: T
	toJSON(): T[]
	insert(...values: T[]): void
	upsert(...values: T[]): T[]
	insertIfAbsent(...values: T[]): T[]
	deleteById(id: string, assertPresent?: boolean): T
	delete(value: T): T
	slice(start?: number, end?: number): KeyedDBType<T, K>
	clear(): void
	get(id: string): T
	all(): T[]
	update(id: string, update: (value: T) => void): 1 | 2
	filter(predicate: (value: T, index: number) => boolean): KeyedDBType<T, K>
	paginatedByValue(
		value: T | null,
		limit: number,
		predicate?: (value: T, index: number) => boolean,
		mode?: 'before' | 'after'
	): T[]
	paginated(cursor: K | null, limit: number, predicate?: (value: T, index: number) => boolean, mode?: 'before' | 'after'): T[]
}

type KeyedDBConstructor = new <T, K>(key: Comparable<T, K>, id?: (v: T) => string) => KeyedDBType<T, K>

const KeyedDB = ((KeyedDBImport as unknown as { default?: KeyedDBConstructor })?.default ??
	(KeyedDBImport as unknown as KeyedDBConstructor)) as KeyedDBConstructor

export type MinimalStoreSocket = {
	profilePictureUrl: (jid: string, type?: 'preview' | 'image', timeoutMs?: number) => Promise<string | undefined>
	groupMetadata: (jid: string) => Promise<GroupMetadata>
}

export const waChatKey = (pin: boolean): Comparable<Chat, string> => ({
	key: c =>
		(pin ? (c.pinned ? '1' : '0') : '') +
		(c.archived ? '0' : '1') +
		(c.conversationTimestamp ? c.conversationTimestamp.toString(16).padStart(8, '0') : '') +
		c.id,
	compare: (k1, k2) => k2.localeCompare(k1)
})

export const waMessageID = (m: WAMessage): string => m.key.id || ''

export const waLabelAssociationKey: Comparable<LabelAssociation, string> = {
	key: la => (la.type === LabelAssociationType.Chat ? la.chatId + la.labelId : la.chatId + la.messageId + la.labelId),
	compare: (k1, k2) => k2.localeCompare(k1)
}

const makeMessagesDictionary = () => makeOrderedDictionary(waMessageID)

export type InMemoryStoreConfig = {
	chatKey?: Comparable<Chat, string>
	labelAssociationKey?: Comparable<LabelAssociation, string>
	logger?: ILogger
	socket?: MinimalStoreSocket
}

export const makeInMemoryStore = (config: InMemoryStoreConfig = {}) => {
	const socket = config.socket
	const chatKey = config.chatKey || waChatKey(true)
	const labelAssociationKey = config.labelAssociationKey || waLabelAssociationKey
	const logger = config.logger || DEFAULT_CONNECTION_CONFIG.logger.child({ stream: 'in-mem-store' })

	const chats = new KeyedDB<Chat, string>(chatKey, c => c.id!)
	const messages: { [jid: string]: OrderedDictionary<WAMessage> } = {}
	const contacts: { [jid: string]: Contact } = {}
	const groupMetadata: { [jid: string]: GroupMetadata } = {}
	const presences: { [jid: string]: { [participant: string]: PresenceData } } = {}
	const state = { connection: 'close' as string }
	const labels = new ObjectRepository<Label>()
	const labelAssociations = new KeyedDB<LabelAssociation, string>(labelAssociationKey, labelAssociationKey.key)

	const assertMessageList = (jid: string) => {
		if (!messages[jid]) {
			messages[jid] = makeMessagesDictionary()
		}

		return messages[jid]
	}

	const contactsUpsert = (newContacts: Contact[]) => {
		const oldContacts = new Set(Object.keys(contacts))
		for (const contact of newContacts) {
			oldContacts.delete(contact.id)
			contacts[contact.id] = Object.assign(contacts[contact.id] || {}, contact)
		}

		return oldContacts
	}

	const labelsUpsert = (newLabels: Label[]) => {
		for (const label of newLabels) {
			labels.upsertById(label.id, label)
		}
	}

	/**
	 * binds to a BaileysEventEmitter.
	 * It listens to all events and constructs a state that you can query accurate data from.
	 * Eg. can use the store to fetch chats, contacts, messages etc.
	 * @param ev typically the event emitter from the socket connection
	 */
	const bind = (ev: BaileysEventEmitter) => {
		ev.on('connection.update', update => {
			Object.assign(state, update)
		})

		ev.on('messaging-history.set', ({ chats: newChats, contacts: newContacts, messages: newMessages, isLatest, syncType }) => {
			if (syncType === proto.HistorySync.HistorySyncType.ON_DEMAND) {
				return
			}

			if (isLatest) {
				chats.clear()
				for (const id in messages) {
					delete messages[id]
				}
			}

			const chatsAdded = chats.insertIfAbsent(...newChats).length
			logger.debug({ chatsAdded }, 'synced chats')

			const oldContacts = contactsUpsert(newContacts)
			if (isLatest) {
				for (const jid of oldContacts) {
					delete contacts[jid]
				}
			}

			logger.debug({ deletedContacts: isLatest ? oldContacts.size : 0, newContacts }, 'synced contacts')

			for (const msg of newMessages) {
				const jid = msg.key.remoteJidAlt || msg.key.remoteJid
				if (!jid) {
					continue
				}

				const list = assertMessageList(jid)
				list.upsert(msg, 'prepend')
			}

			logger.debug({ messages: newMessages.length }, 'synced messages')
		})

		ev.on('contacts.upsert', newContacts => {
			contactsUpsert(newContacts)
		})

		ev.on('contacts.update', async updates => {
			for (const update of updates) {
				let contact: Contact | undefined
				if (update.id && contacts[update.id]) {
					contact = contacts[update.id]
				} else {
					const contactHashes = await Promise.all(
						Object.keys(contacts).map(async contactId => {
							const decoded = jidDecode(contactId)
							const user = decoded?.user || ''
							return [
								contactId,
								Buffer.from(await md5(Buffer.from(user + 'WA_ADD_NOTIF', 'utf8')))
									.toString('base64')
									.slice(0, 3)
							] as const
						})
					)

					const matched = contactHashes.find(([, b]) => b === update.id)?.[0]
					contact = matched ? contacts[matched] : undefined
				}

				if (contact) {
					if (update.imgUrl === 'changed') {
						contact.imgUrl = socket ? await socket.profilePictureUrl(contact.id) : undefined
					} else if (update.imgUrl === 'removed') {
						delete contact.imgUrl
					}
				} else {
					logger.debug({ update }, 'got update for non-existant contact')
					continue
				}

				Object.assign(contacts[contact.id]!, contact)
			}
		})

		ev.on('chats.upsert', newChats => {
			chats.upsert(...newChats)
		})

		ev.on('chats.update', updates => {
			for (let update of updates) {
				if (!update.id) {
					continue
				}

				const result = chats.update(update.id, chat => {
					const incomingUnreadCount = update.unreadCount
					if (incomingUnreadCount && incomingUnreadCount > 0) {
						update = { ...update, unreadCount: (chat.unreadCount || 0) + incomingUnreadCount }
					}

					Object.assign(chat, update)
				})

				if (!result) {
					logger.debug({ update }, 'got update for non-existant chat')
				}
			}
		})

		ev.on('labels.edit', label => {
			if (label.deleted) {
				return labels.deleteById(label.id)
			}

			// WhatsApp can store only up to 20 labels
			if (labels.count() < 20) {
				return labels.upsertById(label.id, label)
			}

			logger.error('Labels count exceed')
		})

		ev.on('labels.association', ({ type, association }) => {
			switch (type) {
				case 'add':
					labelAssociations.upsert(association)
					break
				case 'remove':
					labelAssociations.delete(association)
					break
				default:
					console.error(`unknown operation type [${type}]`)
			}
		})

		ev.on('presence.update', ({ id, presences: update }) => {
			presences[id] = presences[id] || {}
			Object.assign(presences[id], update)
		})

		ev.on('chats.delete', deletions => {
			for (const item of deletions) {
				if (chats.get(item)) {
					chats.deleteById(item)
				}
			}
		})

		ev.on('messages.upsert', ({ messages: newMessages, type }) => {
			switch (type) {
				case 'append':
				case 'notify':
					for (const msg of newMessages) {
						const rawJid = msg.key.remoteJidAlt || msg.key.remoteJid
						if (!rawJid) {
							continue
						}

						const jid = jidNormalizedUser(rawJid)
						const list = assertMessageList(jid)
						list.upsert(msg, 'append')

						if (type === 'notify' && !chats.get(jid)) {
							ev.emit('chats.upsert', [
								{
									id: jid,
									conversationTimestamp: toNumber(msg.messageTimestamp),
									unreadCount: 1
								}
							])
						}
					}

					break
			}
		})

		ev.on('messages.update', updates => {
			for (const { update, key } of updates) {
				if (!key.remoteJid) {
					continue
				}

				const list = assertMessageList(jidNormalizedUser(key.remoteJid))
				if (update?.status !== undefined && key.id) {
					const listStatus = list.get(key.id)?.status
					if (listStatus && update.status && update.status <= listStatus) {
						logger.debug({ update, storedStatus: listStatus }, 'status stored newer then update')
						delete update.status
						logger.debug({ update }, 'new update object')
					}
				}

				const result = key.id ? list.updateAssign(key.id, update) : false
				if (!result) {
					logger.debug({ update }, 'got update for non-existent message')
				}
			}
		})

		ev.on('messages.delete', item => {
			if ('all' in item) {
				const list = messages[item.jid]
				list?.clear()
			} else {
				const firstKey = item.keys[0]
				const jid = firstKey?.remoteJidAlt || firstKey?.remoteJid
				const list = jid ? messages[jid] : undefined
				if (list) {
					const idSet = new Set(item.keys.map(k => k.id))
					list.filter(m => !idSet.has(m.key.id))
				}
			}
		})

		ev.on('groups.update', updates => {
			for (const update of updates) {
				const id = update.id
				if (!id) {
					continue
				}

				if (groupMetadata[id]) {
					Object.assign(groupMetadata[id], update)
				} else {
					logger.debug({ update }, 'got update for non-existant group metadata')
				}
			}
		})

		ev.on('group-participants.update', ({ id, participants, action }) => {
			const metadata = groupMetadata[id]
			if (metadata) {
				switch (action) {
					case 'add':
						metadata.participants.push(
							...participants.map(participant => ({
								id: participant.id,
								phoneNumber: participant.phoneNumber,
								admin: participant.admin
							}))
						)
						break
					case 'demote':
					case 'promote':
						for (const participant of metadata.participants) {
							for (const participantData of participants) {
								if (participantData.id === participant.id || participantData.phoneNumber === participant.phoneNumber) {
									participant.admin = action === 'promote' ? 'admin' : null
								}
							}
						}

						break
					case 'remove': {
						const removeSet = new Set<string>()
						for (const p of participants) {
							if (p.id) {
								removeSet.add(p.id)
							}

							if (p.phoneNumber) {
								removeSet.add(p.phoneNumber)
							}
						}

						metadata.participants = metadata.participants.reduce<typeof metadata.participants>((acc, p) => {
							if (!removeSet.has(p.id) && !(p.phoneNumber && removeSet.has(p.phoneNumber))) {
								acc.push(p)
							}

							return acc
						}, [])
						break
					}
				}
			}
		})

		ev.on('message-receipt.update', updates => {
			for (const { key, receipt } of updates) {
				const jid = key.remoteJidAlt || key.remoteJid
				const obj = jid ? messages[jid] : undefined
				const msg = key.id ? obj?.get(key.id) : undefined
				if (msg) {
					updateMessageWithReceipt(msg, receipt)
				}
			}
		})

		ev.on('messages.reaction', reactions => {
			for (const { key, reaction } of reactions) {
				const jid = key.remoteJidAlt || key.remoteJid
				const obj = jid ? messages[jid] : undefined
				const msg = key.id ? obj?.get(key.id) : undefined
				if (msg) {
					updateMessageWithReaction(msg, reaction)
				}
			}
		})
	}

	const toJSON = () => ({
		chats,
		contacts,
		messages,
		labels,
		labelAssociations
	})

	const fromJSON = (json: {
		chats: Chat[]
		contacts: { [jid: string]: Contact }
		messages: { [jid: string]: WAMessage[] }
		labels?: { [id: string]: Label }
		labelAssociations?: LabelAssociation[]
	}) => {
		chats.upsert(...json.chats)
		labelAssociations.upsert(...(json.labelAssociations || []))
		contactsUpsert(Object.values(json.contacts))
		labelsUpsert(Object.values(json.labels || {}))

		for (const jid in json.messages) {
			const list = assertMessageList(jid)
			for (const msg of json.messages[jid]!) {
				list.upsert(proto.WebMessageInfo.fromObject(msg) as WAMessage, 'append')
			}
		}
	}

	return {
		chats,
		contacts,
		messages,
		groupMetadata,
		state,
		presences,
		labels,
		labelAssociations,
		bind,
		/** loads messages from the store, if not found -- uses the legacy connection */
		loadMessages: async (jid: string, count: number, cursor: { before: WAMessageKey | undefined } | { after: WAMessageKey | undefined } | undefined) => {
			const list = assertMessageList(jid)
			const mode = !cursor || 'before' in cursor ? 'before' : 'after'
			const cursorKey = cursor ? ('before' in cursor ? cursor.before : cursor.after) : undefined
			const cursorValue = cursorKey?.id ? list.get(cursorKey.id) : undefined

			let messages: WAMessage[]
			if (list && mode === 'before' && (!cursorKey || cursorValue)) {
				if (cursorValue) {
					const msgIdx = list.array.findIndex(m => m.key.id === cursorKey?.id)
					messages = list.array.slice(0, msgIdx)
				} else {
					messages = list.array
				}

				const diff = count - messages.length
				if (diff < 0) {
					messages = messages.slice(-count) // get the last X messages
				}
			} else {
				messages = []
			}

			return messages
		},
		/**
		 * Get all available labels for profile
		 *
		 * Keep in mind that the list is formed from predefined tags and tags
		 * that were "caught" during their editing.
		 */
		getLabels: () => {
			return labels
		},
		/**
		 * Get labels for chat
		 *
		 * @returns Label IDs
		 **/
		getChatLabels: (chatId: string) => {
			return labelAssociations.filter(la => la.chatId === chatId).all()
		},
		/**
		 * Get labels for message
		 *
		 * @returns Label IDs
		 **/
		getMessageLabels: (messageId: string) => {
			const associations = labelAssociations
				.filter(la => la.type === LabelAssociationType.Message && la.messageId === messageId)
				.all()

			return associations.map(({ labelId }) => labelId)
		},
		loadMessage: async (jid: string, id: string) => messages[jid]?.get(id),
		mostRecentMessage: async (jid: string) => {
			const message = messages[jid]?.array.slice(-1)[0]
			return message
		},
		fetchImageUrl: async (jid: string, sock?: MinimalStoreSocket) => {
			const contact = contacts[jid]
			if (!contact) {
				return sock?.profilePictureUrl(jid)
			}

			if (typeof contact.imgUrl === 'undefined') {
				contact.imgUrl = await sock?.profilePictureUrl(jid)
			}

			return contact.imgUrl
		},
		fetchGroupMetadata: async (jid: string, sock?: MinimalStoreSocket) => {
			if (!groupMetadata[jid]) {
				const metadata = await sock?.groupMetadata(jid)
				if (metadata) {
					groupMetadata[jid] = metadata
				}
			}

			return groupMetadata[jid]
		},
		fetchMessageReceipts: async ({ remoteJid, id }: { remoteJid: string; id: string }) => {
			const list = messages[remoteJid]
			const msg = list?.get(id)
			return msg?.userReceipt
		},
		toJSON,
		fromJSON,
		writeToFile: (path: string) => {
			writeFileSync(path, JSON.stringify(toJSON()))
		},
		readFromFile: (path: string) => {
			if (existsSync(path)) {
				logger.debug({ path }, 'reading from file')
				const jsonStr = readFileSync(path, { encoding: 'utf-8' })
				const json = JSON.parse(jsonStr)
				fromJSON(json)
			}
		}
	}
}

export type InMemoryStore = ReturnType<typeof makeInMemoryStore>
