import * as $protobuf from "protobufjs";
import Long = require("long");

export namespace proto {

    interface IADVDeviceIdentity extends proto.ADVDeviceIdentity.$Properties {
    }

    class ADVDeviceIdentity {
        constructor(p?: proto.ADVDeviceIdentity.$Properties);
        $unknowns?: Uint8Array[];
        rawId?: (number|null);
        timestamp?: (number|Long|null);
        keyIndex?: (number|null);
        accountType?: (proto.ADVEncryptionType|null);
        deviceType?: (proto.ADVEncryptionType|null);
        static create(properties: proto.ADVDeviceIdentity.$Shape): proto.ADVDeviceIdentity & proto.ADVDeviceIdentity.$Shape;
        static create(properties?: proto.ADVDeviceIdentity.$Properties): proto.ADVDeviceIdentity;
        static encode(m: proto.ADVDeviceIdentity.$Properties, w?: $protobuf.Writer): $protobuf.Writer;
        static decode(r: ($protobuf.Reader|Uint8Array), l?: number): proto.ADVDeviceIdentity & proto.ADVDeviceIdentity.$Shape;
        static fromObject(d: { [k: string]: any }): proto.ADVDeviceIdentity;
        static toObject(m: proto.ADVDeviceIdentity, o?: $protobuf.IConversionOptions): { [k: string]: any };
        toJSON(): { [k: string]: any };
        static getTypeUrl(prefix?: string): string;
    }

    namespace ADVDeviceIdentity {
        interface $Properties {
            rawId?: (number|null);
            timestamp?: (number|Long|null);
            keyIndex?: (number|null);
            accountType?: (proto.ADVEncryptionType|null);
            deviceType?: (proto.ADVEncryptionType|null);
            $unknowns?: Uint8Array[];
        }
        type $Shape = proto.ADVDeviceIdentity.$Properties;
    }

    enum ADVEncryptionType {
        E2EE = 0,
        HOSTED = 1
    }

    interface IADVKeyIndexList extends proto.ADVKeyIndexList.$Properties {
    }

    class ADVKeyIndexList {
        constructor(p?: proto.ADVKeyIndexList.$Properties);
        $unknowns?: Uint8Array[];
        rawId?: (number|null);
        timestamp?: (number|Long|null);
        currentIndex?: (number|null);
        validIndexes: number[];
        accountType?: (proto.ADVEncryptionType|null);
        static create(properties: proto.ADVKeyIndexList.$Shape): proto.ADVKeyIndexList & proto.ADVKeyIndexList.$Shape;
        static create(properties?: proto.ADVKeyIndexList.$Properties): proto.ADVKeyIndexList;
        static encode(m: proto.ADVKeyIndexList.$Properties, w?: $protobuf.Writer): $protobuf.Writer;
        static decode(r: ($protobuf.Reader|Uint8Array), l?: number): proto.ADVKeyIndexList & proto.ADVKeyIndexList.$Shape;
        static fromObject(d: { [k: string]: any }): proto.ADVKeyIndexList;
        static toObject(m: proto.ADVKeyIndexList, o?: $protobuf.IConversionOptions): { [k: string]: any };
        toJSON(): { [k: string]: any };
        static getTypeUrl(prefix?: string): string;
    }

    namespace ADVKeyIndexList {
        interface $Properties {
            rawId?: (number|null);
            timestamp?: (number|Long|null);
            currentIndex?: (number|null);
            validIndexes?: (number[]|null);
            accountType?: (proto.ADVEncryptionType|null);
            $unknowns?: Uint8Array[];
        }
        type $Shape = proto.ADVKeyIndexList.$Properties;
    }

    interface IADVSignedDeviceIdentity extends proto.ADVSignedDeviceIdentity.$Properties {
    }

    class ADVSignedDeviceIdentity {
        constructor(p?: proto.ADVSignedDeviceIdentity.$Properties);
        $unknowns?: Uint8Array[];
        details?: (Uint8Array|null);
        accountSignatureKey?: (Uint8Array|null);
        accountSignature?: (Uint8Array|null);
        deviceSignature?: (Uint8Array|null);
        static create(properties: proto.ADVSignedDeviceIdentity.$Shape): proto.ADVSignedDeviceIdentity & proto.ADVSignedDeviceIdentity.$Shape;
        static create(properties?: proto.ADVSignedDeviceIdentity.$Properties): proto.ADVSignedDeviceIdentity;
        static encode(m: proto.ADVSignedDeviceIdentity.$Properties, w?: $protobuf.Writer): $protobuf.Writer;
        static decode(r: ($protobuf.Reader|Uint8Array), l?: number): proto.ADVSignedDeviceIdentity & proto.ADVSignedDeviceIdentity.$Shape;
        static fromObject(d: { [k: string]: any }): proto.ADVSignedDeviceIdentity;
        static toObject(m: proto.ADVSignedDeviceIdentity, o?: $protobuf.IConversionOptions): { [k: string]: any };
        toJSON(): { [k: string]: any };
        static getTypeUrl(prefix?: string): string;
    }

    namespace ADVSignedDeviceIdentity {
        interface $Properties {
            details?: (Uint8Array|null);
            accountSignatureKey?: (Uint8Array|null);
            accountSignature?: (Uint8Array|null);
            deviceSignature?: (Uint8Array|null);
            $unknowns?: Uint8Array[];
        }
        type $Shape = proto.ADVSignedDeviceIdentity.$Properties;
    }

    interface IADVSignedDeviceIdentityHMAC extends proto.ADVSignedDeviceIdentityHMAC.$Properties {
    }

    class ADVSignedDeviceIdentityHMAC {
        constructor(p?: proto.ADVSignedDeviceIdentityHMAC.$Properties);
        $unknowns?: Uint8Array[];
        details?: (Uint8Array|null);
        hmac?: (Uint8Array|null);
        accountType?: (proto.ADVEncryptionType|null);
        static create(properties: proto.ADVSignedDeviceIdentityHMAC.$Shape): proto.ADVSignedDeviceIdentityHMAC & proto.ADVSignedDeviceIdentityHMAC.$Shape;
        static create(properties?: proto.ADVSignedDeviceIdentityHMAC.$Properties): proto.ADVSignedDeviceIdentityHMAC;
        static encode(m: proto.ADVSignedDeviceIdentityHMAC.$Properties, w?: $protobuf.Writer): $protobuf.Writer;
        static decode(r: ($protobuf.Reader|Uint8Array), l?: number): proto.ADVSignedDeviceIdentityHMAC & proto.ADVSignedDeviceIdentityHMAC.$Shape;
        static fromObject(d: { [k: string]: any }): proto.ADVSignedDeviceIdentityHMAC;
        static toObject(m: proto.ADVSignedDeviceIdentityHMAC, o?: $protobuf.IConversionOptions): { [k: string]: any };
        toJSON(): { [k: string]: any };
        static getTypeUrl(prefix?: string): string;
    }

    namespace ADVSignedDeviceIdentityHMAC {
        interface $Properties {
            details?: (Uint8Array|null);
            hmac?: (Uint8Array|null);
            accountType?: (proto.ADVEncryptionType|null);
            $unknowns?: Uint8Array[];
        }
        type $Shape = proto.ADVSignedDeviceIdentityHMAC.$Properties;
    }

    interface IADVSignedKeyIndexList extends proto.ADVSignedKeyIndexList.$Properties {
    }

    class ADVSignedKeyIndexList {
        constructor(p?: proto.ADVSignedKeyIndexList.$Properties);
        $unknowns?: Uint8Array[];
        details?: (Uint8Array|null);
        accountSignature?: (Uint8Array|null);
        accountSignatureKey?: (Uint8Array|null);
        static create(properties: proto.ADVSignedKeyIndexList.$Shape): proto.ADVSignedKeyIndexList & proto.ADVSignedKeyIndexList.$Shape;
        static create(properties?: proto.ADVSignedKeyIndexList.$Properties): proto.ADVSignedKeyIndexList;
        static encode(m: proto.ADVSignedKeyIndexList.$Properties, w?: $protobuf.Writer): $protobuf.Writer;
        static decode(r: ($protobuf.Reader|Uint8Array), l?: number): proto.ADVSignedKeyIndexList & proto.ADVSignedKeyIndexList.$Shape;
        static fromObject(d: { [k: string]: any }): proto.ADVSignedKeyIndexList;
        static toObject(m: proto.ADVSignedKeyIndexList, o?: $protobuf.IConversionOptions): { [k: string]: any };
        toJSON(): { [k: string]: any };
        static getTypeUrl(prefix?: string): string;
    }

    namespace ADVSignedKeyIndexList {
        interface $Properties {
            details?: (Uint8Array|null);
            accountSignature?: (Uint8Array|null);
            accountSignatureKey?: (Uint8Array|null);
            $unknowns?: Uint8Array[];
        }
        type $Shape = proto.ADVSignedKeyIndexList.$Properties;
    }

    interface IAIHomeState extends proto.AIHomeState.$Properties {
    }

    class AIHomeState {
        constructor(p?: proto.AIHomeState.$Properties);
        $unknowns?: Uint8Array[];
        lastFetchTime?: (number|Long|null);
        capabilityOptions: proto.AIHomeState.AIHomeOption.$Properties[];
        conversationOptions: proto.AIHomeState.AIHomeOption.$Properties[];
        static create(properties: proto.AIHomeState.$Shape): proto.AIHomeState & proto.AIHomeState.$Shape;
        static create(properties?: proto.AIHomeState.$Properties): proto.AIHomeState;
        static encode(m: proto.AIHomeState.$Properties, w?: $protobuf.Writer): $protobuf.Writer;
        static decode(r: ($protobuf.Reader|Uint8Array), l?: number): proto.AIHomeState & proto.AIHomeState.$Shape;
        static fromObject(d: { [k: string]: any }): proto.AIHomeState;
        static toObject(m: proto.AIHomeState, o?: $protobuf.IConversionOptions): { [k: string]: any };
        toJSON(): { [k: string]: any };
        static getTypeUrl(prefix?: string): string;
    }

    namespace AIHomeState {
        interface $Properties {
            lastFetchTime?: (number|Long|null);
            capabilityOptions?: (proto.AIHomeState.AIHomeOption.$Properties[]|null);
            conversationOptions?: (proto.AIHomeState.AIHomeOption.$Properties[]|null);
            $unknowns?: Uint8Array[];
        }
        type $Shape = proto.AIHomeState.$Properties;

        interface IAIHomeOption extends proto.AIHomeState.AIHomeOption.$Properties {
        }

        class AIHomeOption {
            constructor(p?: proto.AIHomeState.AIHomeOption.$Properties);
            $unknowns?: Uint8Array[];
            type?: (proto.AIHomeState.AIHomeOption.AIHomeActionType|null);
            title?: (string|null);
            promptText?: (string|null);
            sessionId?: (string|null);
            imageWdsIdentifier?: (string|null);
            imageTintColor?: (string|null);
            imageBackgroundColor?: (string|null);
            cardTypeId?: (string|null);
            static create(properties: proto.AIHomeState.AIHomeOption.$Shape): proto.AIHomeState.AIHomeOption & proto.AIHomeState.AIHomeOption.$Shape;
            static create(properties?: proto.AIHomeState.AIHomeOption.$Properties): proto.AIHomeState.AIHomeOption;
            static encode(m: proto.AIHomeState.AIHomeOption.$Properties, w?: $protobuf.Writer): $protobuf.Writer;
            static decode(r: ($protobuf.Reader|Uint8Array), l?: number): proto.AIHomeState.AIHomeOption & proto.AIHomeState.AIHomeOption.$Shape;
            static fromObject(d: { [k: string]: any }): proto.AIHomeState.AIHomeOption;
            static toObject(m: proto.AIHomeState.AIHomeOption, o?: $protobuf.IConversionOptions): { [k: string]: any };
            toJSON(): { [k: string]: any };
            static getTypeUrl(prefix?: string): string;
        }

        namespace AIHomeOption {
            interface $Properties {
                type?: (proto.AIHomeState.AIHomeOption.AIHomeActionType|null);
                title?: (string|null);
                promptText?: (string|null);
                sessionId?: (string|null);
                imageWdsIdentifier?: (string|null);
                imageTintColor?: (string|null);
                imageBackgroundColor?: (string|null);
                cardTypeId?: (string|null);
                $unknowns?: Uint8Array[];
            }
            type $Shape = proto.AIHomeState.AIHomeOption.$Properties;

            enum AIHomeActionType {
                PROMPT = 0,
                CREATE_IMAGE = 1,
                ANIMATE_PHOTO = 2,
                ANALYZE_FILE = 3,
                COLLABORATE = 4
            }
        }
    }

    interface IAIMediaCollectionMessage extends proto.AIMediaCollectionMessage.$Properties {
    }

    class AIMediaCollectionMessage {
        constructor(p?: proto.AIMediaCollectionMessage.$Properties);
        $unknowns?: Uint8Array[];
        collectionId?: (string|null);
        expectedMediaCount?: (number|null);
        hasGlobalCaption?: (boolean|null);
        static create(properties: proto.AIMediaCollectionMessage.$Shape): proto.AIMediaCollectionMessage & proto.AIMediaCollectionMessage.$Shape;
        static create(properties?: proto.AIMediaCollectionMessage.$Properties): proto.AIMediaCollectionMessage;
        static encode(m: proto.AIMediaCollectionMessage.$Properties, w?: $protobuf.Writer): $protobuf.Writer;
        static decode(r: ($protobuf.Reader|Uint8Array), l?: number): proto.AIMediaCollectionMessage & proto.AIMediaCollectionMessage.$Shape;
        static fromObject(d: { [k: string]: any }): proto.AIMediaCollectionMessage;
        static toObject(m: proto.AIMediaCollectionMessage, o?: $protobuf.IConversionOptions): { [k: string]: any };
        toJSON(): { [k: string]: any };
        static getTypeUrl(prefix?: string): string;
    }

