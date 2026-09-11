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
import {
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

/**
 * What the caller is told when the failed response classified nothing.
 *
 * Not "non-JSON": a body that parses as a JSON string or number is perfectly
 * valid JSON and still carries no problem details, and it reached here as a
 * bare sentence written by the upstream — one that had a taxpayer id in it
 * the day this was found.
 */
const noProblemDetails = (status: number) =>
  `Upstream error body carried no problem details (status ${status})`

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

      // Parse text/plain error responses
      if (response?.headers?.get('content-type')?.includes('text/plain')) {
        const message = await response.text()

        // The hook still receives the text — a transport that knows its own
        // upstream may read it — but the text never becomes the thrown
        // message. It is free prose written by whatever answered, and the
        // thrown message is what `getResponse()` hands to the browser.
        await this.catch(request, response, { message })

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

        // Never the body itself. The whole parsed body used to be handed in
        // as the message, and `getResponse()` serialises the message to the
        // browser — so `detail` and `errors[]`, which is where an upstream
        // puts destination URLs and the values it rejected, went with it.
        throw this.toApiException(
          response.status,
          toProblemMessage(error, noProblemDetails(response.status))
        )
      }

      // Handle 204 Success No Content response
      if (response.status === HttpStatus.NO_CONTENT) {
        return {} as T
      }

      return await response.json()
    } catch (error: any) {
      if (error instanceof ApiException) {
        throw error
      }

      // Never the error's own message. A `fetch` failure names the host and
      // port it could not reach, and a success body that is not JSON arrives
      // here as a SyntaxError quoting its first bytes; both used to become
      // the message this exception serialises to the browser. What actually
      // broke stays on `cause`, which no exception filter serialises, so a
      // server-side log can still say it. Non-enumerable, like the `cause`
      // the Error constructor sets, so a caller that spreads the exception
      // does not put it back on the wire.
      throw Object.defineProperty(
        new ServiceUnavailableApiException(UPSTREAM_UNREACHABLE),
        'cause',
        { value: error, writable: true, configurable: true }
      )
    }
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
   * Reads the body of a failed response without letting the body decide the
   * status.
   *
   * `response.json()` throws on a bodiless 401/403 and on any non-JSON error
   * page, and that throw used to escape the whole `request` block: the caller
   * got a 503 "service unavailable" for what was really an expired token, and
   * the upstream status was gone. Text first, parse second, and only an object
   * survives — a scalar or unparseable body is dropped rather than handed on
   * to be interpolated into an exception message.
   */
  private async readErrorBody(response: Response): Promise<unknown> {
    const rawText = await response.text()

    if (!rawText) {
      return undefined
    }

    try {
      const parsed = JSON.parse(rawText)
      return parsed !== null && typeof parsed === 'object' ? parsed : undefined
    } catch {
      return undefined
    }
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
   * Event triggered after the request is sent, but before response JSON parsing
   * @param request The request that was sent
   * @param response The raw response received from the server
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected onAfterFetch(request: Request, response: Response) {}

  /**
   * The fields of a failed call that are safe to log.
   *
   * The body is not among them. An RFC 9457 problem body puts a free-text
   * sentence in `detail` and the rejected values themselves in `errors[]`, so
   * logging the body wrote destination URLs and submitted values into operator
   * logs, at error level, on every single failure. Only a bounded
   * classification survives: `type`, `title`, `code`. The URL keeps its path
   * and loses its query string, which carries tokens and filters just as
   * freely as a body does.
   *
   * Override to add what a specific upstream is known to keep safe — and only
   * that. What this returns is written by the default `catch` to
   * `console.error`, at error level, on every failed call, so it lands in the
   * operator's log and in whatever ships that log onward. The object returned
   * here is the ceiling, not a starting point: `return { ...super.describe(),
   * ...error }`, or returning `error` itself, puts the whole upstream body
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
    error: any
  ): Record<string, unknown> {
    const { origin, pathname } = new URL(request.url)
    const cap = (value: string) => value.slice(0, PROBLEM_FIELD_MAX_LENGTH)

    return {
      method: request.method,
      url: `${origin}${pathname}`,
      status: response.status,
      ...(typeof error?.type === 'string' && { type: cap(error.type) }),
      ...(typeof error?.title === 'string' && { title: cap(error.title) }),
      ...(typeof error?.code === 'string' && { code: cap(error.code) })
    }
  }

  /**
   * Catch function to handle errors from the native fetch API
   * @param request The request that was sent
   * @param response The raw response received from the server
   * @param error Parsed error response from the server, `undefined` when the
   * response carried no JSON object body
   */
  protected async catch(request: Request, response: Response, error: any) {
    console.error(
      'Request error',
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
