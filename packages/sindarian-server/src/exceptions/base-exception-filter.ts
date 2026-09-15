import { HttpStatus } from '@/constants'
import { ApiException } from './api-exception'
import { ExceptionFilter } from './exception-filter'
import { toProblemMessage } from '@/utils/error/to-problem-message'
import { NextResponse } from 'next/server'

/** What the caller is told when the thrown value classified nothing. */
const UNCLASSIFIED = 'Internal server error'

/**
 * The code that goes with it, which is the one this library already uses for
 * an unclassified 500 (`InternalServerErrorApiException`). A caller reading
 * codes can tell this envelope from a sentence an upstream actually wrote,
 * which matters now that the generic sentence is what an unexpected error
 * answers.
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
   * `toProblemMessage` is the one place that reduction lives, so this uses it
   * rather than a second opinion: a string survives bounded, a problem object
   * keeps only its classification, an `Error` keeps none of its text, and
   * anything else becomes one sentence. An `Error` is handed over WHOLE for
   * that last rule to fire at all: `exception.message` is a string by then,
   * and a string is the one thing the rule lets through.
   *
   * Reading the message through `?.` is load-bearing too. `throw null` used to
   * make this filter throw, and a filter that throws escapes the request
   * pipeline entirely, so the route produced no Response at all. Measured on
   * Next 16.2.6 under `next start`, that answers `500` with a ZERO-BYTE body
   * and no `content-type` header: a caller promised a JSON envelope instead
   * gets `SyntaxError: Unexpected end of JSON input`.
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
    if (exception instanceof ApiException) {
      return NextResponse.json(
        { message: toProblemMessage(exception.message, UNCLASSIFIED) },
        { status: exception.getStatus() }
      )
    }

    const unexpected = exception instanceof Error

    if (unexpected) {
      // The only remaining copy of what actually broke, written the way
      // `HttpService.onRequestFailure` already writes an upstream failure:
      // `console.error`, at error level, so it lands in the operator's log and
      // in whatever ships that log onward. Not the package's `Logger`, whose
      // static methods write through a logger the application has to register
      // and drop everything until it does. Redacting the text from the
      // response is not a reason to lose it.
      console.error('Unhandled exception', {
        name: exception.name,
        message: exception.message,
        stack: exception.stack
      })
    }

    return NextResponse.json(
      {
        message: toProblemMessage(
          unexpected ? exception : exception?.message,
          UNCLASSIFIED
        ),
        code: UNCLASSIFIED_CODE
      },
      { status: HttpStatus.INTERNAL_SERVER_ERROR }
    )
  }
}
