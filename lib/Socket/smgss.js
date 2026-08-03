import { randomBytes } from 'crypto';
import { Boom } from '@hapi/boom';
import { generateWAMessage, generateWAMessageContent, generateWAMessageFromContent, prepareWAMessageMedia } from '../Utils/index.js';
import { delay, generateMessageID } from '../Utils/generics.js';
import { jidNormalizedUser } from '../WABinary/index.js';
export class Smgss {
    constructor(waUploadToServer, relayMessage, config, sock, messageMutex, upsertMessage) {
        this.waUploadToServer = waUploadToServer;
        this.relayMessage = relayMessage;
        this.config = config;
        this.sock = sock;
        this.messageMutex = messageMutex;
        this.upsertMessage = upsertMessage;
    }
    get meJid() {
        return jidNormalizedUser(this.sock.authState?.creds?.me?.id || '');
    }
    emitSent(msg) {
        if (!this.config.emitOwnEvents || !this.messageMutex || !this.upsertMessage)
            return;
        const mutex = this.messageMutex;
        const upsert = this.upsertMessage;
        process.nextTick(async () => {
            await mutex.mutex(() => upsert(msg, 'append'));
        });
    }
    detectType(content) {
        if (content?.requestPaymentMessage)
            return 'PAYMENT';
        if (content?.productMessage)
            return 'PRODUCT';
        if (content?.interactiveButtons)
            return 'INTERACTIVE_BUTTONS';
        if (content?.interactiveMessage?.carouselMessage)
            return 'CAROUSEL';
        if (content?.interactiveMessage)
            return 'INTERACTIVE';
        if (content?.albumMessage || content?.album)
            return 'ALBUM';
        if (content?.eventMessage)
            return 'EVENT';
        if (content?.pollResultMessage)
            return 'POLL_RESULT';
        if (content?.groupStatusMessage)
            return 'GROUP_STORY';
        return null;
    }
    async handle(type, content, jid, quoted, options) {
        switch (type) {
            case 'PAYMENT':
                return this.handlePayment(content, quoted);
            case 'PRODUCT':
                return this.handleProduct(content);
            case 'INTERACTIVE_BUTTONS':
                return this.handleInteractiveButtons(content);
            case 'INTERACTIVE':
                return this.handleInteractive(content);
            case 'CAROUSEL':
                return this.handleCarousel(content);
            case 'ALBUM':
                return this.handleAlbum(content, jid, quoted, options);
            case 'EVENT':
                return this.handleEvent(content, jid, quoted);
            case 'POLL_RESULT':
                return this.handlePollResult(content, jid, quoted);
            case 'GROUP_STORY':
                return this.handleGroupStory(content, jid);
        }
    }
    async handlePayment(content, quoted) {
        const data = content.requestPaymentMessage;
        let notes = {};
        if (data.sticker?.stickerMessage) {
            notes = {
                stickerMessage: {
                    ...data.sticker.stickerMessage,
                    contextInfo: {
                        stanzaId: quoted?.key?.id,
                        participant: quoted?.key?.participant || content.sender,
                        quotedMessage: quoted?.message
                    }
                }
            };
        }
        else if (data.note) {
            notes = {
                extendedTextMessage: {
                    text: data.note,
                    contextInfo: {
                        stanzaId: quoted?.key?.id,
                        participant: quoted?.key?.participant || content.sender,
                        quotedMessage: quoted?.message
                    }
                }
            };
        }
        return {
            requestPaymentMessage: {
                expiryTimestamp: data.expiry || 0,
                amount1000: data.amount || 0,
                currencyCodeIso4217: data.currency || 'USD',
                requestFrom: data.from || '0@s.whatsapp.net',
                noteMessage: notes,
                background: data.background ?? { id: 'DEFAULT', placeholderArgb: 0xfff0f0f0 }
            }
        };
    }
    async handleProduct(content) {
        const { title, description, thumbnail, productId, retailerId, url, body = '', footer = '', buttons = [], priceAmount1000 = null, currencyCode = 'USD' } = content.productMessage;
        let productImage;
        if (Buffer.isBuffer(thumbnail)) {
            const { imageMessage } = await generateWAMessageContent({ image: thumbnail }, {
                upload: this.waUploadToServer
            });
            productImage = imageMessage;
        }
        else if (typeof thumbnail === 'object' && thumbnail?.url) {
            const { imageMessage } = await generateWAMessageContent({ image: { url: thumbnail.url } }, {
                upload: this.waUploadToServer
            });
            productImage = imageMessage;
        }
        return {
            viewOnceMessage: {
                message: {
                    interactiveMessage: {
                        body: { text: body },
                        footer: { text: footer },
                        header: {
                            title,
                            hasMediaAttachment: true,
                            productMessage: {
                                product: {
                                    productImage,
                                    productId,
                                    title,
                                    description,
                                    currencyCode,
                                    priceAmount1000,
                                    retailerId,
                                    url,
                                    productImageCount: 1
                                },
                                businessOwnerJid: '0@s.whatsapp.net'
                            }
                        },
                        nativeFlowMessage: { buttons }
                    }
                }
            }
        };
    }
    async handleInteractive(content) {
        const { title, footer, thumbnail, image, video, document, mimetype, fileName, jpegThumbnail, contextInfo, externalAdReply, buttons = [], nativeFlowMessage, header } = content.interactiveMessage;
        let media = null;
        if (thumbnail) {
            media = await prepareWAMessageMedia({ image: { url: thumbnail } }, { upload: this.waUploadToServer });
        }
        else if (image) {
            const src = typeof image === 'object' && image.url ? { image: { url: image.url } } : { image };
            media = await prepareWAMessageMedia(src, { upload: this.waUploadToServer });
        }
        else if (video) {
            const src = typeof video === 'object' && video.url ? { video: { url: video.url } } : { video };
            media = await prepareWAMessageMedia(src, { upload: this.waUploadToServer });
        }
        else if (document) {
            const docPayload = { document };
            if (jpegThumbnail) {
                docPayload.jpegThumbnail =
                    typeof jpegThumbnail === 'object' && jpegThumbnail.url ? { url: jpegThumbnail.url } : jpegThumbnail;
            }
            media = await prepareWAMessageMedia(docPayload, { upload: this.waUploadToServer });
            if (fileName)
                media.documentMessage.fileName = fileName;
            if (mimetype)
                media.documentMessage.mimetype = mimetype;
        }
        const interactiveMessage = {
            body: { text: title || '' },
            footer: { text: footer || '' }
        };
        if (buttons?.length > 0) {
            interactiveMessage.nativeFlowMessage = { buttons };
            if (nativeFlowMessage) {
                interactiveMessage.nativeFlowMessage = { ...interactiveMessage.nativeFlowMessage, ...nativeFlowMessage };
            }
        }
        else if (nativeFlowMessage) {
            interactiveMessage.nativeFlowMessage = nativeFlowMessage;
        }
        interactiveMessage.header = media
            ? { title: header || '', hasMediaAttachment: true, ...media }
            : { title: header || '', hasMediaAttachment: false };
        const finalContextInfo = {};
        if (contextInfo) {
            Object.assign(finalContextInfo, {
                mentionedJid: contextInfo.mentionedJid || [],
                forwardingScore: contextInfo.forwardingScore || 0,
                isForwarded: contextInfo.isForwarded || false,
                ...contextInfo
            });
        }
        if (externalAdReply) {
            finalContextInfo.externalAdReply = {
                title: externalAdReply.title || '',
                body: externalAdReply.body || '',
                mediaType: externalAdReply.mediaType || 1,
                thumbnailUrl: externalAdReply.thumbnailUrl || '',
                mediaUrl: externalAdReply.mediaUrl || '',
                sourceUrl: externalAdReply.sourceUrl || '',
                showAdAttribution: externalAdReply.showAdAttribution || false,
                renderLargerThumbnail: externalAdReply.renderLargerThumbnail || false,
                ...externalAdReply
            };
        }
        if (Object.keys(finalContextInfo).length > 0) {
            interactiveMessage.contextInfo = finalContextInfo;
        }
        return { interactiveMessage };
    }
    async handleInteractiveButtons(content) {
        const { text, caption, title, subtitle, footer, interactiveButtons, hasMediaAttachment, image, video, document, mimetype, jpegThumbnail, location, product, businessOwnerJid } = content;
        const bodyText = text || caption || '';
        const buttons = interactiveButtons.map((btn) => ({
            name: btn.name,
            buttonParamsJson: typeof btn.buttonParamsJson === 'string' ? btn.buttonParamsJson : JSON.stringify(btn.buttonParamsJson)
        }));
        let headerContent = {};
        let mediaAttached = typeof hasMediaAttachment === 'boolean' ? hasMediaAttachment : false;
        if (image) {
            const src = typeof image === 'object' && image.url ? { image: { url: image.url } } : { image };
            headerContent = await prepareWAMessageMedia(src, { upload: this.waUploadToServer });
            mediaAttached = typeof hasMediaAttachment === 'boolean' ? hasMediaAttachment : true;
        }
        else if (video) {
            const src = typeof video === 'object' && video.url ? { video: { url: video.url } } : { video };
            headerContent = await prepareWAMessageMedia(src, { upload: this.waUploadToServer });
            mediaAttached = typeof hasMediaAttachment === 'boolean' ? hasMediaAttachment : true;
        }
        else if (document) {
            const docPayload = typeof document === 'object' && document.url ? { document: { url: document.url } } : { document };
            if (mimetype)
                docPayload.mimetype = mimetype;
            headerContent = await prepareWAMessageMedia(docPayload, { upload: this.waUploadToServer });
            if (jpegThumbnail) {
                headerContent.documentMessage.jpegThumbnail =
                    typeof jpegThumbnail === 'string' ? Buffer.from(jpegThumbnail, 'base64') : jpegThumbnail;
            }
            mediaAttached = typeof hasMediaAttachment === 'boolean' ? hasMediaAttachment : true;
        }
        else if (location) {
            headerContent = {
                locationMessage: {
                    degreesLatitude: location.degreesLatitude || location.degressLatitude || 0,
                    degreesLongitude: location.degreesLongitude || location.degressLongitude || 0,
                    name: location.name || ''
                }
            };
            mediaAttached = typeof hasMediaAttachment === 'boolean' ? hasMediaAttachment : true;
        }
        else if (product) {
            let productImage;
            if (product.productImage) {
                const imgSrc = typeof product.productImage === 'object' && product.productImage.url
                    ? { image: { url: product.productImage.url } }
                    : { image: product.productImage };
                const uploaded = await prepareWAMessageMedia(imgSrc, { upload: this.waUploadToServer });
                productImage = uploaded.imageMessage;
            }
            headerContent = {
                productMessage: {
                    product: {
                        productImage,
                        productId: product.productId,
                        title: product.title,
                        description: product.description,
                        currencyCode: product.currencyCode || 'USD',
                        priceAmount1000: product.priceAmount1000,
                        retailerId: product.retailerId,
                        url: product.url,
                        productImageCount: product.productImageCount || 1
                    },
                    businessOwnerJid: businessOwnerJid || '0@s.whatsapp.net'
                }
            };
            mediaAttached = typeof hasMediaAttachment === 'boolean' ? hasMediaAttachment : true;
        }
        const interactiveMessage = {
            body: { text: bodyText },
            footer: { text: footer || '' },
            header: {
                title: title || '',
                subtitle: subtitle || '',
                hasMediaAttachment: mediaAttached,
                ...headerContent
            },
            nativeFlowMessage: { buttons }
        };
        return {
            viewOnceMessage: {
                message: {
                    messageContextInfo: {
                        deviceListMetadata: {},
                        deviceListMetadataVersion: 2,
                        messageSecret: randomBytes(32)
                    },
                    interactiveMessage
                }
            }
        };
    }
    async handleCarousel(content) {
        const { interactiveMessage } = content;
        const { body, footer, header, carouselMessage, contextInfo } = interactiveMessage;
        const processedCards = await Promise.all(carouselMessage.cards.map(async (card) => {
            const cardMsg = {
                body: card.body || { text: '' },
                footer: card.footer || { text: '' },
                header: { title: card.header?.title || '', hasMediaAttachment: false }
            };
            if (card.nativeFlowMessage) {
                cardMsg.nativeFlowMessage = card.nativeFlowMessage;
            }
            if (card.header?.imageMessage || card.header?.videoMessage || card.header?.documentMessage) {
                let headerContent = {};
                if (card.header.imageMessage) {
                    const url = card.header.imageMessage.url || card.header.imageMessage;
                    const src = typeof url === 'string' ? { image: { url } } : { image: url };
                    headerContent = await prepareWAMessageMedia(src, { upload: this.waUploadToServer });
                }
                else if (card.header.videoMessage) {
                    const url = card.header.videoMessage.url || card.header.videoMessage;
                    const src = typeof url === 'string' ? { video: { url } } : { video: url };
                    headerContent = await prepareWAMessageMedia(src, { upload: this.waUploadToServer });
                }
                else if (card.header.documentMessage) {
                    const url = card.header.documentMessage.url || card.header.documentMessage;
                    const src = typeof url === 'string' ? { document: { url } } : { document: url };
                    headerContent = await prepareWAMessageMedia(src, { upload: this.waUploadToServer });
                }
                cardMsg.header = { title: card.header?.title || '', hasMediaAttachment: true, ...headerContent };
            }
            return cardMsg;
        }));
        const interactiveMsg = {
            body: body || { text: '' },
            footer: footer || { text: '' },
            header: header || { title: '', hasMediaAttachment: false },
            carouselMessage: {
                cards: processedCards,
                messageVersion: carouselMessage.messageVersion || 1,
                carouselCardType: carouselMessage.carouselCardType ?? 1
            }
        };
        if (contextInfo)
            interactiveMsg.contextInfo = contextInfo;
        return {
            viewOnceMessage: {
                message: {
                    messageContextInfo: {
                        deviceListMetadata: {},
                        deviceListMetadataVersion: 2,
                        messageSecret: randomBytes(32)
                    },
                    interactiveMessage: interactiveMsg
                }
            }
        };
    }
    async handleAlbum(content, jid, quoted, options) {
        const array = content.albumMessage || content.album;
        if (!Array.isArray(array)) {
            throw new Boom('Invalid album type. Expected an array.', { statusCode: 400 });
        }
        const imageCount = array.filter((a) => 'image' in a).length;
        const videoCount = array.filter((a) => 'video' in a).length;
        if (imageCount + videoCount < 2) {
            throw new Boom('Minimum provide 2 media to upload album message', { statusCode: 400 });
        }
        const ctxInfo = content.contextInfo || {};
        const relayOpts = {
            useCachedGroupMetadata: options?.useCachedGroupMetadata,
            statusJidList: options?.statusJidList
        };
        const album = await generateWAMessageFromContent(jid, {
            messageContextInfo: { messageSecret: randomBytes(32) },
            albumMessage: {
                expectedImageCount: imageCount,
                expectedVideoCount: videoCount
            }
        }, { userJid: this.meJid, quoted, upload: this.waUploadToServer });
        await this.relayMessage(jid, album.message, { messageId: album.key.id, ...relayOpts });
        this.emitSent(album);
        for (let item of array) {
            if (!('image' in item) && !('video' in item)) {
                this.config.logger?.warn('smgss.handleAlbum: skipping item without image/video');
                continue;
            }
            if (ctxInfo && Object.keys(ctxInfo).length > 0 && !item.contextInfo) {
                item = { ...item, contextInfo: ctxInfo };
            }
            try {
                const img = await generateWAMessage(jid, item, { upload: this.waUploadToServer, userJid: this.meJid });
                img.message.messageContextInfo = {
                    messageSecret: randomBytes(32),
                    messageAssociation: { associationType: 1, parentMessageKey: album.key }
                };
                await this.relayMessage(jid, img.message, { messageId: img.key.id, ...relayOpts });
                this.emitSent(img);
            }
            catch (err) {
                this.config.logger?.error(`smgss.handleAlbum: failed to send item — ${err}`);
            }
            await delay(this.config.albumItemDelayMs ?? 300);
        }
        return album;
    }
    async handleEvent(content, jid, quoted) {
        const eventData = content.eventMessage;
        const msg = await generateWAMessageFromContent(jid, {
            viewOnceMessage: {
                message: {
                    messageContextInfo: {
                        deviceListMetadata: {},
                        deviceListMetadataVersion: 2,
                        messageSecret: randomBytes(32)
                    },
                    eventMessage: {
                        isCanceled: eventData.isCanceled || false,
                        name: eventData.name,
                        description: eventData.description,
                        location: eventData.location || { degreesLatitude: 0, degreesLongitude: 0, name: 'Location' },
                        joinLink: eventData.joinLink || '',
                        startTime: typeof eventData.startTime === 'string' ? parseInt(eventData.startTime) : eventData.startTime || Date.now(),
                        endTime: typeof eventData.endTime === 'string' ? parseInt(eventData.endTime) : eventData.endTime || Date.now() + 3600000,
                        extraGuestsAllowed: eventData.extraGuestsAllowed !== false
                    }
                }
            }
        }, { quoted, userJid: this.meJid });
        await this.relayMessage(jid, msg.message, { messageId: msg.key.id });
        return msg;
    }
    async handlePollResult(content, jid, quoted) {
        const pollData = content.pollResultMessage;
        const msg = await generateWAMessageFromContent(jid, {
            pollResultSnapshotMessage: {
                name: pollData.name,
                pollVotes: pollData.pollVotes.map((vote) => ({
                    optionName: vote.optionName,
                    optionVoteCount: typeof vote.optionVoteCount === 'number' ? vote.optionVoteCount.toString() : vote.optionVoteCount
                }))
            }
        }, { quoted, userJid: this.meJid });
        await this.relayMessage(jid, msg.message, { messageId: msg.key.id });
        return msg;
    }
    async handleGroupStory(content, jid) {
        const storyData = content.groupStatusMessage;
        const messageSecret = storyData.messageSecret || randomBytes(32);
        const waMsgContent = storyData.message ? storyData : await generateWAMessageContent(storyData, { upload: this.waUploadToServer });
        const innerMsg = waMsgContent.message || waMsgContent;
        const msgKey = Object.keys(innerMsg).find(k => innerMsg[k] && typeof innerMsg[k] === 'object');
        if (msgKey) {
            innerMsg[msgKey].contextInfo = innerMsg[msgKey].contextInfo || {};
            innerMsg[msgKey].contextInfo.isGroupStatus = true;
            if (!innerMsg[msgKey].contextInfo.statusSourceType) {
                if (innerMsg.imageMessage)
                    innerMsg[msgKey].contextInfo.statusSourceType = 0;
                else if (innerMsg.videoMessage)
                    innerMsg[msgKey].contextInfo.statusSourceType = 1;
                else if (innerMsg.audioMessage)
                    innerMsg[msgKey].contextInfo.statusSourceType = 3;
                else if (innerMsg.extendedTextMessage)
                    innerMsg[msgKey].contextInfo.statusSourceType = 4;
            }
            if (storyData.closeFriends || storyData.audienceType !== undefined) {
                innerMsg[msgKey].contextInfo.statusAudienceMetadata = {
                    audienceType: storyData.audienceType ?? 1
                };
            }
        }
        innerMsg.messageContextInfo = { messageSecret };
        const finalMsg = { messageContextInfo: { messageSecret }, groupStatusMessageV2: { message: innerMsg } };
        const msgId = generateMessageID();
        await this.relayMessage(jid, finalMsg, { messageId: msgId });
        return { key: { id: msgId, remoteJid: jid, fromMe: true }, message: finalMsg };
    }
}
//# sourceMappingURL=smgss.js.map