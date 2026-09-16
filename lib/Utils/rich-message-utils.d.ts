export declare function toUnified(submessages: any[], uuid?: string): { response_id: string; sections: any[] };

export interface RichResponseContent {
    headerText?: string;
    contentText?: string;
    footerText?: string;
    disclaimerText?: string;
    code?: string;
    language?: string;
    table?: any[][];
    title?: string;
    noHeading?: boolean;
    links?: Array<{ text: string; url?: string; title?: string; displayName?: string }>;
    richResponse?: any[];
    [key: string]: any;
}

export declare function prepareRichResponseMessage(content: RichResponseContent): any;
export declare function botMetadataSignature(): Uint8Array;
export declare function botMetadataCertificate(length?: number): Uint8Array;
export declare function wrapToBotForwardedMessage(richResponseMessage: any): any;
