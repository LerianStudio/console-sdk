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
    const error = args[2] as { message?: string; code?: string } | undefined

    // The vendor's own words, or failing that its own identifier, and nothing
    // else. The previous fallback serialised the ENTIRE error when it carried
    // no `message`, and for an HTTP client that error IS the upstream response
    // body: a vendor answering `{ code, fields: { cardNumber, taxId } }` and no
    // message wrote those values into the log line verbatim, at error level, on
    // every failure. Bodies without a `message` member are not exotic — a
    // consumer in this organisation stopped calling this hook altogether over
    // exactly that.
    //
    // A service cannot opt out of a decorator, so the leak reached every one
    // that inherits this catch. Anything richer than an identifier has to be
    // chosen by the service, which knows what its vendor puts in a body.
    const detail = error?.message ?? error?.code

    logger.error(
      operation,
      `${request.method} ${request.url} → ${response.status}` +
        (detail ? `: ${detail}` : '')
    )
  }
}
