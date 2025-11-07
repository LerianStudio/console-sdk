import { injectable } from 'inversify'
import { LoggerService, LogLevel } from './logger-service'
import { ConsoleLogger } from './console-logger'
import { isObject } from 'lodash'

const dateTimeFormatter = new Intl.DateTimeFormat(undefined, {
  year: 'numeric',
  hour: 'numeric',
  minute: 'numeric',
  second: 'numeric',
  day: '2-digit',
  month: '2-digit'
})

@injectable()
export class Logger implements LoggerService {
  private logger: LoggerService = new ConsoleLogger()
  private static staticLogger?: LoggerService

  log(message: any, ...optionalParams: any[]) {
    this.logger.log(message, ...optionalParams)
  }
  error(message: any, ...optionalParams: any[]) {
    this.logger.error(message, ...optionalParams)
  }
  warn(message: any, ...optionalParams: any[]) {
    this.logger.warn(message, ...optionalParams)
  }
  debug?(message: any, ...optionalParams: any[]) {
    this.logger.debug?.(message, ...optionalParams)
  }
  verbose?(message: any, ...optionalParams: any[]) {
    this.logger.verbose?.(message, ...optionalParams)
  }
  fatal?(message: any, ...optionalParams: any[]) {
    this.logger.fatal?.(message, ...optionalParams)
  }
  setLogLevels?(levels: LogLevel[]) {
    this.logger.setLogLevels?.(levels)
  }

  static log(message: any, ...optionalParams: any[]) {
    this.staticLogger?.log(message, ...optionalParams)
  }
  static error(message: any, ...optionalParams: any[]) {
    this.staticLogger?.error(message, ...optionalParams)
  }
  static warn(message: any, ...optionalParams: any[]) {
    this.staticLogger?.warn(message, ...optionalParams)
  }
  static debug?(message: any, ...optionalParams: any[]) {
    this.staticLogger?.debug?.(message, ...optionalParams)
  }
  static verbose?(message: any, ...optionalParams: any[]) {
    this.staticLogger?.verbose?.(message, ...optionalParams)
  }
  static fatal?(message: any, ...optionalParams: any[]) {
    this.staticLogger?.fatal?.(message, ...optionalParams)
  }

  static getTimestamp() {
    return dateTimeFormatter.format(Date.now())
  }

  static overrideLogger(logger: LoggerService | boolean) {
    if (isObject(logger)) {
      if (logger instanceof Logger && logger.constructor !== Logger) {
        const errorMessage = `Using the "extends Logger" instruction is not allowed. Please, use "extends ConsoleLogger" instead.`
        this.staticLogger?.error(errorMessage)
        throw new Error(errorMessage)
      }
      this.staticLogger = logger as LoggerService
    } else {
      this.staticLogger = undefined
    }
  }
}
