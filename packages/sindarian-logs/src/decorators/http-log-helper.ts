import { LoggerAggregator } from '@/aggregator/logger-aggregator'

/**
 * Shared logging logic for HTTP service hooks.
 * Used by both @LogHttpCall() decorator and LoggableHttpService.
 */
export function logHttpEvent(
  logger: LoggerAggregator,
  serviceName: string,
  methodName: string,
  args: any[]
): void {
  const operation = `${serviceName}.${methodName}`

  if (methodName === 'onBeforeFetch' && args[0] instanceof Request) {
    const request = args[0] as Request
    logger.info(operation, `${request.method} ${request.url}`)
    return
  }

  if (methodName === 'onAfterFetch' && args[1] instanceof Response) {
    const request = args[0] as Request
    const response = args[1] as Response

    if (response.ok) {
      logger.info(
        operation,
        `${request.method} ${request.url} → ${response.status}`
      )
    } else {
      logger.error(
        operation,
        `${request.method} ${request.url} → ${response.status}`
      )
    }
    return
  }

  if (methodName === 'catch') {
    const request = args[0] as Request
    const response = args[1] as Response
    const error = args[2]
    logger.error(
      operation,
      `${request.method} ${request.url} → ${response.status}: ${error?.message ?? JSON.stringify(error)}`
    )
  }
}
