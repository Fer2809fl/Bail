"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSenderLid = exports.toJid = exports.assertMediaContent = exports.downloadMediaMessage = exports.aggregateMessageKeysNotFromMe = exports.getAggregateVotesInPollMessage = exports.updateMessageWithPollUpdate = exports.updateMessageWithReaction = exports.updateMessageWithReceipt = exports.getDevice = exports.extractMessageContent = exports.normalizeMessageContent = exports.getContentType = exports.generateWAMessage = exports.generateWAMessageFromContent = exports.generateWAMessageContent = exports.generateForwardMessageContent = exports.prepareDisappearingMessageSettingContent = exports.prepareWAMessageMedia = exports.generateLinkPreviewIfRequired = exports.extractUrlFromText = void 0;
const stream_1 = require("stream");
const WAProto_1 = require("../../WAProto");
const logger_1 = require("./logger");
const messages_media_1 = require("./messages-media");
const generics_1 = require("./generics");
const WABinary_1 = require("../WABinary");

/**
 * Uses a regex to test whether the string contains a URL, and returns the URL if it does.
 */
const extractUrlFromText = (text) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const match = text.match(urlRegex);
    return match ? match[0] : undefined;
};
exports.extractUrlFromText = extractUrlFromText;

const generateLinkPreviewIfRequired = async (text, getUrlInfo, logger) => {
    const url = (0, exports.extractUrlFromText)(text);
    if (url && getUrlInfo) {
        try {
            const info = await getUrlInfo(url);
            return {
                canonicalUrl: info['canonical-url'],
                matchedText: info['matched-text'],
                title: info.title,
                description: info.description,
                originalUrl: info['original-url'],
                thumbnail: info.thumbnail
            };
        }
        catch (error) {
            logger.error(`Error getting link preview: ${error}`);
            return undefined;
        }
    }
    return undefined;
};
exports.generateLinkPreviewIfRequired = generateLinkPreviewIfRequired;

const prepareWAMessageMedia = async (message, options) => {
    const media = await (0, messages_media_1.getWAUploadToCloud)(message, options);
    return media;
};
exports.prepareWAMessageMedia = prepareWAMessageMedia;

const prepareDisappearingMessageSettingContent = (ephemeralExpiration) => {
    return {
        ephemeralMessage: {
            message: {
                ephemeralSetting: {
                    duration: ephemeralExpiration || 0,
                    timestamp: Math.floor(Date.now() / 1000)
                }
            }
        }
    };
};
exports.prepareDisappearingMessageSettingContent = prepareDisappearingMessageSettingContent;

const generateForwardMessageContent = (message, forceForward = false) => {
    const content = (0, exports.extractMessageContent)(message.message);
    if (!content)
        throw new Error('No content to forward');
    const isFromMe = message.key.fromMe;
    const isForwarded = forceForward || !isFromMe;
    const forwardContent = {
        ...content,
        contextInfo: {
            ...content.contextInfo,
            isForwarded,
            forwardedNewsletterMessageInfo: content.contextInfo?.forwardedNewsletterMessageInfo,
            quotedMessage: content.contextInfo?.quotedMessage
        }
    };
    return forwardContent;
};
exports.generateForwardMessageContent = generateForwardMessageContent;

