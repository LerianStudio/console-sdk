import { Controller, Get } from '@lerianstudio/sindarian-server'

/**
 * A route may throw anything, not only an ApiException.
 *
 * These four shapes are what actually reached the default exception filter in
 * production code and left the response body without a readable `message`.
 * They exist so the e2e suite reads a REAL Response, built by a real
 * NextResponse: the filter's own unit tests mock `NextResponse.json`, so they
 * can assert the arguments and never the body a caller parses.
 */
@Controller('/throwing')
export class ThrowingController {
  /** An upstream problem body handed straight to `throw`. */
  @Get('object')
  public object(): never {
    throw {
      message: {
        title: 'Gateway Timeout',
        detail: 'cpf 123.456.789-00 timed out at db-primary.internal'
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
}
