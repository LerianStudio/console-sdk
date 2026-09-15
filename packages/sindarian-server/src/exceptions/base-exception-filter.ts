import { inspect } from 'node:util'
import { HttpStatus } from '@/constants'
import { ApiException } from './api-exception'
import { ExceptionFilter } from './exception-filter'
import {
  MESSAGE_MAX_LENGTH,
  noProblemDetails,
  readWireMessage
} from '@/utils/error/to-problem-message'
import { NextResponse } from 'next/server'

/** What the caller is told when the thrown value classified nothing. */
const UNCLASSIFIED = 'Internal server error'

/**
 * The code that goes with it, which is the one this library already uses for
 * an unclassified 500 (`InternalServerErrorApiException`).
 *
 * A caller reading codes can tell this envelope from a sentence an upstream
 * actually wrote, because the two never arrive together: an upstream's own
 * classification reaches a caller as an `ApiException`, which is answered
 * above with no code at all, and nothing that gets this far keeps a word of
 * what it was carrying. An earlier version of this filter stamped `0004` on an
 * upstream's `title` and made the code unreadable, which is what the e2e case
 * `keeps no part of an upstream problem object` now pins.
 */
const UNCLASSIFIED_CODE = '0004'

export class BaseExceptionFilter implements ExceptionFilter {
  /**
   * The last frame before the wire, for anything a route threw.
   *
   * `message` is documented as a sentence and was whatever the thrown value
   * happened to carry under that name. `ApiException` reduces its own message
   * one frame down and still answers it here. Everything else reached the wire
   * untouched: an object body was serialised as an object, a thrown string or
   * a bare `throw` left the field missing, and an `Error` handed over its full
   * text however long it was.
   *
   * The object and the missing field are shape defects, and a caller that
   * classifies a failure with string methods had a dead branch on both. The
   * `Error` was NOT one of them: its text was already a string, so that branch
   * was live, and what it matched on was the failure's own words - a
   * connection string, an internal host, a taxpayer id, whatever the throw
   * site interpolated. An unexpected error, meaning anything that is not one
   * of this library's typed exceptions, now answers the generic sentence and
   * the code, and its words go to the server log instead. That is a change to
   * what a caller receives: anything classifying a 500 on that text stops
   * matching, deliberately and visibly rather than one release later.
   *
   * **The thrown shape decides nothing past the narrowing below.** The first
   * version of this redaction asked `exception instanceof Error`, and an
   * ordinary rethrow is not an `Error`: `throw { message: e.message }`, or an
   * upstream problem body handed straight to `throw`, went on reaching the
   * browser word for word while the identical text inside an `Error` was
   * redacted, and the body was stamped `0004` either way, which told a caller
   * the sentence was ours when it was a connection string. There is nothing
   * left to ask: an `ApiException` returns above, so everything here is
   * unexpected by construction and answers one constant body. `toProblemMessage`
   * is not consulted anywhere in this file, because there is no longer a
   * reading of a thrown value for it to choose between.
   *
   * Reading the value through `?.` is load-bearing, and it has moved to the
   * log line. `throw null` used to make this filter throw, and a filter that
   * throws escapes the request pipeline entirely, so the route produced no
   * Response at all. Measured on Next 16.2.6 under `next start`, that answers
   * `500` with a ZERO-BYTE body and no `content-type` header: a caller
   * promised a JSON envelope instead gets `SyntaxError: Unexpected end of JSON
   * input`.
   *
   * **What this asks of a consumer.** The text is not destroyed, it is moved,
   * and the operator log is a less private place than it looks: the thrown
   * value is written there as it came, bounded but not redacted, shipped onward
   * by whatever collects stdout. That covers a sentence a throw site
   * interpolated into an `Error` AND the fields of an upstream body a route
   * rethrew, and no key-based redaction reaches inside either. Do not put a
   * customer's data in an `Error` message, and redact in the log pipeline if
   * your routes rethrow an upstream's body. Name what failed, not whose record
   * it was.
   */
  async catch(exception: any) {
    // This narrowing is what keeps the redaction below off every 401, 404 and
    // 422 this library raises: `ApiException extends HttpException extends
    // Error`, so redacting by `instanceof Error` alone would take the sentence
    // off all of them. Its message is already bounded and free of the
    // request's own values one frame down.
    //
    // No `&& exception.getStatus` here. It was carried over from when
    // `exception` was untyped and the guard did real work; after the
    // `instanceof`, `getStatus` is inherited from `HttpException` and cannot
    // be missing, so the second operand only invited a defensive branch for a
    // state that cannot occur.
    //
    // No `toProblemMessage` and no `|| UNCLASSIFIED` either. The constructor
    // already ran the message through it (`api-exception.ts`), so by the time
    // the filter sees one it is a non-empty string under 2000 characters, and
    // both a second call and a falsy fallback are unreachable through the
    // constructor.
    //
    // Unreachable is not the same as equivalent, so what the reduction answers
    // is pinned rather than argued: `answers the message it was given, even a
    // mutated empty one` mutates `.message` to `''` after construction and
    // reads back `{ message: '' }` at 404. Restoring the fallback turns that
    // case red, which is the only way the difference is visible at all.
    //
    // What the guard below IS for is the shape, not the emptiness, and this
    // was the one place this filter still handed over whatever it was given.
    // `Error.message` is typed `string` and the constructor produces one, but
    // it is a writable property: `e.message = upstreamBody` after construction
    // put an OBJECT on the wire under a field documented as a sentence, with
    // the upstream's `detail` and a taxpayer id inside it, and `e.message =
    // undefined` left the field missing. Those are the two defects this filter
    // answers for on every other path, surviving on the one branch that
    // trusted its input. An empty string is a string and passes through
    // unchanged, so the pin above still reads `{ message: '' }`.
    //
    // The fallback is the constructor's own, `noProblemDetails(status)`, which
    // names the REAL status. Not `UNCLASSIFIED`: a 404 that says `Internal
    // server error` is the defect `names the real status when the message is
    // empty` exists to prevent, and this branch must not reintroduce it one
    // mutation over.
    //
    // Both reads are inside the guard, and there is exactly one of each.
    // `readWireMessage` owns the message read, for this branch and for
    // `ApiException.getResponse()`, which is the other frame that answers one;
    // the `try` here is for `getStatus`, which a subclass may override with
    // anything. A status that could be read still names itself in the answer;
    // one that could not leaves nothing to trust and answers 500.
    if (exception instanceof ApiException) {
      let status: number = HttpStatus.INTERNAL_SERVER_ERROR

      try {
        status = exception.getStatus()

        return NextResponse.json(
          { message: readWireMessage(exception, noProblemDetails(status)) },
          { status }
        )
      } catch {
        return NextResponse.json(
          { message: noProblemDetails(status) },
          { status }
        )
      }
    }

    // The only remaining copy of what actually broke, written to the seam
    // `HttpService.onRequestFailure` already uses for an upstream failure:
    // `console.error`, at error level, so it lands in the operator's log and
    // in whatever ships that log onward. Not the package's `Logger`, whose
    // static methods write through a logger the application has to register
    // and drop everything until it does. Redacting the text from the response
    // is not a reason to lose it - and for a thrown object it used to be
    // exactly that, because this write sat behind an `instanceof Error` while
    // the response had already stopped carrying the upstream's own `detail`.
    //
    // Unconditional, because the early return above is what decides whether a
    // value is unexpected and nothing that reaches this line is not.
    //
    // Three fields, always the same three, and all three bounded. `message` is
    // the sentence an operator greps, when the value had one; it is NOT what
    // decides what else gets written, and keying that decision on a nullish
    // `message` is a defect this file already shipped once:
    // `{ message: '', code, detail }` wrote an empty string and dropped the two
    // fields that were the incident.
    // `value` is the whole thrown value rendered, so `String({ code, detail })`
    // never happens, four levels deep so an upstream body prints the rejected
    // value under `errors` instead of `[Object]`, and cut at the same 2000
    // characters a message is, because a rethrown upstream body has a size this
    // package does not control and one bad upstream must not fill a log sink.
    // There is no `stack` field: rendering an `Error` prints its stack, inside
    // the same bound.
    //
    // **One failure is one physical line, and that is why the record is
    // serialised here instead of handed over as an object.** Node renders a
    // second argument with its OWN `util.inspect` defaults, `breakLength: 128`
    // and `compact: 3`, which no option on the call below can reach: measured
    // through the real request pipeline, an RFC 9457 body whose rejected value
    // sits three levels down printed across SEVEN physical lines, and a thrown
    // `Error` fifteen. Flattening the value alone does not fix that, it only
    // shortens the first one to five. A line-oriented collector, the Docker
    // json-file driver or Fluent Bit, ships each of those as a separate event,
    // so the taxpayer id lands in a different event from the `Unhandled
    // exception` label an operator greps for. A string argument is written
    // through verbatim and JSON has no multi-line string, so a stack's
    // newlines survive as escapes inside the one line rather than breaking it,
    // and what a collector receives is also parseable. `compact: true` is the
    // other half: without it `util.inspect` breaks a value nested three deep
    // whatever `breakLength` says, and the escaped newlines would be inside
    // `value` for no reason.
    //
    // **This package applies NO redaction to what it writes here.** `value` is
    // what the route threw, verbatim within the bound, which is the opposite of
    // `HttpService.describeRequestError` one frame down: there the value is an
    // upstream's response body over a contract the transport knows, so only its
    // classification is copied. Here it is the last remaining copy of what
    // broke, and a projection would have to guess which key holds the incident.
    // A consumer whose routes throw a customer's data, interpolated into an
    // `Error` message or rethrown inside an upstream body, must redact in its
    // own log pipeline. The cheaper fix is at the throw site: name what failed,
    // not whose record it was.
    // Every read below is of a value the throw site controls, and the write
    // must not cost the caller its response: this filter runs inside
    // `ServerFactory._handleRequest`'s own catch block and that call is not
    // guarded, so a filter that throws escapes the request pipeline and the
    // route answers a ZERO-BYTE body. `throw null` produced exactly that until
    // this branch, and three other shapes still could: a `message` getter that
    // throws, a `[util.inspect.custom]` function that throws, a proxy trap.
    // `customInspect: false` closes the second one and stops a custom inspector
    // from deciding what an incident looks like; the `catch` closes the rest.
    // Losing the line is bad, losing the response is the failure this file
    // exists to prevent, so the fallback still writes one and `typeof` cannot
    // throw.
    try {
      const name = exception?.name
      const message = exception?.message

      console.error(
        'Unhandled exception',
        JSON.stringify({
          name:
            typeof name === 'string'
              ? name.slice(0, MESSAGE_MAX_LENGTH)
              : typeof exception,
          message:
            typeof message === 'string'
              ? message.slice(0, MESSAGE_MAX_LENGTH)
              : undefined,
          value: inspect(exception, {
            depth: 4,
            breakLength: Infinity,
            compact: true,
            customInspect: false
          }).slice(0, MESSAGE_MAX_LENGTH)
        })
      )
    } catch {
      console.error(
        'Unhandled exception',
        JSON.stringify({ name: typeof exception })
      )
    }

    return NextResponse.json(
      { message: UNCLASSIFIED, code: UNCLASSIFIED_CODE },
      { status: HttpStatus.INTERNAL_SERVER_ERROR }
    )
  }
}