    namespace AIMediaCollectionMessage {
        interface $Properties {
            collectionId?: (string|null);
            expectedMediaCount?: (number|null);
            hasGlobalCaption?: (boolean|null);
            $unknowns?: Uint8Array[];
        }
        type $Shape = proto.AIMediaCollectionMessage.$Properties;
    }

    interface IAIMediaCollectionMetadata extends proto.AIMediaCollectionMetadata.$Properties {
    }

    class AIMediaCollectionMetadata {
        constructor(p?: proto.AIMediaCollectionMetadata.$Properties);
        $unknowns?: Uint8Array[];
        collectionId?: (string|null);
        uploadOrderIndex?: (number|null);
        static create(properties: proto.AIMediaCollectionMetadata.$Shape): proto.AIMediaCollectionMetadata & proto.AIMediaCollectionMetadata.$Shape;
        static create(properties?: proto.AIMediaCollectionMetadata.$Properties): proto.AIMediaCollectionMetadata;
        static encode(m: proto.AIMediaCollectionMetadata.$Properties, w?: $protobuf.Writer): $protobuf.Writer;
        static decode(r: ($protobuf.Reader|Uint8Array), l?: number): proto.AIMediaCollectionMetadata & proto.AIMediaCollectionMetadata.$Shape;
        static fromObject(d: { [k: string]: any }): proto.AIMediaCollectionMetadata;
        static toObject(m: proto.AIMediaCollectionMetadata, o?: $protobuf.IConversionOptions): { [k: string]: any };
        toJSON(): { [k: string]: any };
        static getTypeUrl(prefix?: string): string;
    }

    namespace AIMediaCollectionMetadata {
        interface $Properties {
            collectionId?: (string|null);
            uploadOrderIndex?: (number|null);
            $unknowns?: Uint8Array[];
        }
        type $Shape = proto.AIMediaCollectionMetadata.$Properties;
    }

    interface IAIQueryFanout extends proto.AIQueryFanout.$Properties {
    }

    class AIQueryFanout {
        constructor(p?: proto.AIQueryFanout.$Properties);
        $unknowns?: Uint8Array[];
        messageKey?: (proto.MessageKey.$Properties|null);
        message?: (proto.Message.$Properties|null);
        timestamp?: (number|Long|null);
        static create(properties: proto.AIQueryFanout.$Shape): proto.AIQueryFanout & proto.AIQueryFanout.$Shape;
        static create(properties?: proto.AIQueryFanout.$Properties): proto.AIQueryFanout;
        static encode(m: proto.AIQueryFanout.$Properties, w?: $protobuf.Writer): $protobuf.Writer;
        static decode(r: ($protobuf.Reader|Uint8Array), l?: number): proto.AIQueryFanout & proto.AIQueryFanout.$Shape;
        static fromObject(d: { [k: string]: any }): proto.AIQueryFanout;
        static toObject(m: proto.AIQueryFanout, o?: $protobuf.IConversionOptions): { [k: string]: any };
        toJSON(): { [k: string]: any };
        static getTypeUrl(prefix?: string): string;
    }

    namespace AIQueryFanout {
        interface $Properties {
            messageKey?: (proto.MessageKey.$Properties|null);
            message?: (proto.Message.$Properties|null);
            timestamp?: (number|Long|null);
            $unknowns?: Uint8Array[];
        }
        type $Shape = {
          messageKey?: proto.MessageKey.$Shape|null;
          message?: proto.Message.$Shape|null;
          timestamp?: number|Long|null;
          $unknowns?: Uint8Array[];
        };
    }

    interface IAIRegenerateMetadata extends proto.AIRegenerateMetadata.$Properties {
    }

    class AIRegenerateMetadata {
        constructor(p?: proto.AIRegenerateMetadata.$Properties);
        $unknowns?: Uint8Array[];
        messageKey?: (proto.MessageKey.$Properties|null);
        responseTimestampMs?: (number|Long|null);
        static create(properties: proto.AIRegenerateMetadata.$Shape): proto.AIRegenerateMetadata & proto.AIRegenerateMetadata.$Shape;
        static create(properties?: proto.AIRegenerateMetadata.$Properties): proto.AIRegenerateMetadata;
        static encode(m: proto.AIRegenerateMetadata.$Properties, w?: $protobuf.Writer): $protobuf.Writer;
        static decode(r: ($protobuf.Reader|Uint8Array), l?: number): proto.AIRegenerateMetadata & proto.AIRegenerateMetadata.$Shape;
        static fromObject(d: { [k: string]: any }): proto.AIRegenerateMetadata;
        static toObject(m: proto.AIRegenerateMetadata, o?: $protobuf.IConversionOptions): { [k: string]: any };
        toJSON(): { [k: string]: any };
        static getTypeUrl(prefix?: string): string;
    }

    namespace AIRegenerateMetadata {
        interface $Properties {
            messageKey?: (proto.MessageKey.$Properties|null);
            responseTimestampMs?: (number|Long|null);
            $unknowns?: Uint8Array[];
        }
        type $Shape = proto.AIRegenerateMetadata.$Properties;
    }

    interface IAIRichResponseCodeMetadata extends proto.AIRichResponseCodeMetadata.$Properties {
    }

    class AIRichResponseCodeMetadata {
        constructor(p?: proto.AIRichResponseCodeMetadata.$Properties);
        $unknowns?: Uint8Array[];
        codeLanguage?: (string|null);
        codeBlocks: proto.AIRichResponseCodeMetadata.AIRichResponseCodeBlock.$Properties[];
        static create(properties: proto.AIRichResponseCodeMetadata.$Shape): proto.AIRichResponseCodeMetadata & proto.AIRichResponseCodeMetadata.$Shape;
        static create(properties?: proto.AIRichResponseCodeMetadata.$Properties): proto.AIRichResponseCodeMetadata;
        static encode(m: proto.AIRichResponseCodeMetadata.$Properties, w?: $protobuf.Writer): $protobuf.Writer;
        static decode(r: ($protobuf.Reader|Uint8Array), l?: number): proto.AIRichResponseCodeMetadata & proto.AIRichResponseCodeMetadata.$Shape;
        static fromObject(d: { [k: string]: any }): proto.AIRichResponseCodeMetadata;
        static toObject(m: proto.AIRichResponseCodeMetadata, o?: $protobuf.IConversionOptions): { [k: string]: any };
        toJSON(): { [k: string]: any };
        static getTypeUrl(prefix?: string): string;
    }

    namespace AIRichResponseCodeMetadata {
        interface $Properties {
            codeLanguage?: (string|null);
            codeBlocks?: (proto.AIRichResponseCodeMetadata.AIRichResponseCodeBlock.$Properties[]|null);
            $unknowns?: Uint8Array[];
        }
        type $Shape = proto.AIRichResponseCodeMetadata.$Properties;

        interface IAIRichResponseCodeBlock extends proto.AIRichResponseCodeMetadata.AIRichResponseCodeBlock.$Properties {
        }

        class AIRichResponseCodeBlock {
            constructor(p?: proto.AIRichResponseCodeMetadata.AIRichResponseCodeBlock.$Properties);
            $unknowns?: Uint8Array[];
            highlightType?: (proto.AIRichResponseCodeMetadata.AIRichResponseCodeHighlightType|null);
            codeContent?: (string|null);
            static create(properties: proto.AIRichResponseCodeMetadata.AIRichResponseCodeBlock.$Shape): proto.AIRichResponseCodeMetadata.AIRichResponseCodeBlock & proto.AIRichResponseCodeMetadata.AIRichResponseCodeBlock.$Shape;
            static create(properties?: proto.AIRichResponseCodeMetadata.AIRichResponseCodeBlock.$Properties): proto.AIRichResponseCodeMetadata.AIRichResponseCodeBlock;
            static encode(m: proto.AIRichResponseCodeMetadata.AIRichResponseCodeBlock.$Properties, w?: $protobuf.Writer): $protobuf.Writer;
            static decode(r: ($protobuf.Reader|Uint8Array), l?: number): proto.AIRichResponseCodeMetadata.AIRichResponseCodeBlock & proto.AIRichResponseCodeMetadata.AIRichResponseCodeBlock.$Shape;
            static fromObject(d: { [k: string]: any }): proto.AIRichResponseCodeMetadata.AIRichResponseCodeBlock;
            static toObject(m: proto.AIRichResponseCodeMetadata.AIRichResponseCodeBlock, o?: $protobuf.IConversionOptions): { [k: string]: any };
            toJSON(): { [k: string]: any };
            static getTypeUrl(prefix?: string): string;
        }

        namespace AIRichResponseCodeBlock {
            interface $Properties {
                highlightType?: (proto.AIRichResponseCodeMetadata.AIRichResponseCodeHighlightType|null);
                codeContent?: (string|null);
                $unknowns?: Uint8Array[];
            }
            type $Shape = proto.AIRichResponseCodeMetadata.AIRichResponseCodeBlock.$Properties;
        }

        enum AIRichResponseCodeHighlightType {
            AI_RICH_RESPONSE_CODE_HIGHLIGHT_DEFAULT = 0,
            AI_RICH_RESPONSE_CODE_HIGHLIGHT_KEYWORD = 1,
            AI_RICH_RESPONSE_CODE_HIGHLIGHT_METHOD = 2,
            AI_RICH_RESPONSE_CODE_HIGHLIGHT_STRING = 3,
            AI_RICH_RESPONSE_CODE_HIGHLIGHT_NUMBER = 4,
            AI_RICH_RESPONSE_CODE_HIGHLIGHT_COMMENT = 5
        }
    }

    interface IAIRichResponseContentItemsMetadata extends proto.AIRichResponseContentItemsMetadata.$Properties {
    }

    class AIRichResponseContentItemsMetadata {
        constructor(p?: proto.AIRichResponseContentItemsMetadata.$Properties);
        $unknowns?: Uint8Array[];
        itemsMetadata: proto.AIRichResponseContentItemsMetadata.AIRichResponseContentItemMetadata.$Properties[];
        contentType?: (proto.AIRichResponseContentItemsMetadata.ContentType|null);
        static create(properties: proto.AIRichResponseContentItemsMetadata.$Shape): proto.AIRichResponseContentItemsMetadata & proto.AIRichResponseContentItemsMetadata.$Shape;
        static create(properties?: proto.AIRichResponseContentItemsMetadata.$Properties): proto.AIRichResponseContentItemsMetadata;
        static encode(m: proto.AIRichResponseContentItemsMetadata.$Properties, w?: $protobuf.Writer): $protobuf.Writer;
        static decode(r: ($protobuf.Reader|Uint8Array), l?: number): proto.AIRichResponseContentItemsMetadata & proto.AIRichResponseContentItemsMetadata.$Shape;
        static fromObject(d: { [k: string]: any }): proto.AIRichResponseContentItemsMetadata;
        static toObject(m: proto.AIRichResponseContentItemsMetadata, o?: $protobuf.IConversionOptions): { [k: string]: any };
        toJSON(): { [k: string]: any };
        static getTypeUrl(prefix?: string): string;
    }

    namespace AIRichResponseContentItemsMetadata {
        interface $Properties {
            itemsMetadata?: (proto.AIRichResponseContentItemsMetadata.AIRichResponseContentItemMetadata.$Properties[]|null);
            contentType?: (proto.AIRichResponseContentItemsMetadata.ContentType|null);
            $unknowns?: Uint8Array[];
        }
        type $Shape = {
          itemsMetadata?: proto.AIRichResponseContentItemsMetadata.AIRichResponseContentItemMetadata.$Shape[]|null;
          contentType?: proto.AIRichResponseContentItemsMetadata.ContentType|null;
          $unknowns?: Uint8Array[];
        };

        interface IAIRichResponseContentItemMetadata extends proto.AIRichResponseContentItemsMetadata.AIRichResponseContentItemMetadata.$Properties {
        }

        class AIRichResponseContentItemMetadata {
            constructor(p?: proto.AIRichResponseContentItemsMetadata.AIRichResponseContentItemMetadata.$Properties);
            $unknowns?: Uint8Array[];
            reelItem?: (proto.AIRichResponseContentItemsMetadata.AIRichResponseReelItem.$Properties|null);
            aIRichResponseContentItem?: "reelItem";
            static create(properties: proto.AIRichResponseContentItemsMetadata.AIRichResponseContentItemMetadata.$Shape): proto.AIRichResponseContentItemsMetadata.AIRichResponseContentItemMetadata & proto.AIRichResponseContentItemsMetadata.AIRichResponseContentItemMetadata.$Shape;
            static create(properties?: proto.AIRichResponseContentItemsMetadata.AIRichResponseContentItemMetadata.$Properties): proto.AIRichResponseContentItemsMetadata.AIRichResponseContentItemMetadata;
            static encode(m: proto.AIRichResponseContentItemsMetadata.AIRichResponseContentItemMetadata.$Properties, w?: $protobuf.Writer): $protobuf.Writer;
            static decode(r: ($protobuf.Reader|Uint8Array), l?: number): proto.AIRichResponseContentItemsMetadata.AIRichResponseContentItemMetadata & proto.AIRichResponseContentItemsMetadata.AIRichResponseContentItemMetadata.$Shape;
            static fromObject(d: { [k: string]: any }): proto.AIRichResponseContentItemsMetadata.AIRichResponseContentItemMetadata;
            static toObject(m: proto.AIRichResponseContentItemsMetadata.AIRichResponseContentItemMetadata, o?: $protobuf.IConversionOptions): { [k: string]: any };
            toJSON(): { [k: string]: any };
            static getTypeUrl(prefix?: string): string;
        }

