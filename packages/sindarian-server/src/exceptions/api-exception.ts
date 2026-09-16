import { HttpStatus } from '@/constants/http-status'
import { logErrorLine } from '@/utils/error/log-error-line'
import {
  MESSAGE_MAX_LENGTH,
  noProblemDetails,
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
   * The metadata this body carries, read once and only if it survives JSON.
   *
   * The third value on this frame that a route controls, after the message and
   * the status, and the last one still taken rather than read. A spread is a
   * READ: `{ ...this.metadata }` invokes every own enumerable accessor, so a
   * getter that throws took the whole response down, the same defect
   * `readWireMessage` closes two lines below. A value the serialiser refuses -
   * a `bigint`, which is what a pg driver hands back for an int64 amount -
   * failed one frame later instead, where the body is serialised, which is
   * where a null-body status fails too. Both left the route with NO Response at
   * all, through the recipe TECHNICAL.md prescribes for an application that
   * renders its own envelope.
   *
   * A check on one read and a use of another is not a guard, so this does not
   * check and then spread: it takes the ROUND TRIP as the value. Every
   * accessor runs exactly once, inside the try, and what comes back is by
   * construction a thing `JSON.stringify` cannot refuse. For any metadata that
   * worked before, the bytes on the wire are unchanged: the response is
   * serialised with `JSON.stringify` anyway, and it drops the same functions,
   * `undefined`s and symbols this round trip does, in the same key order. What
   * a caller reading `getResponse()` in memory loses is live references: a
   * class instance arrives as its data. This method is documented as the body
   * a caller receives, which is data.
   *
   * A drop is never silent. The fields are gone from the body, so the reason
   * is the only thing left that explains them, and it goes to the operator log
   * bounded like every other string this package did not size. Reading that
   * reason is itself a read of a value this package does not own, so it happens
   * inside `logErrorLine`'s builder, where a `message` getter that throws is
   * announced rather than thrown a second time.
   */
  private readWireMetadata(): object {
    try {
      const serialised = JSON.stringify(this.metadata)

      return serialised === undefined ? {} : JSON.parse(serialised)
    } catch (failure) {
      logErrorLine('Exception metadata dropped', () => ({
        code: this.code,
        title: this.title,
        cause: (failure instanceof Error
          ? failure.message
          : String(failure)
        ).slice(0, MESSAGE_MAX_LENGTH)
      }))

      return {}
    }
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
   *
   * `message` comes from the base class rather than being read again here.
   * `HttpException.getResponse()` reads it through `readWireMessage`, because
   * the constructor is not the only writer: `Error.message` is a writable
   * property and a route that sets one after construction bypasses the
   * reduction above. An application that renders this body itself, Console
   * spreads it into its own envelope, was the caller still receiving an
   * upstream object, a missing field, or five megabytes under a field this
   * file documents as a string. Spreading the base class LAST is what keeps
   * the reduced sentence on top of any `message` key metadata carries.
   *
   * All three values a route controls are now READ rather than taken: the
   * message and the status through their own readers in the base class, the
   * metadata through `readWireMetadata` above. Every one of them could cost
   * this frame its whole response, and this frame is the one an application
   * that renders its own envelope calls.
   */
  getResponse() {
    return {
      ...this.readWireMetadata(),
      code: this.code,
      title: this.title,
      ...super.getResponse()
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
