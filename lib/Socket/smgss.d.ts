import type { ILogger } from '../Utils/logger.js';
import type { WAMediaUploadFunction } from '../Types/index.js';
export type SmgssContentType = 'PAYMENT' | 'PRODUCT' | 'INTERACTIVE_BUTTONS' | 'INTERACTIVE' | 'CAROUSEL' | 'ALBUM' | 'EVENT' | 'POLL_RESULT' | 'GROUP_STORY';
export type SmgssConfig = {
    logger: ILogger;
    linkPreviewImageThumbnailWidth?: number;
    generateHighQualityLinkPreview?: boolean;
    mediaCache?: any;
    options?: RequestInit;
    albumItemDelayMs?: number;
    emitOwnEvents?: boolean;
};
export type SmgssSock = {
    authState: {
        creds: {
            me?: {
                id: string;
            };
        };
    };
};
type RelayMessageFn = (jid: string, message: any, opts?: any) => Promise<any>;
type MessageMutexFn = {
    mutex: (task: () => Promise<any>) => Promise<any>;
};
type UpsertMessageFn = (msg: any, type: any) => Promise<any>;
export declare class Smgss {
    private waUploadToServer;
    private relayMessage;
    private config;
    private sock;
    private messageMutex?;
    private upsertMessage?;
    constructor(waUploadToServer: WAMediaUploadFunction, relayMessage: RelayMessageFn, config: SmgssConfig, sock: SmgssSock, messageMutex?: MessageMutexFn | undefined, upsertMessage?: UpsertMessageFn | undefined);
    private get meJid();
    private emitSent;
    detectType(content: any): SmgssContentType | null;
    handle(type: SmgssContentType, content: any, jid: string, quoted?: any, options?: any): Promise<import("...js").WAMessage | {
        requestPaymentMessage: {
            expiryTimestamp: any;
            amount1000: any;
            currencyCodeIso4217: any;
            requestFrom: any;
            noteMessage: any;
            background: any;
        };
    } | {
        viewOnceMessage: {
            message: {
                interactiveMessage: {
                    body: {
                        text: any;
                    };
                    footer: {
                        text: any;
                    };
                    header: {
                        title: any;
                        hasMediaAttachment: boolean;
                        productMessage: {
                            product: {
                                productImage: any;
                                productId: any;
                                title: any;
                                description: any;
                                currencyCode: any;
                                priceAmount1000: any;
                                retailerId: any;
                                url: any;
                                productImageCount: number;
                            };
                            businessOwnerJid: string;
                        };
                    };
                    nativeFlowMessage: {
                        buttons: any;
                    };
                };
            };
        };
    } | {
        interactiveMessage: any;
    } | {
        viewOnceMessage: {
            message: {
                messageContextInfo: {
                    deviceListMetadata: {};
                    deviceListMetadataVersion: number;
                    messageSecret: any;
                };
                interactiveMessage: any;
            };
        };
    } | {
        key: {
            id: string;
            remoteJid: string;
            fromMe: boolean;
        };
        message: {
            messageContextInfo: {
                messageSecret: Buffer;
            };
            groupStatusMessageV2: {
                message: any;
            };
        };
    }>;
    handlePayment(content: any, quoted?: any): Promise<{
        requestPaymentMessage: {
            expiryTimestamp: any;
            amount1000: any;
            currencyCodeIso4217: any;
            requestFrom: any;
            noteMessage: any;
            background: any;
        };
    }>;
    handleProduct(content: any): Promise<{
        viewOnceMessage: {
            message: {
                interactiveMessage: {
                    body: {
                        text: any;
                    };
                    footer: {
                        text: any;
                    };
                    header: {
                        title: any;
                        hasMediaAttachment: boolean;
                        productMessage: {
                            product: {
                                productImage: any;
                                productId: any;
                                title: any;
                                description: any;
                                currencyCode: any;
                                priceAmount1000: any;
                                retailerId: any;
                                url: any;
                                productImageCount: number;
                            };
                            businessOwnerJid: string;
                        };
                    };
                    nativeFlowMessage: {
                        buttons: any;
                    };
                };
            };
        };
    }>;
    handleInteractive(content: any): Promise<{
        interactiveMessage: any;
    }>;
    handleInteractiveButtons(content: any): Promise<{
        viewOnceMessage: {
            message: {
                messageContextInfo: {
                    deviceListMetadata: {};
                    deviceListMetadataVersion: number;
                    messageSecret: any;
                };
                interactiveMessage: {
                    body: {
                        text: any;
                    };
                    footer: {
                        text: any;
                    };
                    header: any;
                    nativeFlowMessage: {
                        buttons: any;
                    };
                };
            };
        };
    }>;
    handleCarousel(content: any): Promise<{
        viewOnceMessage: {
            message: {
                messageContextInfo: {
                    deviceListMetadata: {};
                    deviceListMetadataVersion: number;
                    messageSecret: any;
                };
                interactiveMessage: any;
            };
        };
    }>;
    handleAlbum(content: any, jid: string, quoted?: any, options?: any): Promise<import("...js").WAMessage>;
    handleEvent(content: any, jid: string, quoted?: any): Promise<import("...js").WAMessage>;
    handlePollResult(content: any, jid: string, quoted?: any): Promise<import("...js").WAMessage>;
    handleGroupStory(content: any, jid: string): Promise<{
        key: {
            id: string;
            remoteJid: string;
            fromMe: boolean;
        };
        message: {
            messageContextInfo: {
                messageSecret: Buffer;
            };
            groupStatusMessageV2: {
                message: any;
            };
        };
    }>;
}
export {};
//# sourceMappingURL=smgss.d.ts.map