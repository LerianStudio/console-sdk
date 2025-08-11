import { injectable, injectFromBase } from 'inversify'
import { applyDecorators } from '@/utils/apply-decorators'
import { ApiException } from '@/exceptions'
import { HttpStatus } from '@/constants/http-status'
import { NextResponse } from 'next/server'
import { LoggerAggregator } from '@lerianstudio/lib-logs'

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

const controllerKey = Symbol('controller')

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
      Reflect.defineMetadata(controllerKey, { path }, target)

      // Get all method names from the prototype
      const prototype = target.prototype
      const methodNames = Object.getOwnPropertyNames(prototype).filter(
        (name) =>
          typeof prototype[name] === 'function' && name !== 'constructor'
      )

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
