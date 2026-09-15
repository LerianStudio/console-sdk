import { HttpStatus } from '@/constants/http-status'
import {
  noProblemDetails,
  readWireMessage,
  readWireStatus
} from '@/utils/error/to-problem-message'

/**
 * Defines the base HTTP exception, which is handled by the default
 * Exceptions Handler.
 *
 * Inspired by NestJS:
 * https://github.com/nestjs/nest/blob/master/packages/common/exceptions/http.exception.ts
 */
export class HttpException extends Error {
  private readonly status

  constructor(message: string, status?: number) {
    super(message)
    this.status = status || HttpStatus.INTERNAL_SERVER_ERROR
  }

  getStatus() {
    return this.status
  }

  /**
   * The body a caller receives, read rather than taken.
   *
   * This class is the type an application's own filter declares, so a plain
   * `HttpException` reaches THIS accessor and not a subclass's. It returned
   * `this.message` unread, and `Error.message` is a writable property: a route
   * that wrote one after construction put an object on the wire under a field
   * documented as a sentence, left it missing for `undefined`, and served a
   * rethrown five-megabyte body at its full size. A `message` getter that
   * throws took the route's whole response with it.
   *
   * `ApiException` adds its classification on top of this and does not read
   * the message a second time: one reader, so the body an application renders
   * itself and the body the filter renders cannot drift apart. The fallback
   * sentence is the constructor's own, naming the real status, which is why
   * the status is read through its own guard here too.
   */
  getResponse() {
    return {
      message: readWireMessage(this, noProblemDetails(readWireStatus(this)))
    }
  }
}
