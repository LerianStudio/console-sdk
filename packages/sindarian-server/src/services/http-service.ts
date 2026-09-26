import {
  forOwn,
  isNull,
  isUndefined,
  forEach,
  isArray,
  isObject,
  toString
} from 'lodash'
import { createQueryString } from '@/utils/search/create-query-string'
import { HttpStatus } from '@/constants/http-status'
import {
  ApiException,
  BadRequestApiException,
  ForbiddenApiException,
  InternalServerErrorApiException,
  NotFoundApiException,
  ServiceUnavailableApiException,
  UnauthorizedApiException,
  UnprocessableEntityApiException
} from '@/exceptions/api-exception'
import { logErrorLine } from '@/utils/error/log-error-line'
import {
  MESSAGE_MAX_LENGTH,
  noProblemDetails,
  PROBLEM_FIELD_MAX_LENGTH,
  toProblemMessage
} from '@/utils/error/to-problem-message'

export interface FetchModuleOptions extends RequestInit {
  baseUrl?: URL | string
  search?: object
}

/**
 * The statuses that have a purpose-built exception here.
 *
 * Anything else in the 4xx range keeps the status the upstream actually sent
 * rather than collapsing into 503: a 409 used to reach the user as "service
 * unavailable" when the answer was "this already exists", and a 429 as an
 * outage when the answer was "slow down". 5xx keeps collapsing into 503,
 * because a gateway that failed IS an unavailable service from here.
 */
const STATUS_EXCEPTIONS: Record<number, new (message: string) => ApiException> =
  {
    [HttpStatus.BAD_REQUEST]: BadRequestApiException,
    [HttpStatus.UNAUTHORIZED]: UnauthorizedApiException,
    [HttpStatus.FORBIDDEN]: ForbiddenApiException,
    [HttpStatus.NOT_FOUND]: NotFoundApiException,
    [HttpStatus.UNPROCESSABLE_ENTITY]: UnprocessableEntityApiException,
    [HttpStatus.INTERNAL_SERVER_ERROR]: InternalServerErrorApiException
  }

/** Neither a `fetch` failure nor an unreadable success body may describe itself. */
const UPSTREAM_UNREACHABLE =
  'The request to the upstream service could not be completed'

/**
 * HTTP service class to allow easy implementation of custom API repositories
 *
 * Code based from nestjs-fetch:
 * https://github.com/mikehall314/nestjs-fetch/blob/main/lib/fetch.service.ts
 */
export abstract class HttpService {
  protected async request<T>(request: Request): Promise<T> {
    try {
      this.onBeforeFetch(request)

      const response = await fetch(request)

      this.onAfterFetch(request, response)

      // Parse text/plain error responses. The status decides, not the header:
      // an upstream that answers a SUCCESS it forgot to label as JSON is not
      // an outage, and reading the header first turned every one of them into
      // one. A 2xx falls through to `readSuccessBody` below, whose default
      // parses by body and ignores the declared type; a 2xx whose body is
      // genuinely not JSON lands in the catch and becomes the same bounded
      // exception it always did.
      if (
        !response.ok &&
        response?.headers
          ?.get('content-type')
          ?.toLowerCase()
          .includes('text/plain')
      ) {
        const body = await response.text()

        // Under `text`, never `message`, bounded: an `error?.message` reader
        // falls through to its own sentence, and a transport opts in to the
        // body by reading `text`.
        await this.catch(
          request,
          response,
          body ? { text: body.slice(0, MESSAGE_MAX_LENGTH) } : undefined
        )

        throw this.toApiException(
          response.status,
          noProblemDetails(response.status)
        )
      }

      // Parse application/json error responses
      // NodeJS native fetch does not throw for logic errors
      if (!response.ok) {
        const error = await this.readErrorBody(response)

        await this.catch(request, response, error)

        // The bounded classification, never the body — see `toProblemMessage`.
        throw this.toApiException(
          response.status,
          toProblemMessage(error, noProblemDetails(response.status))
        )
      }

      // Handle 204 Success No Content response
      if (response.status === HttpStatus.NO_CONTENT) {
        return {} as T
      }

      // Not the outer catch: that one rethrows an ApiException unchanged,
      // and an override can throw one carrying the body it just read.
      try {
        return await this.readSuccessBody<T>(response)
      } catch (error: unknown) {
        throw this.unreachable(request, error)
      }
    } catch (error: unknown) {
      if (error instanceof ApiException) {
        throw error
      }

      throw this.unreachable(request, error)
    }
  }