const generateWAMessageContent = async (message, options) => {
    if (message.text) {
        const linkPreview = await (0, exports.generateLinkPreviewIfRequired)(message.text, options.getUrlInfo, options.logger);
        return {
            conversation: message.text,
            ...(linkPreview ? { extendedTextMessage: { text: message.text, matchedText: linkPreview.matchedText, canonicalUrl: linkPreview.canonicalUrl, title: linkPreview.title, description: linkPreview.description, thumbnail: linkPreview.thumbnail } } : {})
        };
    }
    if (message.image)
        return { imageMessage: await (0, exports.prepareWAMessageMedia)({ image: message.image, caption: message.caption }, options) };
    if (message.video)
        return { videoMessage: await (0, exports.prepareWAMessageMedia)({ video: message.video, caption: message.caption }, options) };
    if (message.audio)
        return { audioMessage: await (0, exports.prepareWAMessageMedia)({ audio: message.audio, ptt: message.ptt }, options) };
    if (message.document)
        return { documentMessage: await (0, exports.prepareWAMessageMedia)({ document: message.document, fileName: message.fileName, mimetype: message.mimetype }, options) };
    if (message.sticker)
        return { stickerMessage: await (0, exports.prepareWAMessageMedia)({ sticker: message.sticker }, options) };
    if (message.contact)
        return { contactMessage: { displayName: message.contact.displayName, vcard: message.contact.vcard } };
    if (message.location)
        return { locationMessage: { degreesLatitude: message.location.degreesLatitude, degreesLongitude: message.location.degreesLongitude, name: message.location.name, address: message.location.address } };
    if (message.buttons)
        return { buttonsMessage: { contentText: message.text, footerText: message.footer, buttons: message.buttons, headerType: message.headerType || 4 } };
    if (message.template)
        return { templateMessage: message.template };
    if (message.list)
        return { listMessage: message.list };
    if (message.interactive)
        return { interactiveMessage: message.interactive };
    if (message.product)
        return { productMessage: message.product };
    if (message.poll)
        return { pollCreationMessage: message.poll };
    if (message.event)
        return { eventMessage: message.event };
    throw new Error('Unsupported message type');
};
exports.generateWAMessageContent = generateWAMessageContent;

const generateWAMessageFromContent = (jid, message, options) => {
    const msg = {
        key: {
            remoteJid: jid,
            fromMe: options.userJid === jid ? true : false,
            id: options.messageId || (0, generics_1.generateMessageId)(),
            participant: options.participant
        },
        message: message,
        messageTimestamp: options.timestamp || Math.floor(Date.now() / 1000),
        status: options.status || 0,
        messageStubParameters: options.messageStubParameters,
        messageStubType: options.messageStubType,
        ...(options.deviceInfo ? { deviceInfo: options.deviceInfo } : {})
    };
    return msg;
};
exports.generateWAMessageFromContent = generateWAMessageFromContent;

const generateWAMessage = async (jid, content, options) => {
    const messageContent = await (0, exports.generateWAMessageContent)(content, options);
    return (0, exports.generateWAMessageFromContent)(jid, messageContent, options);
};
exports.generateWAMessage = generateWAMessage;

const getContentType = (content) => {
    if (!content)
        return undefined;
    const keys = Object.keys(content);
    return keys.find(k => k !== 'senderKeyDistributionMessage');
};
exports.getContentType = getContentType;

const normalizeMessageContent = (content) => {
    if (!content)
        return undefined;
    if (content.ephemeralMessage)
        return (0, exports.normalizeMessageContent)(content.ephemeralMessage.message);
    if (content.viewOnceMessage)
        return (0, exports.normalizeMessageContent)(content.viewOnceMessage.message);
    if (content.viewOnceMessageV2)
        return (0, exports.normalizeMessageContent)(content.viewOnceMessageV2.message);
    if (content.documentWithCaptionMessage)
        return (0, exports.normalizeMessageContent)(content.documentWithCaptionMessage.message);
    if (content.imageWithCaptionMessage)
        return (0, exports.normalizeMessageContent)(content.imageWithCaptionMessage.message);
    if (content.videoWithCaptionMessage)
        return (0, exports.normalizeMessageContent)(content.videoWithCaptionMessage.message);
    return content;
};
exports.normalizeMessageContent = normalizeMessageContent;

const extractMessageContent = (content) => {
    const normalized = (0, exports.normalizeMessageContent)(content);
    if (!normalized)
        return undefined;
    const type = (0, exports.getContentType)(normalized);
    if (type && normalized[type]) {
        return normalized[type];
    }
    return undefined;
};
exports.extractMessageContent = extractMessageContent;

const getDevice = (id) => {
    if (id.includes('android'))
        return 'android';
    if (id.includes('ios'))
        return 'ios';
    if (id.includes('web'))
        return 'web';
    return 'desktop';
};
exports.getDevice = getDevice;

const updateMessageWithReceipt = (msg, receipt) => {
    if (!msg.userReceipt)
        msg.userReceipt = [];
    const existing = msg.userReceipt.find(r => r.userJid === receipt.userJid);
    if (existing) {
        existing.receiptTimestamp = receipt.receiptTimestamp;
        existing.readTimestamp = receipt.readTimestamp;
        existing.playedTimestamp = receipt.playedTimestamp;
    }
    else {
        msg.userReceipt.push(receipt);
    }
};
exports.updateMessageWithReceipt = updateMessageWithReceipt;

