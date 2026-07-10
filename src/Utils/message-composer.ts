import { proto } from '../../WAProto/index.js'
import type { WAMessage, WAMessageKey } from '../Types'
import { generateMessageIDV2 } from './generics'

export const JS_KEYWORDS = new Set([
	'import', 'export', 'from', 'default', 'as', 'const', 'let', 'var', 'function', 'class', 'extends', 'new',
	'return', 'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'break', 'continue', 'try', 'catch', 'finally',
	'throw', 'async', 'await', 'yield', 'typeof', 'instanceof', 'in', 'of', 'delete', 'void', 'true', 'false',
	'null', 'undefined', 'NaN', 'Infinity', 'this', 'super', 'static', 'get', 'set', 'debugger', 'with'
])

export const PYTHON_KEYWORDS = new Set([
	'import', 'from', 'as', 'def', 'class', 'return', 'if', 'elif', 'else', 'for', 'while', 'break', 'continue',
	'try', 'except', 'finally', 'raise', 'with', 'yield', 'lambda', 'pass', 'del', 'global', 'nonlocal', 'assert',
	'True', 'False', 'None', 'and', 'or', 'not', 'in', 'is', 'async', 'await', 'self', 'print'
])

export const LANGUAGE_KEYWORDS: Record<string, Set<string>> = {
	javascript: JS_KEYWORDS,
	typescript: JS_KEYWORDS,
	js: JS_KEYWORDS,
	ts: JS_KEYWORDS,
	python: PYTHON_KEYWORDS,
	py: PYTHON_KEYWORDS
}

const HL = proto.AIRichResponseCodeMetadata.AIRichResponseCodeHighlightType
export const CodeHighlightType = {
	DEFAULT: HL.AI_RICH_RESPONSE_CODE_HIGHLIGHT_DEFAULT,
	KEYWORD: HL.AI_RICH_RESPONSE_CODE_HIGHLIGHT_KEYWORD,
	METHOD: HL.AI_RICH_RESPONSE_CODE_HIGHLIGHT_METHOD,
	STRING: HL.AI_RICH_RESPONSE_CODE_HIGHLIGHT_STRING,
	NUMBER: HL.AI_RICH_RESPONSE_CODE_HIGHLIGHT_NUMBER,
	COMMENT: HL.AI_RICH_RESPONSE_CODE_HIGHLIGHT_COMMENT
}

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
}

export type CodeBlock = { highlightType: number; codeContent: string }