        namespace AIRichResponseContentItemMetadata {
            interface $Properties {
                reelItem?: (proto.AIRichResponseContentItemsMetadata.AIRichResponseReelItem.$Properties|null);
                aIRichResponseContentItem?: "reelItem";
                $unknowns?: Uint8Array[];
            }
            type $Shape = {
              reelItem?: proto.AIRichResponseContentItemsMetadata.AIRichResponseReelItem.$Shape|null;
              $unknowns?: Uint8Array[];
            } & (
              ({ aIRichResponseContentItem?: undefined; reelItem?: null }|{ aIRichResponseContentItem?: "reelItem"; reelItem: proto.AIRichResponseContentItemsMetadata.AIRichResponseReelItem.$Shape })
            );
        }

        interface IAIRichResponseReelItem extends proto.AIRichResponseContentItemsMetadata.AIRichResponseReelItem.$Properties {
        }

        class AIRichResponseReelItem {
            constructor(p?: proto.AIRichResponseContentItemsMetadata.AIRichResponseReelItem.$Properties);
            $unknowns?: Uint8Array[];
            title?: (string|null);
            profileIconUrl?: (string|null);
            thumbnailUrl?: (string|null);
            videoUrl?: (string|null);
            static create(properties: proto.AIRichResponseContentItemsMetadata.AIRichResponseReelItem.$Shape): proto.AIRichResponseContentItemsMetadata.AIRichResponseReelItem & proto.AIRichResponseContentItemsMetadata.AIRichResponseReelItem.$Shape;
            static create(properties?: proto.AIRichResponseContentItemsMetadata.AIRichResponseReelItem.$Properties): proto.AIRichResponseContentItemsMetadata.AIRichResponseReelItem;
            static encode(m: proto.AIRichResponseContentItemsMetadata.AIRichResponseReelItem.$Properties, w?: $protobuf.Writer): $protobuf.Writer;
            static decode(r: ($protobuf.Reader|Uint8Array), l?: number): proto.AIRichResponseContentItemsMetadata.AIRichResponseReelItem & proto.AIRichResponseContentItemsMetadata.AIRichResponseReelItem.$Shape;
            static fromObject(d: { [k: string]: any }): proto.AIRichResponseContentItemsMetadata.AIRichResponseReelItem;
            static toObject(m: proto.AIRichResponseContentItemsMetadata.AIRichResponseReelItem, o?: $protobuf.IConversionOptions): { [k: string]: any };
            toJSON(): { [k: string]: any };
            static getTypeUrl(prefix?: string): string;
        }

        namespace AIRichResponseReelItem {
            interface $Properties {
                title?: (string|null);
                profileIconUrl?: (string|null);
                thumbnailUrl?: (string|null);
                videoUrl?: (string|null);
                $unknowns?: Uint8Array[];
            }
            type $Shape = proto.AIRichResponseContentItemsMetadata.AIRichResponseReelItem.$Properties;
        }

        enum ContentType {
            DEFAULT = 0,
            CAROUSEL = 1
        }
    }

    interface IAIRichResponseDynamicMetadata extends proto.AIRichResponseDynamicMetadata.$Properties {
    }

    class AIRichResponseDynamicMetadata {
        constructor(p?: proto.AIRichResponseDynamicMetadata.$Properties);
        $unknowns?: Uint8Array[];
        type?: (proto.AIRichResponseDynamicMetadata.AIRichResponseDynamicMetadataType|null);
        version?: (number|Long|null);
        url?: (string|null);
        loopCount?: (number|null);
        static create(properties: proto.AIRichResponseDynamicMetadata.$Shape): proto.AIRichResponseDynamicMetadata & proto.AIRichResponseDynamicMetadata.$Shape;
        static create(properties?: proto.AIRichResponseDynamicMetadata.$Properties): proto.AIRichResponseDynamicMetadata;
        static encode(m: proto.AIRichResponseDynamicMetadata.$Properties, w?: $protobuf.Writer): $protobuf.Writer;
        static decode(r: ($protobuf.Reader|Uint8Array), l?: number): proto.AIRichResponseDynamicMetadata & proto.AIRichResponseDynamicMetadata.$Shape;
        static fromObject(d: { [k: string]: any }): proto.AIRichResponseDynamicMetadata;
        static toObject(m: proto.AIRichResponseDynamicMetadata, o?: $protobuf.IConversionOptions): { [k: string]: any };
        toJSON(): { [k: string]: any };
        static getTypeUrl(prefix?: string): string;
    }

    namespace AIRichResponseDynamicMetadata {
        interface $Properties {
            type?: (proto.AIRichResponseDynamicMetadata.AIRichResponseDynamicMetadataType|null);
            version?: (number|Long|null);
            url?: (string|null);
            loopCount?: (number|null);
            $unknowns?: Uint8Array[];
        }
        type $Shape = proto.AIRichResponseDynamicMetadata.$Properties;

        enum AIRichResponseDynamicMetadataType {
            AI_RICH_RESPONSE_DYNAMIC_METADATA_TYPE_UNKNOWN = 0,
            AI_RICH_RESPONSE_DYNAMIC_METADATA_TYPE_IMAGE = 1,
            AI_RICH_RESPONSE_DYNAMIC_METADATA_TYPE_GIF = 2
        }
    }

    interface IAIRichResponseGridImageMetadata extends proto.AIRichResponseGridImageMetadata.$Properties {
    }

    class AIRichResponseGridImageMetadata {
        constructor(p?: proto.AIRichResponseGridImageMetadata.$Properties);
        $unknowns?: Uint8Array[];
        gridImageUrl?: (proto.AIRichResponseImageURL.$Properties|null);
        imageUrls: proto.AIRichResponseImageURL.$Properties[];
        static create(properties: proto.AIRichResponseGridImageMetadata.$Shape): proto.AIRichResponseGridImageMetadata & proto.AIRichResponseGridImageMetadata.$Shape;
        static create(properties?: proto.AIRichResponseGridImageMetadata.$Properties): proto.AIRichResponseGridImageMetadata;
        static encode(m: proto.AIRichResponseGridImageMetadata.$Properties, w?: $protobuf.Writer): $protobuf.Writer;
        static decode(r: ($protobuf.Reader|Uint8Array), l?: number): proto.AIRichResponseGridImageMetadata & proto.AIRichResponseGridImageMetadata.$Shape;
        static fromObject(d: { [k: string]: any }): proto.AIRichResponseGridImageMetadata;
        static toObject(m: proto.AIRichResponseGridImageMetadata, o?: $protobuf.IConversionOptions): { [k: string]: any };
        toJSON(): { [k: string]: any };
        static getTypeUrl(prefix?: string): string;
    }

    namespace AIRichResponseGridImageMetadata {
        interface $Properties {
            gridImageUrl?: (proto.AIRichResponseImageURL.$Properties|null);
            imageUrls?: (proto.AIRichResponseImageURL.$Properties[]|null);
            $unknowns?: Uint8Array[];
        }
        type $Shape = proto.AIRichResponseGridImageMetadata.$Properties;
    }

    interface IAIRichResponseImageURL extends proto.AIRichResponseImageURL.$Properties {
    }

    class AIRichResponseImageURL {
        constructor(p?: proto.AIRichResponseImageURL.$Properties);
        $unknowns?: Uint8Array[];
        imagePreviewUrl?: (string|null);
        imageHighResUrl?: (string|null);
        sourceUrl?: (string|null);
        static create(properties: proto.AIRichResponseImageURL.$Shape): proto.AIRichResponseImageURL & proto.AIRichResponseImageURL.$Shape;
        static create(properties?: proto.AIRichResponseImageURL.$Properties): proto.AIRichResponseImageURL;
        static encode(m: proto.AIRichResponseImageURL.$Properties, w?: $protobuf.Writer): $protobuf.Writer;
        static decode(r: ($protobuf.Reader|Uint8Array), l?: number): proto.AIRichResponseImageURL & proto.AIRichResponseImageURL.$Shape;
        static fromObject(d: { [k: string]: any }): proto.AIRichResponseImageURL;
        static toObject(m: proto.AIRichResponseImageURL, o?: $protobuf.IConversionOptions): { [k: string]: any };
        toJSON(): { [k: string]: any };
        static getTypeUrl(prefix?: string): string;
    }

    namespace AIRichResponseImageURL {
        interface $Properties {
            imagePreviewUrl?: (string|null);
            imageHighResUrl?: (string|null);
            sourceUrl?: (string|null);
            $unknowns?: Uint8Array[];
        }
        type $Shape = proto.AIRichResponseImageURL.$Properties;
    }

    interface IAIRichResponseInlineImageMetadata extends proto.AIRichResponseInlineImageMetadata.$Properties {
    }

    class AIRichResponseInlineImageMetadata {
        constructor(p?: proto.AIRichResponseInlineImageMetadata.$Properties);
        $unknowns?: Uint8Array[];
        imageUrl?: (proto.AIRichResponseImageURL.$Properties|null);
        imageText?: (string|null);
        alignment?: (proto.AIRichResponseInlineImageMetadata.AIRichResponseImageAlignment|null);
        tapLinkUrl?: (string|null);
        static create(properties: proto.AIRichResponseInlineImageMetadata.$Shape): proto.AIRichResponseInlineImageMetadata & proto.AIRichResponseInlineImageMetadata.$Shape;
        static create(properties?: proto.AIRichResponseInlineImageMetadata.$Properties): proto.AIRichResponseInlineImageMetadata;
        static encode(m: proto.AIRichResponseInlineImageMetadata.$Properties, w?: $protobuf.Writer): $protobuf.Writer;
        static decode(r: ($protobuf.Reader|Uint8Array), l?: number): proto.AIRichResponseInlineImageMetadata & proto.AIRichResponseInlineImageMetadata.$Shape;
        static fromObject(d: { [k: string]: any }): proto.AIRichResponseInlineImageMetadata;
        static toObject(m: proto.AIRichResponseInlineImageMetadata, o?: $protobuf.IConversionOptions): { [k: string]: any };
        toJSON(): { [k: string]: any };
        static getTypeUrl(prefix?: string): string;
    }

    namespace AIRichResponseInlineImageMetadata {
        interface $Properties {
            imageUrl?: (proto.AIRichResponseImageURL.$Properties|null);
            imageText?: (string|null);
            alignment?: (proto.AIRichResponseInlineImageMetadata.AIRichResponseImageAlignment|null);
            tapLinkUrl?: (string|null);
            $unknowns?: Uint8Array[];
        }
        type $Shape = proto.AIRichResponseInlineImageMetadata.$Properties;

        enum AIRichResponseImageAlignment {
            AI_RICH_RESPONSE_IMAGE_LAYOUT_LEADING_ALIGNED = 0,
            AI_RICH_RESPONSE_IMAGE_LAYOUT_TRAILING_ALIGNED = 1,
            AI_RICH_RESPONSE_IMAGE_LAYOUT_CENTER_ALIGNED = 2
        }
    }

    interface IAIRichResponseLatexMetadata extends proto.AIRichResponseLatexMetadata.$Properties {
    }

    class AIRichResponseLatexMetadata {
        constructor(p?: proto.AIRichResponseLatexMetadata.$Properties);
        $unknowns?: Uint8Array[];
        text?: (string|null);
        expressions: proto.AIRichResponseLatexMetadata.AIRichResponseLatexExpression.$Properties[];
        static create(properties: proto.AIRichResponseLatexMetadata.$Shape): proto.AIRichResponseLatexMetadata & proto.AIRichResponseLatexMetadata.$Shape;
        static create(properties?: proto.AIRichResponseLatexMetadata.$Properties): proto.AIRichResponseLatexMetadata;
        static encode(m: proto.AIRichResponseLatexMetadata.$Properties, w?: $protobuf.Writer): $protobuf.Writer;
        static decode(r: ($protobuf.Reader|Uint8Array), l?: number): proto.AIRichResponseLatexMetadata & proto.AIRichResponseLatexMetadata.$Shape;
        static fromObject(d: { [k: string]: any }): proto.AIRichResponseLatexMetadata;
        static toObject(m: proto.AIRichResponseLatexMetadata, o?: $protobuf.IConversionOptions): { [k: string]: any };
        toJSON(): { [k: string]: any };
        static getTypeUrl(prefix?: string): string;
    }

    namespace AIRichResponseLatexMetadata {
        interface $Properties {
            text?: (string|null);
            expressions?: (proto.AIRichResponseLatexMetadata.AIRichResponseLatexExpression.$Properties[]|null);
            $unknowns?: Uint8Array[];
        }
        type $Shape = proto.AIRichResponseLatexMetadata.$Properties;

        interface IAIRichResponseLatexExpression extends proto.AIRichResponseLatexMetadata.AIRichResponseLatexExpression.$Properties {
        }

        class AIRichResponseLatexExpression {
            constructor(p?: proto.AIRichResponseLatexMetadata.AIRichResponseLatexExpression.$Properties);
            $unknowns?: Uint8Array[];
            latexExpression?: (string|null);
            url?: (string|null);
            width?: (number|null);
            height?: (number|null);
            fontHeight?: (number|null);
            imageTopPadding?: (number|null);
            imageLeadingPadding?: (number|null);
            imageBottomPadding?: (number|null);
            imageTrailingPadding?: (number|null);
            static create(properties: proto.AIRichResponseLatexMetadata.AIRichResponseLatexExpression.$Shape): proto.AIRichResponseLatexMetadata.AIRichResponseLatexExpression & proto.AIRichResponseLatexMetadata.AIRichResponseLatexExpression.$Shape;
            static create(properties?: proto.AIRichResponseLatexMetadata.AIRichResponseLatexExpression.$Properties): proto.AIRichResponseLatexMetadata.AIRichResponseLatexExpression;
            static encode(m: proto.AIRichResponseLatexMetadata.AIRichResponseLatexExpression.$Properties, w?: $protobuf.Writer): $protobuf.Writer;
            static decode(r: ($protobuf.Reader|Uint8Array), l?: number): proto.AIRichResponseLatexMetadata.AIRichResponseLatexExpression & proto.AIRichResponseLatexMetadata.AIRichResponseLatexExpression.$Shape;
            static fromObject(d: { [k: string]: any }): proto.AIRichResponseLatexMetadata.AIRichResponseLatexExpression;
            static toObject(m: proto.AIRichResponseLatexMetadata.AIRichResponseLatexExpression, o?: $protobuf.IConversionOptions): { [k: string]: any };
            toJSON(): { [k: string]: any };
            static getTypeUrl(prefix?: string): string;
        }

