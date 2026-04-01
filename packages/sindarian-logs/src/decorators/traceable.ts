import { Inject, getClassName } from '@lerianstudio/sindarian-server'
import { LoggerAggregator } from '@/aggregator/logger-aggregator'

const LOGGER_INJECTED_KEY = Symbol('logger_injected')

export type TraceableOptions = {
  operation?: string
}

/**
 * @Traceable() — method decorator that wraps a method in a logging context.
 *
 * - Zero required params: auto-derives operation as `ClassName.methodName`
 * - Context-aware: adds events to existing context if present;
 *   creates root context + finalizes if not (NextAuth, cron, queues)
 * - Disabled when NODE_ENV=test
 */
export function Traceable(options: TraceableOptions = {}): MethodDecorator {
  return (
    target: object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ) => {
    // Inject LoggerAggregator once per class (lazy, on first decorated method)
    if (!Reflect.getOwnMetadata(LOGGER_INJECTED_KEY, target.constructor)) {
      Inject(LoggerAggregator)(target, '__traceable_logger__')
      Reflect.defineMetadata(LOGGER_INJECTED_KEY, true, target.constructor)
    }

    const originalMethod = descriptor.value

    descriptor.value = async function (this: any, ...args: any[]) {
      // Disabled in test environment
      if (process.env.NODE_ENV === 'test') {
        return originalMethod.apply(this, args)
      }

      const logger: LoggerAggregator | undefined = this.__traceable_logger__
      if (!logger) {
        return originalMethod.apply(this, args)
      }

      const className = getClassName(this.constructor)
      const operation =
        options.operation ?? `${className}.${String(propertyKey)}`

      // If already inside a context, just add events
      if (logger.hasContext()) {
        logger.info(operation, `Entering ${operation}`)
        try {
          const result = await originalMethod.apply(this, args)
          logger.info(operation, `Completed ${operation}`)
          return result
        } catch (error: unknown) {
          logger.error(
            operation,
            error instanceof Error ? error.message : String(error)
          )
          throw error
        }
      }

      // No context exists — create root context (NextAuth, cron, queue scenarios)
      return logger.runWithContext(
        operation,
        'INTERNAL',
        { handler: operation },
        async () => {
          const result = await originalMethod.apply(this, args)
          return result
        }
      )
    }

    // Preserve original method name for debugging
    Object.defineProperty(descriptor.value, 'name', {
      value: propertyKey,
      configurable: true
    })

    return descriptor
  }
}