export const tokenizeCode = (codeStr: string, language = 'javascript'): CodeBlock[] => {
	const keywords = LANGUAGE_KEYWORDS[language] || JS_KEYWORDS
	const blocks: CodeBlock[] = []
	const lines = codeStr.split('\n')

	for (let li = 0; li < lines.length; li++) {
		const line = lines[li]!
		const isLast = li === lines.length - 1
		const nl = isLast ? '' : '\n'

		if (!line.trim()) {
			blocks.push({ highlightType: CodeHighlightType.DEFAULT, codeContent: line + nl })
			continue
		}

		if (line.trim().startsWith('//') || line.trim().startsWith('#')) {
			blocks.push({ highlightType: CodeHighlightType.COMMENT, codeContent: line + nl })
			continue
		}

		const regex = /(\/\/.*$|#.*$)|(["'`](?:[^"'`\\]|\\.)*["'`])|(\b\d+(?:\.\d+)?\b)|(\b[a-zA-Z_$][\w$]*\b)|([^\s\w$"'`]+)|(\s+)/g
		let match: RegExpExecArray | null
		const tokens: CodeBlock[] = []

		while ((match = regex.exec(line)) !== null) {
			const val = match[0]
			if (match[1]) {
				tokens.push({ highlightType: CodeHighlightType.COMMENT, codeContent: val })
			} else if (match[2]) {
				tokens.push({ highlightType: CodeHighlightType.STRING, codeContent: val })
			} else if (match[3]) {
				tokens.push({ highlightType: CodeHighlightType.NUMBER, codeContent: val })
			} else if (match[4]) {
				if (keywords.has(val)) {
					tokens.push({ highlightType: CodeHighlightType.KEYWORD, codeContent: val })
				} else {
					const after = line.slice(regex.lastIndex).trimStart()
					if (after.startsWith('(')) {
						tokens.push({ highlightType: CodeHighlightType.METHOD, codeContent: val })
					} else {
						tokens.push({ highlightType: CodeHighlightType.DEFAULT, codeContent: val })
					}
				}
			} else {
				tokens.push({ highlightType: CodeHighlightType.DEFAULT, codeContent: val })
			}
		}

		if (tokens.length === 0) {
			blocks.push({ highlightType: CodeHighlightType.DEFAULT, codeContent: line + nl })
			continue
		}

		const merged: CodeBlock[] = []
		for (const t of tokens) {
			const prev = merged.length > 0 ? merged[merged.length - 1] : undefined
			if (prev && prev.highlightType === t.highlightType) {
				prev.codeContent += t.codeContent
			} else {
				merged.push({ ...t })
			}
		}

		if (merged.length > 0) {
			merged[merged.length - 1]!.codeContent += nl
		}

		blocks.push(...merged)
	}

	return blocks
}

type Quotable = WAMessage | { key: WAMessageKey; message?: proto.IMessage | null; sender?: string } | undefined

export const buildRichContextInfo = (quoted?: Quotable): proto.IContextInfo => {
	const ctxInfo: proto.IContextInfo = {
		forwardingScore: 1,
		isForwarded: true,
		forwardedAiBotMessageInfo: { botJid: '867051314767696@bot' },
		forwardOrigin: proto.ContextInfo.ForwardOrigin.META_AI
	}

	if (quoted?.key) {
		ctxInfo.stanzaId = quoted.key.id
		ctxInfo.participant = quoted.key.participant || (quoted as any).sender || quoted.key.remoteJid || undefined
		ctxInfo.quotedMessage = quoted.message
	}

	return ctxInfo
}

export const buildBotForwardedMessage = (
	submessages: proto.IAIRichResponseSubMessage[],
	contextInfo: proto.IContextInfo,
	unifiedResponse?: proto.IAIRichResponseUnifiedResponse
): proto.IMessage => {
	const richResponse: proto.IAIRichResponseMessage = {
		messageType: proto.AIRichResponseMessageType.AI_RICH_RESPONSE_TYPE_STANDARD,
		submessages,
		contextInfo
	}

	if (unifiedResponse) {
		richResponse.unifiedResponse = unifiedResponse
	}

	return {
		botForwardedMessage: {
			message: {
				richResponseMessage: richResponse
			}
		}
	}
}

export type RichMessageResult = { message: proto.IMessage; messageId: string }

export type RichContentOptions = { footer?: string; headerText?: string }

export const generateTableContent = (
	title: string,
	headers: string[],
	rows: unknown[][],
	quoted?: Quotable,
	options: RichContentOptions = {}
): RichMessageResult => {
	const { footer, headerText } = options
	const tableRows = [{ items: headers, isHeading: true }, ...rows.map(row => ({ items: row.map(String) }))]

	const submessages: proto.IAIRichResponseSubMessage[] = []
	if (headerText) {
		submessages.push({ messageType: RichSubMessageType.TEXT, messageText: headerText })
	}

	submessages.push({
		messageType: RichSubMessageType.TABLE,
		tableMetadata: { title, rows: tableRows }
	})

	if (footer) {
		submessages.push({ messageType: RichSubMessageType.TEXT, messageText: footer })
	}

	const ctxInfo = buildRichContextInfo(quoted)
	return { message: buildBotForwardedMessage(submessages, ctxInfo), messageId: generateMessageIDV2() }
}

export const generateListContent = (
	title: string,
	items: unknown[],
	quoted?: Quotable,
	options: RichContentOptions = {}
): RichMessageResult => {
	const { footer, headerText } = options
	const tableRows = items.map(item => ({
		items: Array.isArray(item) ? item.map(String) : [String(item)]
	}))

	const submessages: proto.IAIRichResponseSubMessage[] = []
	if (headerText) {
		submessages.push({ messageType: RichSubMessageType.TEXT, messageText: headerText })
	}

	submessages.push({
		messageType: RichSubMessageType.TABLE,
		tableMetadata: { title, rows: tableRows }
	})

	if (footer) {
		submessages.push({ messageType: RichSubMessageType.TEXT, messageText: footer })
	}

	const ctxInfo = buildRichContextInfo(quoted)
	return { message: buildBotForwardedMessage(submessages, ctxInfo), messageId: generateMessageIDV2() }
}

export const generateCodeBlockContent = (
	code: string,
	quoted?: Quotable,
	options: RichContentOptions & { title?: string; language?: string } = {}
): RichMessageResult => {
	const { title, footer, language = 'javascript' } = options
	const submessages: proto.IAIRichResponseSubMessage[] = []

	if (title) {
		submessages.push({ messageType: RichSubMessageType.TEXT, messageText: title })
	}

	submessages.push({
		messageType: RichSubMessageType.CODE,
		codeMetadata: {
			codeLanguage: language,
			codeBlocks: tokenizeCode(code, language)
		}
	})

	if (footer) {
		submessages.push({ messageType: RichSubMessageType.TEXT, messageText: footer })
	}

	const ctxInfo = buildRichContextInfo(quoted)
	return { message: buildBotForwardedMessage(submessages, ctxInfo), messageId: generateMessageIDV2() }
}

export type LatexExpressionInput = {
	latexExpression: string
	url?: string
	width?: number
	height?: number
	fontHeight?: number
	imageTopPadding?: number
	imageLeadingPadding?: number
	imageBottomPadding?: number
	imageTrailingPadding?: number
}

export const generateLatexContent = (
	quoted: Quotable | undefined,
	options: RichContentOptions & { text?: string; expressions: LatexExpressionInput[] }
): RichMessageResult => {
	const { text, expressions, headerText, footer } = options
	const submessages: proto.IAIRichResponseSubMessage[] = []

	if (headerText) {
		submessages.push({ messageType: RichSubMessageType.TEXT, messageText: headerText })
	}

	const latexExpressions = expressions.map(expr => {
		const entry: Record<string, unknown> = {
			latexExpression: expr.latexExpression,
			url: expr.url,
			width: expr.width,
			height: expr.height
		}
		if (expr.fontHeight !== undefined) entry.fontHeight = expr.fontHeight
		if (expr.imageTopPadding !== undefined) entry.imageTopPadding = expr.imageTopPadding
		if (expr.imageLeadingPadding !== undefined) entry.imageLeadingPadding = expr.imageLeadingPadding
		if (expr.imageBottomPadding !== undefined) entry.imageBottomPadding = expr.imageBottomPadding
		if (expr.imageTrailingPadding !== undefined) entry.imageTrailingPadding = expr.imageTrailingPadding
		return entry
	})

	submessages.push({
		messageType: RichSubMessageType.LATEX,
		latexMetadata: { text: text || '', expressions: latexExpressions } as any
	})

	if (footer) {
		submessages.push({ messageType: RichSubMessageType.TEXT, messageText: footer })
	}

	const ctxInfo = buildRichContextInfo(quoted)
	return { message: buildBotForwardedMessage(submessages, ctxInfo), messageId: generateMessageIDV2() }
}

type RenderLatexToPng = (expr: string) => Promise<{ buffer: Buffer; width: number; height: number }>
type UploadFn = (buffer: Buffer, type: string) => Promise<{ url?: string; directPath?: string }>

export const generateLatexImageContent = async (
	quoted: Quotable | undefined,
	options: RichContentOptions & { text?: string; expressions: LatexExpressionInput[] },
	uploadFn: UploadFn,
	renderLatexToPng: RenderLatexToPng
): Promise<RichMessageResult> => {
	const { text, expressions, headerText, footer } = options
	const submessages: proto.IAIRichResponseSubMessage[] = []

	if (headerText) {
		submessages.push({ messageType: RichSubMessageType.TEXT, messageText: headerText })
	}

	const latexExpressions = await Promise.all(
		expressions.map(async expr => {
			const { buffer, width, height } = await renderLatexToPng(expr.latexExpression)
			const uploadResult = await uploadFn(buffer, 'image')
			const imageUrl = uploadResult.url || uploadResult.directPath
			return { latexExpression: expr.latexExpression, url: imageUrl, width, height }
		})
	)

	submessages.push({
		messageType: RichSubMessageType.LATEX,
		latexMetadata: { text: text || '', expressions: latexExpressions } as any
	})

	if (footer) {
		submessages.push({ messageType: RichSubMessageType.TEXT, messageText: footer })
	}

	const ctxInfo = buildRichContextInfo(quoted)
	return { message: buildBotForwardedMessage(submessages, ctxInfo), messageId: generateMessageIDV2() }
}

export const generateLatexInlineImageContent = async (
	quoted: Quotable | undefined,
	options: RichContentOptions & { text?: string; expressions: LatexExpressionInput[] },
	uploadFn: UploadFn,
	renderLatexToPng: RenderLatexToPng
): Promise<RichMessageResult> => {
	const { text, expressions, headerText, footer } = options
	const submessages: proto.IAIRichResponseSubMessage[] = []

	if (headerText) {
		submessages.push({ messageType: RichSubMessageType.TEXT, messageText: headerText })
	}

	if (text) {
		submessages.push({ messageType: RichSubMessageType.TEXT, messageText: text })
	}

	for (const expr of expressions) {
		const { buffer, width, height } = await renderLatexToPng(expr.latexExpression)
		const uploadResult = await uploadFn(buffer, 'image')
		const imageUrl = uploadResult.url || uploadResult.directPath

		submessages.push({
			messageType: RichSubMessageType.INLINE_IMAGE,
			imageMetadata: {
				imageUrl: { imagePreviewUrl: imageUrl, imageHighResUrl: imageUrl },
				imageText: expr.latexExpression,
				alignment: 2
			} as any
		})
		void width
		void height
	}

	if (footer) {
		submessages.push({ messageType: RichSubMessageType.TEXT, messageText: footer })
	}

	const ctxInfo = buildRichContextInfo(quoted)
	return { message: buildBotForwardedMessage(submessages, ctxInfo), messageId: generateMessageIDV2() }
}

export type CapturedUnifiedResponse = {
	unifiedResponse: proto.IAIRichResponseUnifiedResponse
	submessages: proto.IAIRichResponseSubMessage[]
	contextInfo: proto.IContextInfo
}

export const captureUnifiedResponse = (msg?: proto.IMessage | null): CapturedUnifiedResponse | null => {
	const botFwd = msg?.botForwardedMessage?.message
	if (!botFwd) {
		return null
	}

	const rich = botFwd.richResponseMessage
	if (!rich?.unifiedResponse?.data) {
		return null
	}

	return {
		unifiedResponse: { data: rich.unifiedResponse.data },
		submessages: rich.submessages || [],
		contextInfo: rich.contextInfo || {}
	}
}

export const generateUnifiedResponseContent = (
	quoted: Quotable | undefined,
	captured: CapturedUnifiedResponse
): RichMessageResult => {
	const ctxInfo = buildRichContextInfo(quoted)
	return {
		message: buildBotForwardedMessage(captured.submessages, ctxInfo, captured.unifiedResponse),
		messageId: generateMessageIDV2()
	}
}

export const generateRichMessageContent = (
	submessages: proto.IAIRichResponseSubMessage[],
	quoted?: Quotable
): RichMessageResult => {
	const ctxInfo = buildRichContextInfo(quoted)
	return { message: buildBotForwardedMessage(submessages, ctxInfo), messageId: generateMessageIDV2() }
}
