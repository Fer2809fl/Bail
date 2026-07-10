import { Boom } from '@hapi/boom'
import { proto } from '../../WAProto/index.js'
import type { GroupMetadata, GroupParticipant, ParticipantAction, SocketConfig, WAMessageKey } from '../Types'
import { WAMessageAddressingMode, WAMessageStubType } from '../Types'
import { generateMessageIDV2, unixTimestampSeconds } from '../Utils'
import type { LIDMappingStore } from '../Signal/lid-mapping'
import {
	type BinaryNode,
	getBinaryNodeChild,
	getBinaryNodeChildren,
	getBinaryNodeChildString,
	isLidUser,
	isPnUser,
	jidEncode,
	jidNormalizedUser
} from '../WABinary'
import { makeChatsSocket } from './chats'

type GroupMetadataCacheEntry = { data: GroupMetadata; ts: number }

const resolveParticipantsLID = async (metadataList: GroupMetadata[], lidMapping: LIDMappingStore) => {
	const unresolvedLids = new Set<string>()
	for (const meta of metadataList) {
		for (const p of meta.participants) {
			if (!p.phoneNumber && isLidUser(p.id)) {
				unresolvedLids.add(p.id)
			}
		}
	}

	if (unresolvedLids.size === 0) {
		return
	}

	const resolved = await lidMapping.getPNsForLIDs([...unresolvedLids])
	if (!resolved?.length) {
		return
	}

	const lidToPn = new Map(resolved.map(({ lid, pn }) => [lid, pn]))
	for (const meta of metadataList) {
		meta.participants = meta.participants.map(p => {
			const pn = lidToPn.get(p.id)
			if (!pn) {
				return p
			}

			return { ...p, id: pn, phoneNumber: pn, lid: p.id }
		})
	}
}

