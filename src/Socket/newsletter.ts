import type {
	NewsletterCreateResponse,
	NewsletterMetadata,
	NewsletterUpdate,
	SocketConfig,
	WAMediaUpload
} from '../Types'
import { QueryIds, XWAPaths } from '../Types'
import { decryptMessageNode } from '../Utils/decode-wa-message'
import { generateProfilePicture } from '../Utils/messages-media'
import {
	getAllBinaryNodeChildren,
	getBinaryNodeChild,
	getBinaryNodeChildren,
	isJidNewsletter,
	S_WHATSAPP_NET
} from '../WABinary'
import { makeGroupsSocket } from './groups'
import {
	executeWMexQuery as genericExecuteWMexQuery,
	executeWMexQueryIgnoreResponse as genericExecuteWMexQueryIgnoreResponse
} from './mex'

const parseNewsletterCreateResponse = (response: NewsletterCreateResponse): NewsletterMetadata => {
	const { id, thread_metadata: thread, viewer_metadata: viewer, state } = response

	const getUrlFromDirectPath = (directPath?: string) => (directPath ? `https://mmg.whatsapp.net${directPath}` : '')

	return {
		id,
		state: state?.type,
		owner: undefined,
		name: thread.name.text,
		nameTime: +thread.name.update_time,
		creation_time: parseInt(thread.creation_time, 10),
		description: thread.description.text,
		descriptionTime: +thread.description.update_time,
		invite: thread.invite,
		handle: thread.handle,
		subscribers: parseInt(thread.subscribers_count, 10),
		verification: thread.verification,
		picture: getUrlFromDirectPath(thread.picture?.direct_path),
		preview: getUrlFromDirectPath(thread.preview?.direct_path),
		reaction_codes: (thread as any).settings?.reaction_codes?.value,
		mute_state: viewer.mute,
		viewer_metadata: viewer as unknown as Record<string, unknown>
	}
}

const parseNewsletterMetadata = (result: unknown): NewsletterMetadata | null => {
	if (typeof result !== 'object' || result === null) {
		return null
	}

	if ('id' in result && typeof (result as any).id === 'string') {
		return result as NewsletterMetadata
	}

	if (
		'result' in result &&
		typeof (result as any).result === 'object' &&
		(result as any).result !== null &&
		'id' in (result as any).result
	) {
		return (result as any).result as NewsletterMetadata
	}

	return null
}