        namespace AIRichResponseLatexExpression {
            interface $Properties {
                latexExpression?: (string|null);
                url?: (string|null);
                width?: (number|null);
                height?: (number|null);
                fontHeight?: (number|null);
                imageTopPadding?: (number|null);
                imageLeadingPadding?: (number|null);
                imageBottomPadding?: (number|null);
                imageTrailingPadding?: (number|null);
                $unknowns?: Uint8Array[];
            }
            type $Shape = proto.AIRichResponseLatexMetadata.AIRichResponseLatexExpression.$Properties;
        }
    }

    interface IAIRichResponseMapMetadata extends proto.AIRichResponseMapMetadata.$Properties {
    }

    class AIRichResponseMapMetadata {
        constructor(p?: proto.AIRichResponseMapMetadata.$Properties);
        $unknowns?: Uint8Array[];
        centerLatitude?: (number|null);
        centerLongitude?: (number|null);
        latitudeDelta?: (number|null);
        longitudeDelta?: (number|null);
        annotations: proto.AIRichResponseMapMetadata.AIRichResponseMapAnnotation.$Properties[];
        showInfoList?: (boolean|null);
        static create(properties: proto.AIRichResponseMapMetadata.$Shape): proto.AIRichResponseMapMetadata & proto.AIRichResponseMapMetadata.$Shape;
        static create(properties?: proto.AIRichResponseMapMetadata.$Properties): proto.AIRichResponseMapMetadata;
        static encode(m: proto.AIRichResponseMapMetadata.$Properties, w?: $protobuf.Writer): $protobuf.Writer;
        static decode(r: ($protobuf.Reader|Uint8Array), l?: number): proto.AIRichResponseMapMetadata & proto.AIRichResponseMapMetadata.$Shape;
        static fromObject(d: { [k: string]: any }): proto.AIRichResponseMapMetadata;
        static toObject(m: proto.AIRichResponseMapMetadata, o?: $protobuf.IConversionOptions): { [k: string]: any };
        toJSON(): { [k: string]: any };
        static getTypeUrl(prefix?: string): string;
    }

    namespace AIRichResponseMapMetadata {
        interface $Properties {
            centerLatitude?: (number|null);
            centerLongitude?: (number|null);
            latitudeDelta?: (number|null);
            longitudeDelta?: (number|null);
            annotations?: (proto.AIRichResponseMapMetadata.AIRichResponseMapAnnotation.$Properties[]|null);
            showInfoList?: (boolean|null);
            $unknowns?: Uint8Array[];
        }
        type $Shape = proto.AIRichResponseMapMetadata.$Properties;

        interface IAIRichResponseMapAnnotation extends proto.AIRichResponseMapMetadata.AIRichResponseMapAnnotation.$Properties {
        }

        class AIRichResponseMapAnnotation {
            constructor(p?: proto.AIRichResponseMapMetadata.AIRichResponseMapAnnotation.$Properties);
            $unknowns?: Uint8Array[];
            annotationNumber?: (number|null);
            latitude?: (number|null);
            longitude?: (number|null);
            title?: (string|null);
            body?: (string|null);
            static create(properties: proto.AIRichResponseMapMetadata.AIRichResponseMapAnnotation.$Shape): proto.AIRichResponseMapMetadata.AIRichResponseMapAnnotation & proto.AIRichResponseMapMetadata.AIRichResponseMapAnnotation.$Shape;
            static create(properties?: proto.AIRichResponseMapMetadata.AIRichResponseMapAnnotation.$Properties): proto.AIRichResponseMapMetadata.AIRichResponseMapAnnotation;
            static encode(m: proto.AIRichResponseMapMetadata.AIRichResponseMapAnnotation.$Properties, w?: $protobuf.Writer): $protobuf.Writer;
            static decode(r: ($protobuf.Reader|Uint8Array), l?: number): proto.AIRichResponseMapMetadata.AIRichResponseMapAnnotation & proto.AIRichResponseMapMetadata.AIRichResponseMapAnnotation.$Shape;
            static fromObject(d: { [k: string]: any }): proto.AIRichResponseMapMetadata.AIRichResponseMapAnnotation;
            static toObject(m: proto.AIRichResponseMapMetadata.AIRichResponseMapAnnotation, o?: $protobuf.IConversionOptions): { [k: string]: any };
            toJSON(): { [k: string]: any };
            static getTypeUrl(prefix?: string): string;
        }

        namespace AIRichResponseMapAnnotation {
            interface $Properties {
                annotationNumber?: (number|null);
                latitude?: (number|null);
                longitude?: (number|null);
                title?: (string|null);
                body?: (string|null);
                $unknowns?: Uint8Array[];
            }
            type $Shape = proto.AIRichResponseMapMetadata.AIRichResponseMapAnnotation.$Properties;
        }
    }

    interface IAIRichResponseMessage extends proto.AIRichResponseMessage.$Properties {
    }

    class AIRichResponseMessage {
        constructor(p?: proto.AIRichResponseMessage.$Properties);
        $unknowns?: Uint8Array[];
        messageType?: (proto.AIRichResponseMessageType|null);
        submessages: proto.AIRichResponseSubMessage.$Properties[];
        unifiedResponse?: (proto.AIRichResponseUnifiedResponse.$Properties|null);
        contextInfo?: (proto.ContextInfo.$Properties|null);
        static create(properties: proto.AIRichResponseMessage.$Shape): proto.AIRichResponseMessage & proto.AIRichResponseMessage.$Shape;
        static create(properties?: proto.AIRichResponseMessage.$Properties): proto.AIRichResponseMessage;
        static encode(m: proto.AIRichResponseMessage.$Properties, w?: $protobuf.Writer): $protobuf.Writer;
        static decode(r: ($protobuf.Reader|Uint8Array), l?: number): proto.AIRichResponseMessage & proto.AIRichResponseMessage.$Shape;
        static fromObject(d: { [k: string]: any }): proto.AIRichResponseMessage;
        static toObject(m: proto.AIRichResponseMessage, o?: $protobuf.IConversionOptions): { [k: string]: any };
        toJSON(): { [k: string]: any };
        static getTypeUrl(prefix?: string): string;
    }

    namespace AIRichResponseMessage {
        interface $Properties {
            messageType?: (proto.AIRichResponseMessageType|null);
            submessages?: (proto.AIRichResponseSubMessage.$Properties[]|null);
            unifiedResponse?: (proto.AIRichResponseUnifiedResponse.$Properties|null);
            contextInfo?: (proto.ContextInfo.$Properties|null);
            $unknowns?: Uint8Array[];
        }
        type $Shape = {
          messageType?: proto.AIRichResponseMessageType|null;
          submessages?: proto.AIRichResponseSubMessage.$Shape[]|null;
          unifiedResponse?: proto.AIRichResponseUnifiedResponse.$Shape|null;
          contextInfo?: proto.ContextInfo.$Shape|null;
          $unknowns?: Uint8Array[];
        };
    }

    enum AIRichResponseMessageType {
        AI_RICH_RESPONSE_TYPE_UNKNOWN = 0,
        AI_RICH_RESPONSE_TYPE_STANDARD = 1
    }

    interface IAIRichResponseSubMessage extends proto.AIRichResponseSubMessage.$Properties {
    }

    class AIRichResponseSubMessage {
        constructor(p?: proto.AIRichResponseSubMessage.$Properties);
        $unknowns?: Uint8Array[];
        messageType?: (proto.AIRichResponseSubMessageType|null);
        gridImageMetadata?: (proto.AIRichResponseGridImageMetadata.$Properties|null);
        messageText?: (string|null);
        imageMetadata?: (proto.AIRichResponseInlineImageMetadata.$Properties|null);
        codeMetadata?: (proto.AIRichResponseCodeMetadata.$Properties|null);
        tableMetadata?: (proto.AIRichResponseTableMetadata.$Properties|null);
        dynamicMetadata?: (proto.AIRichResponseDynamicMetadata.$Properties|null);
        latexMetadata?: (proto.AIRichResponseLatexMetadata.$Properties|null);
        mapMetadata?: (proto.AIRichResponseMapMetadata.$Properties|null);
        contentItemsMetadata?: (proto.AIRichResponseContentItemsMetadata.$Properties|null);
        static create(properties: proto.AIRichResponseSubMessage.$Shape): proto.AIRichResponseSubMessage & proto.AIRichResponseSubMessage.$Shape;
        static create(properties?: proto.AIRichResponseSubMessage.$Properties): proto.AIRichResponseSubMessage;
        static encode(m: proto.AIRichResponseSubMessage.$Properties, w?: $protobuf.Writer): $protobuf.Writer;
        static decode(r: ($protobuf.Reader|Uint8Array), l?: number): proto.AIRichResponseSubMessage & proto.AIRichResponseSubMessage.$Shape;
        static fromObject(d: { [k: string]: any }): proto.AIRichResponseSubMessage;
        static toObject(m: proto.AIRichResponseSubMessage, o?: $protobuf.IConversionOptions): { [k: string]: any };
        toJSON(): { [k: string]: any };
        static getTypeUrl(prefix?: string): string;
    }

    namespace AIRichResponseSubMessage {
        interface $Properties {
            messageType?: (proto.AIRichResponseSubMessageType|null);
            gridImageMetadata?: (proto.AIRichResponseGridImageMetadata.$Properties|null);
            messageText?: (string|null);
            imageMetadata?: (proto.AIRichResponseInlineImageMetadata.$Properties|null);
            codeMetadata?: (proto.AIRichResponseCodeMetadata.$Properties|null);
            tableMetadata?: (proto.AIRichResponseTableMetadata.$Properties|null);
            dynamicMetadata?: (proto.AIRichResponseDynamicMetadata.$Properties|null);
            latexMetadata?: (proto.AIRichResponseLatexMetadata.$Properties|null);
            mapMetadata?: (proto.AIRichResponseMapMetadata.$Properties|null);
            contentItemsMetadata?: (proto.AIRichResponseContentItemsMetadata.$Properties|null);
            $unknowns?: Uint8Array[];
        }
        type $Shape = {
          messageType?: proto.AIRichResponseSubMessageType|null;
          gridImageMetadata?: proto.AIRichResponseGridImageMetadata.$Shape|null;
          messageText?: string|null;
          imageMetadata?: proto.AIRichResponseInlineImageMetadata.$Shape|null;
          codeMetadata?: proto.AIRichResponseCodeMetadata.$Shape|null;
          tableMetadata?: proto.AIRichResponseTableMetadata.$Shape|null;
          dynamicMetadata?: proto.AIRichResponseDynamicMetadata.$Shape|null;
          latexMetadata?: proto.AIRichResponseLatexMetadata.$Shape|null;
          mapMetadata?: proto.AIRichResponseMapMetadata.$Shape|null;
          contentItemsMetadata?: proto.AIRichResponseContentItemsMetadata.$Shape|null;
          $unknowns?: Uint8Array[];
        };
    }

    enum AIRichResponseSubMessageType {
        AI_RICH_RESPONSE_UNKNOWN = 0,
        AI_RICH_RESPONSE_GRID_IMAGE = 1,
        AI_RICH_RESPONSE_TEXT = 2,
        AI_RICH_RESPONSE_INLINE_IMAGE = 3,
        AI_RICH_RESPONSE_TABLE = 4,
        AI_RICH_RESPONSE_CODE = 5,
        AI_RICH_RESPONSE_DYNAMIC = 6,
        AI_RICH_RESPONSE_MAP = 7,
        AI_RICH_RESPONSE_LATEX = 8,
        AI_RICH_RESPONSE_CONTENT_ITEMS = 9
    }

    interface IAIRichResponseTableMetadata extends proto.AIRichResponseTableMetadata.$Properties {
    }

    class AIRichResponseTableMetadata {
        constructor(p?: proto.AIRichResponseTableMetadata.$Properties);
        $unknowns?: Uint8Array[];
        rows: proto.AIRichResponseTableMetadata.AIRichResponseTableRow.$Properties[];
        title?: (string|null);
        static create(properties: proto.AIRichResponseTableMetadata.$Shape): proto.AIRichResponseTableMetadata & proto.AIRichResponseTableMetadata.$Shape;
        static create(properties?: proto.AIRichResponseTableMetadata.$Properties): proto.AIRichResponseTableMetadata;
        static encode(m: proto.AIRichResponseTableMetadata.$Properties, w?: $protobuf.Writer): $protobuf.Writer;
        static decode(r: ($protobuf.Reader|Uint8Array), l?: number): proto.AIRichResponseTableMetadata & proto.AIRichResponseTableMetadata.$Shape;
        static fromObject(d: { [k: string]: any }): proto.AIRichResponseTableMetadata;
        static toObject(m: proto.AIRichResponseTableMetadata, o?: $protobuf.IConversionOptions): { [k: string]: any };
        toJSON(): { [k: string]: any };
        static getTypeUrl(prefix?: string): string;
    }

    namespace AIRichResponseTableMetadata {
        interface $Properties {
            rows?: (proto.AIRichResponseTableMetadata.AIRichResponseTableRow.$Properties[]|null);
            title?: (string|null);
            $unknowns?: Uint8Array[];
        }
        type $Shape = proto.AIRichResponseTableMetadata.$Properties;

        interface IAIRichResponseTableRow extends proto.AIRichResponseTableMetadata.AIRichResponseTableRow.$Properties {
        }

