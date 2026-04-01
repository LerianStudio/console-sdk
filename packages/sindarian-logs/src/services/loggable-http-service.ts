import {
  HttpService,
  Inject,
  getClassName
} from '@lerianstudio/sindarian-server'
import { LoggerAggregator } from '@/aggregator/logger-aggregator'
import { logHttpEvent } from '@/decorators/http-log-helper'

/**
 * HttpService with automatic request/response logging.
 *
 * Consumer services extend this instead of HttpService directly.
 * Override hooks and call super.*() to preserve auto-logging, then add custom logic.
 *
 * For services that can't extend this base class, use @LogHttpCall() decorator instead.
 */
export abstract class LoggableHttpService extends HttpService {
  @Inject(LoggerAggregator) protected logger!: LoggerAggregator

  private get serviceName(): string {
    return getClassName(this.constructor)
  }

  protected onBeforeFetch(request: Request): void {
    if (this.logger?.hasContext()) {
      logHttpEvent(this.logger, this.serviceName, 'onBeforeFetch', [request])
    }
  }

  protected onAfterFetch(request: Request, response: Response): void {
    if (this.logger?.hasContext()) {
      logHttpEvent(this.logger, this.serviceName, 'onAfterFetch', [
        request,
        response
      ])
    }
  }

  protected async catch(
    request: Request,
    response: Response,
    error: any
  ): Promise<void> {
    if (this.logger?.hasContext()) {
      logHttpEvent(this.logger, this.serviceName, 'catch', [
        request,
        response,
        error
      ])
    }
  }
}