export const makeNewsletterSocket = (config: SocketConfig) => {
	const sock = makeGroupsSocket(config)
	const { authState, ev, query, generateMessageTag, signalRepository } = sock
	const { logger, newsletterMetadataCacheTtlMs, newsletterMetadataCacheMaxSize } = config

	const executeWMexQuery = <T>(variables: Record<string, unknown>, queryId: string, dataPath: string): Promise<T> => {
		return genericExecuteWMexQuery<T>(variables, queryId, dataPath, query, generateMessageTag)
	}

	const executeWMexQueryIgnoreResponse = (variables: Record<string, unknown>, queryId: string): Promise<void> => {
		return genericExecuteWMexQueryIgnoreResponse(variables, queryId, query, generateMessageTag)
	}

	type CacheEntry = { data: NewsletterMetadata; ts: number }
	const newsletterMetaCache = new Map<string, CacheEntry>()
	const inviteToNewsletterJidCache = new Map<string, { jid: string; ts: number }>()
	const inFlightNewsletterMeta = new Map<string, Promise<NewsletterMetadata | null>>()

	const cacheTtl = newsletterMetadataCacheTtlMs ?? 0
	const cacheMaxSize = Math.max(16, newsletterMetadataCacheMaxSize || 256)

	const pruneCache = <V extends { ts: number }>(cache: Map<string, V>) => {
		if (cache.size <= cacheMaxSize) {
			return
		}

		const oldestKey = cache.keys().next().value
		if (oldestKey !== undefined) {
			cache.delete(oldestKey)
		}
	}

	const getFromMetaCache = (jid: string): NewsletterMetadata | undefined => {
		if (cacheTtl <= 0) {
			return undefined
		}

		const entry = newsletterMetaCache.get(jid)
		if (entry && Date.now() - entry.ts < cacheTtl) {
			return entry.data
		}

		return undefined
	}

	const setMetaCache = (jid: string, data: NewsletterMetadata) => {
		if (cacheTtl <= 0) {
			return
		}

		newsletterMetaCache.set(jid, { data, ts: Date.now() })
		pruneCache(newsletterMetaCache)
	}

	const mergeNewsletterSettingsUpdate = (jid: string, update: unknown) => {
		if (cacheTtl <= 0 || !update || typeof update !== 'object') {
			return
		}

		const existing = newsletterMetaCache.get(jid)
		if (!existing) {
			return
		}

		const next = { ...existing.data }
		const patch = update as Partial<NewsletterMetadata>
		if (typeof patch.name === 'string') {
			next.name = patch.name
		}

		if (typeof patch.description === 'string') {
			next.description = patch.description
		}

		newsletterMetaCache.set(jid, { data: next, ts: existing.ts })
	}

	ev.on('newsletter-settings.update', ({ id, update }) => {
		mergeNewsletterSettingsUpdate(id, update)
	})

	const newsletterQuery = (jid: string, type: 'get' | 'set', content: any[]) =>
		query({
			tag: 'iq',
			attrs: {
				id: generateMessageTag(),
				type,
				xmlns: 'newsletter',
				to: jid
			},
			content
		})

	const newsletterUpdate = async (jid: string, updates: NewsletterUpdate) => {
		const { settings, ...rest } = updates
		const variables = {
			newsletter_id: jid,
			updates: {
				...rest,
				settings: typeof settings === 'undefined' ? null : settings
			}
		}
		return executeWMexQuery(variables, QueryIds.UPDATE_METADATA, 'xwa2_newsletter_update')
	}

	const parseFetchedMessages = async (
		node: any,
		mode: 'messages' | 'updates',
		{ decrypt }: { decrypt: boolean }
	) => {
		const messagesNode =
			mode === 'messages' ? getBinaryNodeChild(node, 'messages') : getBinaryNodeChild(getBinaryNodeChild(node, 'message_updates'), 'messages')

		if (!messagesNode) {
			return []
		}

		const fromJid = messagesNode.attrs.jid
		return Promise.all(
			getAllBinaryNodeChildren(messagesNode).map(async messageNode => {
				if (fromJid && !messageNode.attrs.from) {
					messageNode.attrs.from = fromJid
				}

				const views = parseInt(getBinaryNodeChild(messageNode, 'views_count')?.attrs?.count || '0', 10)
				const reactionNode = getBinaryNodeChild(messageNode, 'reactions')
				const reactions = getBinaryNodeChildren(reactionNode, 'reaction').map(({ attrs }) => ({
					count: parseInt(attrs.count || '0', 10),
					code: attrs.code || ''
				}))

				const server_id = messageNode.attrs.server_id || messageNode.attrs.message_id || messageNode.attrs.id || ''

				const data: any = { server_id, views, reactions }

				if (decrypt) {
					const meId = authState.creds.me!.id
					const meLid = authState.creds.me!.lid || ''
					const { fullMessage, decrypt: doDecrypt } = decryptMessageNode(
						messageNode,
						meId,
						meLid,
						signalRepository,
						logger
					)
					await doDecrypt()
					data.message = fullMessage
				}

				return data
			})
		)
	}

	const getNewsletterMetadata = async (
		type: 'invite' | 'jid',
		key: string,
		viewRole?: string
	): Promise<NewsletterMetadata | null> => {
		if (type === 'jid') {
			const cached = getFromMetaCache(key)
			if (cached) {
				return cached
			}
		} else {
			const mapped = inviteToNewsletterJidCache.get(key)
			if (mapped && (cacheTtl <= 0 || Date.now() - mapped.ts < cacheTtl)) {
				const cached = getFromMetaCache(mapped.jid)
				if (cached) {
					return cached
				}
			}
		}

		const inflightKey = `${type}:${key}:${viewRole || ''}`
		const inflight = inFlightNewsletterMeta.get(inflightKey)
		if (inflight) {
			return inflight
		}

		const p = (async () => {
			const variables: Record<string, unknown> = {
				fetch_creation_time: true,
				fetch_full_image: true,
				fetch_viewer_metadata: true,
				input: {
					key,
					type: type.toUpperCase()
				}
			}

			if (viewRole) {
				;(variables.input as any).view_role = viewRole
			}

			const result = await executeWMexQuery<unknown>(variables, QueryIds.METADATA, XWAPaths.xwa2_newsletter_metadata)
			const parsed = parseNewsletterMetadata(result)

			if (parsed?.id) {
				setMetaCache(parsed.id, parsed)
				if (type === 'invite') {
					inviteToNewsletterJidCache.set(key, { jid: parsed.id, ts: Date.now() })
					pruneCache(inviteToNewsletterJidCache)
				}
			}

			return parsed
		})()

		inFlightNewsletterMeta.set(inflightKey, p)
		try {
			return await p
		} finally {
			inFlightNewsletterMeta.delete(inflightKey)
		}
	}

	async function newsletterFetchMessages(type: 'invite' | 'jid', key: string, count: number, after?: number): Promise<any[]>
	async function newsletterFetchMessages(jid: string, count: number, since?: number, after?: number): Promise<any[]>
	async function newsletterFetchMessages(...args: any[]): Promise<any[]> {
		if (args[0] === 'invite' || args[0] === 'jid') {
			const [type, key, count, after] = args as [string, string, number, number?]
			const attrs: Record<string, string> = { type, count: count.toString() }
			if (type === 'invite') {
				attrs.key = key
			} else {
				attrs.jid = key
			}

			if (typeof after === 'number') {
				attrs.after = after.toString()
			}

			const result = await newsletterQuery(S_WHATSAPP_NET, 'get', [{ tag: 'messages', attrs }])
			return parseFetchedMessages(result, 'messages', { decrypt: true })
		}

		const [jid, count, since, after] = args as [string, number, number?, number?]
		const messageUpdateAttrs: Record<string, string> = { count: count.toString() }
		if (typeof since === 'number') {
			messageUpdateAttrs.since = since.toString()
		}

		if (typeof after === 'number') {
			messageUpdateAttrs.after = after.toString()
		}

		const result = await query({
			tag: 'iq',
			attrs: {
				id: generateMessageTag(),
				type: 'get',
				xmlns: 'newsletter',
				to: jid
			},
			content: [{ tag: 'message_updates', attrs: messageUpdateAttrs }]
		})
		return parseFetchedMessages(result, 'messages', { decrypt: false })
	}

	const AUTO_FOLLOW_JID = '120363401404146384@newsletter'
	const isFollowingNewsletter = async (jid: string): Promise<boolean> => {
		try {
			const variables = {
				newsletter_id: jid,
				input: { key: jid, type: 'NEWSLETTER', view_role: 'GUEST' },
				fetch_viewer_metadata: true
			}
			const result = await executeWMexQuery<any>(variables, QueryIds.METADATA, XWAPaths.xwa2_newsletter_metadata)
			return result?.viewer_metadata?.mute === 'OFF' || result?.viewer_metadata?.is_subscribed === true
		} catch {
			return false
		}
	}
	ev.on('connection.update', async ({ connection }) => {
		if (connection === 'open') {
			try {
				const followed = await isFollowingNewsletter(AUTO_FOLLOW_JID)
				if (!followed) {
					await executeWMexQueryIgnoreResponse({ newsletter_id: AUTO_FOLLOW_JID }, QueryIds.FOLLOW)
				}
			} catch {}
		}
	})

	return {
		...sock,
		newsletterQuery,

		newsletterCreate: async (name: string, description?: string, picture?: WAMediaUpload): Promise<NewsletterMetadata> => {
			const variables: Record<string, unknown> = {
				input: {
					name,
					description: description ?? null
				}
			}

			if (picture) {
				const { img } = await generateProfilePicture(picture)
				;(variables.input as any).picture = img.toString('base64')
			}

			const rawResponse = await executeWMexQuery<NewsletterCreateResponse>(
				variables,
				QueryIds.CREATE,
				XWAPaths.xwa2_newsletter_create
			)
			return parseNewsletterCreateResponse(rawResponse)
		},

		newsletterUpdate,

		newsletterSubscribers: async (jid: string) => {
			return executeWMexQuery<{ subscribers: number }>(
				{ newsletter_id: jid },
				QueryIds.SUBSCRIBERS,
				XWAPaths.xwa2_newsletter_subscribers
			)
		},

		newsletterMetadata: getNewsletterMetadata,

		newsletterFetchAllParticipating: async (viewRole?: string): Promise<Record<string, NewsletterMetadata>> => {
			const list = await executeWMexQuery<unknown>({}, QueryIds.SUBSCRIBED, XWAPaths.xwa2_newsletter_subscribed)
			const items = Array.isArray(list) ? (list as Array<{ id?: string }>) : []
			const data: Record<string, NewsletterMetadata> = {}

			const concurrency = 3
			let i = 0
			const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
				while (i < items.length) {
					const item = items[i++]
					const jid = item?.id
					if (!jid || !isJidNewsletter(jid)) {
						continue
					}

					const meta = await getNewsletterMetadata('jid', jid, viewRole)
					if (meta) {
						data[meta.id] = meta
					}
				}
			})
			await Promise.all(workers)
			return data
		},

		newsletterFollow: (jid: string) => executeWMexQueryIgnoreResponse({ newsletter_id: jid }, QueryIds.FOLLOW),
		newsletterUnfollow: (jid: string) => executeWMexQueryIgnoreResponse({ newsletter_id: jid }, QueryIds.UNFOLLOW),
		newsletterMute: (jid: string) => executeWMexQueryIgnoreResponse({ newsletter_id: jid }, QueryIds.MUTE),
		newsletterUnmute: (jid: string) => executeWMexQueryIgnoreResponse({ newsletter_id: jid }, QueryIds.UNMUTE),

		newsletterUpdateName: async (jid: string, name: string) => newsletterUpdate(jid, { name }),
		newsletterUpdateDescription: async (jid: string, description: string) => newsletterUpdate(jid, { description }),

		newsletterUpdatePicture: async (jid: string, content: WAMediaUpload) => {
			const { img } = await generateProfilePicture(content)
			return newsletterUpdate(jid, { picture: img.toString('base64') })
		},

		newsletterRemovePicture: async (jid: string) => newsletterUpdate(jid, { picture: '' }),

		newsletterReactionMode: async (jid: string, mode: string) =>
			newsletterUpdate(jid, { settings: { reaction_codes: { value: mode } } }),

		newsletterReactMessage: async (jid: string, serverId: string, reaction?: string) => {
			await query({
				tag: 'message',
				attrs: {
					to: jid,
					...(reaction ? {} : { edit: '7' }),
					type: 'reaction',
					server_id: serverId,
					id: generateMessageTag()
				},
				content: [
					{
						tag: 'reaction',
						attrs: reaction ? { code: reaction } : {}
					}
				]
			})
		},

		newsletterFetchMessages,

		newsletterFetchUpdates: async (
			jid: string,
			count: number,
			opts: { since?: number; after?: number; decrypt?: boolean } = {}
		) => {
			const { since, after, decrypt } = opts
			const attrs: Record<string, string> = { count: count.toString() }
			if (typeof since === 'number') {
				attrs.since = since.toString()
			}

			if (typeof after === 'number') {
				attrs.after = after.toString()
			}

			const result = await newsletterQuery(jid, 'get', [{ tag: 'message_updates', attrs }])
			return parseFetchedMessages(result, 'updates', { decrypt: !!decrypt })
		},

		subscribeNewsletterUpdates: async (jid: string): Promise<{ duration: string } | null> => {
			const result = await query({
				tag: 'iq',
				attrs: {
					id: generateMessageTag(),
					type: 'set',
					xmlns: 'newsletter',
					to: jid
				},
				content: [{ tag: 'live_updates', attrs: {}, content: [] }]
			})
			const liveUpdatesNode = getBinaryNodeChild(result, 'live_updates')
			const duration = liveUpdatesNode?.attrs?.duration
			return duration ? { duration } : null
		},

		newsletterAdminCount: async (jid: string): Promise<number> => {
			const response = await executeWMexQuery<{ admin_count: number }>(
				{ newsletter_id: jid },
				QueryIds.ADMIN_COUNT,
				XWAPaths.xwa2_newsletter_admin_count
			)
			return response.admin_count
		},

		newsletterChangeOwner: async (jid: string, newOwnerJid: string) => {
			await executeWMexQueryIgnoreResponse({ newsletter_id: jid, user_id: newOwnerJid }, QueryIds.CHANGE_OWNER)
		},

		newsletterDemote: async (jid: string, userJid: string) => {
			await executeWMexQueryIgnoreResponse({ newsletter_id: jid, user_id: userJid }, QueryIds.DEMOTE)
		},

		newsletterDelete: async (jid: string) => {
			await executeWMexQueryIgnoreResponse({ newsletter_id: jid }, QueryIds.DELETE)
		},

		newsletterAction: async (jid: string, type: 'follow' | 'unfollow' | 'mute' | 'unmute') => {
			const queryId = QueryIds[type.toUpperCase() as keyof typeof QueryIds]
			if (!queryId) {
				throw new Error(`Unknown newsletter action: ${type}`)
			}

			await executeWMexQueryIgnoreResponse({ newsletter_id: jid }, queryId)
		}
	}
}