  /**
   * The bounded exception a call that never produced a usable answer
   * becomes, after reporting what actually broke to `onRequestFailure`.
   */
  private unreachable(
    request: Request,
    error: unknown
  ): ServiceUnavailableApiException {
    try {
      this.onRequestFailure(request, error)
    } catch {
      // a failing failure-logger must never replace the bounded exception
    }

    // Never the error's own message. A `fetch` failure names the host and
    // port it could not reach, and a success body that is not JSON arrives
    // here as a SyntaxError quoting its first bytes; both used to become
    // the message this exception serialises to the browser. What actually
    // broke went to `onRequestFailure` just above, and stays on `cause`,
    // which no exception filter serialises. Non-enumerable, like the
    // `cause` the Error constructor sets, so a caller that spreads the
    // exception does not put it back on the wire.
    return Object.defineProperty(
      new ServiceUnavailableApiException(UPSTREAM_UNREACHABLE),
      'cause',
      { value: error, writable: true, configurable: true }
    )
  }

  /**
   * The exception a failed upstream call becomes, at the status it really was.
   */
  private toApiException(status: number, message: string): ApiException {
    const Exception = STATUS_EXCEPTIONS[status]

    if (Exception) {
      return new Exception(message)
    }

    if (
      status >= HttpStatus.BAD_REQUEST &&
      status < HttpStatus.INTERNAL_SERVER_ERROR
    ) {
      return new ApiException('0008', 'Upstream Error', message, status)
    }

    return new ServiceUnavailableApiException(message)
  }

  /**
   * Reads the body of a 2xx that is not a 204, after the error branches.
   *
   * The default parses JSON. A transport whose upstream answers a success in
   * another shape (Slack's `ok` as text/plain) overrides it to read the body
   * it is actually sent. A throw inside it, an `ApiException` included, becomes
   * the bounded `ServiceUnavailableApiException` with the thrown error on
   * `cause`, so an override cannot put a body on the wire.
   */
  protected async readSuccessBody<T>(response: Response): Promise<T> {
    return (await response.json()) as T
  }

  /**
   * Reads a failed response's body without letting it decide the status: empty
   * is `undefined`, a JSON object is that object, and anything else (HTML, a
   * panic's text, a JSON scalar or array) is `{ text }` bounded at
   * `MESSAGE_MAX_LENGTH`.
   */
  private async readErrorBody(response: Response): Promise<unknown> {
    const rawText = await response.text()

    if (!rawText) {
      return undefined
    }

    try {
      const parsed = JSON.parse(rawText)

      if (
        parsed !== null &&
        typeof parsed === 'object' &&
        !Array.isArray(parsed)
      ) {
        return parsed
      }
    } catch {
      // not JSON: handed on as text below
    }

    return { text: rawText.slice(0, MESSAGE_MAX_LENGTH) }
  }

  protected async createRequest(
    url: URL | string,
    options: FetchModuleOptions
  ): Promise<Request> {
    const defaults = (await this.createDefaults()) as FetchModuleOptions

    const { baseUrl, search, ...requestOptions } = {
      ...defaults,
      ...options,
      headers: {
        ...defaults.headers,
        ...options.headers
      }
    }

    return new Request(
      new URL(url + createQueryString(search), baseUrl),
      requestOptions
    )
  }

  protected async createRequestFormData(
    url: URL | string,
    options: FetchModuleOptions
  ) {
    const defaults = (await this.createDefaults()) as FetchModuleOptions

    const { baseUrl, search, ...requestOptions } = {
      ...defaults,
      ...options,
      headers: {
        ...defaults.headers,
        ...options.headers
      }
    }

    if (requestOptions.headers) {
      delete (requestOptions.headers as any)['Content-Type']
      delete (requestOptions.headers as any)['content-type']
    }

    return new Request(
      new URL(url + createQueryString(search), baseUrl),
      requestOptions
    )
  }

