import { HttpStatus } from '@/constants/http-status'
import { logErrorLine } from '@/utils/error/log-error-line'
import {
  MESSAGE_MAX_LENGTH,
  PROBLEM_FIELD_MAX_LENGTH,
  UNCLASSIFIED_CODE,
  noProblemDetails,
  noProblemTitle,
  readWireField,
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
   * construction a thing `JSON.stringify` cannot refuse. For metadata whose
   * ROOT is a plain object carrying no `toJSON` of its own, which is every
   * shape this package and Console pass, the bytes on the wire are unchanged:
   * the response is serialised with `JSON.stringify` anyway, and it drops the
   * same functions, `undefined`s and symbols this round trip does, in the same
   * key order. What a caller reading `getResponse()` in memory loses is live
   * references: a class instance arrives as its data. This method is
   * documented as the body a caller receives, which is data.
   *
   * The quantifier is not decoration, and both exceptions were measured. A
   * root that carries its OWN `toJSON` now DECIDES the body, where the spread
   * copied that function and the serialiser then dropped it: a money class
   * passed as the whole metadata served its fields before and serves what its
   * `toJSON` returns now. A root the round trip turns into something that is
   * not an object, a `Date` becoming its ISO string, then spreads by index and
   * serves numbered character keys. A `toJSON` on a value INSIDE the metadata
   * is unaffected either way. Neither shape is one this package produces, and
   * both are named in TECHNICAL.md rather than guarded against, because
   * guarding the second would change what a plain string root has always
   * served.
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
   * The classification this body carries, each field read once.
   *
   * The last two values on this frame that were taken rather than read, and
   * neither needs an override or a cast to go wrong. `code: string` is
   * satisfied with no cast at all by the `any` a database row is, which is the
   * premise the metadata guard above already rests on; `title` is a writable
   * property, which is how `message` reached the wire as an upstream object.
   * Measured through a real handler: a `code` getter that throws left the route
   * with NO Response, above the frame that would have built one, and a `title`
   * an upstream body had been written into reached the browser whole, internal
   * host included, under a field this package documents as a classification.
   *
   * Bounded at `PROBLEM_FIELD_MAX_LENGTH` rather than the message ceiling,
   * which is the argument that constant already makes about these exact two
   * fields: they are written by an upstream, so their length is not ours to
   * assume.
   *
   * A drop is never silent, and what the line names is the FIELD rather than
   * the reason. The reason lives in the value that failed, and the read of it
   * is what failed; asking again is the one-read rule broken. The field name
   * plus the substitute is the whole story here anyway, which is what the
   * metadata line cannot say, its fields having gone with no names at all.
   */
  private readWireClassification(): { code: string; title: string } {
    const code = readWireField(() => this.code, PROBLEM_FIELD_MAX_LENGTH)
    const title = readWireField(() => this.title, PROBLEM_FIELD_MAX_LENGTH)

    if (code === undefined || title === undefined) {
      const dropped: string[] = []

      if (code === undefined) {
        dropped.push('code')
      }

      if (title === undefined) {
        dropped.push('title')
      }

      // Read once, here, and only on the path that spends it: the status is a
      // subclass's to override too, and this frame already reads it twice.
      const status = readWireStatus(this)

      logErrorLine('Exception classification dropped', () => ({
        dropped,
        status
      }))

      return {
        code: code ?? UNCLASSIFIED_CODE,
        title: title ?? noProblemTitle(status)
      }
    }

    return { code, title }
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
   * Every value a route controls is now READ rather than taken, and there are
   * five of them on this frame: the message and the status through their own
   * readers in the base class, the metadata through `readWireMetadata`, the
   * code and the title through `readWireClassification`. Every one of them
   * could cost this frame its whole response, and this frame is the one an
   * application that renders its own envelope calls. There is no unguarded
   * read left on this line.
   */
  getResponse() {
    return {
      ...this.readWireMetadata(),
      ...this.readWireClassification(),
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
