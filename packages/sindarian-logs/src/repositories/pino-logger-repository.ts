import pino, { BaseLogger, LoggerOptions } from 'pino'
import { LoggerRepository } from './logger-repository'
import { AggregatedLog } from '@/types/log-event'

export class PinoLoggerRepository extends LoggerRepository {
  private logger: BaseLogger

  constructor(private readonly options: { debug?: boolean } = {}) {
    super()
    this.logger = this.initializeLogger()
  }

  private initializeLogger(): BaseLogger {
    const loggerOptions: LoggerOptions = {
      level: this.options.debug ? 'debug' : 'info',
      formatters: {
        level: (label) => ({ level: label.toUpperCase() })
      },
      timestamp: pino.stdTimeFunctions.isoTime,
      base: {
        env: process.env.NODE_ENV || 'production'
      }
    }

    if (process.env.NODE_ENV === 'development') {
      try {
        // pino-pretty is an optional peer dependency
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const pretty = require('pino-pretty')
        return pino(
          loggerOptions,
          pretty({
            colorize: true,
            ignore: 'pid,hostname,level',
            translateTime: 'SYS:yyyy-mm-dd HH:MM:ss.l'
          })
        )
      } catch (error: any) {
        if (error?.code !== 'MODULE_NOT_FOUND') throw error
      }
    }

    return pino(loggerOptions)
  }

  info(log: AggregatedLog): void {
    this.logger.info(JSON.stringify(log))
  }

  error(log: AggregatedLog): void {
    this.logger.error(JSON.stringify(log))
  }

  warn(log: AggregatedLog): void {
    this.logger.warn(JSON.stringify(log))
  }

  debug(log: AggregatedLog): void {
    this.logger.debug(JSON.stringify(log))
  }

  audit(log: AggregatedLog): void {
    this.logger.info(JSON.stringify(log))
  }
}