        class AIRichResponseTableRow {
            constructor(p?: proto.AIRichResponseTableMetadata.AIRichResponseTableRow.$Properties);
            $unknowns?: Uint8Array[];
            items: string[];
            isHeading?: (boolean|null);
            static create(properties: proto.AIRichResponseTableMetadata.AIRichResponseTableRow.$Shape): proto.AIRichResponseTableMetadata.AIRichResponseTableRow & proto.AIRichResponseTableMetadata.AIRichResponseTableRow.$Shape;
            static create(properties?: proto.AIRichResponseTableMetadata.AIRichResponseTableRow.$Properties): proto.AIRichResponseTableMetadata.AIRichResponseTableRow;
            static encode(m: proto.AIRichResponseTableMetadata.AIRichResponseTableRow.$Properties, w?: $protobuf.Writer): $protobuf.Writer;
            static decode(r: ($protobuf.Reader|Uint8Array), l?: number): proto.AIRichResponseTableMetadata.AIRichResponseTableRow & proto.AIRichResponseTableMetadata.AIRichResponseTableRow.$Shape;
            static fromObject(d: { [k: string]: any }): proto.AIRichResponseTableMetadata.AIRichResponseTableRow;
            static toObject(m: proto.AIRichResponseTableMetadata.AIRichResponseTableRow, o?: $protobuf.IConversionOptions): { [k: string]: any };
            toJSON(): { [k: string]: any };
            static getTypeUrl(prefix?: string): string;
        }

        namespace AIRichResponseTableRow {
            interface $Properties {
                items?: (string[]|null);
                isHeading?: (boolean|null);
                $unknowns?: Uint8Array[];
            }
            type $Shape = proto.AIRichResponseTableMetadata.AIRichResponseTableRow.$Properties;
        }
    }

    interface IAIRichResponseUnifiedResponse extends proto.AIRichResponseUnifiedResponse.$Properties {
    }

    class AIRichResponseUnifiedResponse {
        constructor(p?: proto.AIRichResponseUnifiedResponse.$Properties);
        $unknowns?: Uint8Array[];
        data?: (Uint8Array|null);
        static create(properties: proto.AIRichResponseUnifiedResponse.$Shape): proto.AIRichResponseUnifiedResponse & proto.AIRichResponseUnifiedResponse.$Shape;
        static create(properties?: proto.AIRichResponseUnifiedResponse.$Properties): proto.AIRichResponseUnifiedResponse;
        static encode(m: proto.AIRichResponseUnifiedResponse.$Properties, w?: $protobuf.Writer): $protobuf.Writer;
        static decode(r: ($protobuf.Reader|Uint8Array), l?: number): proto.AIRichResponseUnifiedResponse & proto.AIRichResponseUnifiedResponse.$Shape;
        static fromObject(d: { [k: string]: any }): proto.AIRichResponseUnifiedResponse;
        static toObject(m: proto.AIRichResponseUnifiedResponse, o?: $protobuf.IConversionOptions): { [k: string]: any };
        toJSON(): { [k: string]: any };
        static getTypeUrl(prefix?: string): string;
    }

    namespace AIRichResponseUnifiedResponse {
        interface $Properties {
            data?: (Uint8Array|null);
            $unknowns?: Uint8Array[];
        }
        type $Shape = proto.AIRichResponseUnifiedResponse.$Properties;
    }

    interface IAIThreadInfo extends proto.AIThreadInfo.$Properties {
    }

    class AIThreadInfo {
        constructor(p?: proto.AIThreadInfo.$Properties);
        $unknowns?: Uint8Array[];
        serverInfo?: (proto.AIThreadInfo.AIThreadServerInfo.$Properties|null);
        clientInfo?: (proto.AIThreadInfo.AIThreadClientInfo.$Properties|null);
        static create(properties: proto.AIThreadInfo.$Shape): proto.AIThreadInfo & proto.AIThreadInfo.$Shape;
        static create(properties?: proto.AIThreadInfo.$Properties): proto.AIThreadInfo;
        static encode(m: proto.AIThreadInfo.$Properties, w?: $protobuf.Writer): $protobuf.Writer;
        static decode(r: ($protobuf.Reader|Uint8Array), l?: number): proto.AIThreadInfo & proto.AIThreadInfo.$Shape;
        static fromObject(d: { [k: string]: any }): proto.AIThreadInfo;
        static toObject(m: proto.AIThreadInfo, o?: $protobuf.IConversionOptions): { [k: string]: any };
        toJSON(): { [k: string]: any };
        static getTypeUrl(prefix?: string): string;
    }

    namespace AIThreadInfo {
        interface $Properties {
            serverInfo?: (proto.AIThreadInfo.AIThreadServerInfo.$Properties|null);
            clientInfo?: (proto.AIThreadInfo.AIThreadClientInfo.$Properties|null);
            $unknowns?: Uint8Array[];
        }
        type $Shape = proto.AIThreadInfo.$Properties;

        interface IAIThreadClientInfo extends proto.AIThreadInfo.AIThreadClientInfo.$Properties {
        }

        class AIThreadClientInfo {
            constructor(p?: proto.AIThreadInfo.AIThreadClientInfo.$Properties);
            $unknowns?: Uint8Array[];
            type?: (proto.AIThreadInfo.AIThreadClientInfo.AIThreadType|null);
            sourceChatJid?: (string|null);
            static create(properties: proto.AIThreadInfo.AIThreadClientInfo.$Shape): proto.AIThreadInfo.AIThreadClientInfo & proto.AIThreadInfo.AIThreadClientInfo.$Shape;
            static create(properties?: proto.AIThreadInfo.AIThreadClientInfo.$Properties): proto.AIThreadInfo.AIThreadClientInfo;
            static encode(m: proto.AIThreadInfo.AIThreadClientInfo.$Properties, w?: $protobuf.Writer): $protobuf.Writer;
            static decode(r: ($protobuf.Reader|Uint8Array), l?: number): proto.AIThreadInfo.AIThreadClientInfo & proto.AIThreadInfo.AIThreadClientInfo.$Shape;
            static fromObject(d: { [k: string]: any }): proto.AIThreadInfo.AIThreadClientInfo;
            static toObject(m: proto.AIThreadInfo.AIThreadClientInfo, o?: $protobuf.IConversionOptions): { [k: string]: any };
            toJSON(): { [k: string]: any };
            static getTypeUrl(prefix?: string): string;
        }

        namespace AIThreadClientInfo {
            interface $Properties {
                type?: (proto.AIThreadInfo.AIThreadClientInfo.AIThreadType|null);
                sourceChatJid?: (string|null);
                $unknowns?: Uint8Array[];
            }
            type $Shape = proto.AIThreadInfo.AIThreadClientInfo.$Properties;

            enum AIThreadType {
                UNKNOWN = 0,
                DEFAULT = 1,
                INCOGNITO = 2,
                SIDE_CHAT = 3
            }
        }

        interface IAIThreadServerInfo extends proto.AIThreadInfo.AIThreadServerInfo.$Properties {
        }

        class AIThreadServerInfo {
            constructor(p?: proto.AIThreadInfo.AIThreadServerInfo.$Properties);
            $unknowns?: Uint8Array[];
            title?: (string|null);
            static create(properties: proto.AIThreadInfo.AIThreadServerInfo.$Shape): proto.AIThreadInfo.AIThreadServerInfo & proto.AIThreadInfo.AIThreadServerInfo.$Shape;
            static create(properties?: proto.AIThreadInfo.AIThreadServerInfo.$Properties): proto.AIThreadInfo.AIThreadServerInfo;
            static encode(m: proto.AIThreadInfo.AIThreadServerInfo.$Properties, w?: $protobuf.Writer): $protobuf.Writer;
            static decode(r: ($protobuf.Reader|Uint8Array), l?: number): proto.AIThreadInfo.AIThreadServerInfo & proto.AIThreadInfo.AIThreadServerInfo.$Shape;
            static fromObject(d: { [k: string]: any }): proto.AIThreadInfo.AIThreadServerInfo;
            static toObject(m: proto.AIThreadInfo.AIThreadServerInfo, o?: $protobuf.IConversionOptions): { [k: string]: any };
            toJSON(): { [k: string]: any };
            static getTypeUrl(prefix?: string): string;
        }

        namespace AIThreadServerInfo {
            interface $Properties {
                title?: (string|null);
                $unknowns?: Uint8Array[];
            }
            type $Shape = proto.AIThreadInfo.AIThreadServerInfo.$Properties;
        }
    }

    interface IAccount extends proto.Account.$Properties {
    }

    class Account {
        constructor(p?: proto.Account.$Properties);
        $unknowns?: Uint8Array[];
        lid?: (string|null);
        username?: (string|null);
        countryCode?: (string|null);
        isUsernameDeleted?: (boolean|null);
        static create(properties: proto.Account.$Shape): proto.Account & proto.Account.$Shape;
        static create(properties?: proto.Account.$Properties): proto.Account;
        static encode(m: proto.Account.$Properties, w?: $protobuf.Writer): $protobuf.Writer;
        static decode(r: ($protobuf.Reader|Uint8Array), l?: number): proto.Account & proto.Account.$Shape;
        static fromObject(d: { [k: string]: any }): proto.Account;
        static toObject(m: proto.Account, o?: $protobuf.IConversionOptions): { [k: string]: any };
        toJSON(): { [k: string]: any };
        static getTypeUrl(prefix?: string): string;
    }

    namespace Account {
        interface $Properties {
            lid?: (string|null);
            username?: (string|null);
            countryCode?: (string|null);
            isUsernameDeleted?: (boolean|null);
            $unknowns?: Uint8Array[];
        }
        type $Shape = proto.Account.$Properties;
    }

    interface IActionLink extends proto.ActionLink.$Properties {
    }

    class ActionLink {
        constructor(p?: proto.ActionLink.$Properties);
        $unknowns?: Uint8Array[];
        url?: (string|null);
        buttonTitle?: (string|null);
        static create(properties: proto.ActionLink.$Shape): proto.ActionLink & proto.ActionLink.$Shape;
        static create(properties?: proto.ActionLink.$Properties): proto.ActionLink;
        static encode(m: proto.ActionLink.$Properties, w?: $protobuf.Writer): $protobuf.Writer;
        static decode(r: ($protobuf.Reader|Uint8Array), l?: number): proto.ActionLink & proto.ActionLink.$Shape;
        static fromObject(d: { [k: string]: any }): proto.ActionLink;
        static toObject(m: proto.ActionLink, o?: $protobuf.IConversionOptions): { [k: string]: any };
        toJSON(): { [k: string]: any };
        static getTypeUrl(prefix?: string): string;
    }

    namespace ActionLink {
        interface $Properties {
            url?: (string|null);
            buttonTitle?: (string|null);
            $unknowns?: Uint8Array[];
        }
        type $Shape = proto.ActionLink.$Properties;
    }

    interface IAutoDownloadSettings extends proto.AutoDownloadSettings.$Properties {
    }

    class AutoDownloadSettings {
        constructor(p?: proto.AutoDownloadSettings.$Properties);
        $unknowns?: Uint8Array[];
        downloadImages?: (boolean|null);
        downloadAudio?: (boolean|null);
        downloadVideo?: (boolean|null);
        downloadDocuments?: (boolean|null);
        static create(properties: proto.AutoDownloadSettings.$Shape): proto.AutoDownloadSettings & proto.AutoDownloadSettings.$Shape;
        static create(properties?: proto.AutoDownloadSettings.$Properties): proto.AutoDownloadSettings;
        static encode(m: proto.AutoDownloadSettings.$Properties, w?: $protobuf.Writer): $protobuf.Writer;
        static decode(r: ($protobuf.Reader|Uint8Array), l?: number): proto.AutoDownloadSettings & proto.AutoDownloadSettings.$Shape;
        static fromObject(d: { [k: string]: any }): proto.AutoDownloadSettings;
        static toObject(m: proto.AutoDownloadSettings, o?: $protobuf.IConversionOptions): { [k: string]: any };
        toJSON(): { [k: string]: any };
        static getTypeUrl(prefix?: string): string;
    }

    namespace AutoDownloadSettings {
        interface $Properties {
            downloadImages?: (boolean|null);
            downloadAudio?: (boolean|null);
            downloadVideo?: (boolean|null);
            downloadDocuments?: (boolean|null);
            $unknowns?: Uint8Array[];
        }
        type $Shape = proto.AutoDownloadSettings.$Properties;
    }

    interface IAvatarUserSettings extends proto.AvatarUserSettings.$Properties {
    }

    class AvatarUserSettings {
        constructor(p?: proto.AvatarUserSettings.$Properties);
        $unknowns?: Uint8Array[];
        fbid?: (string|null);
        password?: (string|null);
        static create(properties: proto.AvatarUserSettings.$Shape): proto.AvatarUserSettings & proto.AvatarUserSettings.$Shape;
        static create(properties?: proto.AvatarUserSettings.$Properties): proto.AvatarUserSettings;
        static encode(m: proto.AvatarUserSettings.$Properties, w?: $protobuf.Writer): $protobuf.Writer;
        static decode(r: ($protobuf.Reader|Uint8Array), l?: number): proto.AvatarUserSettings & proto.AvatarUserSettings.$Shape;
        static fromObject(d: { [k: string]: any }): proto.AvatarUserSettings;
        static toObject(m: proto.AvatarUserSettings, o?: $protobuf.IConversionOptions): { [k: string]: any };
        toJSON(): { [k: string]: any };
        static getTypeUrl(prefix?: string): string;
    }

    namespace AvatarUserSettings {
        interface $Properties {
            fbid?: (string|null);
            password?: (string|null);
            $unknowns?: Uint8Array[];
        }
        type $Shape = proto.AvatarUserSettings.$Properties;
    }

