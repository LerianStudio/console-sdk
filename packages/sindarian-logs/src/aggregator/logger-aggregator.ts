import { AsyncLocalStorage } from 'async_hooks'
import { LoggerRepository } from '@/repositories/logger-repository'
import {
  AggregatedLog,
  LogEvent,
  LogLevel,
  RequestContext,
  TransformedEvent
} from '@/types/log-event'

const LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  audit: 2,
  warn: 3,
  error: 4
}

const MAX_EVENTS = 1000

export class LoggerAggregator {
  private storage = new AsyncLocalStorage<RequestContext>()

  constructor(
    private readonly loggerRepository: LoggerRepository,
    private readonly options: { debug?: boolean } = {}
  ) {}

  /**
   * Wraps an async function in a request context.
   * All events logged within fn() are aggregated and finalized when fn() completes.
   */
  async runWithContext<T>(
    path: string,
    method: string,
    initialMetadata: Record<string, any>,
    fn: () => Promise<T>
  ): Promise<T> {
    const context: RequestContext = {
      startTime: Date.now(),
      path,
      method,
      metadata: initialMetadata,
      events: []
    }

    return this.storage.run(context, async () => {
      try {
        const result = await fn()
        this.finalizeContext()
        return result
      } catch (error: unknown) {
        this.addEvent({
          operation: 'request_error',
          level: 'error',
          message: error instanceof Error ? error.message : String(error),
          ...(error instanceof Error ? { error } : {})
        })
        this.finalizeContext()
        throw error
      }
    })
  }

  /**
   * Returns true if there is an active aggregation context.
   */
  hasContext(): boolean {
    return this.storage.getStore() !== undefined
  }

  /**
   * Sets response metadata on the current context (called by TraceMiddleware).
   */
  setResponseMetadata(statusCode: number, responseSize?: number): void {
    const context = this.storage.getStore()
    if (!context) return

    context.statusCode = statusCode
    context.responseSize = responseSize
  }

  /**
   * Adds an event to the current request context.
   */
  addEvent(event: Omit<LogEvent, 'timestamp'>): void {
    const context = this.storage.getStore()
    if (!context) return

    if (event.level === 'debug' && !this.options.debug) return

    if (context.events.length >= MAX_EVENTS) return

    context.events.push({
      ...event,
      timestamp: Date.now()
    })
  }

  // Convenience methods — operation is always first param
  info(
    operation: string,
    message: string,
    context?: Record<string, any>
  ): void {
    this.addEvent({
      operation,
      message,
      level: 'info',
      ...(context ? { context } : {})
    })
  }

  error(
    operation: string,
    message: string,
    context?: Record<string, any>
  ): void {
    this.addEvent({
      operation,
      message,
      level: 'error',
      ...(context ? { context } : {})
    })
  }

  warn(
    operation: string,
    message: string,
    context?: Record<string, any>
  ): void {
    this.addEvent({
      operation,
      message,
      level: 'warn',
      ...(context ? { context } : {})
    })
  }

  debug(
    operation: string,
    message: string,
    context?: Record<string, any>
  ): void {
    this.addEvent({
      operation,
      message,
      level: 'debug',
      ...(context ? { context } : {})
    })
  }

  audit(
    operation: string,
    message: string,
    context?: Record<string, any>
  ): void {
    this.addEvent({
      operation,
      message,
      level: 'audit',
      ...(context ? { context } : {})
    })
  }

  /**
   * Finalizes the current context: transforms events, calculates duration,
   * escalates level, and writes to the logger repository.
   */
  private finalizeContext(): void {
    const context = this.storage.getStore()
    if (!context) return

    const duration = (Date.now() - context.startTime) / 1000

    const events: TransformedEvent[] = context.events.map((event) => {
      const transformed: TransformedEvent = {
        timestamp: new Date(event.timestamp).toISOString(),
        message: event.message
      }

      if (event.operation) transformed.operation = event.operation
      if (event.level) transformed.level = event.level.toUpperCase()
      if (event.context && Object.keys(event.context).length > 0) {
        transformed.context = event.context
      }
      if (event.error) transformed.error = event.error.message

      return transformed
    })

    const escalatedLevel = this.escalateLevel(context.events)

    const log: AggregatedLog = {
      level: escalatedLevel,
      method: context.method,
      path: context.path,
      duration,
      events
    }

    if (context.statusCode !== undefined) log.statusCode = context.statusCode
    if (context.metadata.traceId) log.traceId = context.metadata.traceId
    if (context.metadata.handler) log.handler = context.metadata.handler

    this.writeLog(escalatedLevel, log)
  }

  /**
   * Level escalation: the outer log level equals the highest-severity inner event.
   */
  private escalateLevel(events: LogEvent[]): LogLevel {
    let highest: LogLevel = 'info'

    for (const event of events) {
      const level = event.level ?? 'info'
      if (LEVEL_PRIORITY[level] > LEVEL_PRIORITY[highest]) {
        highest = level
      }
    }

    return highest
  }

  /**
   * Routes the aggregated log to the correct repository method based on level.
   */
  private writeLog(level: LogLevel, log: AggregatedLog): void {
    switch (level) {
      case 'error':
        return this.loggerRepository.error(log)
      case 'warn':
        return this.loggerRepository.warn(log)
      case 'debug':
        return this.loggerRepository.debug(log)
      case 'audit':
        return this.loggerRepository.audit(log)
      default:
        return this.loggerRepository.info(log)
    }
  }
}