export const makeGroupsSocket = (config: SocketConfig) => {
	const sock = makeChatsSocket(config)
	const { authState, ev, query, upsertMessage, signalRepository } = sock
	const { cachedGroupMetadata, groupCacheTTL } = config

	const groupMetadataCache = new Map<string, GroupMetadataCacheEntry>()
	const cacheTTL = groupCacheTTL > 0 ? groupCacheTTL : 5 * 60 * 1000

	const getCachedGroupMetadata = async (jid: string): Promise<GroupMetadata | undefined> => {
		if (cachedGroupMetadata) {
			const cached = await cachedGroupMetadata(jid)
			if (cached && Array.isArray(cached.participants)) {
				return cached
			}
		}

		const entry = groupMetadataCache.get(jid)
		if (entry && Date.now() - entry.ts < cacheTTL) {
			return entry.data
		}

		return undefined
	}

	const setCachedGroupMetadata = (jid: string, data: GroupMetadata) => {
		groupMetadataCache.set(jid, { data, ts: Date.now() })
	}

	ev.on('groups.update', updates => {
		for (const update of updates) {
			if (!update.id) {
				continue
			}

			const entry = groupMetadataCache.get(update.id)
			if (entry) {
				groupMetadataCache.set(update.id, { data: { ...entry.data, ...update } as GroupMetadata, ts: entry.ts })
			}
		}
	})

	const refreshDebounce = new Set<string>()
	const refreshGroupMetadata = async (jid: string) => {
		if (refreshDebounce.has(jid)) {
			return
		}

		refreshDebounce.add(jid)
		setTimeout(() => refreshDebounce.delete(jid), 2000)

		try {
			const result = await groupQuery(jid, 'get', [{ tag: 'query', attrs: { request: 'interactive' } }])
			const meta = extractGroupMetadata(result)
			setCachedGroupMetadata(jid, meta)
			ev.emit('groups.update', [meta])
		} catch {}
	}

	ev.on('group-participants.update', ({ id, participants, action }) => {
		const entry = groupMetadataCache.get(id)
		if (entry && Array.isArray(entry.data.participants)) {
			const meta: GroupMetadata = { ...entry.data, participants: [...entry.data.participants] }
			const jids = participants.map(p => p.id)

			if (action === 'add') {
				const existing = new Set(meta.participants.map(p => p.id))
				for (const p of participants) {
					if (!existing.has(p.id)) {
						meta.participants.push(p)
					}
				}
			} else if (action === 'remove') {
				meta.participants = meta.participants.filter(p => !jids.includes(p.id))
			} else if (action === 'promote') {
				meta.participants = meta.participants.map(p => (jids.includes(p.id) ? { ...p, admin: 'admin' } : p))
			} else if (action === 'demote') {
				meta.participants = meta.participants.map(p => (jids.includes(p.id) ? { ...p, admin: null } : p))
			}

			groupMetadataCache.set(id, { data: meta, ts: entry.ts })
		}

		void refreshGroupMetadata(id)
	})

	const groupQuery = async (jid: string, type: 'get' | 'set', content: BinaryNode[]) =>
		query({
			tag: 'iq',
			attrs: {
				type,
				xmlns: 'w:g2',
				to: jid
			},
			content
		})

	const groupMetadata = async (jid: string) => {
		const cached = await getCachedGroupMetadata(jid)
		if (cached) {
			return cached
		}

		const result = await groupQuery(jid, 'get', [{ tag: 'query', attrs: { request: 'interactive' } }])
		const meta = extractGroupMetadata(result)
		await resolveParticipantsLID([meta], signalRepository.lidMapping)
		setCachedGroupMetadata(jid, meta)
		return meta
	}

	const groupFetchAllParticipating = async () => {
		const result = await query({
			tag: 'iq',
			attrs: {
				to: '@g.us',
				xmlns: 'w:g2',
				type: 'get'
			},
			content: [
				{
					tag: 'participating',
					attrs: {},
					content: [
						{ tag: 'participants', attrs: {} },
						{ tag: 'description', attrs: {} }
					]
				}
			]
		})
		const data: { [_: string]: GroupMetadata } = {}
		const groupsChild = getBinaryNodeChild(result, 'groups')
		if (groupsChild) {
			const groups = getBinaryNodeChildren(groupsChild, 'group')
			for (const groupNode of groups) {
				const meta = extractGroupMetadata({
					tag: 'result',
					attrs: {},
					content: [groupNode]
				})
				data[meta.id] = meta
			}
		}

		await resolveParticipantsLID(Object.values(data), signalRepository.lidMapping)

		for (const meta of Object.values(data)) {
			setCachedGroupMetadata(meta.id, meta)
		}

		sock.ev.emit('groups.update', Object.values(data))

		return data
	}

	sock.ws.on('CB:ib,,dirty', async (node: BinaryNode) => {
		const { attrs } = getBinaryNodeChild(node, 'dirty')!
		if (attrs.type !== 'groups') {
			return
		}

		await groupFetchAllParticipating()
		await sock.cleanDirtyBits('groups')
	})

	return {
		...sock,
		groupMetadata,
		groupCreate: async (subject: string, participants: string[]) => {
			const key = generateMessageIDV2()
			const result = await groupQuery('@g.us', 'set', [
				{
					tag: 'create',
					attrs: {
						subject,
						key
					},
					content: participants.map(jid => ({
						tag: 'participant',
						attrs: { jid }
					}))
				}
			])
			return extractGroupMetadata(result)
		},
		groupLeave: async (id: string) => {
			await groupQuery('@g.us', 'set', [
				{
					tag: 'leave',
					attrs: {},
					content: [{ tag: 'group', attrs: { id } }]
				}
			])
		},
		groupUpdateSubject: async (jid: string, subject: string) => {
			await groupQuery(jid, 'set', [
				{
					tag: 'subject',
					attrs: {},
					content: Buffer.from(subject, 'utf-8')
				}
			])
		},
		groupRequestParticipantsList: async (jid: string) => {
			const result = await groupQuery(jid, 'get', [
				{
					tag: 'membership_approval_requests',
					attrs: {}
				}
			])
			const node = getBinaryNodeChild(result, 'membership_approval_requests')
			const participants = getBinaryNodeChildren(node, 'membership_approval_request')
			return participants.map(v => v.attrs)
		},
		groupRequestParticipantsUpdate: async (jid: string, participants: string[], action: 'approve' | 'reject') => {
			const result = await groupQuery(jid, 'set', [
				{
					tag: 'membership_requests_action',
					attrs: {},
					content: [
						{
							tag: action,
							attrs: {},
							content: participants.map(jid => ({
								tag: 'participant',
								attrs: { jid }
							}))
						}
					]
				}
			])
			const node = getBinaryNodeChild(result, 'membership_requests_action')
			const nodeAction = getBinaryNodeChild(node, action)
			const participantsAffected = getBinaryNodeChildren(nodeAction, 'participant')
			return participantsAffected.map(p => {
				return { status: p.attrs.error || '200', jid: p.attrs.jid }
			})
		},
		groupParticipantsUpdate: async (jid: string, participants: string[], action: ParticipantAction) => {
			const result = await groupQuery(jid, 'set', [
				{
					tag: action,
					attrs: {},
					content: participants.map(jid => ({
						tag: 'participant',
						attrs: { jid }
					}))
				}
			])
			const node = getBinaryNodeChild(result, action)
			const participantsAffected = getBinaryNodeChildren(node, 'participant')
			return participantsAffected.map(p => {
				return { status: p.attrs.error || '200', jid: p.attrs.jid, content: p }
			})
		},
		groupUpdateDescription: async (jid: string, description?: string) => {
			const metadata = await groupMetadata(jid)
			const prev = metadata.descId ?? null

			await groupQuery(jid, 'set', [
				{
					tag: 'description',
					attrs: {
						...(description ? { id: generateMessageIDV2() } : { delete: 'true' }),
						...(prev ? { prev } : {})
					},
					content: description ? [{ tag: 'body', attrs: {}, content: Buffer.from(description, 'utf-8') }] : undefined
				}
			])
		},
		groupInviteCode: async (jid: string) => {
			const result = await groupQuery(jid, 'get', [{ tag: 'invite', attrs: {} }])
			const inviteNode = getBinaryNodeChild(result, 'invite')
			return inviteNode?.attrs.code
		},
		groupRevokeInvite: async (jid: string) => {
			const result = await groupQuery(jid, 'set', [{ tag: 'invite', attrs: {} }])
			const inviteNode = getBinaryNodeChild(result, 'invite')
			return inviteNode?.attrs.code
		},
		groupAcceptInvite: async (code: string) => {
			const results = await groupQuery('@g.us', 'set', [{ tag: 'invite', attrs: { code } }])
			const result = getBinaryNodeChild(results, 'group')
			return result?.attrs.jid
		},

		/**
		 * revoke a v4 invite for someone
		 * @param groupJid group jid
		 * @param invitedJid jid of person you invited
		 * @returns true if successful
		 */
		groupRevokeInviteV4: async (groupJid: string, invitedJid: string) => {
			const result = await groupQuery(groupJid, 'set', [
				{ tag: 'revoke', attrs: {}, content: [{ tag: 'participant', attrs: { jid: invitedJid } }] }
			])
			return !!result
		},

		/**
		 * accept a GroupInviteMessage
		 * @param key the key of the invite message, or optionally only provide the jid of the person who sent the invite
		 * @param inviteMessage the message to accept
		 */
		groupAcceptInviteV4: ev.createBufferedFunction(
			async (key: string | WAMessageKey, inviteMessage: proto.Message.IGroupInviteMessage) => {
				key = typeof key === 'string' ? { remoteJid: key } : key
				const results = await groupQuery(inviteMessage.groupJid!, 'set', [
					{
						tag: 'accept',
						attrs: {
							code: inviteMessage.inviteCode!,
							expiration: inviteMessage.inviteExpiration!.toString(),
							admin: key.remoteJid!
						}
					}
				])

				// if we have the full message key
				// update the invite message to be expired
				if (key.id) {
					// create new invite message that is expired
					inviteMessage = proto.Message.GroupInviteMessage.fromObject(inviteMessage)
					inviteMessage.inviteExpiration = 0
					inviteMessage.inviteCode = ''
					ev.emit('messages.update', [
						{
							key,
							update: {
								message: {
									groupInviteMessage: inviteMessage
								}
							}
						}
					])
				}

				// generate the group add message
				await upsertMessage(
					{
						key: {
							remoteJid: inviteMessage.groupJid,
							id: generateMessageIDV2(sock.user?.id),
							fromMe: false,
							participant: key.remoteJid
						},
						messageStubType: WAMessageStubType.GROUP_PARTICIPANT_ADD,
						messageStubParameters: [JSON.stringify(authState.creds.me)],
						participant: key.remoteJid,
						messageTimestamp: unixTimestampSeconds()
					},
					'notify'
				)

				return results.attrs.from
			}
		),
		groupGetInviteInfo: async (code: string) => {
			const results = await groupQuery('@g.us', 'get', [{ tag: 'invite', attrs: { code } }])
			return extractGroupMetadata(results)
		},
		groupToggleEphemeral: async (jid: string, ephemeralExpiration: number) => {
			const content: BinaryNode = ephemeralExpiration
				? { tag: 'ephemeral', attrs: { expiration: ephemeralExpiration.toString() } }
				: { tag: 'not_ephemeral', attrs: {} }
			await groupQuery(jid, 'set', [content])
		},
		groupSettingUpdate: async (jid: string, setting: 'announcement' | 'not_announcement' | 'locked' | 'unlocked') => {
			await groupQuery(jid, 'set', [{ tag: setting, attrs: {} }])
		},
		groupMemberAddMode: async (jid: string, mode: 'admin_add' | 'all_member_add') => {
			await groupQuery(jid, 'set', [{ tag: 'member_add_mode', attrs: {}, content: mode }])
		},
		groupJoinApprovalMode: async (jid: string, mode: 'on' | 'off') => {
			await groupQuery(jid, 'set', [
				{ tag: 'membership_approval_mode', attrs: {}, content: [{ tag: 'group_join', attrs: { state: mode } }] }
			])
		},
		groupFetchAllParticipating,

		getAdminStatus: async (
			groupJid: string,
			senderJid?: string
		): Promise<{ isAdmin: boolean; isBotAdmin: boolean }> => {
			const normalizeJid = (jid?: string | null): string | null => {
				if (!jid) {
					return null
				}

				try {
					return jidNormalizedUser(jid).split('@')[0] ?? null
				} catch {
					return String(jid).split('@')[0] ?? null
				}
			}

			const botJid = authState.creds.me?.id
			const meta = await groupMetadata(groupJid).catch(() => undefined)
			if (!meta || !Array.isArray(meta.participants)) {
				return { isAdmin: false, isBotAdmin: false }
			}

			const senderNorm = normalizeJid(senderJid)
			const botNorm = normalizeJid(botJid)

			const isAdminIn = (norm: string | null) =>
				norm !== null &&
				meta.participants.some(p => {
					const pid = normalizeJid(p.id ?? p.phoneNumber ?? p.lid)
					return pid === norm && (p.admin === 'admin' || p.admin === 'superadmin')
				})

			const isAdmin = isAdminIn(senderNorm)
			let isBotAdmin = isAdminIn(botNorm)

			if (!isBotAdmin && botNorm) {
				const owners = [meta.owner, meta.ownerPn].filter(Boolean).map(normalizeJid)
				if (owners.includes(botNorm)) {
					isBotAdmin = true
				}
			}

			return { isAdmin, isBotAdmin }
		}
	}
}

