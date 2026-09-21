import { NextResponse } from 'next/server'
import { ROUTE_KEY } from '@/constants/keys'
import { HttpMethods } from '@/constants/http-methods'
import { RequestHandler } from './request-decorator'
import { BodyHandler } from './body-decorator'
import { ParamHandler } from './param-decorator'
import { QueryHandler } from './query-decorator'

export type RouteMetadata = {
  methodName: string
  method: HttpMethods
  path: string
  paramTypes: any[]
}

export type RouteContext = {
  type?: 'body' | 'param' | 'query' | 'custom'
  parameter: any
  parameterIndex: number
  paramType?: any
}

export class RouteHandler {
  /**
   * Read the route metadata `@Route` wrote for one method.
   *
   * `@Route` is a method decorator, so it writes on the PROTOTYPE. Three
   * shapes reach here and all three resolve:
   *
   * - the controller CLASS — what a consumer reflecting over a controller
   *   hands over, having never constructed one (Product Console's
   *   `describeController`, plan 2026-09-21-console-simplification C11);
   * - that class's PROTOTYPE — what `Controller` passes;
   * - a controller INSTANCE — what `PipeHandler.execute` passes.
   *
   * @param target - The controller class, its prototype, or an instance
   * @param propertyKey - The method name
   * @returns The route metadata, or `undefined` when the method carries no
   *   route decorator
   */
  static getMetadata(
    target: object,
    propertyKey: string | symbol
  ): RouteMetadata | undefined {
    // A class carries nothing itself: its prototype does. Read that first,
    // then the target, then its constructor's prototype — the same two-step
    // read every sibling handler in this package uses, with the class shape
    // in front of it.
    let metadata: RouteMetadata | undefined

    if (typeof target === 'function' && (target as Function).prototype) {
      metadata = Reflect.getOwnMetadata(
        ROUTE_KEY,
        (target as Function).prototype,
        propertyKey
      )
    }

    metadata ??= Reflect.getOwnMetadata(ROUTE_KEY, target, propertyKey)

    if (!metadata && target.constructor) {
      metadata = Reflect.getOwnMetadata(
        ROUTE_KEY,
        target.constructor.prototype,
        propertyKey
      )
    }

    return metadata
  }

  static async getArgs(
    target: object,
    propertyKey: string | symbol,
    originalArgs: any[]
  ): Promise<RouteContext[]> {
    const args = [
      await RequestHandler.handle(target, propertyKey, originalArgs),
      await QueryHandler.handle(target, propertyKey, originalArgs),
      await ParamHandler.handle(target, propertyKey, originalArgs),
      await BodyHandler.handle(target, propertyKey, originalArgs)
    ]
      .flat()
      .filter((a) => a !== null && a !== undefined)
      .sort((a, b) => a.parameterIndex - b.parameterIndex)

    return args
  }
}

export function Route(method: HttpMethods, path: string): MethodDecorator {
  return function (
    target: object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ) {
    const paramTypes =
      Reflect.getMetadata('design:paramtypes', target, propertyKey) || []
    Reflect.defineMetadata(
      ROUTE_KEY,
      {
        methodName: propertyKey,
        method: method,
        path,
        paramTypes
      },
      target,
      propertyKey
    )

    const originalMethod = descriptor.value

    descriptor.value = async function (...args: any[]) {
      const response = await originalMethod.apply(this, args)

      if (response instanceof NextResponse) {
        return response
      }

      if (response == null) {
        return new NextResponse(null, { status: 204 })
      }

      return NextResponse.json(response)
    }
  }
}

/**
 * Decorator to define a GET route.
 *
 * @param path - The path of the route.
 * @returns A decorator function that can be used to decorate a controller method.
 */
export function Get(path: string = '') {
  return Route(HttpMethods.GET, path)
}

/**
 * Decorator to define a POST route.
 *
 * @param path - The path of the route.
 * @returns A decorator function that can be used to decorate a controller method.
 */
export function Post(path: string = '') {
  return Route(HttpMethods.POST, path)
}

/**
 * Decorator to define a PUT route.
 *
 * @param path - The path of the route.
 * @returns A decorator function that can be used to decorate a controller method.
 */
export function Put(path: string = '') {
  return Route(HttpMethods.PUT, path)
}

/**
 * Decorator to define a PATCH route.
 *
 * @param path - The path of the route.
 * @returns A decorator function that can be used to decorate a controller method.
 */
export function Patch(path: string = '') {
  return Route(HttpMethods.PATCH, path)
}

/**
 * Decorator to define a DELETE route.
 *
 * When the decorated method returns `null` or `undefined`, the response will
 * automatically be HTTP 204 No Content (with no body). If the method returns
 * a non-null value, it will be serialized as JSON with status 200.
 *
 * @param path - The path of the route.
 * @returns A decorator function that can be used to decorate a controller method.
 */
export function Delete(path: string = '') {
  return Route(HttpMethods.DELETE, path)
}