const updateMessageWithReaction = (msg, reaction) => {
    if (!msg.reactions)
        msg.reactions = [];
    const existing = msg.reactions.find(r => r.key === reaction.key);
    if (existing) {
        existing.text = reaction.text;
        existing.timestamp = reaction.timestamp;
    }
    else {
        msg.reactions.push(reaction);
    }
};
exports.updateMessageWithReaction = updateMessageWithReaction;

const updateMessageWithPollUpdate = (msg, update) => {
    if (!msg.pollUpdates)
        msg.pollUpdates = [];
    const existing = msg.pollUpdates.find(p => p.pollUpdateMessageKey === update.pollUpdateMessageKey);
    if (existing) {
        existing.pollUpdateMessageKey = update.pollUpdateMessageKey;
        existing.vote = update.vote;
        existing.senderTimestampMs = update.senderTimestampMs;
        existing.receiptTimestamp = update.receiptTimestamp;
    }
    else {
        msg.pollUpdates.push(update);
    }
};
exports.updateMessageWithPollUpdate = updateMessageWithPollUpdate;

const getAggregateVotesInPollMessage = ({ message, pollUpdates }, meId) => {
    const pollMsg = (0, exports.extractMessageContent)(message);
    if (!pollMsg?.pollCreationMessage)
        return [];
    const options = pollMsg.pollCreationMessage.options || [];
    const voteMap = new Map();
    for (const update of pollUpdates || []) {
        const vote = update.vote;
        if (!vote || !vote.selectedOptions || !vote.senderTimestampMs)
            continue;
        const selectedOptions = vote.selectedOptions || [];
        for (const opt of selectedOptions) {
            const optionName = opt;
            if (!voteMap.has(optionName))
                voteMap.set(optionName, []);
            voteMap.get(optionName).push(vote.sender);
        }
    }
    return options.map(opt => ({
        name: opt.optionName,
        voters: voteMap.get(opt.optionName) || []
    }));
};
exports.getAggregateVotesInPollMessage = getAggregateVotesInPollMessage;

const aggregateMessageKeysNotFromMe = (keys) => {
    const grouped = new Map();
    for (const key of keys) {
        const jid = key.remoteJid;
        const participant = key.participant;
        const groupKey = `${jid}|${participant || ''}`;
        if (!grouped.has(groupKey))
            grouped.set(groupKey, { jid, participant, messageIds: [] });
        grouped.get(groupKey).messageIds.push(key.id);
    }
    return Array.from(grouped.values());
};
exports.aggregateMessageKeysNotFromMe = aggregateMessageKeysNotFromMe;

const downloadMediaMessage = async (message, type, options, ctx) => {
    const content = (0, exports.extractMessageContent)(message.message);
    if (!content)
        throw new Error('No media content found');
    const mediaType = ['imageMessage', 'videoMessage', 'audioMessage', 'documentMessage', 'stickerMessage'].find(t => content[t]);
    if (!mediaType)
        throw new Error('Not a media message');
    const media = content[mediaType];
    const url = media.url;
    if (!url)
        throw new Error('No media URL found');
    const buffer = await (0, messages_media_1.downloadMedia)(url, options);
    if (type === 'buffer')
        return buffer;
    const stream = new stream_1.Readable();
    stream.push(buffer);
    stream.push(null);
    return stream;
};
exports.downloadMediaMessage = downloadMediaMessage;

const assertMediaContent = (content) => {
    const normalized = (0, exports.normalizeMessageContent)(content);
    if (!normalized)
        throw new Error('No content');
    const type = (0, exports.getContentType)(normalized);
    if (!type || !['imageMessage', 'videoMessage', 'audioMessage', 'documentMessage', 'stickerMessage'].includes(type))
        throw new Error('Not a media message');
    return normalized[type];
};
exports.assertMediaContent = assertMediaContent;

const toJid = (id) => {
    return (0, WABinary_1.jidNormalizedUser)(id);
};
exports.toJid = toJid;

const getSenderLid = (msg) => {
    const jid = msg.key.participant || msg.key.remoteJid;
    const lid = msg.participantLid || jid;
    return { jid, lid };
};
exports.getSenderLid = getSenderLid;
