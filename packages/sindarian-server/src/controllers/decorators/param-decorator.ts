import { PARAM_KEY } from '@/constants/keys'
import { ValidationApiException } from '@/exceptions/api-exception'
import { getNextParamArgument } from '@/utils/nextjs/get-next-arguments'

export type ParamMetadata = {
  name: string
  parameterIndex: number
}

/**
 * Handler to validate the param of the request.
 *
 * @param target - The target object.
 * @param propertyKey - The property key.
 * @param args - The arguments.
 * @returns The parameter and parameter index.
 */
export async function paramDecoratorHandler(
  target: object,
  propertyKey: string | symbol,
  args: any[]
): Promise<any> {
  const metadatas: ParamMetadata[] | undefined = Reflect.getOwnMetadata(
    PARAM_KEY,
    target,
    propertyKey
  )

  // If the metadata is found, validate the param.
  if (metadatas && metadatas.length > 0) {
    const params: { [key: string]: any } = await getNextParamArgument(args)

    // If params is undefined or null, all required params are missing
    if (!params) {
      throw new ValidationApiException(
        `Invalid param: ${metadatas[0].name} is required`
      )
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
        parameter: value,
        parameterIndex: metadata.parameterIndex
      }
    })
  }

  return null
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