    interface IBizAccountLinkInfo extends proto.BizAccountLinkInfo.$Properties {
    }

    class BizAccountLinkInfo {
        constructor(p?: proto.BizAccountLinkInfo.$Properties);
        $unknowns?: Uint8Array[];
        whatsappBizAcctFbid?: (number|Long|null);
        whatsappAcctNumber?: (string|null);
        issueTime?: (number|Long|null);
        hostStorage?: (proto.BizAccountLinkInfo.HostStorageType|null);
        accountType?: (proto.BizAccountLinkInfo.AccountType|null);
        static create(properties: proto.BizAccountLinkInfo.$Shape): proto.BizAccountLinkInfo & proto.BizAccountLinkInfo.$Shape;
        static create(properties?: proto.BizAccountLinkInfo.$Properties): proto.BizAccountLinkInfo;
        static encode(m: proto.BizAccountLinkInfo.$Properties, w?: $protobuf.Writer): $protobuf.Writer;
        static decode(r: ($protobuf.Reader|Uint8Array), l?: number): proto.BizAccountLinkInfo & proto.BizAccountLinkInfo.$Shape;
        static fromObject(d: { [k: string]: any }): proto.BizAccountLinkInfo;
        static toObject(m: proto.BizAccountLinkInfo, o?: $protobuf.IConversionOptions): { [k: string]: any };
        toJSON(): { [k: string]: any };
        static getTypeUrl(prefix?: string): string;
    }

    namespace BizAccountLinkInfo {
        interface $Properties {
            whatsappBizAcctFbid?: (number|Long|null);
            whatsappAcctNumber?: (string|null);
            issueTime?: (number|Long|null);
            hostStorage?: (proto.BizAccountLinkInfo.HostStorageType|null);
            accountType?: (proto.BizAccountLinkInfo.AccountType|null);
            $unknowns?: Uint8Array[];
        }
        type $Shape = proto.BizAccountLinkInfo.$Properties;

        enum AccountType {
            ENTERPRISE = 0
        }

        enum HostStorageType {
            ON_PREMISE = 0,
            FACEBOOK = 1
        }
    }

    interface IBizAccountPayload extends proto.BizAccountPayload.$Properties {
    }

    class BizAccountPayload {
        constructor(p?: proto.BizAccountPayload.$Properties);
        $unknowns?: Uint8Array[];
        vnameCert?: (proto.VerifiedNameCertificate.$Properties|null);
        bizAcctLinkInfo?: (Uint8Array|null);
        static create(properties: proto.BizAccountPayload.$Shape): proto.BizAccountPayload & proto.BizAccountPayload.$Shape;
        static create(properties?: proto.BizAccountPayload.$Properties): proto.BizAccountPayload;
        static encode(m: proto.BizAccountPayload.$Properties, w?: $protobuf.Writer): $protobuf.Writer;
        static decode(r: ($protobuf.Reader|Uint8Array), l?: number): proto.BizAccountPayload & proto.BizAccountPayload.$Shape;
        static fromObject(d: { [k: string]: any }): proto.BizAccountPayload;
        static toObject(m: proto.BizAccountPayload, o?: $protobuf.IConversionOptions): { [k: string]: any };
        toJSON(): { [k: string]: any };
        static getTypeUrl(prefix?: string): string;
    }

    namespace BizAccountPayload {
        interface $Properties {
            vnameCert?: (proto.VerifiedNameCertificate.$Properties|null);
            bizAcctLinkInfo?: (Uint8Array|null);
            $unknowns?: Uint8Array[];
        }
        type $Shape = proto.BizAccountPayload.$Properties;
    }

    interface IBizIdentityInfo extends proto.BizIdentityInfo.$Properties {
    }

    class BizIdentityInfo {
        constructor(p?: proto.BizIdentityInfo.$Properties);
        $unknowns?: Uint8Array[];
        vlevel?: (proto.BizIdentityInfo.VerifiedLevelValue|null);
        vnameCert?: (proto.VerifiedNameCertificate.$Properties|null);
        signed?: (boolean|null);
        revoked?: (boolean|null);
        hostStorage?: (proto.BizIdentityInfo.HostStorageType|null);
        actualActors?: (proto.BizIdentityInfo.ActualActorsType|null);
        privacyModeTs?: (number|Long|null);
        featureControls?: (number|Long|null);
        static create(properties: proto.BizIdentityInfo.$Shape): proto.BizIdentityInfo & proto.BizIdentityInfo.$Shape;
        static create(properties?: proto.BizIdentityInfo.$Properties): proto.BizIdentityInfo;
        static encode(m: proto.BizIdentityInfo.$Properties, w?: $protobuf.Writer): $protobuf.Writer;
        static decode(r: ($protobuf.Reader|Uint8Array), l?: number): proto.BizIdentityInfo & proto.BizIdentityInfo.$Shape;
        static fromObject(d: { [k: string]: any }): proto.BizIdentityInfo;
        static toObject(m: proto.BizIdentityInfo, o?: $protobuf.IConversionOptions): { [k: string]: any };
        toJSON(): { [k: string]: any };
        static getTypeUrl(prefix?: string): string;
    }

    namespace BizIdentityInfo {
        interface $Properties {
            vlevel?: (proto.BizIdentityInfo.VerifiedLevelValue|null);
            vnameCert?: (proto.VerifiedNameCertificate.$Properties|null);
            signed?: (boolean|null);
            revoked?: (boolean|null);
            hostStorage?: (proto.BizIdentityInfo.HostStorageType|null);
            actualActors?: (proto.BizIdentityInfo.ActualActorsType|null);
            privacyModeTs?: (number|Long|null);
            featureControls?: (number|Long|null);
            $unknowns?: Uint8Array[];
        }
        type $Shape = proto.BizIdentityInfo.$Properties;

        enum ActualActorsType {
            SELF = 0,
            BSP = 1
        }

        enum HostStorageType {
            ON_PREMISE = 0,
            FACEBOOK = 1
        }

        enum VerifiedLevelValue {
            UNKNOWN = 0,
            LOW = 1,
            HIGH = 2
        }
    }

    interface IBotAgeCollectionMetadata extends proto.BotAgeCollectionMetadata.$Properties {
    }

    class BotAgeCollectionMetadata {
        constructor(p?: proto.BotAgeCollectionMetadata.$Properties);
        $unknowns?: Uint8Array[];
        ageCollectionEligible?: (boolean|null);
        shouldTriggerAgeCollectionOnClient?: (boolean|null);
        ageCollectionType?: (proto.BotAgeCollectionMetadata.AgeCollectionType|null);
        static create(properties: proto.BotAgeCollectionMetadata.$Shape): proto.BotAgeCollectionMetadata & proto.BotAgeCollectionMetadata.$Shape;
        static create(properties?: proto.BotAgeCollectionMetadata.$Properties): proto.BotAgeCollectionMetadata;
        static encode(m: proto.BotAgeCollectionMetadata.$Properties, w?: $protobuf.Writer): $protobuf.Writer;
        static decode(r: ($protobuf.Reader|Uint8Array), l?: number): proto.BotAgeCollectionMetadata & proto.BotAgeCollectionMetadata.$Shape;
        static fromObject(d: { [k: string]: any }): proto.BotAgeCollectionMetadata;
        static toObject(m: proto.BotAgeCollectionMetadata, o?: $protobuf.IConversionOptions): { [k: string]: any };
        toJSON(): { [k: string]: any };
        static getTypeUrl(prefix?: string): string;
    }

    namespace BotAgeCollectionMetadata {
        interface $Properties {
            ageCollectionEligible?: (boolean|null);
            shouldTriggerAgeCollectionOnClient?: (boolean|null);
            ageCollectionType?: (proto.BotAgeCollectionMetadata.AgeCollectionType|null);
            $unknowns?: Uint8Array[];
        }
        type $Shape = proto.BotAgeCollectionMetadata.$Properties;

        enum AgeCollectionType {
            O18_BINARY = 0,
            WAFFLE = 1
        }
    }

    interface IBotAgentDeepLinkMetadata extends proto.BotAgentDeepLinkMetadata.$Properties {
    }

    class BotAgentDeepLinkMetadata {
        constructor(p?: proto.BotAgentDeepLinkMetadata.$Properties);
        $unknowns?: Uint8Array[];
        token?: (string|null);
        static create(properties: proto.BotAgentDeepLinkMetadata.$Shape): proto.BotAgentDeepLinkMetadata & proto.BotAgentDeepLinkMetadata.$Shape;
        static create(properties?: proto.BotAgentDeepLinkMetadata.$Properties): proto.BotAgentDeepLinkMetadata;
        static encode(m: proto.BotAgentDeepLinkMetadata.$Properties, w?: $protobuf.Writer): $protobuf.Writer;
        static decode(r: ($protobuf.Reader|Uint8Array), l?: number): proto.BotAgentDeepLinkMetadata & proto.BotAgentDeepLinkMetadata.$Shape;
        static fromObject(d: { [k: string]: any }): proto.BotAgentDeepLinkMetadata;
        static toObject(m: proto.BotAgentDeepLinkMetadata, o?: $protobuf.IConversionOptions): { [k: string]: any };
        toJSON(): { [k: string]: any };
        static getTypeUrl(prefix?: string): string;
    }

    namespace BotAgentDeepLinkMetadata {
        interface $Properties {
            token?: (string|null);
            $unknowns?: Uint8Array[];
        }
        type $Shape = proto.BotAgentDeepLinkMetadata.$Properties;
    }

    interface IBotAgentMetadata extends proto.BotAgentMetadata.$Properties {
    }

    class BotAgentMetadata {
        constructor(p?: proto.BotAgentMetadata.$Properties);
        $unknowns?: Uint8Array[];
        deepLinkMetadata?: (proto.BotAgentDeepLinkMetadata.$Properties|null);
        static create(properties: proto.BotAgentMetadata.$Shape): proto.BotAgentMetadata & proto.BotAgentMetadata.$Shape;
        static create(properties?: proto.BotAgentMetadata.$Properties): proto.BotAgentMetadata;
        static encode(m: proto.BotAgentMetadata.$Properties, w?: $protobuf.Writer): $protobuf.Writer;
        static decode(r: ($protobuf.Reader|Uint8Array), l?: number): proto.BotAgentMetadata & proto.BotAgentMetadata.$Shape;
        static fromObject(d: { [k: string]: any }): proto.BotAgentMetadata;
        static toObject(m: proto.BotAgentMetadata, o?: $protobuf.IConversionOptions): { [k: string]: any };
        toJSON(): { [k: string]: any };
        static getTypeUrl(prefix?: string): string;
    }

    namespace BotAgentMetadata {
        interface $Properties {
            deepLinkMetadata?: (proto.BotAgentDeepLinkMetadata.$Properties|null);
            $unknowns?: Uint8Array[];
        }
        type $Shape = proto.BotAgentMetadata.$Properties;
    }

    interface IBotCapabilityMetadata extends proto.BotCapabilityMetadata.$Properties {
    }

    class BotCapabilityMetadata {
        constructor(p?: proto.BotCapabilityMetadata.$Properties);
        $unknowns?: Uint8Array[];
        capabilities: proto.BotCapabilityMetadata.BotCapabilityType[];
        static create(properties: proto.BotCapabilityMetadata.$Shape): proto.BotCapabilityMetadata & proto.BotCapabilityMetadata.$Shape;
        static create(properties?: proto.BotCapabilityMetadata.$Properties): proto.BotCapabilityMetadata;
        static encode(m: proto.BotCapabilityMetadata.$Properties, w?: $protobuf.Writer): $protobuf.Writer;
        static decode(r: ($protobuf.Reader|Uint8Array), l?: number): proto.BotCapabilityMetadata & proto.BotCapabilityMetadata.$Shape;
        static fromObject(d: { [k: string]: any }): proto.BotCapabilityMetadata;
        static toObject(m: proto.BotCapabilityMetadata, o?: $protobuf.IConversionOptions): { [k: string]: any };
        toJSON(): { [k: string]: any };
        static getTypeUrl(prefix?: string): string;
    }

    namespace BotCapabilityMetadata {
        interface $Properties {
            capabilities?: (proto.BotCapabilityMetadata.BotCapabilityType[]|null);
            $unknowns?: Uint8Array[];
        }
        type $Shape = proto.BotCapabilityMetadata.$Properties;