export const extractGroupMetadata = (result: BinaryNode) => {
	const group = getBinaryNodeChild(result, 'group')
	if (!group) {
		// Mirror WAWeb: surface server/client errors with their code+text instead of crashing.
		const errorNode = getBinaryNodeChild(result, 'error')
		if (errorNode) {
			const code = errorNode.attrs.code ? +errorNode.attrs.code : 500
			const text = errorNode.attrs.text || 'group metadata query failed'
			throw new Boom(text, { statusCode: code, data: errorNode })
		}

		throw new Boom('Invalid group metadata response: missing <group> node', { data: result })
	}

	if (!group.attrs.id) {
		throw new Boom('Invalid group metadata response: missing group id', { data: group })
	}

	const descChild = getBinaryNodeChild(group, 'description')
	let desc: string | undefined
	let descId: string | undefined
	let descOwner: string | undefined
	let descOwnerPn: string | undefined
	let descOwnerUsername: string | undefined
	let descTime: number | undefined
	if (descChild) {
		desc = getBinaryNodeChildString(descChild, 'body')
		descOwner = descChild.attrs.participant ? jidNormalizedUser(descChild.attrs.participant) : undefined
		descOwnerPn = descChild.attrs.participant_pn ? jidNormalizedUser(descChild.attrs.participant_pn) : undefined
		descOwnerUsername = descChild.attrs.participant_username || undefined
		descTime = +descChild.attrs.t!
		descId = descChild.attrs.id
	}

	const groupId = group.attrs.id.includes('@') ? group.attrs.id : jidEncode(group.attrs.id, 'g.us')
	const eph = getBinaryNodeChild(group, 'ephemeral')?.attrs.expiration
	const memberAddMode = getBinaryNodeChildString(group, 'member_add_mode') === 'all_member_add'
	const metadata: GroupMetadata = {
		id: groupId,
		notify: group.attrs.notify,
		addressingMode: group.attrs.addressing_mode === 'lid' ? WAMessageAddressingMode.LID : WAMessageAddressingMode.PN,
		subject: group.attrs.subject!,
		subjectOwner: group.attrs.s_o,
		subjectOwnerPn: group.attrs.s_o_pn,
		subjectOwnerUsername: group.attrs.s_o_username,
		subjectTime: +group.attrs.s_t!,
		size: group.attrs.size ? +group.attrs.size : getBinaryNodeChildren(group, 'participant').length,
		creation: +group.attrs.creation!,
		owner: group.attrs.creator ? jidNormalizedUser(group.attrs.creator) : undefined,
		ownerPn: group.attrs.creator_pn ? jidNormalizedUser(group.attrs.creator_pn) : undefined,
		ownerUsername: group.attrs.creator_username || undefined,
		owner_country_code: group.attrs.creator_country_code,
		desc,
		descId,
		descOwner,
		descOwnerPn,
		descOwnerUsername,
		descTime,
		linkedParent: getBinaryNodeChild(group, 'linked_parent')?.attrs.jid || undefined,
		restrict: !!getBinaryNodeChild(group, 'locked'),
		announce: !!getBinaryNodeChild(group, 'announcement'),
		isCommunity: !!getBinaryNodeChild(group, 'parent'),
		isCommunityAnnounce: !!getBinaryNodeChild(group, 'default_sub_group'),
		joinApprovalMode: !!getBinaryNodeChild(group, 'membership_approval_mode'),
		memberAddMode,
		participants: getBinaryNodeChildren(group, 'participant').map(({ attrs }) => {
			const isLid = isLidUser(attrs.jid)
			const hasPn = isPnUser(attrs.phone_number)
			return {
				id: isLid && hasPn ? attrs.phone_number! : attrs.jid!,
				phoneNumber: isLid && hasPn ? attrs.phone_number : undefined,
				lid: isLid ? attrs.jid : isPnUser(attrs.jid) && isLidUser(attrs.lid) ? attrs.lid : undefined,
				username: attrs.participant_username || attrs.username || undefined,
				admin: (attrs.type || null) as GroupParticipant['admin']
			}
		}),
		ephemeralDuration: eph ? +eph : undefined
	}
	return metadata
}

export type GroupsSocket = ReturnType<typeof makeGroupsSocket>
