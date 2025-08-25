import { injectable } from 'inversify'
import { HttpMethods } from '@/constants/http-methods'
import { CONTROLLER_KEY } from '@/constants/keys'
import { routeHandler } from './route-decorator'
import { applyDecorators } from '@/utils/apply-decorators'
import { getClassMethods } from '@/utils/class/get-class-methods'
import { urlJoin } from '@/utils/url/url-join'

export type ControllerMetadata = {
  methodName: string
  method: HttpMethods
  path: string
}

export function controllerHandler(target: Function) {
  const routes: ControllerMetadata[] = []
  const prototype = target.prototype

  const metadata = Reflect.getOwnMetadata(CONTROLLER_KEY, target)

  if (!metadata) {
    console.warn(`Class ${target.name} does not have a Controller decorator`)
    return []
  }

  const methodNames = getClassMethods(target)

  // Compile all routes from the controller
  for (const methodName of methodNames) {
    const routeMetadata = routeHandler(prototype, methodName)

    if (routeMetadata) {
      // Join the controller path with the route path
      const url = urlJoin(metadata.path, routeMetadata.path)

      // Add the route to the routes array
      routes.push({
        methodName: methodName,
        method: routeMetadata.method,
        path: url
      })
    }
  }

  return routes
}

/**
 * A class decorator that wraps all methods in the class with error handling.
 *
 * @returns
 */
export function Controller(path: string): ClassDecorator {
  return applyDecorators(injectable(), function (target: Function) {
    Reflect.defineMetadata(CONTROLLER_KEY, { path }, target)
  })
}