        enum BotCapabilityType {
            UNKNOWN = 0,
            PROGRESS_INDICATOR = 1,
            RICH_RESPONSE_HEADING = 2,
            RICH_RESPONSE_NESTED_LIST = 3,
            AI_MEMORY = 4,
            RICH_RESPONSE_THREAD_SURFING = 5,
            RICH_RESPONSE_TABLE = 6,
            RICH_RESPONSE_CODE = 7,
            RICH_RESPONSE_STRUCTURED_RESPONSE = 8,
            RICH_RESPONSE_INLINE_IMAGE = 9,
            WA_IG_1P_PLUGIN_RANKING_CONTROL = 10,
            WA_IG_1P_PLUGIN_RANKING_UPDATE_1 = 11,
            WA_IG_1P_PLUGIN_RANKING_UPDATE_2 = 12,
            WA_IG_1P_PLUGIN_RANKING_UPDATE_3 = 13,
            WA_IG_1P_PLUGIN_RANKING_UPDATE_4 = 14,
            WA_IG_1P_PLUGIN_RANKING_UPDATE_5 = 15,
            WA_IG_1P_PLUGIN_RANKING_UPDATE_6 = 16,
            WA_IG_1P_PLUGIN_RANKING_UPDATE_7 = 17,
            WA_IG_1P_PLUGIN_RANKING_UPDATE_8 = 18,
            WA_IG_1P_PLUGIN_RANKING_UPDATE_9 = 19,
            WA_IG_1P_PLUGIN_RANKING_UPDATE_10 = 20,
            RICH_RESPONSE_SUB_HEADING = 21,
            RICH_RESPONSE_GRID_IMAGE = 22,
            AI_STUDIO_UGC_MEMORY = 23,
            RICH_RESPONSE_LATEX = 24,
            RICH_RESPONSE_MAPS = 25,
            RICH_RESPONSE_INLINE_REELS = 26,
            AGENTIC_PLANNING = 27,
            ACCOUNT_LINKING = 28,
            STREAMING_DISAGGREGATION = 29,
            RICH_RESPONSE_GRID_IMAGE_3P = 30,
            RICH_RESPONSE_LATEX_INLINE = 31,
            QUERY_PLAN = 32,
            PROACTIVE_MESSAGE = 33,
            RICH_RESPONSE_UNIFIED_RESPONSE = 34,
            PROMOTION_MESSAGE = 35,
            SIMPLIFIED_PROFILE_PAGE = 36,
            RICH_RESPONSE_SOURCES_IN_MESSAGE = 37,
            RICH_RESPONSE_SIDE_BY_SIDE_SURVEY = 38,
            RICH_RESPONSE_UNIFIED_TEXT_COMPONENT = 39,
            AI_SHARED_MEMORY = 40,
            RICH_RESPONSE_UNIFIED_SOURCES = 41,
            RICH_RESPONSE_UNIFIED_DOMAIN_CITATIONS = 42,
            RICH_RESPONSE_UR_INLINE_REELS_ENABLED = 43,
            RICH_RESPONSE_UR_MEDIA_GRID_ENABLED = 44,
            RICH_RESPONSE_UR_TIMESTAMP_PLACEHOLDER = 45,
            RICH_RESPONSE_IN_APP_SURVEY = 46,
            AI_RESPONSE_MODEL_BRANDING = 47,
            SESSION_TRANSPARENCY_SYSTEM_MESSAGE = 48,
            RICH_RESPONSE_UR_REASONING = 49,
            RICH_RESPONSE_UR_ZEITGEIST_CITATIONS = 50,
            RICH_RESPONSE_UR_ZEITGEIST_CAROUSEL = 51,
            AI_IMAGINE_LOADING_INDICATOR = 52,
            RICH_RESPONSE_UR_IMAGINE = 53,
            AI_IMAGINE_UR_TO_NATIVE_LOADING_INDICATOR = 54,
            RICH_RESPONSE_UR_BLOKS_ENABLED = 55,
            RICH_RESPONSE_INLINE_LINKS_ENABLED = 56,
            RICH_RESPONSE_UR_IMAGINE_VIDEO = 57,
            JSON_PATCH_STREAMING = 58,
            AI_TAB_FORCE_CLIPPY = 59,
            UNIFIED_RESPONSE_EMBEDDED_SCREENS = 60,
            AI_SUBSCRIPTION_ENABLED = 61
        }
    }

    interface IBotCommandMetadata extends proto.BotCommandMetadata.$Properties {
    }

    class BotCommandMetadata {
        constructor(p?: proto.BotCommandMetadata.$Properties);
        $unknowns?: Uint8Array[];
        commandName?: (string|null);
        commandDescription?: (string|null);
        commandPrompt?: (string|null);
        static create(properties: proto.BotCommandMetadata.$Shape): proto.BotCommandMetadata & proto.BotCommandMetadata.$Shape;
        static create(properties?: proto.BotCommandMetadata.$Properties): proto.BotCommandMetadata;
        static encode(m: proto.BotCommandMetadata.$Properties, w?: $protobuf.Writer): $protobuf.Writer;
        static decode(r: ($protobuf.Reader|Uint8Array), l?: number): proto.BotCommandMetadata & proto.BotCommandMetadata.$Shape;
        static fromObject(d: { [k: string]: any }): proto.BotCommandMetadata;
        static toObject(m: proto.BotCommandMetadata, o?: $protobuf.IConversionOptions): { [k: string]: any };
        toJSON(): { [k: string]: any };
        static getTypeUrl(prefix?: string): string;
    }

    namespace BotCommandMetadata {
        interface $Properties {
            commandName?: (string|null);
            commandDescription?: (string|null);
            commandPrompt?: (string|null);
            $unknowns?: Uint8Array[];
        }
        type $Shape = proto.BotCommandMetadata.$Properties;
    }

    interface IBotDocumentMessageMetadata extends proto.BotDocumentMessageMetadata.$Properties {
    }

    class BotDocumentMessageMetadata {
        constructor(p?: proto.BotDocumentMessageMetadata.$Properties);
        $unknowns?: Uint8Array[];
        pluginType?: (proto.BotDocumentMessageMetadata.DocumentPluginType|null);
        static create(properties: proto.BotDocumentMessageMetadata.$Shape): proto.BotDocumentMessageMetadata & proto.BotDocumentMessageMetadata.$Shape;
        static create(properties?: proto.BotDocumentMessageMetadata.$Properties): proto.BotDocumentMessageMetadata;
        static encode(m: proto.BotDocumentMessageMetadata.$Properties, w?: $protobuf.Writer): $protobuf.Writer;
        static decode(r: ($protobuf.Reader|Uint8Array), l?: number): proto.BotDocumentMessageMetadata & proto.BotDocumentMessageMetadata.$Shape;
        static fromObject(d: { [k: string]: any }): proto.BotDocumentMessageMetadata;
        static toObject(m: proto.BotDocumentMessageMetadata, o?: $protobuf.IConversionOptions): { [k: string]: any };
        toJSON(): { [k: string]: any };
        static getTypeUrl(prefix?: string): string;
    }

    namespace BotDocumentMessageMetadata {
        interface $Properties {
            pluginType?: (proto.BotDocumentMessageMetadata.DocumentPluginType|null);
            $unknowns?: Uint8Array[];
        }
        type $Shape = proto.BotDocumentMessageMetadata.$Properties;

        enum DocumentPluginType {
            TEXT_EXTRACTION = 0,
            OCR_AND_IMAGES = 1
        }
    }

    interface IBotFeedbackMessage extends proto.BotFeedbackMessage.$Properties {
    }

    class BotFeedbackMessage {
        constructor(p?: proto.BotFeedbackMessage.$Properties);
        $unknowns?: Uint8Array[];
        messageKey?: (proto.MessageKey.$Properties|null);
        kind?: (proto.BotFeedbackMessage.BotFeedbackKind|null);
        text?: (string|null);
        kindNegative?: (number|Long|null);
        kindPositive?: (number|Long|null);
        kindReport?: (proto.BotFeedbackMessage.ReportKind|null);
        sideBySideSurveyMetadata?: (proto.BotFeedbackMessage.SideBySideSurveyMetadata.$Properties|null);
        static create(properties: proto.BotFeedbackMessage.$Shape): proto.BotFeedbackMessage & proto.BotFeedbackMessage.$Shape;
        static create(properties?: proto.BotFeedbackMessage.$Properties): proto.BotFeedbackMessage;
        static encode(m: proto.BotFeedbackMessage.$Properties, w?: $protobuf.Writer): $protobuf.Writer;
        static decode(r: ($protobuf.Reader|Uint8Array), l?: number): proto.BotFeedbackMessage & proto.BotFeedbackMessage.$Shape;
        static fromObject(d: { [k: string]: any }): proto.BotFeedbackMessage;
        static toObject(m: proto.BotFeedbackMessage, o?: $protobuf.IConversionOptions): { [k: string]: any };
        toJSON(): { [k: string]: any };
        static getTypeUrl(prefix?: string): string;
    }

    namespace BotFeedbackMessage {
        interface $Properties {
            messageKey?: (proto.MessageKey.$Properties|null);
            kind?: (proto.BotFeedbackMessage.BotFeedbackKind|null);
            text?: (string|null);
            kindNegative?: (number|Long|null);
            kindPositive?: (number|Long|null);
            kindReport?: (proto.BotFeedbackMessage.ReportKind|null);
            sideBySideSurveyMetadata?: (proto.BotFeedbackMessage.SideBySideSurveyMetadata.$Properties|null);
            $unknowns?: Uint8Array[];
        }
        type $Shape = proto.BotFeedbackMessage.$Properties;

        enum BotFeedbackKind {
            BOT_FEEDBACK_POSITIVE = 0,
            BOT_FEEDBACK_NEGATIVE_GENERIC = 1,
            BOT_FEEDBACK_NEGATIVE_HELPFUL = 2,
            BOT_FEEDBACK_NEGATIVE_INTERESTING = 3,
            BOT_FEEDBACK_NEGATIVE_ACCURATE = 4,
            BOT_FEEDBACK_NEGATIVE_SAFE = 5,
            BOT_FEEDBACK_NEGATIVE_OTHER = 6,
            BOT_FEEDBACK_NEGATIVE_REFUSED = 7,
            BOT_FEEDBACK_NEGATIVE_NOT_VISUALLY_APPEALING = 8,
            BOT_FEEDBACK_NEGATIVE_NOT_RELEVANT_TO_TEXT = 9,
            BOT_FEEDBACK_NEGATIVE_PERSONALIZED = 10,
            BOT_FEEDBACK_NEGATIVE_CLARITY = 11,
            BOT_FEEDBACK_NEGATIVE_DOESNT_LOOK_LIKE_THE_PERSON = 12,
            BOT_FEEDBACK_NEGATIVE_HALLUCINATION_INTERNAL_ONLY = 13,
            BOT_FEEDBACK_NEGATIVE = 14
        }

        enum BotFeedbackKindMultipleNegative {
            BOT_FEEDBACK_MULTIPLE_NEGATIVE_GENERIC = 1,
            BOT_FEEDBACK_MULTIPLE_NEGATIVE_HELPFUL = 2,
            BOT_FEEDBACK_MULTIPLE_NEGATIVE_INTERESTING = 4,
            BOT_FEEDBACK_MULTIPLE_NEGATIVE_ACCURATE = 8,
            BOT_FEEDBACK_MULTIPLE_NEGATIVE_SAFE = 16,
            BOT_FEEDBACK_MULTIPLE_NEGATIVE_OTHER = 32,
            BOT_FEEDBACK_MULTIPLE_NEGATIVE_REFUSED = 64,
            BOT_FEEDBACK_MULTIPLE_NEGATIVE_NOT_VISUALLY_APPEALING = 128,
            BOT_FEEDBACK_MULTIPLE_NEGATIVE_NOT_RELEVANT_TO_TEXT = 256
        }

        enum BotFeedbackKindMultiplePositive {
            BOT_FEEDBACK_MULTIPLE_POSITIVE_GENERIC = 1
        }

        enum ReportKind {
            NONE = 0,
            GENERIC = 1
        }

        interface ISideBySideSurveyMetadata extends proto.BotFeedbackMessage.SideBySideSurveyMetadata.$Properties {
        }

        class SideBySideSurveyMetadata {
            constructor(p?: proto.BotFeedbackMessage.SideBySideSurveyMetadata.$Properties);
            $unknowns?: Uint8Array[];
            selectedRequestId?: (string|null);
            surveyId?: (number|null);
            simonSessionFbid?: (string|null);
            responseOtid?: (string|null);
            responseTimestampMsString?: (string|null);
            isSelectedResponsePrimary?: (boolean|null);
            messageIdToEdit?: (string|null);
            analyticsData?: (proto.BotFeedbackMessage.SideBySideSurveyMetadata.SideBySideSurveyAnalyticsData.$Properties|null);
            metaAiAnalyticsData?: (proto.BotFeedbackMessage.SideBySideSurveyMetadata.SidebySideSurveyMetaAiAnalyticsData.$Properties|null);
            static create(properties: proto.BotFeedbackMessage.SideBySideSurveyMetadata.$Shape): proto.BotFeedbackMessage.SideBySideSurveyMetadata & proto.BotFeedbackMessage.SideBySideSurveyMetadata.$Shape;
            static create(properties?: proto.BotFeedbackMessage.SideBySideSurveyMetadata.$Properties): proto.BotFeedbackMessage.SideBySideSurveyMetadata;
            static encode(m: proto.BotFeedbackMessage.SideBySideSurveyMetadata.$Properties, w?: $protobuf.Writer): $protobuf.Writer;
            static decode(r: ($protobuf.Reader|Uint8Array), l?: number): proto.BotFeedbackMessage.SideBySideSurveyMetadata & proto.BotFeedbackMessage.SideBySideSurveyMetadata.$Shape;
            static fromObject(d: { [k: string]: any }): proto.BotFeedbackMessage.SideBySideSurveyMetadata;
            static toObject(m: proto.BotFeedbackMessage.SideBySideSurveyMetadata, o?: $protobuf.IConversionOptions): { [k: string]: any };
            toJSON(): { [k: string]: any };
            static getTypeUrl(prefix?: string): string;
        }

        namespace SideBySideSurveyMetadata {
            interface $Properties {
                selectedRequestId?: (string|null);
                surveyId?: (number|null);
                simonSessionFbid?: (string|null);
                responseOtid?: (string|null);
                responseTimestampMsString?: (string|null);
                isSelectedResponsePrimary?: (boolean|null);
                messageIdToEdit?: (string|null);
                analyticsData?: (proto.BotFeedbackMessage.SideBySideSurveyMetadata.SideBySideSurveyAnalyticsData.$Properties|null);
                metaAiAnalyticsData?: (proto.BotFeedbackMessage.SideBySideSurveyMetadata.SidebySideSurveyMetaAiAnalyticsData.$Properties|null);
                $unknowns?: Uint8Array[];
            }
            type $Shape = proto.BotFeedbackMessage.SideBySideSurveyMetadata.$Properties;

            interface ISideBySideSurveyAnalyticsData extends proto.BotFeedbackMessage.SideBySideSurveyMetadata.SideBySideSurveyAnalyticsData.$Properties {
            }

