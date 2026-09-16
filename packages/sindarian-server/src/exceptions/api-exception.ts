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
   * The quantifier is not decoration, and every exception below was measured
   * on a pre-fix build of this tree through a real `Response`, because the
   * mechanism is not the same one twice. A root carrying a `toJSON` DECIDES
   * the body now, and what it replaces depends on where that `toJSON` sits. On
   * a class, where an ordinary one sits on the PROTOTYPE, the spread copied
   * the instance's DATA and left the method behind, so a money class served
   * `{"cents":1500}` and serves `{"amount":15}` now: a consumer reading
   * `cents` reads nothing. As an OWN ENUMERABLE property, the spread copied
   * the FUNCTION onto the body itself and the serialiser then called it, so
   * what it returned became the WHOLE response - `{"amount":15}`, with the
   * application's envelope and all three named fields gone. That shape is
   * repaired here rather than changed. A root the round trip turns into
   * something that is not an object, a `Date` becoming its ISO string, then
   * spreads by index and serves numbered character keys where it served none.
   * A `toJSON` on a value INSIDE the metadata is unaffected either way. None
   * of these is a shape this package produces, and they are named in
   * TECHNICAL.md rather than guarded against, because guarding the last would
   * change what a plain string root has always served.
   *
   * A drop is never silent. The fields are gone from the body, so the reason
   * is the only thing left that explains them, and it goes to the operator log
   * bounded like every other string this package did not size. Reading that
   * reason is itself a read of a value this package does not own, so it happens
   * inside `logErrorLine`'s builder, where a `message` getter that throws is
   * announced rather than thrown a second time.
   *
   * The classification arrives as an ARGUMENT rather than being read here, and
   * that is the one-read rule again rather than tidiness. This line names the
   * incident with the route's `code` and `title`, and building it from
   * `this.code` was itself an unguarded read of a value this frame already
   * knows it cannot trust: when the code was the thing that had just failed,
   * the builder threw, `logErrorLine` kept the label and lost the fields, and
   * the line named the CODE's failure as the metadata's cause. Measured
   * through a real Response before this was fixed: `Exception metadata dropped
   * {"record":"unserialisable","cause":"code getter exploded"}`, with the
   * metadata's own reason nowhere in it.
   *
   * @param classification The already-guarded `code` and `title`, read once
   */
  private readWireMetadata(classification: {
    code: string
    title: string
  }): object {
    try {
      const serialised = JSON.stringify(this.metadata)

      return serialised === undefined ? {} : JSON.parse(serialised)
    } catch (failure) {
      logErrorLine('Exception metadata dropped', () => ({
        ...classification,
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
   * neither needs an override to go wrong. Both are declared `string` and both
   * are satisfied with no cast at all by the `any` a database row is, which is
   * the premise the metadata guard above already rests on: `new
   * ApiException(row.code, row.title, ...)` compiles. Measured through a real
   * handler: a `code` getter that throws left the route with NO Response,
   * above the frame that would have built one, and a `title` an upstream body
   * had been written into reached the browser whole, internal host included,
   * under a field this package documents as a classification. Writing either
   * of them AFTER construction does need a cast, both being `readonly`, which
   * is the one thing `message` never needed: measured under strict `tsc`
   * against the emitted types, `e.title = x` and `e.code = x` are both
   * TS2540, and the constructor call above compiles.
   *
   * Bounded at `PROBLEM_FIELD_MAX_LENGTH` rather than the message ceiling,
   * which is the argument that constant already makes about these exact two
   * fields: they are written by an upstream, so their length is not ours to
   * assume. A primitive is stringified rather than replaced, for the reason
   * `readWireField` gives: a pg `INT` code served a caller perfectly well
   * before this package read the field, and a substitute would destroy it.
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
   * read left on this line, and the code, the title, the message and the
   * metadata are each read EXACTLY once: the classification is read first and
   * handed to the metadata reader, which needs those two values to name an
   * incident in the operator log and used to read them a second time to get
   * them. The status is the one value read twice, on purpose, once for the
   * response and once to name it in the fallback sentence; the comment on the
   * classification reader above says so where it happens.
   *
   * The return type is written out rather than inferred, and the index
   * signature is the load-bearing half. Metadata keys are part of this body -
   * Console passes `{ details }` and reads `details` back - so a type narrowed
   * to the three named fields is a compile error in a consumer that nothing in
   * this package would notice. The e2e suite holds it: `test/` has no
   * `node_modules` of its own (its `file:../` dependency is declared, never
   * installed), so the import resolves through the workspace symlink
   * `node_modules/@lerianstudio/sindarian-server` to this package's `types`,
   * the emitted `dist/index.d.ts` a consumer installs.
   */
  getResponse(): {
    message: string
    code: string
    title: string
  } & Record<string, unknown> {
    const classification = this.readWireClassification()

    return {
      ...this.readWireMetadata(classification),
      ...classification,
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
