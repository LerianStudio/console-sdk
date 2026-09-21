import { PARAM_KEY } from '@/constants/keys'
import { ValidationApiException } from '@/exceptions/api-exception'
import {
  getNextParamArgument,
  getRouteParamArgument
} from '@/utils/nextjs/get-next-arguments'

export type ParamMetadata = {
  name: string
  parameterIndex: number
}

export class ParamHandler {
  static getMetadata(
    target: object,
    propertyKey: string | symbol
  ): ParamMetadata[] | undefined {
    let metadatas: ParamMetadata[] | undefined = Reflect.getOwnMetadata(
      PARAM_KEY,
      target,
      propertyKey
    )

    // If not found on instance, try constructor prototype
    if (!metadatas && target.constructor) {
      metadatas = Reflect.getOwnMetadata(
        PARAM_KEY,
        target.constructor.prototype,
        propertyKey
      )
    }

    return metadatas
  }

  static async handle(
    target: object,
    propertyKey: string | symbol,
    args: any[]
  ): Promise<any> {
    const metadatas = this.getMetadata(target, propertyKey)

    // If the metadata is found, validate the param.
    if (metadatas && metadatas.length > 0) {
      // Two sources, both optional: Next's own params object (a per-file route
      // supplies the named segments; a catch-all supplies only its segment
      // array) and the captures the matched route produced. The captures come
      // last so they win a name collision — they are read from the URL the
      // framework actually matched. Spreading undefined yields {}, so a route
      // carrying neither behaves exactly as it did before.
      const params: { [key: string]: any } = {
        ...(await getNextParamArgument(args)),
        ...getRouteParamArgument(args)
      }

      // Validate the param.
      return metadatas.map((metadata) => {
        const value = params[metadata.name]

        // If the param is not found, throw a validation error.
        if (!value) {
          throw new ValidationApiException(
            `Invalid param: ${metadata.name} is required`
          )
        }

        return {
          type: 'param',
          parameter: value,
          parameterIndex: metadata.parameterIndex
        }
      })
    }

    return null
  }
}

/**
 * Decorator to validate the param of the request.
 *
 * @param name - The name of the param.
 * @returns A decorator function that can be used to decorate a controller method.
 */
export function Param(name: string) {
  return function (
    target: object,
    propertyKey: string | symbol,
    parameterIndex: number
  ) {
    const existingParams: ParamMetadata[] =
      Reflect.getOwnMetadata(PARAM_KEY, target, propertyKey) || []

    existingParams.push({
      name,
      parameterIndex
    })

    Reflect.defineMetadata(PARAM_KEY, existingParams, target, propertyKey)
  }
}
