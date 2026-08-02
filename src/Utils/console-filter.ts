const SIGNAL_NOISE = [
	'Closing session:',
	'Opening session:',
	'Closing open session',
	'Closing stale open session',
	'Removing old closed session',
	'Session already closed',
	'Session already open',
	'Migrating session to:',
	'Duplicate PreKeyWhisperMessage',
	'SessionEntry {'
]

const isNoise = (args: unknown[]): boolean =>
	args.some(arg => {
		if (typeof arg === 'string') {
			return SIGNAL_NOISE.some(pattern => arg.includes(pattern))
		}

		return typeof arg === 'object' && arg !== null && arg.constructor?.name === 'SessionEntry'
	})

const INSTALLED = Symbol.for('baileysx.console-filter')

export const installConsoleFilter = () => {
	const globalAny = globalThis as Record<PropertyKey, unknown>
	if (globalAny[INSTALLED] || process.env.BAILEYSX_VERBOSE) {
		return
	}

	globalAny[INSTALLED] = true

	for (const level of ['log', 'info', 'warn', 'error', 'debug'] as const) {
		const original = console[level].bind(console)
		console[level] = (...args: unknown[]) => {
			if (isNoise(args)) {
				return
			}

			original(...args)
		}
	}
}
