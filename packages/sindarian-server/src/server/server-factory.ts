import { ArgumentsHost } from '@/context/arguments-host'
import { ExecutionContext } from '@/context/execution-context'
import { MODULE_PROPERTY } from '@/constants/keys'
import { BaseController } from '@/controllers/base-controller'
import { Container } from '@/dependency-injection/container'
import { BaseExceptionFilter } from '@/exceptions/base-exception-filter'
import { catchHandler } from '@/exceptions/decorators/catch-decorator'
import { FilterHandler } from '@/exceptions/decorators/use-filters-decorator'
import { ExceptionFilter } from '@/exceptions/exception-filter'
import { InterceptorHandler } from '@/interceptor/decorators/use-interceptor-decorator'
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
import { PipeTransform } from '@/pipes/pipe-transform'
import { APP_PIPE } from '@/services/pipes'
import { PipeHandler } from '@/pipes/decorators/use-pipes'
import { RouteHandler } from '@/controllers/decorators/route-decorator'
import { sortRoutesBySpecificity } from '@/utils/routes/route-specificity'
import { GetOptions, OptionalGetOptions } from 'inversify'

export type ServerFactoryOptions = {
  logger?: LoggerService | boolean
}

export class ServerFactory {
  private globalPrefix: string = ''
  private globalFilters: ExceptionFilter[] = [new BaseExceptionFilter()]
  private globalInterceptors: Interceptor[] = []
  private globalPipes: PipeTransform[] = []

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

    // Sort routes by specificity (most specific first)
    // This ensures routes like /users/active match before /users/:id
    const sortedRoutes = sortRoutesBySpecificity(routes)

    return new ServerFactory(module, container, sortedRoutes)
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

  public useGlobalPipes(...pipes: PipeTransform[]) {
    this.globalPipes.push(...pipes)
  }

  /**
   * Get a service synchronously
   * @param service - The service to get
   * @param options - The options for getting the service
   * @returns The service instance
   */
  public get<T>(service: Class<T>, options?: OptionalGetOptions): T {
    return this.container.get<T>(service, options)
  }

  /**
   * Get a service asynchronously
   * @param service - The service to get
   * @param options - The options for getting the service
   * @returns A promise that resolves to the service instance
   */
  public getAsync<T>(service: Class<T>, options?: GetOptions): Promise<T> {
    return this.container.getAsync<T>(service, options)
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

      const match = this._fetchRoute(pathname, method)

      controller = await this.container.getAsync(
        match?.controller as Class<BaseController>
      )

      const handler = this._fetchHandler(controller!, match?.methodName)

      const executionContext = new ExecutionContext(
        controller!.constructor as Class,
        handler,
        [request]
      )

      // Check if there's any interceptors to execute
      const interceptors = await this._fetchInterceptors(controller!)

      // Check if there's any pipes to execute
      const pipes = await this._fetchPipes(controller!, match?.methodName)

      return await InterceptorHandler.execute(
        executionContext,
        interceptors,
        async () => {
          // Parse args
          const args = await RouteHandler.getArgs(
            controller!,
            match?.methodName,
            [request, { params }]
          )

          // Run registered pipes
          const pipedArgs = await PipeHandler.execute(
            controller!,
            match?.methodName,
            pipes,
            args
          )

          // Execute controller
          return await handler.call(controller!, ...pipedArgs)
        }
      )
    } catch (error: any) {
      const filters = await this._fetchExceptionFilters(controller)

      for (const filter of filters) {
        // Fetch filter metadata
        const metadata = catchHandler(filter.constructor)
        const type = metadata?.type

        // Check if any specific type is registered, if none, it's a catch all filter
        if (!type || error instanceof type) {
          const response = await filter.catch(error, host)

          // Add validation
          if (response && !(response instanceof Response)) {
            Logger.error(
              `ExceptionFilter ${filter.constructor.name} returned invalid response type: ${response?.constructor?.name}`
            )
            return NextResponse.json(
              { message: 'Internal server error' },
              { status: 500 }
            )
          }

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

    // Strip the global prefix from the pathname
    let strippedPathname = pathname
    if (this.globalPrefix && pathname.startsWith(this.globalPrefix)) {
      strippedPathname = pathname.slice(this.globalPrefix.length)
    }

    // Ensure pathname starts with / after stripping prefix
    if (!strippedPathname.startsWith('/')) {
      strippedPathname = '/' + strippedPathname
    }

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

    // Fetch all registered global interceptors
    try {
      const appInterceptors =
        await this.container.getAllAsync<Interceptor>(APP_INTERCEPTOR)
      if (appInterceptors.length > 0) {
        interceptors.push(...appInterceptors)
      }
    } catch {
      // No bindings found or error retrieving - continue without APP_INTERCEPTOR providers
    }

    if (controller) {
      // Fetch controller interceptors
      interceptors.push(
        ...(await InterceptorHandler.fetch(this.container, controller))
      )
    }

    return interceptors.reverse()
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

  private async _fetchExceptionFilters(controller?: BaseController) {
    const filters = [...this.globalFilters]

    // Fetch all registered global filters
    try {
      const appFilters =
        await this.container.getAllAsync<ExceptionFilter>(APP_FILTER)
      if (appFilters.length > 0) {
        filters.push(...appFilters)
      }
    } catch {
      // No bindings found or error retrieving - continue without APP_FILTER providers
    }

    if (controller) {
      filters.push(...(await FilterHandler.fetch(this.container, controller)))
    }

    return filters.reverse()
  }

  /**
   * Fetch the pipes for a controller method
   * @param controller
   * @param methodName
   * @returns
   */
  private async _fetchPipes(
    controller: BaseController,
    methodName: string | symbol
  ) {
    const pipes = [...this.globalPipes]

    // Fetch all registered global pipes
    try {
      const appPipes = await this.container.getAllAsync<PipeTransform>(APP_PIPE)
      if (appPipes.length > 0) {
        pipes.push(...appPipes)
      }
    } catch {
      // No bindings found or error retrieving - continue without APP_PIPE providers
    }

    // Fetch controller pipes
    if (controller) {
      pipes.push(
        ...(await PipeHandler.fetch(this.container, controller, methodName))
      )
    }

    return pipes.reverse()
  }
}