            class SideBySideSurveyAnalyticsData {
                constructor(p?: proto.BotFeedbackMessage.SideBySideSurveyMetadata.SideBySideSurveyAnalyticsData.$Properties);
                $unknowns?: Uint8Array[];
                tessaEvent?: (string|null);
                tessaSessionFbid?: (string|null);
                simonSessionFbid?: (string|null);
                static create(properties: proto.BotFeedbackMessage.SideBySideSurveyMetadata.SideBySideSurveyAnalyticsData.$Shape): proto.BotFeedbackMessage.SideBySideSurveyMetadata.SideBySideSurveyAnalyticsData & proto.BotFeedbackMessage.SideBySideSurveyMetadata.SideBySideSurveyAnalyticsData.$Shape;
                static create(properties?: proto.BotFeedbackMessage.SideBySideSurveyMetadata.SideBySideSurveyAnalyticsData.$Properties): proto.BotFeedbackMessage.SideBySideSurveyMetadata.SideBySideSurveyAnalyticsData;
                static encode(m: proto.BotFeedbackMessage.SideBySideSurveyMetadata.SideBySideSurveyAnalyticsData.$Properties, w?: $protobuf.Writer): $protobuf.Writer;
                static decode(r: ($protobuf.Reader|Uint8Array), l?: number): proto.BotFeedbackMessage.SideBySideSurveyMetadata.SideBySideSurveyAnalyticsData & proto.BotFeedbackMessage.SideBySideSurveyMetadata.SideBySideSurveyAnalyticsData.$Shape;
                static fromObject(d: { [k: string]: any }): proto.BotFeedbackMessage.SideBySideSurveyMetadata.SideBySideSurveyAnalyticsData;
                static toObject(m: proto.BotFeedbackMessage.SideBySideSurveyMetadata.SideBySideSurveyAnalyticsData, o?: $protobuf.IConversionOptions): { [k: string]: any };
                toJSON(): { [k: string]: any };
                static getTypeUrl(prefix?: string): string;
            }

            namespace SideBySideSurveyAnalyticsData {
                interface $Properties {
                    tessaEvent?: (string|null);
                    tessaSessionFbid?: (string|null);
                    simonSessionFbid?: (string|null);
                    $unknowns?: Uint8Array[];
                }
                type $Shape = proto.BotFeedbackMessage.SideBySideSurveyMetadata.SideBySideSurveyAnalyticsData.$Properties;
            }

            interface ISidebySideSurveyMetaAiAnalyticsData extends proto.BotFeedbackMessage.SideBySideSurveyMetadata.SidebySideSurveyMetaAiAnalyticsData.$Properties {
            }

            class SidebySideSurveyMetaAiAnalyticsData {
                constructor(p?: proto.BotFeedbackMessage.SideBySideSurveyMetadata.SidebySideSurveyMetaAiAnalyticsData.$Properties);
                $unknowns?: Uint8Array[];
                surveyId?: (number|null);
                primaryResponseId?: (string|null);
                testArmName?: (string|null);
                timestampMsString?: (string|null);
                ctaImpressionEvent?: (proto.BotFeedbackMessage.SideBySideSurveyMetadata.SidebySideSurveyMetaAiAnalyticsData.SideBySideSurveyCTAImpressionEventData.$Properties|null);
                ctaClickEvent?: (proto.BotFeedbackMessage.SideBySideSurveyMetadata.SidebySideSurveyMetaAiAnalyticsData.SideBySideSurveyCTAClickEventData.$Properties|null);
                cardImpressionEvent?: (proto.BotFeedbackMessage.SideBySideSurveyMetadata.SidebySideSurveyMetaAiAnalyticsData.SideBySideSurveyCardImpressionEventData.$Properties|null);
                responseEvent?: (proto.BotFeedbackMessage.SideBySideSurveyMetadata.SidebySideSurveyMetaAiAnalyticsData.SideBySideSurveyResponseEventData.$Properties|null);
                abandonEvent?: (proto.BotFeedbackMessage.SideBySideSurveyMetadata.SidebySideSurveyMetaAiAnalyticsData.SideBySideSurveyAbandonEventData.$Properties|null);
                static create(properties: proto.BotFeedbackMessage.SideBySideSurveyMetadata.SidebySideSurveyMetaAiAnalyticsData.$Shape): proto.BotFeedbackMessage.SideBySideSurveyMetadata.SidebySideSurveyMetaAiAnalyticsData & proto.BotFeedbackMessage.SideBySideSurveyMetadata.SidebySideSurveyMetaAiAnalyticsData.$Shape;
                static create(properties?: proto.BotFeedbackMessage.SideBySideSurveyMetadata.SidebySideSurveyMetaAiAnalyticsData.$Properties): proto.BotFeedbackMessage.SideBySideSurveyMetadata.SidebySideSurveyMetaAiAnalyticsData;
                static encode(m: proto.BotFeedbackMessage.SideBySideSurveyMetadata.SidebySideSurveyMetaAiAnalyticsData.$Properties, w?: $protobuf.Writer): $protobuf.Writer;
                static decode(r: ($protobuf.Reader|Uint8Array), l?: number): proto.BotFeedbackMessage.SideBySideSurveyMetadata.SidebySideSurveyMetaAiAnalyticsData & proto.BotFeedbackMessage.SideBySideSurveyMetadata.SidebySideSurveyMetaAiAnalyticsData.$Shape;
                static fromObject(d: { [k: string]: any }): proto.BotFeedbackMessage.SideBySideSurveyMetadata.SidebySideSurveyMetaAiAnalyticsData;
                static toObject(m: proto.BotFeedbackMessage.SideBySideSurveyMetadata.SidebySideSurveyMetaAiAnalyticsData, o?: $protobuf.IConversionOptions): { [k: string]: any };
                toJSON(): { [k: string]: any };
                static getTypeUrl(prefix?: string): string;
            }

            namespace SidebySideSurveyMetaAiAnalyticsData {
                interface $Properties {
                    surveyId?: (number|null);
                    primaryResponseId?: (string|null);
                    testArmName?: (string|null);
                    timestampMsString?: (string|null);
                    ctaImpressionEvent?: (proto.BotFeedbackMessage.SideBySideSurveyMetadata.SidebySideSurveyMetaAiAnalyticsData.SideBySideSurveyCTAImpressionEventData.$Properties|null);
                    ctaClickEvent?: (proto.BotFeedbackMessage.SideBySideSurveyMetadata.SidebySideSurveyMetaAiAnalyticsData.SideBySideSurveyCTAClickEventData.$Properties|null);
                    cardImpressionEvent?: (proto.BotFeedbackMessage.SideBySideSurveyMetadata.SidebySideSurveyMetaAiAnalyticsData.SideBySideSurveyCardImpressionEventData.$Properties|null);
                    responseEvent?: (proto.BotFeedbackMessage.SideBySideSurveyMetadata.SidebySideSurveyMetaAiAnalyticsData.SideBySideSurveyResponseEventData.$Properties|null);
                    abandonEvent?: (proto.BotFeedbackMessage.SideBySideSurveyMetadata.SidebySideSurveyMetaAiAnalyticsData.SideBySideSurveyAbandonEventData.$Properties|null);
                    $unknowns?: Uint8Array[];
                }
                type $Shape = proto.BotFeedbackMessage.SideBySideSurveyMetadata.SidebySideSurveyMetaAiAnalyticsData.$Properties;

                interface ISideBySideSurveyAbandonEventData extends proto.BotFeedbackMessage.SideBySideSurveyMetadata.SidebySideSurveyMetaAiAnalyticsData.SideBySideSurveyAbandonEventData.$Properties {
                }

                class SideBySideSurveyAbandonEventData {
                    constructor(p?: proto.BotFeedbackMessage.SideBySideSurveyMetadata.SidebySideSurveyMetaAiAnalyticsData.SideBySideSurveyAbandonEventData.$Properties);
                    $unknowns?: Uint8Array[];
                    abandonDwellTimeMsString?: (string|null);
                    static create(properties: proto.BotFeedbackMessage.SideBySideSurveyMetadata.SidebySideSurveyMetaAiAnalyticsData.SideBySideSurveyAbandonEventData.$Shape): proto.BotFeedbackMessage.SideBySideSurveyMetadata.SidebySideSurveyMetaAiAnalyticsData.SideBySideSurveyAbandonEventData & proto.BotFeedbackMessage.SideBySideSurveyMetadata.SidebySideSurveyMetaAiAnalyticsData.SideBySideSurveyAbandonEventData.$Shape;
                    static create(properties?: proto.BotFeedbackMessage.SideBySideSurveyMetadata.SidebySideSurveyMetaAiAnalyticsData.SideBySideSurveyAbandonEventData.$Properties): proto.BotFeedbackMessage.SideBySideSurveyMetadata.SidebySideSurveyMetaAiAnalyticsData.SideBySideSurveyAbandonEventData;
                    static encode(m: proto.BotFeedbackMessage.SideBySideSurveyMetadata.SidebySideSurveyMetaAiAnalyticsData.SideBySideSurveyAbandonEventData.$Properties, w?: $protobuf.Writer): $protobuf.Writer;
                    static decode(r: ($protobuf.Reader|Uint8Array), l?: number): proto.BotFeedbackMessage.SideBySideSurveyMetadata.SidebySideSurveyMetaAiAnalyticsData.SideBySideSurveyAbandonEventData & proto.BotFeedbackMessage.SideBySideSurveyMetadata.SidebySideSurveyMetaAiAnalyticsData.SideBySideSurveyAbandonEventData.$Shape;
                    static fromObject(d: { [k: string]: any }): proto.BotFeedbackMessage.SideBySideSurveyMetadata.SidebySideSurveyMetaAiAnalyticsData.SideBySideSurveyAbandonEventData;
                    static toObject(m: proto.BotFeedbackMessage.SideBySideSurveyMetadata.SidebySideSurveyMetaAiAnalyticsData.SideBySideSurveyAbandonEventData, o?: $protobuf.IConversionOptions): { [k: string]: any };
                    toJSON(): { [k: string]: any };
                    static getTypeUrl(prefix?: string): string;
                }

                namespace SideBySideSurveyAbandonEventData {
                    interface $Properties {
                        abandonDwellTimeMsString?: (string|null);
                        $unknowns?: Uint8Array[];
                    }
                    type $Shape = proto.BotFeedbackMessage.SideBySideSurveyMetadata.SidebySideSurveyMetaAiAnalyticsData.SideBySideSurveyAbandonEventData.$Properties;
                }

                interface ISideBySideSurveyCTAClickEventData extends proto.BotFeedbackMessage.SideBySideSurveyMetadata.SidebySideSurveyMetaAiAnalyticsData.SideBySideSurveyCTAClickEventData.$Properties {
                }

                class SideBySideSurveyCTAClickEventData {
                    constructor(p?: proto.BotFeedbackMessage.SideBySideSurveyMetadata.SidebySideSurveyMetaAiAnalyticsData.SideBySideSurveyCTAClickEventData.$Properties);
                    $unknowns?: Uint8Array[];
                    isSurveyExpired?: (boolean|null);
                    clickDwellTimeMsString?: (string|null);
                    static create(properties: proto.BotFeedbackMessage.SideBySideSurveyMetadata.SidebySideSurveyMetaAiAnalyticsData.SideBySideSurveyCTAClickEventData.$Shape): proto.BotFeedbackMessage.SideBySideSurveyMetadata.SidebySideSurveyMetaAiAnalyticsData.SideBySideSurveyCTAClickEventData & proto.BotFeedbackMessage.SideBySideSurveyMetadata.SidebySideSurveyMetaAiAnalyticsData.SideBySideSurveyCTAClickEventData.$Shape;
                    static create(properties?: proto.BotFeedbackMessage.SideBySideSurveyMetadata.SidebySideSurveyMetaAiAnalyticsData.SideBySideSurveyCTAClickEventData.$Properties): proto.BotFeedbackMessage.SideBySideSurveyMetadata.SidebySideSurveyMetaAiAnalyticsData.SideBySideSurveyCTAClickEventData;
                    static encode(m: proto.BotFeedbackMessage.SideBySideSurveyMetadata.SidebySideSurveyMetaAiAnalyticsData.SideBySideSurveyCTAClickEventData.$Properties, w?: $protobuf.Writer): $protobuf.Writer;
                    static decode(r: ($protobuf.Reader|Uint8Array), l?: number): proto.BotFeedbackMessage.SideBySideSurveyMetadata.SidebySideSurveyMetaAiAnalyticsData.SideBySideSurveyCTAClickEventData & proto.BotFeedbackMessage.SideBySideSurveyMetadata.SidebySideSurveyMetaAiAnalyticsData.SideBySideSurveyCTAClickEventData.$Shape;
                    static fromObject(d: { [k: string]: any }): proto.BotFeedbackMessage.SideBySideSurveyMetadata.SidebySideSurveyMetaAiAnalyticsData.SideBySideSurveyCTAClickEventData;
                    static toObject(m: proto.BotFeedbackMessage.SideBySideSurveyMetadata.SidebySideSurveyMetaAiAnalyticsData.SideBySideSurveyCTAClickEventData, o?: $protobuf.IConversionOptions): { [k: string]: any };
                    toJSON(): { [k: string]: any };
                    static getTypeUrl(prefix?: string): string;
                }

                namespace SideBySideSurveyCTAClickEventData {
                    interface $Properties {
                        isSurveyExpired?: (boolean|null);
                        clickDwellTimeMsString?: (string|null);
                        $unknowns?: Uint8Array[];
                    }
                    type $Shape = proto.BotFeedbackMessage.SideBySideSurveyMetadata.SidebySideSurveyMetaAiAnalyticsData.SideBySideSurveyCTAClickEventData.$Properties;
                }

                interface ISideBySideSurveyCTAImpressionEventData extends proto.BotFeedbackMessage.SideBySideSurveyMetadata.SidebySideSurveyMetaAiAnalyticsData.SideBySideSurveyCTAIm