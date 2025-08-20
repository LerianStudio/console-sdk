import { ArgumentsHost } from '@/context/arguments-host'
import { ExecutionContext } from '@/context/execution-context'
import { MODULE_PROPERTY } from '@/constants/keys'
import { BaseController } from '@/controllers/base-controller'
import { Container } from '@/dependency-injection/container'
import { BaseExceptionFilter } from '@/exceptions/base-exception-filter'
import { catchHandler } from '@/exceptions/decorators/catch-decorator'
import { filterHandler } from '@/exceptions/decorators/use-filters-decorator'
import { ExceptionFilter } from '@/exceptions/exception-filter'
import {
  interceptorExecute,
  interceptorHandler
} from '@/interceptor/decorators/use-interceptor-decorator'
import { Interceptor } from '@/interceptor/interceptor'
import { moduleHandler, ModuleMetadata } from '@/modules/module-decorator'
import { APP_FILTER } from '@/services/filters'
import { APP_INTERCEPTOR } from '@/services/interceptor'
import { bindRequest } from '@/services/request'
import { Class } from '@/types/class'
import { urlMatch } from '@/utils/url/url-match'
import { NextRequest, NextResponse } from 'next/server'
import { LoggerService } from '@/logger/logger-service'
import { Logger } from '@/logger/logger'
import { NotFoundApiException } from '@/exceptions/api-exception'
import { isNil } from 'lodash'

export type ServerFactoryOptions = {
  logger?: LoggerService | boolean
}

export class ServerFactory {
  private globalPrefix: string = ''
  private globalFilters: ExceptionFilter[] = [new BaseExceptionFilter()]
  private globalInterceptors: Interceptor[] = []

  private readonly module: Class
  private readonly container: Container
  private readonly routes: ModuleMetadata[]

  constructor(module: Class, container: Container, routes: ModuleMetadata[]) {
    this.module = module
    this.container = container
    this.routes = routes

    Logger.log('Application Started.')
  }

  public static create(module: Class, options?: ServerFactoryOptions) {
    const container = new Container()

    this._registerLogger(options?.logger)

    container.load(module.prototype[MODULE_PROPERTY])

    const routes = moduleHandler(module)

    return new ServerFactory(module, container, routes)
  }

  /**
   * Set the global prefix for the server
   * @param prefix - The global prefix to set
   */
  public setGlobalPrefix(prefix: string) {
    this.globalPrefix = prefix
  }

  public useGlobalFilters(...filters: ExceptionFilter[]) {
    this.globalFilters.push(...filters)
  }

  public useGlobalInterceptors(...interceptors: Interceptor[]) {
    this.globalInterceptors.push(...interceptors)
  }

  /**
   * Handle a request
   * @param request - The request to handle
   * @param params - The parameters to pass to the handler
   * @returns The response from the handler
   */
  public async handler(
    request: NextRequest,
    { params }: { params: Promise<any> }
  ) {
    const host = new ArgumentsHost([request])
    let controller: BaseController | undefined

    try {
      // Bind the current request to the container for this request lifecycle
      bindRequest(this.container, request)

      const { pathname, method } = this._parseRequest(request)

      const routeMatch = this._fetchRoute(pathname, method)

      controller = await this.container.getAsync(
        routeMatch?.controller as Class<BaseController>
      )

      const handler = this._fetchHandler(controller!, routeMatch?.methodName)

      const executionContext = new ExecutionContext(
        controller!.constructor as Class,
        handler,
        [request]
      )

      // Check if there's any interceptors to execute
      const interceptors = await this._fetchInterceptors(controller!)

      return await interceptorExecute(executionContext, interceptors, () =>
        handler.call(controller!, request, {
          params
        })
      )
    } catch (error: any) {
      const filters = controller
        ? await this._fetchExceptionFilters(controller)
        : await this._fetchGlobalFilters()

      for (const filter of filters) {
        // Fetch filter metadata
        const metadata = catchHandler(filter.constructor)
        const type = metadata?.type

        // Check if any specific type is registered, if none, it's a catch all filter
        if (!type || error instanceof type) {
          const response = await filter.catch(error, host)

          // If a response is returned from the filter, use it
          if (response) {
            return response
          }
        }
      }

      return NextResponse.json(
        { message: 'Internal server error' },
        { status: 500 }
      )
    }
  }

  private static _registerLogger(logger?: LoggerService | boolean) {
    if (logger !== false && !isNil(logger)) {
      Logger.overrideLogger(logger)
    }
  }

  /**
   * Parse the request
   * @param request - The request to parse
   * @returns The parsed request
   */
  private _parseRequest(request: NextRequest) {
    const { pathname } = new URL(request.url)
    const strippedPathname = pathname.replace(this.globalPrefix, '')

    return {
      pathname: strippedPathname,
      method: request.method.toUpperCase()
    }
  }

  /**
   * Fetch the route
   * @param pathname - The pathname to fetch the route for
   * @param method - The method to fetch the route for
   * @returns The route
   */
  private _fetchRoute(pathname: string, method: string) {
    const route = this.routes.find((route) => {
      const match = urlMatch(pathname, route.path)

      if (match && route.method === method) {
        return route
      }
    })

    if (!route) {
      Logger.error(`Route not found for ${method} ${pathname}`)
      throw new NotFoundApiException(`Route ${pathname} not found`)
    }

    return route
  }

  private async _fetchInterceptors(controller: BaseController) {
    const interceptors = [...this.globalInterceptors]

    // Fetch any registered global interceptor
    const appInterceptor = this.container.isBound(APP_INTERCEPTOR)
    if (appInterceptor) {
      interceptors.push(
        await this.container.getAsync<Interceptor>(APP_INTERCEPTOR)
      )
    }

    // Fetch controller interceptors
    const metadata = interceptorHandler(controller.constructor)
    if (metadata.length > 0) {
      const resolvedInterceptors = await Promise.all(
        metadata.map((interceptor) => {
          // If it's a class constructor (function), resolve from container
          if (typeof interceptor === 'function') {
            return this.container.getAsync<Interceptor>(interceptor)
          }
          // If it's an instance, resolve from container using its constructor
          return this.container.getAsync<Interceptor>(
            interceptor.constructor as any
          )
        })
      )
      interceptors.push(...resolvedInterceptors)
    }

    return interceptors
  }

  private _fetchHandler(controller: BaseController, methodName: string) {
    const originalHandler = controller![
      methodName as keyof BaseController
    ] as Function

    // Create a named function wrapper to preserve the method name for logging/debugging
    const handler = Object.defineProperty(
      function namedHandler(...args: any[]) {
        return originalHandler.apply(controller!, args)
      },
      'name',
      { value: methodName, configurable: true }
    )

    return handler
  }

  private async _fetchGlobalFilters() {
    const filters = [...this.globalFilters]

    // Fetch any registered global filter
    const appFilter = this.container.isBound(APP_FILTER)
    if (appFilter) {
      filters.push(await this.container.getAsync<ExceptionFilter>(APP_FILTER))
    }

    return filters
  }

  private async _fetchExceptionFilters(controller: BaseController) {
    const filters = await this._fetchGlobalFilters()

    // Fetch controller filters
    const controllerFilters = filterHandler(controller.constructor)
    if (controllerFilters.length > 0) {
      filters.push(...controllerFilters)
    }

    return filters
  }
}
