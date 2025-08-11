import { z } from 'zod'
import { BODY_KEY } from '@/constants/keys'
import { getNextRequestArgument } from '@/utils/nextjs/get-next-arguments'
import { ValidationApiException } from '@/exceptions'

export type BodyMetadata = {
  propertyIndex: number
  schema?: z.ZodSchema
}

/**
 * Handler to validate the body of the request.
 *
 * @param target - The target object.
 * @param propertyKey - The property key.
 * @param args - The arguments.
 * @returns The parameter and parameter index.
 */
export async function bodyDecoratorHandler(
  target: object,
  propertyKey: string | symbol,
  args: any[]
) {
  const metadata: BodyMetadata = Reflect.getOwnMetadata(
    BODY_KEY,
    target,
    propertyKey
  )

  // If the metadata is not found, return null.
  if (metadata) {
    const request = getNextRequestArgument(args)
    const body = await request.json()

    // If the schema is not provided, return the body.
    if (!metadata.schema) {
      return {
        parameter: body,
        parameterIndex: metadata.propertyIndex
      }
    }

    // Parse the body using the schema.
    const parsedBody = metadata.schema?.safeParse(body)

    // If the body is not valid, throw a validation error.
    if (!parsedBody?.success) {
      throw new ValidationApiException(
        `Invalid body: ${JSON.stringify(parsedBody.error.flatten().fieldErrors)}`
      )
    }

    return {
      parameter: parsedBody.data,
      parameterIndex: metadata.propertyIndex
    }
  }

  return null
}

/**
 * Decorator to validate the body of the request.
 *
 * @param schema - The Zod schema to validate the body against.
 * @returns A decorator function that can be used to decorate a controller method.
 */
export function Body(schema?: z.ZodSchema) {
  return function (
    target: object,
    propertyKey: string | symbol,
    propertyIndex: number
  ) {
    Reflect.defineMetadata(
      BODY_KEY,
      { propertyIndex, schema },
      target,
      propertyKey
    )
  }
}
