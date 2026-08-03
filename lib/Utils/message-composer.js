import { proto } from '../../WAProto/index.js';
import { generateMessageIDV2 } from './generics.js';
export const JS_KEYWORDS = new Set([
    'import', 'export', 'from', 'default', 'as', 'const', 'let', 'var', 'function', 'class', 'extends', 'new',
    'return', 'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'break', 'continue', 'try', 'catch', 'finally',
    'throw', 'async', 'await', 'yield', 'typeof', 'instanceof', 'in', 'of', 'delete', 'void', 'true', 'false',
    'null', 'undefined', 'NaN', 'Infinity', 'this', 'super', 'static', 'get', 'set', 'debugger', 'with'
]);
export const PYTHON_KEYWORDS = new Set([
    'import', 'from', 'as', 'def', 'class', 'return', 'if', 'elif', 'else', 'for', 'while', 'break', 'continue',
    'try', 'except', 'finally', 'raise', 'with', 'yield', 'lambda', 'pass', 'del', 'global', 'nonlocal', 'assert',
    'True', 'False', 'None', 'and', 'or', 'not', 'in', 'is', 'async', 'await', 'self', 'print'
]);
export const LANGUAGE_KEYWORDS = {
    javascript: JS_KEYWORDS,
    typescript: JS_KEYWORDS,
    js: JS_KEYWORDS,
    ts: JS_KEYWORDS,
    python: PYTHON_KEYWORDS,
    py: PYTHON_KEYWORDS
};
const HL = proto.AIRichResponseCodeMetadata.AIRichResponseCodeHighlightType;
export const CodeHighlightType = {
    DEFAULT: HL.AI_RICH_RESPONSE_CODE_HIGHLIGHT_DEFAULT,
    KEYWORD: HL.AI_RICH_RESPONSE_CODE_HIGHLIGHT_KEYWORD,
    METHOD: HL.AI_RICH_RESPONSE_CODE_HIGHLIGHT_METHOD,
    STRING: HL.AI_RICH_RESPONSE_CODE_HIGHLIGHT_STRING,
    NUMBER: HL.AI_RICH_RESPONSE_CODE_HIGHLIGHT_NUMBER,
    COMMENT: HL.AI_RICH_RESPONSE_CODE_HIGHLIGHT_COMMENT
};
export const RichSubMessageType = {
    UNKNOWN: proto.AIRichResponseSubMessageType.AI_RICH_RESPONSE_UNKNOWN,
    GRID_IMAGE: proto.AIRichResponseSubMessageType.AI_RICH_RESPONSE_GRID_IMAGE,
    TEXT: proto.AIRichResponseSubMessageType.AI_RICH_RESPONSE_TEXT,
    INLINE_IMAGE: proto.AIRichResponseSubMessageType.AI_RICH_RESPONSE_INLINE_IMAGE,
    TABLE: proto.AIRichResponseSubMessageType.AI_RICH_RESPONSE_TABLE,
    CODE: proto.AIRichResponseSubMessageType.AI_RICH_RESPONSE_CODE,
    DYNAMIC: proto.AIRichResponseSubMessageType.AI_RICH_RESPONSE_DYNAMIC,
    MAP: proto.AIRichResponseSubMessageType.AI_RICH_RESPONSE_MAP,
    LATEX: proto.AIRichResponseSubMessageType.AI_RICH_RESPONSE_LATEX,
    CONTENT_ITEMS: proto.AIRichResponseSubMessageType.AI_RICH_RESPONSE_CONTENT_ITEMS
};
export const tokenizeCode = (codeStr, language = 'javascript') => {
    const keywords = LANGUAGE_KEYWORDS[language] || JS_KEYWORDS;
    const blocks = [];
    const lines = codeStr.split('\n');
    for (let li = 0; li < lines.length; li++) {
        const line = lines[li];
        const isLast = li === lines.length - 1;
        const nl = isLast ? '' : '\n';
        if (!line.trim()) {
            blocks.push({ highlightType: CodeHighlightType.DEFAULT, codeContent: line + nl });
            continue;
        }
        if (line.trim().startsWith('//') || line.trim().startsWith('#')) {
            blocks.push({ highlightType: CodeHighlightType.COMMENT, codeContent: line + nl });
            continue;
        }
        const regex = /(\/\/.*$|#.*$)|(["'`](?:[^"'`\\]|\\.)*["'`])|(\b\d+(?:\.\d+)?\b)|(\b[a-zA-Z_$][\w$]*\b)|([^\s\w$"'`]+)|(\s+)/g;
        let match;
        const tokens = [];
        while ((match = regex.exec(line)) !== null) {
            const val = match[0];
            if (match[1]) {
                tokens.push({ highlightType: CodeHighlightType.COMMENT, codeContent: val });
            }
            else if (match[2]) {
                tokens.push({ highlightType: CodeHighlightType.STRING, codeContent: val });
            }
            else if (match[3]) {
                tokens.push({ highlightType: CodeHighlightType.NUMBER, codeContent: val });
            }
            else if (match[4]) {
                if (keywords.has(val)) {
                    tokens.push({ highlightType: CodeHighlightType.KEYWORD, codeContent: val });
                }
                else {
                    const after = line.slice(regex.lastIndex).trimStart();
                    if (after.startsWith('(')) {
                        tokens.push({ highlightType: CodeHighlightType.METHOD, codeContent: val });
                    }
                    else {
                        tokens.push({ highlightType: CodeHighlightType.DEFAULT, codeContent: val });
                    }
                }
            }
            else {
                tokens.push({ highlightType: CodeHighlightType.DEFAULT, codeContent: val });
            }
        }
        if (tokens.length === 0) {
            blocks.push({ highlightType: CodeHighlightType.DEFAULT, codeContent: line + nl });
            continue;
        }
        const merged = [];
        for (const t of tokens) {
            const prev = merged.length > 0 ? merged[merged.length - 1] : undefined;
            if (prev && prev.highlightType === t.highlightType) {
                prev.codeContent += t.codeContent;
            }
            else {
                merged.push({ ...t });
            }
        }
        if (merged.length > 0) {
            merged[merged.length - 1].codeContent += nl;
        }
        blocks.push(...merged);
    }
    return blocks;
};
export const buildRichContextInfo = (quoted) => {
    const ctxInfo = {
        forwardingScore: 1,
        isForwarded: true,
        forwardedAiBotMessageInfo: { botJid: '867051314767696@bot' },
        forwardOrigin: proto.ContextInfo.ForwardOrigin.META_AI
    };
    if (quoted?.key) {
        ctxInfo.stanzaId = quoted.key.id;
        ctxInfo.participant = quoted.key.participant || quoted.sender || quoted.key.remoteJid || undefined;
        ctxInfo.quotedMessage = quoted.message;
    }
    return ctxInfo;
};
export const buildBotForwardedMessage = (submessages, contextInfo, unifiedResponse) => {
    const richResponse = {
        messageType: proto.AIRichResponseMessageType.AI_RICH_RESPONSE_TYPE_STANDARD,
        submessages,
        contextInfo
    };
    if (unifiedResponse) {
        richResponse.unifiedResponse = unifiedResponse;
    }
    return {
        botForwardedMessage: {
            message: {
                richResponseMessage: richResponse
            }
        }
    };
};
export const generateTableContent = (title, headers, rows, quoted, options = {}) => {
    const { footer, headerText } = options;
    const tableRows = [{ items: headers, isHeading: true }, ...rows.map(row => ({ items: row.map(String) }))];
    const submessages = [];
    if (headerText) {
        submessages.push({ messageType: RichSubMessageType.TEXT, messageText: headerText });
    }
    submessages.push({
        messageType: RichSubMessageType.TABLE,
        tableMetadata: { title, rows: tableRows }
    });
    if (footer) {
        submessages.push({ messageType: RichSubMessageType.TEXT, messageText: footer });
    }
    const ctxInfo = buildRichContextInfo(quoted);
    return { message: buildBotForwardedMessage(submessages, ctxInfo), messageId: generateMessageIDV2() };
};
export const generateListContent = (title, items, quoted, options = {}) => {
    const { footer, headerText } = options;
    const tableRows = items.map(item => ({
        items: Array.isArray(item) ? item.map(String) : [String(item)]
    }));
    const submessages = [];
    if (headerText) {
        submessages.push({ messageType: RichSubMessageType.TEXT, messageText: headerText });
    }
    submessages.push({
        messageType: RichSubMessageType.TABLE,
        tableMetadata: { title, rows: tableRows }
    });
    if (footer) {
        submessages.push({ messageType: RichSubMessageType.TEXT, messageText: footer });
    }
    const ctxInfo = buildRichContextInfo(quoted);
    return { message: buildBotForwardedMessage(submessages, ctxInfo), messageId: generateMessageIDV2() };
};
export const generateCodeBlockContent = (code, quoted, options = {}) => {
    const { title, footer, language = 'javascript' } = options;
    const submessages = [];
    if (title) {
        submessages.push({ messageType: RichSubMessageType.TEXT, messageText: title });
    }
    submessages.push({
        messageType: RichSubMessageType.CODE,
        codeMetadata: {
            codeLanguage: language,
            codeBlocks: tokenizeCode(code, language)
        }
    });
    if (footer) {
        submessages.push({ messageType: RichSubMessageType.TEXT, messageText: footer });
    }
    const ctxInfo = buildRichContextInfo(quoted);
    return { message: buildBotForwardedMessage(submessages, ctxInfo), messageId: generateMessageIDV2() };
};
export const generateLatexContent = (quoted, options) => {
    const { text, expressions, headerText, footer } = options;
    const submessages = [];
    if (headerText) {
        submessages.push({ messageType: RichSubMessageType.TEXT, messageText: headerText });
    }
    const latexExpressions = expressions.map(expr => {
        const entry = {
            latexExpression: expr.latexExpression,
            url: expr.url,
            width: expr.width,
            height: expr.height
        };
        if (expr.fontHeight !== undefined)
            entry.fontHeight = expr.fontHeight;
        if (expr.imageTopPadding !== undefined)
            entry.imageTopPadding = expr.imageTopPadding;
        if (expr.imageLeadingPadding !== undefined)
            entry.imageLeadingPadding = expr.imageLeadingPadding;
        if (expr.imageBottomPadding !== undefined)
            entry.imageBottomPadding = expr.imageBottomPadding;
        if (expr.imageTrailingPadding !== undefined)
            entry.imageTrailingPadding = expr.imageTrailingPadding;
        return entry;
    });
    submessages.push({
        messageType: RichSubMessageType.LATEX,
        latexMetadata: { text: text || '', expressions: latexExpressions }
    });
    if (footer) {
        submessages.push({ messageType: RichSubMessageType.TEXT, messageText: footer });
    }
    const ctxInfo = buildRichContextInfo(quoted);
    return { message: buildBotForwardedMessage(submessages, ctxInfo), messageId: generateMessageIDV2() };
};
export const generateLatexImageContent = async (quoted, options, uploadFn, renderLatexToPng) => {
    const { text, expressions, headerText, footer } = options;
    const submessages = [];
    if (headerText) {
        submessages.push({ messageType: RichSubMessageType.TEXT, messageText: headerText });
    }
    const latexExpressions = await Promise.all(expressions.map(async (expr) => {
        const { buffer, width, height } = await renderLatexToPng(expr.latexExpression);
        const uploadResult = await uploadFn(buffer, 'image');
        const imageUrl = uploadResult.url || uploadResult.directPath;
        return { latexExpression: expr.latexExpression, url: imageUrl, width, height };
    }));
    submessages.push({
        messageType: RichSubMessageType.LATEX,
        latexMetadata: { text: text || '', expressions: latexExpressions }
    });
    if (footer) {
        submessages.push({ messageType: RichSubMessageType.TEXT, messageText: footer });
    }
    const ctxInfo = buildRichContextInfo(quoted);
    return { message: buildBotForwardedMessage(submessages, ctxInfo), messageId: generateMessageIDV2() };
};
export const generateLatexInlineImageContent = async (quoted, options, uploadFn, renderLatexToPng) => {
    const { text, expressions, headerText, footer } = options;
    const submessages = [];
    if (headerText) {
        submessages.push({ messageType: RichSubMessageType.TEXT, messageText: headerText });
    }
    if (text) {
        submessages.push({ messageType: RichSubMessageType.TEXT, messageText: text });
    }
    for (const expr of expressions) {
        const { buffer, width, height } = await renderLatexToPng(expr.latexExpression);
        const uploadResult = await uploadFn(buffer, 'image');
        const imageUrl = uploadResult.url || uploadResult.directPath;
        submessages.push({
            messageType: RichSubMessageType.INLINE_IMAGE,
            imageMetadata: {
                imageUrl: { imagePreviewUrl: imageUrl, imageHighResUrl: imageUrl },
                imageText: expr.latexExpression,
                alignment: 2
            }
        });
        void width;
        void height;
    }
    if (footer) {
        submessages.push({ messageType: RichSubMessageType.TEXT, messageText: footer });
    }
    const ctxInfo = buildRichContextInfo(quoted);
    return { message: buildBotForwardedMessage(submessages, ctxInfo), messageId: generateMessageIDV2() };
};
export const captureUnifiedResponse = (msg) => {
    const botFwd = msg?.botForwardedMessage?.message;
    if (!botFwd) {
        return null;
    }
    const rich = botFwd.richResponseMessage;
    if (!rich?.unifiedResponse?.data) {
        return null;
    }
    return {
        unifiedResponse: { data: rich.unifiedResponse.data },
        submessages: rich.submessages || [],
        contextInfo: rich.contextInfo || {}
    };
};
export const generateUnifiedResponseContent = (quoted, captured) => {
    const ctxInfo = buildRichContextInfo(quoted);
    return {
        message: buildBotForwardedMessage(captured.submessages, ctxInfo, captured.unifiedResponse),
        messageId: generateMessageIDV2()
    };
};
export const generateRichMessageContent = (submessages, quoted) => {
    const ctxInfo = buildRichContextInfo(quoted);
    return { message: buildBotForwardedMessage(submessages, ctxInfo), messageId: generateMessageIDV2() };
};
//# sourceMappingURL=message-composer.js.map