import { MESSAGE_MAX_LENGTH } from './to-problem-message'

/**
 * Writes one operator record, as ONE physical line, at error level.
 *
 * Every write in this package that describes a failure goes through here: the
 * exception filter's unhandled exception, and the transport's two, an
 * unreachable upstream and a failed response.
 *
 * **Why the record is serialised here instead of handed over.** Node renders a
 * second argument to `console.error` with its OWN `util.inspect` defaults,
 * `breakLength: 128` and `compact: 3`, which no option at the call site can
 * reach: a real ledger URL beside a connection string is already past 128
 * characters, so these records printed across five, eight and fifteen physical
 * lines. A line-oriented collector, the Docker json-file driver or Fluent Bit,
 * ships each of those as a separate event, so the internal host and the
 * taxpayer id an upstream failure carries land in a different event from the
 * label an operator greps for. A string argument is written through verbatim,
 * and JSON has no multi-line string, so a stack's newlines survive as escapes
 * inside the one line rather than breaking it, and what a collector receives
 * is parseable as well as whole.
 *
 * **Why the bound is here.** Every one of these records carries text this
 * package does not size: an upstream's own error, a rethrown body, a message
 * a throw site interpolated. One bad upstream must not fill a log sink, so
 * every string in the record, at any depth, is cut at the ceiling a message
 * is. The cut is by CHARACTER, and JSON escaping then expands a control
 * character to six bytes, so a pathological record is several times its
 * character count in bytes. Still bounded, which is what the bound is for.
 *
 * **No redaction.** These records are the last remaining copy of what broke,
 * so nothing is projected away and nothing guesses which key holds the
 * incident. A consumer whose routes carry a customer's data redacts in its own
 * log pipeline.
 *
 * **Writing a line must not cost a caller its response.** `JSON.stringify`
 * throws on a cycle, on a `bigint` and on a getter that throws, and
 * `HttpService.describeRequestError` is documented as overridable, so a
 * consumer decides part of what arrives here. The transport calls this from
 * inside its own `try`, where a throw becomes the 503 that means "the upstream
 * never answered" - for an upstream that answered 409 perfectly well. The
 * label is therefore always written: a record that cannot be serialised is
 * announced as one, and only its fields are lost.
 *
 * @param label The greppable label, written as the first argument
 * @param record The fields of the failure, serialised beside it
 */
export function logErrorLine(
  label: string,
  record: Record<string, unknown>
): void {
  let line = '{"record":"unserialisable"}'

  try {
    line = JSON.stringify(record, (_key, value) =>
      typeof value === 'string' ? value.slice(0, MESSAGE_MAX_LENGTH) : value
    )
  } catch {
    // Keep the announcement, lose the fields.
  }

  console.error(label, line)
}
