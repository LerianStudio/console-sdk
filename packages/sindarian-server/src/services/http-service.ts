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
  InternalServerErrorApiException,
  NotFoundApiException,
  ServiceUnavailableApiException,
  UnauthorizedApiException,
  UnprocessableEntityApiException
} from '@/exceptions/api-exception'

export interface FetchModuleOptions extends RequestInit {
  baseUrl?: URL | string
  search?: object
}

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

        await this.catch(request, response, { message })

        if (response.status === HttpStatus.UNAUTHORIZED) {
          throw new UnauthorizedApiException(message)
        } else if (response.status === HttpStatus.NOT_FOUND) {
          throw new NotFoundApiException(message)
        } else if (response.status === HttpStatus.UNPROCESSABLE_ENTITY) {
          throw new UnprocessableEntityApiException(message)
        } else if (response.status === HttpStatus.INTERNAL_SERVER_ERROR) {
          throw new InternalServerErrorApiException(message)
        }

        throw new ServiceUnavailableApiException(message)
      }

      // Parse application/json error responses
      // NodeJS native fetch does not throw for logic errors
      if (!response.ok) {
        const error = await this.readErrorBody(response)

        await this.catch(request, response, error)

        // Never the body text. A gateway's HTML page or a truncated body used
        // to arrive here inside a SyntaxError whose own message quotes the
        // first bytes of that body, and that message became the exception's.
        const message =
          error ??
          `Upstream returned a non-JSON error body (status ${response.status})`

        if (response.status === HttpStatus.UNAUTHORIZED) {
          throw new UnauthorizedApiException(message)
        } else if (response.status === HttpStatus.NOT_FOUND) {
          throw new NotFoundApiException(message)
        } else if (response.status === HttpStatus.UNPROCESSABLE_ENTITY) {
          throw new UnprocessableEntityApiException(message)
        } else if (response.status === HttpStatus.INTERNAL_SERVER_ERROR) {
          throw new InternalServerErrorApiException(message)
        }

        throw new ServiceUnavailableApiException(message)
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

      throw new ServiceUnavailableApiException(error)
    }
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
  private async readErrorBody(response: Response): Promise<any> {
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
   * Override to add what a specific upstream is known to keep safe.
   * @param request The request that was sent
   * @param response The raw response received from the server
   * @param error Parsed error response from the server, when it had one
   */
  protected describeRequestError(
    request: Request,
    response: Response,
    error: any
  ): Record<string, any> {
    const { origin, pathname } = new URL(request.url)

    return {
      method: request.method,
      url: `${origin}${pathname}`,
      status: response.status,
      ...(typeof error?.type === 'string' && { type: error.type }),
      ...(typeof error?.title === 'string' && { title: error.title }),
      ...(typeof error?.code === 'string' && { code: error.code })
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