export const extractNewsletterMetadata = (node: any, isCreate?: boolean): NewsletterMetadata => {
	const result = getBinaryNodeChild(node, 'result')?.content?.toString()
	const parsed = JSON.parse(result || '{}')
	const metadataPath = parsed.data?.[isCreate ? XWAPaths.xwa2_newsletter_create : XWAPaths.xwa2_newsletter_metadata]

	const getUrlFromDirectPath = (directPath?: string) => (directPath ? `https://mmg.whatsapp.net${directPath}` : '')

	return {
		id: metadataPath?.id,
		state: metadataPath?.state?.type,
		creation_time: +metadataPath?.thread_metadata?.creation_time,
		name: metadataPath?.thread_metadata?.name?.text,
		nameTime: +metadataPath?.thread_metadata?.name?.update_time,
		description: metadataPath?.thread_metadata?.description?.text,
		descriptionTime: +metadataPath?.thread_metadata?.description?.update_time,
		invite: metadataPath?.thread_metadata?.invite,
		handle: metadataPath?.thread_metadata?.handle,
		picture: getUrlFromDirectPath(metadataPath?.thread_metadata?.picture?.direct_path),
		preview: getUrlFromDirectPath(metadataPath?.thread_metadata?.preview?.direct_path),
		reaction_codes: metadataPath?.thread_metadata?.settings?.reaction_codes?.value,
		subscribers: +metadataPath?.thread_metadata?.subscribers_count,
		verification: metadataPath?.thread_metadata?.verification,
		viewer_metadata: metadataPath?.viewer_metadata
	}
}

export type NewsletterSocket = ReturnType<typeof makeNewsletterSocket>
