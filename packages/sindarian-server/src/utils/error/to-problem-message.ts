import { HttpStatus } from '@/constants/http-status'

/**
 * Longest an upstream-controlled classification may be once it becomes ours.
 *
 * `type`, `title` and `code` are written by the upstream, which means their
 * length is not ours to assume. A body that pads one of them to a megabyte
 * would otherwise be copied verbatim into a log line or an exception message.
 */
export const PROBLEM_FIELD_MAX_LENGTH = 200

/**
 * Ceiling on a message handed in as a plain string.
 *
 * Deliberately not `PROBLEM_FIELD_MAX_LENGTH`: this package's own callers
 * write messages through here too, and `ValidationApiException` aggregates
 * every Zod issue of a rejected form into one legitimately long sentence that
 * 200 would cut off mid-field. This is a ceiling against an unbounded string,
 * not a bound on a sentence we wrote.
 */
export const MESSAGE_MAX_LENGTH = 2000

/**
 * What the caller is told when the failed response classified nothing.
 *
 * Not "non-JSON": a body that parses as a JSON string or number is perfectly
 * valid JSON and still carries no problem details, and it reached here as a
 * bare sentence written by the upstream — one that had a taxpayer id in it
 * the day this was found.
 */
export const noProblemDetails = (status: number) =>
  `Upstream error body carried no problem details (status ${status})`

/**
 * Reduces whatever arrived to a sentence that is safe to show and to store.
 *
 * An RFC 9457 problem body classifies the failure in `type`, `title` and
 * `code`, and describes it in `detail` and `errors[]`. Only the classification
 * is bounded and free of the request's own values, so only the classification
 * survives: `detail` carries a free-text sentence and `errors[]` carries the
 * rejected values themselves — destination URLs, taxpayer ids, whatever the
 * caller submitted. Anything the object cannot classify becomes `fallback`,
 * never a serialisation of the object.
 *
 * This is the one place that argument lives; the transport points here.
 *
 * @param value A string, a parsed problem body, or nothing
 * @param fallback The sentence to use when `value` classifies nothing
 */
/**
 * Reads the message off an exception that is about to be answered.
 *
 * `toProblemMessage` above runs once, in the constructor, over a value an
 * upstream sent. This runs at the other end, over `Error.message` itself,
 * which is a WRITABLE property: `e.message = upstreamBody` after construction
 * walked past the constructor entirely and put an object on the wire under a
 * field documented as a sentence, `e.message = undefined` left the field
 * missing, and a rethrown 5 MB body became a 5 MB response. The two are not
 * the same function because an empty string is a legitimate message once a
 * route has written one, and the constructor substitutes for it.
 *
 * Three things, all of them about the read and none about the value:
 *
 * - ONE read. A check on one read and a use of another is not a guard: a
 *   `message` getter answering a sentence first and an object second passed a
 *   `typeof` and handed the object over.
 * - Bounded, at the ceiling the constructor uses, because a message written
 *   after construction has a size this package does not control.
 * - It cannot throw. Both callers are the last frame before a body: the
 *   exception filter runs inside `ServerFactory._handleRequest`'s own catch
 *   block, which does not guard it, so a throw here escapes the request
 *   pipeline and the route answers a ZERO-BYTE body with no content-type -
 *   `SyntaxError: Unexpected end of JSON input` for a caller promised an
 *   envelope. Losing the sentence is bad; losing the response is the failure
 *   this package already closed once, for `throw null`.
 *
 * @param source The exception whose `message` is about to be answered
 * @param fallback The sentence to use when the read gives no usable string
 */
export function readWireMessage(
  source: { message?: unknown },
  fallback: string
): string {
  try {
    const message = source.message

    return typeof message === 'string'
      ? message.slice(0, MESSAGE_MAX_LENGTH)
      : fallback
  } catch {
    return fallback
  }
}

/**
 * The statuses a response may not be paired with a body at all.
 *
 * These are not out of range and no range check sees them: the runtime accepts
 * 204, 205 and 304 as statuses and then raises a `TypeError` the moment a body
 * is attached, one frame after the `RangeError` the band below catches. Each is
 * a member of this package's own `HttpStatus` enum and type-legal in
 * `ApiException`'s constructor, so `new ApiException(code, title, message,
 * HttpStatus.NO_CONTENT)` reached it with no override at all, and the filter
 * left the route with a zero-byte body.
 */
const NULL_BODY_STATUSES: ReadonlySet<number> = new Set([
  HttpStatus.NO_CONTENT,
  HttpStatus.RESET_CONTENT,
  HttpStatus.NOT_MODIFIED
])

/**
 * The status a response may actually be built with, read off an exception.
 *
 * `getStatus` is a method a subclass may override with anything, and both
 * frames that answer a typed exception have to read it: one to build the
 * response, one to name the status in a fallback sentence. An application that
 * renders its own envelope is a third, which is why this is exported.
 *
 * Two ways it fails and one answer for both. An override that THROWS is the
 * `readWireMessage` story exactly. A status that no response can CARRY A BODY
 * WITH is worse, because it fails one frame later, where the body is attached:
 * the runtime rejects anything outside 200 to 599 with a `RangeError` and the
 * three null-body statuses above with a `TypeError`, both measured, so a guard
 * that caught the throw and reused the status would throw from inside its own
 * fallback and leave the route with the zero-byte body again. The status is
 * therefore checked rather than caught, and anything unusable answers 500, the
 * status this library already gives a failure it cannot classify.
 *
 * "Usable" is about the pairing, not about the number: a route that genuinely
 * wants to answer 204 answers it with no body and never reaches an exception
 * filter to do it.
 */
export function readWireStatus(source: { getStatus?: () => unknown }): number {
  try {
    const status = source.getStatus?.()

    return typeof status === 'number' &&
      Number.isInteger(status) &&
      status >= 200 &&
      status <= 599 &&
      !NULL_BODY_STATUSES.has(status)
      ? status
      : HttpStatus.INTERNAL_SERVER_ERROR
  } catch {
    return HttpStatus.INTERNAL_SERVER_ERROR
  }
}

export function toProblemMessage(value: unknown, fallback: string): string {
  if (typeof value === 'string') {
    return value ? value.slice(0, MESSAGE_MAX_LENGTH) : fallback
  }

  // An `Error` classifies nothing and describes everything. Three Console
  // transports hand one straight to an exception constructor from a
  // `catch (error: any)`, and taking its message put `fetch failed: connect
  // ECONNREFUSED 10.0.0.5:8080` on the wire. What broke belongs in the server
  // log — `HttpService.onRequestFailure` writes it there — never in a response.
  if (value instanceof Error) {
    return fallback
  }

  if (value !== null && typeof value === 'object') {
    const { title, code } = value as { title?: unknown; code?: unknown }

    // `&& title` is load-bearing: an upstream rendering an empty title must
    // fall through to the code, not produce the message ''.
    if (typeof title === 'string' && title) {
      return title.slice(0, PROBLEM_FIELD_MAX_LENGTH)
    }

    if (typeof code === 'string' && code) {
      return code.slice(0, PROBLEM_FIELD_MAX_LENGTH)
    }
  }

  return fallback
}
