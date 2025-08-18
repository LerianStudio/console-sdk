import { NextResponse } from 'next/server'
import { ROUTE_KEY } from '@/constants/keys'
import { HttpMethods } from '@/constants/http-methods'
import { bodyDecoratorHandler } from './body-decorator'
import { paramDecoratorHandler } from './param-decorator'
import { queryDecoratorHandler } from './query-decorator'
import { requestDecoratorHandler } from './request-decorator'

export type RouteMetadata = {
  method: HttpMethods
  path: string
}

export function routeHandler(
  target: object,
  propertyKey: string | symbol
): RouteMetadata | undefined {
  return Reflect.getOwnMetadata(ROUTE_KEY, target, propertyKey)
}

export function Route(method: HttpMethods, path: string): MethodDecorator {
  return function (
    target: object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ) {
    Reflect.defineMetadata(
      ROUTE_KEY,
      {
        method: method,
        path
      },
      target,
      propertyKey
    )

    const originalMethod = descriptor.value

    descriptor.value = async function (...originalArgs: any[]) {
      const args = [
        await requestDecoratorHandler(target, propertyKey, originalArgs),
        await queryDecoratorHandler(target, propertyKey, originalArgs),
        await paramDecoratorHandler(target, propertyKey, originalArgs),
        await bodyDecoratorHandler(target, propertyKey, originalArgs)
      ]
        .flat()
        .filter((a) => a !== null && a !== undefined)
        .sort((a, b) => a.parameterIndex - b.parameterIndex)
        .map((a) => a.parameter)

      const response = await originalMethod.apply(this, args)

      if (response instanceof NextResponse) {
        return response
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
 * @param path - The path of the route.
 * @returns A decorator function that can be used to decorate a controller method.
 */
export function Delete(path: string = '') {
  return Route(HttpMethods.DELETE, path)
}
