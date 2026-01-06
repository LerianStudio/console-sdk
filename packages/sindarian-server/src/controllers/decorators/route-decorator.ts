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
  static getMetadata(
    target: object,
    propertyKey: string | symbol
  ): RouteMetadata {
    return Reflect.getOwnMetadata(ROUTE_KEY, target, propertyKey)
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

      if (method === HttpMethods.DELETE && response == null) {
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
