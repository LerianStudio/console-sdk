import { LoggerAggregator } from '@/aggregator/logger-aggregator'

/**
 * The destination of a call, never its payload.
 *
 * A query string carries whatever the caller filtered by — a tax id, a document
 * number, an account, a cursor — and these log lines are emitted by every
 * service that inherits the hooks, so a service cannot opt out of the leak.
 * `origin + pathname` sheds the query, the fragment and any credentials, and
 * keeps the host and port an operator needs to tell two upstreams apart.
 *
 * The `catch` hook has no `instanceof Request` guard, so a caller can reach
 * this with a relative URL no parser accepts: cut it at the first `?` or `#`.
 */
function destination(url: string): string {
  try {
    const parsed = new URL(url)
    return parsed.origin + parsed.pathname
  } catch {
    return String(url).split(/[?#]/)[0]
  }
}

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
    logger.info(operation, `${request.method} ${destination(request.url)}`)
    return
  }

  if (methodName === 'onAfterFetch' && args[1] instanceof Response) {
    const request = args[0] as Request
    const response = args[1] as Response

    if (response.ok) {
      logger.info(
        operation,
        `${request.method} ${destination(request.url)} → ${response.status}`
      )
    } else {
      logger.error(
        operation,
        `${request.method} ${destination(request.url)} → ${response.status}`
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
    // `||` and not `??`: a vendor answering `{ message: '', code: 'X' }` has an
    // identifier worth logging, and nullish coalescing would select the empty
    // string and drop both.
    // Never `text`: `HttpService` hands a text/plain body over under that key
    // precisely because it is unbounded, unstructured prose from the vendor.
    const detail = error?.message || error?.code

    logger.error(
      operation,
      `${request.method} ${destination(request.url)} → ${response.status}` +
        (detail ? `: ${detail}` : '')
    )
  }
}
