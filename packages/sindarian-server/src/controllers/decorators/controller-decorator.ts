import { injectable, injectFromBase } from 'inversify'
import { ApiException } from '@/exceptions/api-exception'
import { HttpStatus } from '@/constants/http-status'
import { HttpMethods } from '@/constants/http-methods'
import { NextResponse } from 'next/server'
import { LoggerAggregator } from '@lerianstudio/lib-logs'
import { CONTROLLER_KEY } from '@/constants/keys'
import { routeHandler } from './route-decorator'
import { applyDecorators } from '@/utils/apply-decorators'
import { getClassMethods } from '@/utils/class/get-class-methods'
import { urlJoin } from '@/utils/url/url-join'

export type ErrorResponse = {
  message: string
  status: number
}

async function apiErrorHandler(
  error: any,
  logger: LoggerAggregator
): Promise<ErrorResponse> {
  // const intl = await getIntl()

  const errorMetadata = {
    errorType: error.constructor.name,
    originalMessage: error.message
  }

  if (error instanceof ApiException) {
    logger.error(`Api error`, errorMetadata)
    return { message: error.message, status: error.getStatus() }
  }

  logger.error(`Unknown error`, errorMetadata)
  return {
    message: 'Unknown error',
    // message: intl.formatMessage({
    //   id: 'error.midaz.unknowError',
    //   defaultMessage: 'Unknown error on Midaz.'
    // }),
    status: HttpStatus.INTERNAL_SERVER_ERROR
  }
}

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
  return applyDecorators(
    injectable(),
    injectFromBase({
      extendProperties: true
    }),
    function (target: Function) {
      Reflect.defineMetadata(CONTROLLER_KEY, { path }, target)

      // Get all method names from the prototype
      const prototype = target.prototype
      const methodNames = getClassMethods(target)

      // Replace each method with a wrapped version
      for (const methodName of methodNames) {
        const originalMethod = prototype[methodName]

        // Replace with wrapped method
        prototype[methodName] = async function (...args: any[]) {
          try {
            return await originalMethod.apply(this, args)
          } catch (error: any) {
            const logger = (this as any).logger

            const { message, status } = await apiErrorHandler(error, logger)
            return NextResponse.json({ message }, { status })
          }
        }
      }
    }
  )
}
