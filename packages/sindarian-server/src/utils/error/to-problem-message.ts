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
