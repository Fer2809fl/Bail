const ESC = '\x1b['
const RESET = `${ESC}0m`
const BOLD = `${ESC}1m`
const DIM = `${ESC}2m`


const GRADIENT = [54, 57, 93, 99, 135, 141, 177, 183, 207, 201]

const paint = (text: string, color: number, bold = false) => `${bold ? BOLD : ''}${ESC}38;5;${color}m${text}${RESET}`

const gradientLine = (text: string, offset = 0) => {
	const chars = [...text]
	const step = Math.max(1, Math.floor(chars.length / GRADIENT.length))
	return (
		chars
			.map((ch, i) => {
				const color = GRADIENT[Math.min(GRADIENT.length - 1, Math.floor(i / step) + offset)] ?? 201
				return `${ESC}38;5;${color}m${ch}`
			})
			.join('') + RESET
	)
}


export const BAILEYSX_VERSION = '7.0.10-rc1'

let printed = false

export const printBanner = (version: string = BAILEYSX_VERSION) => {
	if (printed || process.env.BAILEYSX_NO_BANNER) {
		return
	}

	printed = true

	const width = 46
	const line = '─'.repeat(width)
	const pad = (text: string, visibleLength = text.length) => {
		const left = Math.floor((width - visibleLength) / 2)
		return ' '.repeat(Math.max(0, left)) + text + ' '.repeat(Math.max(0, width - visibleLength - left))
	}

	const title = 'B A I L E Y S X'
	const subtitle = '— w h a t s a p p   s o c k e t —'
	const items = ['◆ Signal Protocol en TypeScript', '◆ Botones nativos · flows interactivos', '◆ Comunidades · newsletters · grupos']

	const edge = (ch: string) => paint(ch, 99)
	const out = [
		'',
		`${edge('╭')}${gradientLine(line)}${edge('╮')}`,
		`${edge('│')}${' '.repeat(width)}${edge('│')}`,
		`${edge('│')}${pad(`${BOLD}${gradientLine(title)}`, title.length)}${edge('│')}`,
		`${edge('│')}${pad(gradientLine(subtitle, 3), subtitle.length)}${edge('│')}`,
		`${edge('│')}${' '.repeat(width)}${edge('│')}`,
		...items.map(item => `${edge('│')}${pad(paint(item, 183), item.length)}${edge('│')}`),
		`${edge('│')}${' '.repeat(width)}${edge('│')}`,
		`${edge('│')}${pad(`${DIM}v${version}${RESET}`, version.length + 1)}${edge('│')}`,
		`${edge('╰')}${gradientLine(line, 3)}${edge('╯')}`,
		''
	]

	console.log(out.join('\n'))
}

let versionNoticePrinted = false

export type WaVersionSource = 'live' | 'pinned' | 'bundled'

export const printWaVersionNotice = ({ version, source }: { version: number[]; source: WaVersionSource }) => {
	if (versionNoticePrinted || process.env.BAILEYSX_NO_BANNER) {
		return
	}

	versionNoticePrinted = true

	const v = `v${version.join('.')}`

	if (source === 'bundled') {
		console.log(
			`${paint('⚠', 214)} ${paint(
				`No se pudo consultar la versión de WA Web: se usa la incluida (${v}).`,
				214
			)}\n  ${paint('Si WhatsApp ya publicó una más nueva, la vinculación fallará ("código incorrecto").', 250)}\n`
		)
		return
	}

	const label = source === 'live' ? 'en vivo' : 'fijada'
	console.log(`${paint('◆', 99)} ${paint(`WA Web ${v} (${label})`, 250)}\n`)
}
