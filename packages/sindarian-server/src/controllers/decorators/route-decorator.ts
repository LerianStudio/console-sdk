import { NextResponse } from 'next/server'
import {
  GET_KEY,
  POST_KEY,
  PUT_KEY,
  PATCH_KEY,
  DELETE_KEY
} from '../../constants/keys'
import { bodyDecoratorHandler } from './body-decorator'
import { paramDecoratorHandler } from './param-decorator'
import { queryDecoratorHandler } from './query-decorator'
import { requestDecoratorHandler } from './request-decorator'

export function Route(routeKey: symbol, path?: string): MethodDecorator {
  return function (
    target: object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ) {
    Reflect.defineMetadata(
      routeKey,
      {
        method: routeKey,
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
export function Get(path?: string) {
  return Route(GET_KEY, path)
}

/**
 * Decorator to define a POST route.
 *
 * @param path - The path of the route.
 * @returns A decorator function that can be used to decorate a controller method.
 */
export function Post(path?: string) {
  return Route(POST_KEY, path)
}

/**
 * Decorator to define a PUT route.
 *
 * @param path - The path of the route.
 * @returns A decorator function that can be used to decorate a controller method.
 */
export function Put(path?: string) {
  return Route(PUT_KEY, path)
}

/**
 * Decorator to define a PATCH route.
 *
 * @param path - The path of the route.
 * @returns A decorator function that can be used to decorate a controller method.
 */
export function Patch(path?: string) {
  return Route(PATCH_KEY, path)
}

/**
 * Decorator to define a DELETE route.
 *
 * @param path - The path of the route.
 * @returns A decorator function that can be used to decorate a controller method.
 */
export function Delete(path?: string) {
  return Route(DELETE_KEY, path)
}
