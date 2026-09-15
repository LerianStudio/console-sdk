import { HttpStatus } from '@/constants/http-status'
import {
  noProblemDetails,
  readWireMessage,
  readWireStatus,
  toProblemMessage
} from '@/utils/error/to-problem-message'
import { HttpException } from './http-exception'

export class ApiException extends HttpException {
  private readonly metadata: any

  /**
   * @param message Anything, coerced to a string. `message` used to be a
   * constructor parameter property, so it replaced `Error.message` with
   * whatever was handed in — and an upstream JSON body handed in here became
   * the `message` that `getResponse()` serialises to the browser. A body is
   * now reduced to its bounded classification before it gets that far.
   */
  constructor(
    public readonly code: string,
    public readonly title: string,
    message: unknown,
    status: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR,
    metadata: any = {}
  ) {
    super(toProblemMessage(message, noProblemDetails(status)), status)
    this.metadata = metadata
  }

  /**
   * The body a caller receives.
   *
   * Metadata is spread UNDER the three named fields, not over them. Spreading
   * it last let a caller passing a `message` key put the object back that the
   * constructor had just reduced to a sentence, one line above, and Console
   * already passes metadata here (`{ details }`), so `message` is the next key
   * anyone reaches for. Metadata extends the body; these three are its
   * contract.
   */
  /**
   * `message` is read through `readWireMessage` rather than taken, because the
   * constructor is not the only writer: `Error.message` is a writable property
   * and a route that sets one after construction bypasses the reduction above.
   * An application that renders this body itself - Console spreads it into its
   * own envelope - was the caller still receiving an upstream object, a
   * missing field, or five megabytes under a field this file documents as a
   * string. The exception filter reads a message through the same function,
   * which is why there is one and not two.
   */
  getResponse() {
    return {
      ...this.metadata,
      code: this.code,
      title: this.title,
      message: readWireMessage(this, noProblemDetails(readWireStatus(this)))
    }
  }
}

export class BadRequestApiException extends ApiException {
  constructor(message: string) {
    super('0000', 'Bad Request', message, HttpStatus.BAD_REQUEST)
  }
}

export class ValidationApiException extends ApiException {
  constructor(message: string, errors?: any) {
    super('0007', 'Validation Error', message, HttpStatus.BAD_REQUEST, {
      errors
    })
  }
}

export class UnauthorizedApiException extends ApiException {
  constructor(message: string = 'Unauthorized') {
    super('0001', 'Unauthorized', message, HttpStatus.UNAUTHORIZED)
  }
}

export class ForbiddenApiException extends ApiException {
  constructor(message: string) {
    super('0002', 'Forbidden', message, HttpStatus.FORBIDDEN)
  }
}

export class NotFoundApiException extends ApiException {
  constructor(message: string) {
    super('0003', 'Not Found', message, HttpStatus.NOT_FOUND)
  }
}

export class UnprocessableEntityApiException extends ApiException {
  constructor(message: string) {
    super(
      '0006',
      'Unprocessable Entity',
      message,
      HttpStatus.UNPROCESSABLE_ENTITY
    )
  }
}

export class InternalServerErrorApiException extends ApiException {
  constructor(message: string) {
    super(
      '0004',
      'Internal Server Error',
      message,
      HttpStatus.INTERNAL_SERVER_ERROR
    )
  }
}

export class ServiceUnavailableApiException extends ApiException {
  constructor(message: string) {
    super(
      '0005',
      'Service Unavailable',
      message,
      HttpStatus.SERVICE_UNAVAILABLE
    )
  }
}