  protected async createDefaults() {
    return {}
  }

  /**
   * Event triggered before the request is sent
   * @param request The request to be sent
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected onBeforeFetch(request: Request) {}

  /**
   * Event triggered after the request is sent, but before the response body is read
   * @param request The request that was sent
   * @param response The raw response received from the server
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected onAfterFetch(request: Request, response: Response) {}

  /**
   * Event triggered when the call never produced a usable response.
   *
   * A `fetch` that never connected, a DNS or TLS failure, a success body that
   * is not JSON, a `catch` override that threw something other than an
   * `ApiException`: every one of them becomes the same fixed sentence on the
   * wire, which is correct — the host and port a request could not reach are
   * not the browser's business. They ARE the operator's, and nothing wrote
   * them down: an upstream outage left no server-side record at all.
   *
   * What lands here is deliberately the unredacted cause, so an override must
   * keep it server-side. The URL keeps its path and loses its query string,
   * which carries tokens just as freely as a body does.
   *
   * Like `onBeforeFetch` and `onAfterFetch`, this must not throw. A throw is
   * swallowed so the bounded exception still wins — an override that crashes
   * here used to replace the fixed sentence with its own, and a
   * non-`ApiException` message is serialised to the browser verbatim. The
   * cost of the containment is that the override's own failure is silent and
   * the record it was supposed to write is gone.
   *
   * @param request The request that was sent
   * @param error Whatever actually broke
   */
  protected onRequestFailure(request: Request, error: unknown): void {
    const { origin, pathname } = new URL(request.url)

    logErrorLine('Request failed', () => ({
      method: request.method,
      url: `${origin}${pathname}`,
      cause: error instanceof Error ? error.message : String(error)
    }))
  }

  /**
   * The fields of a failed call that are safe to log.
   *
   * The body is not among them — `toProblemMessage` carries the argument for
   * why `detail` and `errors[]` never leave the upstream. Only a bounded
   * classification survives: `type`, `title`, `code`. The URL keeps its path
   * and loses its query string, which carries tokens and filters just as
   * freely as a body does.
   *
   * Override to add what a specific upstream is known to keep safe — and only
   * that. What this returns is written by the default `catch` to
   * `console.error`, at error level, on every failed call, so it lands in the
   * operator's log and in whatever ships that log onward. The object returned
   * here is the ceiling, not a starting point: `return {
   * ...super.describeRequestError(request, response, error), ...error }`, or
   * returning `error` itself, puts the whole upstream body
   * back in the log and re-opens exactly the defect this replaced. Add named
   * fields you have read the upstream's contract for.
   *
   * @param request The request that was sent
   * @param response The raw response received from the server
   * @param error Parsed error response from the server, when it had one
   */
  protected describeRequestError(
    request: Request,
    response: Response,
    error: unknown
  ): Record<string, unknown> {
    const { origin, pathname } = new URL(request.url)
    const problem = (error ?? {}) as Record<string, unknown>
    const cap = (value: string) => value.slice(0, PROBLEM_FIELD_MAX_LENGTH)

    return {
      method: request.method,
      url: `${origin}${pathname}`,
      status: response.status,
      ...(typeof problem.type === 'string' && { type: cap(problem.type) }),
      ...(typeof problem.title === 'string' && { title: cap(problem.title) }),
      ...(typeof problem.code === 'string' && { code: cap(problem.code) })
    }
  }

  /**
   * Catch function to handle errors from the native fetch API
   *
   * Throwing from here opts out of everything `request` does afterwards: the
   * bounded message and the preserved upstream status are both built after
   * this hook returns, so an exception raised here is the one the caller gets,
   * and bounding its message is the overrider's job (`PROBLEM_FIELD_MAX_LENGTH`
   * is exported for exactly that).
   *
   * @param request The request that was sent
   * @param response The raw response received from the server
   * @param error Parsed error response from the server: a JSON object as
   * parsed, `{ text }` for any other body, `undefined` for an empty one
   */
  protected async catch(request: Request, response: Response, error: any) {
    // Handed over as a function, not as a value: this call sits inside
    // `request`'s own try, and `describeRequestError` is a hook a consumer
    // overrides, so building the record HERE would put an override's throw
    // outside the writer's guard and turn the upstream's real status into a
    // 503.
    logErrorLine('Request error', () =>
      this.describeRequestError(request, response, error)
    )
  }

