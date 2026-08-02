import type { ILogger } from './logger'

export type LogSink = (level: 'trace' | 'debug' | 'info' | 'warn' | 'error', obj: unknown, msg?: string) => void

export type LoggerWithSinksOptions = {
	base: ILogger
	sinks?: LogSink[]
}

export const makeLoggerWithSinks = (opts: LoggerWithSinksOptions): ILogger => {
	const sinks = opts.sinks ? [...opts.sinks] : []

	const wrap = (base: ILogger): ILogger => {
		const dispatch = (level: 'trace' | 'debug' | 'info' | 'warn' | 'error', obj: unknown, msg?: string) => {
			base[level](obj, msg)
			for (const sink of sinks) {
				try {
					sink(level, obj, msg)
				} catch {
					continue
				}
			}
		}

		return {
			level: base.level,
			child: (bindings: Record<string, unknown>) => wrap(base.child(bindings)),
			trace: (obj, msg) => dispatch('trace', obj, msg),
			debug: (obj, msg) => dispatch('debug', obj, msg),
			info: (obj, msg) => dispatch('info', obj, msg),
			warn: (obj, msg) => dispatch('warn', obj, msg),
			error: (obj, msg) => dispatch('error', obj, msg)
		}
	}

	return wrap(opts.base)
}

export const addLogSink = (logger: ILogger, sink: LogSink): ILogger => {
	return makeLoggerWithSinks({ base: logger, sinks: [sink] })
}
