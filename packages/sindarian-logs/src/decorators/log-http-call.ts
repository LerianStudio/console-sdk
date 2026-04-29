import { Inject, getClassName } from '@lerianstudio/sindarian-server'
import { LoggerAggregator } from '@/aggregator/logger-aggregator'
import { logHttpEvent } from './http-log-helper'

const HTTP_LOGGER_INJECTED_KEY = Symbol('http_logger_injected')

/**
 * @LogHttpCall() — method decorator for HTTP service hooks.
 * Auto-logs request/response details for onBeforeFetch, onAfterFetch, and catch methods.
 *
 * Use this when you can't extend LoggableHttpService (e.g., already extending another base class).
 * For the common case, prefer extending LoggableHttpService instead.
 */
export function LogHttpCall(): MethodDecorator {
  return (
    target: object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ) => {
    if (!Reflect.getOwnMetadata(HTTP_LOGGER_INJECTED_KEY, target.constructor)) {
      Inject(LoggerAggregator)(target, '__http_logger__')
      Reflect.defineMetadata(HTTP_LOGGER_INJECTED_KEY, true, target.constructor)
    }

    const originalMethod = descriptor.value

    descriptor.value = async function (this: any, ...args: any[]) {
      const logger: LoggerAggregator | undefined = this.__http_logger__
      if (logger?.hasContext()) {
        const serviceName = getClassName(this.constructor)
        logHttpEvent(logger, serviceName, String(propertyKey), args)
      }

      return originalMethod.apply(this, args)
    }

    Object.defineProperty(descriptor.value, 'name', {
      value: propertyKey,
      configurable: true
    })

    return descriptor
  }
}
