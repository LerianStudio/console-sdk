import {
  Controller,
  Get,
  HttpException,
  HttpStatus
} from '@lerianstudio/sindarian-server'

/**
 * A route may throw anything, not only an ApiException.
 *
 * The first four shapes are what actually reached the default exception filter
 * in production code and left the response body without a readable `message`.
 * They exist so the e2e suite reads a REAL Response, built by a real
 * NextResponse: the filter's own unit tests mock `NextResponse.json`, so they
 * can assert the arguments and never the body a caller parses.
 *
 * The last two are the unexpected errors: a bare `Error` and a plain
 * `HttpException`. Neither puts its own text on the wire any more. See the
 * spec's second describe block.
 */
@Controller('/throwing')
export class ThrowingController {
  /** An upstream problem body handed straight to `throw`. */
  @Get('object')
  public object(): never {
    throw {
      message: {
        title: 'Gateway Timeout',
        detail: 'cpf 123.456.789-00 timed out at db-primary.internal:8080'
      }
    }
  }

  /** A value with nothing under `message` at all. */
  @Get('no-message')
  public noMessage(): never {
    throw { code: 'E_NOPE' }
  }

  /** A bare string, which carries no `message` property. */
  @Get('string')
  public string(): never {
    throw 'something went wrong'
  }

  /** The one that used to make the filter itself throw. */
  @Get('null')
  public null(): never {
    throw null
  }

  /**
   * A bare `Error`, carrying the same two values the `object` route above
   * carries and has stripped from it: the internal host and port
   * `db-primary.internal:8080`, and the taxpayer id `123.456.789-00`. Same
   * values, different thrown shape, so the spec can assert that the shape no
   * longer decides whether a caller reads the failure's own words.
   */
  @Get('error')
  public error(): never {
    throw new Error(
      'connect ECONNREFUSED db-primary.internal:8080 for cpf 123.456.789-00'
    )
  }

  /**
   * A plain `HttpException`, which carries a real status of its own.
   *
   * Found, not fixed: this filter answers it as 500 regardless. The case pins
   * the status so that giving a plain `HttpException` its real status later is
   * a deliberate red test rather than a silent change for every caller.
   */
  @Get('http-status')
  public httpStatus(): never {
    throw new HttpException('no such ledger', HttpStatus.NOT_FOUND)
  }
}
