import { MODULE_PROPERTY } from '@/constants/keys'
import { BaseController } from '@/controllers/base-controller'
import { Container } from '@/dependency-injection/container'
import { moduleHandler, ModuleMetadata } from '@/modules/module-decorator'
import { bindRequest } from '@/services/request'
import { Class } from '@/types/class'
import { urlMatch } from '@/utils/url/url-match'
import { NextRequest, NextResponse } from 'next/server'

export class ServerFactory {
  private globalPrefix: string = ''

  private readonly module: Class
  private readonly container: Container
  private readonly routes: ModuleMetadata[]

  constructor(module: Class, container: Container, routes: ModuleMetadata[]) {
    this.module = module
    this.container = container
    this.routes = routes
  }

  public static create(module: Class) {
    const container = new Container()

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
    try {
      // Bind the current request to the container for this request lifecycle
      bindRequest(this.container, request)

      const { pathname, method } = this._parseRequest(request)

      const routeMatch = this._fetchRoute(pathname, method)

      // Extract URL parameters from the matched route
      const extractedParams = this._extractParams(pathname, routeMatch.path)

      // Merge with any existing params
      const resolvedParams = await params
      const combinedParams = { ...resolvedParams, ...extractedParams }

      const controller: BaseController = await this.container.getAsync(
        routeMatch?.controller as Class
      )

      if (!controller) {
        return NextResponse.json(
          { message: 'Controller not found' },
          { status: 500 }
        )
      }

      const handler = controller[
        routeMatch?.methodName as keyof BaseController
      ] as Function

      if (!handler) {
        return NextResponse.json(
          { message: 'Method not found' },
          { status: 500 }
        )
      }

      return await handler.call(controller, request, {
        params: Promise.resolve(combinedParams)
      })
    } catch (error: any) {
      // Handle route not found errors
      if (
        error.message &&
        error.message.includes('Route') &&
        error.message.includes('not found')
      ) {
        return NextResponse.json(
          { message: 'Route not found' },
          { status: 404 }
        )
      }

      // Handle validation errors
      if (
        error.message &&
        (error.message.includes('Invalid param') ||
          error.message.includes('Invalid body') ||
          error.message.includes('Invalid query'))
      ) {
        return NextResponse.json({ message: error.message }, { status: 400 })
      }

      // Handle other errors
      console.error('Server error:', error)
      return NextResponse.json(
        { message: 'Internal server error' },
        { status: 500 }
      )
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
      throw new Error(`Server: Route ${pathname} not found`)
    }

    return route
  }

  /**
   * Extract parameters from the URL using the route pattern
   * @param pathname - The actual pathname
   * @param routePattern - The route pattern with :param syntax
   * @returns The extracted parameters
   */
  private _extractParams(
    pathname: string,
    routePattern: string
  ): { [key: string]: string } {
    const pathSegments = pathname.split('/').filter(Boolean)
    const patternSegments = routePattern.split('/').filter(Boolean)

    const params: { [key: string]: string } = {}

    for (let i = 0; i < patternSegments.length; i++) {
      const patternSegment = patternSegments[i]
      const pathSegment = pathSegments[i]

      if (patternSegment.startsWith(':')) {
        const paramName = patternSegment.substring(1)
        params[paramName] = pathSegment
      }
    }

    return params
  }
}
