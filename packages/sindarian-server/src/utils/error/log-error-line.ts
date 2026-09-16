import { MESSAGE_MAX_LENGTH } from './to-problem-message'

/**
 * A key cut to the ceiling, and still the only one of its name in its object.
 *
 * Cutting two keys that share their first 2000 characters, an upstream field
 * map keyed by long URNs is exactly that shape, would make them ONE key, and an
 * object holds one of those: the later field wins and the earlier one leaves no
 * trace at all. A bound that loses a field is worse than the length it saved,
 * this record being the last copy of what broke, so a cut key that would land
 * on a name already in the object carries a mark instead. The entry's own index
 * is what the mark is built from, so it is stable for a given record rather
 * than a count of collisions seen so far.
 *
 * A key that was never over the ceiling is never renamed: those are seeded into
 * `taken` before any cutting, so it is always the cut one that moves.
 */
const boundKey = (key: string, index: number, taken: Set<string>): string => {
  if (key.length <= MESSAGE_MAX_LENGTH) {
    return key
  }

  // The mark counts in DIGITS, not in characters. A record whose keys are an
  // upstream's own can occupy the first candidates deliberately, and a mark
  // grown one character per retry then eats the room the key is cut to fit in:
  // measured, two thousand occupied candidates produced a 7000-character key,
  // inside the writer whose whole point is that one bad upstream cannot fill a
  // log sink. A decimal counter cannot reach that length before it runs out of
  // records to collide with.
  const candidateFor = (attempt: number) => {
    const mark = attempt === 0 ? `~${index}` : `~${index}.${attempt}`

    return key.slice(0, Math.max(0, MESSAGE_MAX_LENGTH - mark.length)) + mark
  }

  let attempt = 0
  let candidate = candidateFor(attempt)

  // `taken` holds at most one name per entry, so one of `taken.size + 1`
  // distinct candidates is free and the loop cannot run past that.
  while (taken.has(candidate) && attempt <= taken.size) {
    candidate = candidateFor(++attempt)
  }

  return candidate
}

/**
 * Cuts every string the record carries, as a key or as a value, at any depth.
 *
 * A value is replaced in place. A KEY cannot be: `JSON.stringify` hands a
 * replacer the value and takes back only a value, so bounding a key means
 * handing back an object with the key renamed, and the serialiser then walks
 * that one instead. Which is why it happens ONLY when a key is actually over
 * the ceiling: an object that needs no cutting is returned as itself, keeping
 * the identity the serialiser's own cycle detection works on. A cyclic record
 * with an oversized key is the one shape that runs out of stack rather than
 * being refused as a cycle, and the guard around this writes the same line for
 * both.
 *
 * An array is an object, and rebuilding one turns a list into `{"0":...}`, so
 * it is left alone: its keys are indices, not text anyone chose.
 */
const boundStrings = (_key: string, value: unknown): unknown => {
  if (typeof value === 'string') {
    return value.slice(0, MESSAGE_MAX_LENGTH)
  }

  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return value
  }

  const entries = Object.entries(value)

  if (!entries.some(([key]) => key.length > MESSAGE_MAX_LENGTH)) {
    return value
  }

  const taken = new Set(
    entries
      .map(([key]) => key)
      .filter((key) => key.length <= MESSAGE_MAX_LENGTH)
  )

  return Object.fromEntries(
    entries.map(([key, field], index) => {
      const bounded = boundKey(key, index, taken)
      taken.add(bounded)

      return [bounded, field]
    })
  )
}

/**
 * Writes one operator record, as ONE physical line, at error level.
 *
 * Every write in this package that describes a failure goes through here: the
 * exception filter's unhandled exception, and the transport's two, an
 * unreachable upstream and a failed response.
 *
 * **Why the record is serialised here instead of handed over.** Node renders a
 * second argument to `console.error` with its OWN `util.inspect` defaults,
 * which no option at the call site can reach. Measured on the runtime this
 * package is built against, `util.inspect.defaultOptions` reads `breakLength:
 * 80` and `compact: 3` (Node v24.21.0), and a real ledger URL beside a
 * connection string is already past 80 characters on its own, so these records
 * printed across several physical lines each. A line-oriented collector, the Docker json-file driver or Fluent Bit,
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
 * every string in the record, at any depth and as a KEY as much as a value, is
 * cut at the ceiling a message is. The cut is by CHARACTER, and JSON escaping
 * then expands a control character to six bytes, so a pathological record is
 * several times its character count in bytes. It bounds each string, not their
 * number: a record of ten thousand short fields is ten thousand short fields.
 * Nothing this package writes has more than six, and an override that returns
 * an upstream's field map decides its own width.
 *
 * **No redaction.** These records are the last remaining copy of what broke,
 * so nothing is projected away and nothing guesses which key holds the
 * incident. A consumer whose routes carry a customer's data redacts in its own
 * log pipeline.
 *
 * **Writing a line must not cost a caller its response, and BUILDING the record
 * is part of writing it.** `JSON.stringify` throws on a cycle, on a `bigint`
 * and on a getter that throws, and `HttpService.describeRequestError` is
 * documented as overridable, so a consumer decides part of what arrives here.
 * Every caller writes from inside a `try` of its own, where a throw becomes the
 * 503 that means "the upstream never answered" - for an upstream that answered
 * 409 perfectly well. Guarding only the serialisation left the gap open one
 * frame out: the record was assembled as the ARGUMENT to the call, so an
 * override that threw took the caller's status with it and wrote no line
 * either. The record therefore arrives as a FUNCTION and is called here, inside
 * the same guard as the write, and the label is always written: a record that
 * cannot be built or cannot be serialised is announced as one, with the reason,
 * and only its fields are lost. A record whose own `toJSON` returns nothing is
 * the quiet version of the same thing, giving `undefined` back with no throw at
 * all and so no reason to name, and it takes the bare announcement rather than
 * leaving the word `undefined` after the label for a collector to parse.
 *
 * @param label The greppable label, written as the first argument
 * @param record Builds the fields of the failure, called inside the guard
 */
export function logErrorLine(
  label: string,
  record: () => Record<string, unknown>
): void {
  let line = '{"record":"unserialisable"}'

  try {
    line = JSON.stringify(record(), boundStrings) ?? line
  } catch (failure) {
    // Keep the announcement, name why, lose the fields. Reading the reason is
    // itself a read of a value this package does not own, so it happens inside
    // a guard as well: an override that throws an object with a `message`
    // getter that throws must not become the second throw.
    //
    // A value that is not an `Error` is stringified rather than named by its
    // TYPE. A record builder is a consumer's code and `throw 'payer missing
    // from body'` is a thing consumers write; answering `"string"` there put
    // the name of a type where the only sentence explaining an empty record
    // belongs. `String` is what the transport one file over already uses for
    // the same question, and it is safe here for the same reason the read
    // above is: it can throw, and the bare announcement is what stands when it
    // does.
    try {
      const cause = (failure as { message?: unknown } | null)?.message
      const reason = typeof cause === 'string' ? cause : String(failure)

      line = JSON.stringify({
        record: 'unserialisable',
        cause: reason.slice(0, MESSAGE_MAX_LENGTH)
      })
    } catch {
      // The bare announcement above stands.
    }
  }

  console.error(label, line)
}
