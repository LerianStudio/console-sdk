import { injectable, unmanaged } from 'inversify'
import { LoggerService, LogLevel } from './logger-service'
import { Logger } from './logger'

const DEFAULT_LOG_LEVELS: LogLevel[] = [
  'log',
  'error',
  'warn',
  'debug',
  'verbose',
  'fatal'
]

export type ConsoleLoggerOptions = {
  prefix?: string
  logLevels?: LogLevel[]
}

@injectable()
export class ConsoleLogger implements LoggerService {
  protected logLevels: LogLevel[] = DEFAULT_LOG_LEVELS

  protected options: ConsoleLoggerOptions

  constructor(@unmanaged() options?: ConsoleLoggerOptions) {
    options = options ?? {}
    options.logLevels = DEFAULT_LOG_LEVELS
    options.prefix ??= 'Sindarian'

    this.options = options
  }

  log(message: any, ...optionalParams: any[]): void {
    this.printMessage('log', message, ...optionalParams)
  }

  fatal(message: any, ...optionalParams: any[]): void {
    this.printMessage('fatal', message, ...optionalParams)
  }

  error(message: any, ...optionalParams: any[]): void {
    this.printMessage('error', message, ...optionalParams)
  }

  warn(message: any, ...optionalParams: any[]): void {
    this.printMessage('warn', message, ...optionalParams)
  }

  debug?(message: any, ...optionalParams: any[]): void {
    this.printMessage('debug', message, ...optionalParams)
  }

  verbose?(message: any, ...optionalParams: any[]): void {
    this.printMessage('verbose', message, ...optionalParams)
  }

  /**
   * Set log levels
   * @param levels log levels
   */
  setLogLevels(levels: LogLevel[]) {
    if (!this.options) {
      this.options = {}
    }
    this.options.logLevels = levels
  }

  protected printMessage(
    level: string = 'log',
    message: any,
    writeStreamType: 'stdout' | 'stderr' = 'stdout'
  ): void {
    const logLevel = level.toUpperCase()

    process[writeStreamType].write(this.formatMessage(logLevel, message))
  }

  protected formatMessage(level: string, message: any): string {
    const timestamp = Logger.getTimestamp()
    const logLevel = level.toUpperCase()

    return `[${this.options.prefix}] - ${timestamp} [${logLevel}] ${message}\n`
  }
}
