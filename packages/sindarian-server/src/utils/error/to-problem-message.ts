/**
 * Longest an upstream-controlled string may be once it becomes ours.
 *
 * `type`, `title` and `code` are written by the upstream, which means their
 * length is not ours to assume. A body that pads one of them to a megabyte
 * would otherwise be copied verbatim into a log line or an exception message.
 */
export const PROBLEM_FIELD_MAX_LENGTH = 200

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
 * @param value A string, an `Error`, a parsed problem body, or nothing
 * @param fallback The sentence to use when `value` classifies nothing
 */
export function toProblemMessage(value: unknown, fallback: string): string {
  if (typeof value === 'string') {
    return value
  }

  if (value instanceof Error) {
    return value.message
  }

  if (value !== null && typeof value === 'object') {
    const { title, code } = value as { title?: unknown; code?: unknown }

    if (typeof title === 'string' && title) {
      return title.slice(0, PROBLEM_FIELD_MAX_LENGTH)
    }

    if (typeof code === 'string' && code) {
      return code.slice(0, PROBLEM_FIELD_MAX_LENGTH)
    }
  }

  return fallback
}
