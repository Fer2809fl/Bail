import { proto } from '../../WAProto/index.js';
import type { WAMessage, WAMessageKey } from '../Types/index.js';
export declare const JS_KEYWORDS: Set<string>;
export declare const PYTHON_KEYWORDS: Set<string>;
export declare const LANGUAGE_KEYWORDS: Record<string, Set<string>>;
export declare const CodeHighlightType: {
    DEFAULT: proto.AIRichResponseCodeMetadata.AIRichResponseCodeHighlightType;
    KEYWORD: proto.AIRichResponseCodeMetadata.AIRichResponseCodeHighlightType;
    METHOD: proto.AIRichResponseCodeMetadata.AIRichResponseCodeHighlightType;
    STRING: proto.AIRichResponseCodeMetadata.AIRichResponseCodeHighlightType;
    NUMBER: proto.AIRichResponseCodeMetadata.AIRichResponseCodeHighlightType;
    COMMENT: proto.AIRichResponseCodeMetadata.AIRichResponseCodeHighlightType;
};
export declare const RichSubMessageType: {
    UNKNOWN: proto.AIRichResponseSubMessageType;
    GRID_IMAGE: proto.AIRichResponseSubMessageType;
    TEXT: proto.AIRichResponseSubMessageType;
    INLINE_IMAGE: proto.AIRichResponseSubMessageType;
    TABLE: proto.AIRichResponseSubMessageType;
    CODE: proto.AIRichResponseSubMessageType;
    DYNAMIC: proto.AIRichResponseSubMessageType;
    MAP: proto.AIRichResponseSubMessageType;
    LATEX: proto.AIRichResponseSubMessageType;
    CONTENT_ITEMS: proto.AIRichResponseSubMessageType;
};
export type CodeBlock = {
    highlightType: number;
    codeContent: string;
};
export declare const tokenizeCode: (codeStr: string, language?: string) => CodeBlock[];
type Quotable = WAMessage | {
    key: WAMessageKey;
    message?: proto.IMessage | null;
    sender?: string;
} | undefined;
export declare const buildRichContextInfo: (quoted?: Quotable) => proto.IContextInfo;
export declare const buildBotForwardedMessage: (submessages: proto.IAIRichResponseSubMessage[], contextInfo: proto.IContextInfo, unifiedResponse?: proto.IAIRichResponseUnifiedResponse) => proto.IMessage;
export type RichMessageResult = {
    message: proto.IMessage;
    messageId: string;
};
export type RichContentOptions = {
    footer?: string;
    headerText?: string;
};
export declare const generateTableContent: (title: string, headers: string[], rows: unknown[][], quoted?: Quotable, options?: RichContentOptions) => RichMessageResult;
export declare const generateListContent: (title: string, items: unknown[], quoted?: Quotable, options?: RichContentOptions) => RichMessageResult;
export declare const generateCodeBlockContent: (code: string, quoted?: Quotable, options?: RichContentOptions & {
    title?: string;
    language?: string;
}) => RichMessageResult;
export type LatexExpressionInput = {
    latexExpression: string;
    url?: string;
    width?: number;
    height?: number;
    fontHeight?: number;
    imageTopPadding?: number;
    imageLeadingPadding?: number;
    imageBottomPadding?: number;
    imageTrailingPadding?: number;
};
export declare const generateLatexContent: (quoted: Quotable | undefined, options: RichContentOptions & {
    text?: string;
    expressions: LatexExpressionInput[];
}) => RichMessageResult;
export type RenderLatexToPng = (expr: string) => Promise<{
    buffer: Buffer;
    width: number;
    height: number;
}>;
export type UploadFn = (buffer: Buffer, type: string) => Promise<{
    url?: string;
    directPath?: string;
}>;
export declare const generateLatexImageContent: (quoted: Quotable | undefined, options: RichContentOptions & {
    text?: string;
    expressions: LatexExpressionInput[];
}, uploadFn: UploadFn, renderLatexToPng: RenderLatexToPng) => Promise<RichMessageResult>;
export declare const generateLatexInlineImageContent: (quoted: Quotable | undefined, options: RichContentOptions & {
    text?: string;
    expressions: LatexExpressionInput[];
}, uploadFn: UploadFn, renderLatexToPng: RenderLatexToPng) => Promise<RichMessageResult>;
export type CapturedUnifiedResponse = {
    unifiedResponse: proto.IAIRichResponseUnifiedResponse;
    submessages: proto.IAIRichResponseSubMessage[];
    contextInfo: proto.IContextInfo;
};
export declare const captureUnifiedResponse: (msg?: proto.IMessage | null) => CapturedUnifiedResponse | null;
export declare const generateUnifiedResponseContent: (quoted: Quotable | undefined, captured: CapturedUnifiedResponse) => RichMessageResult;
export declare const generateRichMessageContent: (submessages: proto.IAIRichResponseSubMessage[], quoted?: Quotable) => RichMessageResult;
export {};
//# sourceMappingURL=message-composer.d.ts.map