  async get<T>(
    url: URL | string,
    options: FetchModuleOptions = {}
  ): Promise<T> {
    const request = await this.createRequest(url, { ...options, method: 'GET' })
    return this.request<T>(request)
  }

  async head(
    url: URL | string,
    options: FetchModuleOptions = {}
  ): Promise<Response> {
    const request = await this.createRequest(url, {
      ...options,
      method: 'HEAD'
    })
    return this.request(request)
  }

  async delete(
    url: URL | string,
    options: FetchModuleOptions = {}
  ): Promise<Response> {
    const request = await this.createRequest(url, {
      ...options,
      method: 'DELETE'
    })
    return this.request(request)
  }

  async patch<T>(
    url: URL | string,
    options: FetchModuleOptions = {}
  ): Promise<T> {
    const request = await this.createRequest(url, {
      ...options,
      method: 'PATCH'
    })
    return this.request<T>(request)
  }

  async put<T>(
    url: URL | string,
    options: FetchModuleOptions = {}
  ): Promise<T> {
    const request = await this.createRequest(url, { ...options, method: 'PUT' })
    return this.request<T>(request)
  }

  async post<T>(
    url: URL | string,
    options: FetchModuleOptions = {}
  ): Promise<T> {
    const request = await this.createRequest(url, {
      ...options,
      method: 'POST'
    })
    return this.request<T>(request)
  }

  /**
   * Convert an object to FormData, handling File objects and nested data
   * Uses lodash utilities for better type checking and iteration
   * @param data Object to convert to FormData
   * @returns FormData instance
   */
  private objectToFormData(data: Record<string, any>): FormData {
    const formData = new FormData()

    forOwn(data, (value, key) => {
      // Skip null/undefined values using lodash utilities
      if (isNull(value) || isUndefined(value)) {
        return
      }

      if (value instanceof File) {
        formData.append(key, value)
      } else if (isArray(value)) {
        forEach(value, (item, index) => {
          if (item instanceof File) {
            formData.append(`${key}[${index}]`, item)
          } else {
            formData.append(`${key}[${index}]`, toString(item))
          }
        })
      } else if (isObject(value)) {
        // Convert nested objects to JSON strings
        formData.append(key, JSON.stringify(value))
      } else {
        formData.append(key, toString(value))
      }
    })

    return formData
  }

  /**
   * POST method with automatic FormData conversion
   * Accepts any object and converts it to FormData, handling File objects properly
   * Automatically removes Content-Type header to let browser set multipart boundary
   * @param url URL to send the request to
   * @param data Object to convert to FormData
   * @param options Additional request options
   * @returns Promise resolving to the response data
   */
  async postFormData<T>(
    url: URL | string,
    data: Record<string, any>,
    options: FetchModuleOptions = {}
  ): Promise<T> {
    const formData = this.objectToFormData(data)

    const request = await this.createRequestFormData(url, {
      ...options,
      method: 'POST',
      body: formData
    })

    return this.request<T>(request)
  }

  /**
   * PATCH method with automatic FormData conversion
   * Accepts any object and converts it to FormData, handling File objects properly
   * Automatically removes Content-Type header to let browser set multipart boundary
   * @param url URL to send the request to
   * @param data Object to convert to FormData
   * @param options Additional request options
   * @returns Promise resolving to the response data
   */
  async patchFormData<T>(
    url: URL | string,
    data: Record<string, any>,
    options: FetchModuleOptions = {}
  ): Promise<T> {
    const formData = this.objectToFormData(data)

    const request = await this.createRequestFormData(url, {
      ...options,
      method: 'PATCH',
      body: formData
    })

    return this.request<T>(request)
  }
}
