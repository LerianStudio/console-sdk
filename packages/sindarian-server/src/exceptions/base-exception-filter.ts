import { HttpStatus } from '@/constants'
import { ApiException } from './api-exception'
import { ExceptionFilter } from './exception-filter'
import { toProblemMessage } from '@/utils/error/to-problem-message'
import { NextResponse } from 'next/server'

/** What the caller is told when the thrown value classified nothing. */
const UNCLASSIFIED = 'Internal server error'

export class BaseExceptionFilter implements ExceptionFilter {
  /**
   * The last frame before the wire, for anything a route threw.
   *
   * `message` is documented as a sentence and was whatever the thrown value
   * happened to carry under that name. `ApiException` reduces its own message
   * one frame down, but everything else reached here untouched: an object body
   * was serialised as an object, a thrown string or a bare `throw` left the
   * field missing, and an `Error` handed over its full text however long it
   * was. A caller that classifies a failure with string methods had a dead
   * branch on all three and answered a generic 500.
   *
   * `toProblemMessage` is the one place that reduction lives, so this uses it
   * rather than a second opinion: a string survives bounded, a problem object
   * keeps only its classification, and anything else becomes one sentence.
   *
   * Reading the message through `?.` is load-bearing too. `throw null` used to
   * make this filter throw, and a filter that throws escapes the request
   * pipeline entirely: the caller got Next's own HTML error page where a JSON
   * envelope was promised.
   */
  async catch(exception: any) {
    const status =
      exception instanceof ApiException && exception.getStatus
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR

    return NextResponse.json(
      { message: toProblemMessage(exception?.message, UNCLASSIFIED) },
      { status }
    )
  }
}
