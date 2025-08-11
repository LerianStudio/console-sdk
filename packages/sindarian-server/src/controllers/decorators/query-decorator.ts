import z from 'zod'
import { QUERY_KEY } from '@/constants/keys'
import { ValidationApiException } from '@/exceptions'
import { getNextRequestArgument } from '@/utils/nextjs/get-next-arguments'

export type QueryMetadata = {
  propertyKey: string | symbol
  parameterIndex: number
  schema?: z.ZodSchema
}

/**
 * Handler to validate the query of the request.
 *
 * @param target - The target object.
 * @param propertyKey - The property key.
 * @param args - The arguments.
 * @returns The parameter and parameter index.
 */
export function queryDecoratorHandler(
  target: object,
  propertyKey: string | symbol,
  args: any[]
) {
  const metadata: QueryMetadata = Reflect.getOwnMetadata(
    QUERY_KEY,
    target,
    propertyKey
  )

  // If the metadata is found, validate the query.
  if (metadata) {
    const request = getNextRequestArgument(args)
    const { searchParams } = new URL(request.url)

    const query = Object.fromEntries(searchParams.entries())

    // If the schema is not provided, return the query.
    if (!metadata.schema) {
      return {
        parameter: query,
        parameterIndex: metadata.parameterIndex
      }
    }

    const parsedQuery = metadata.schema?.safeParse(query)

    // If the query is not valid, throw a validation error.
    if (!parsedQuery?.success) {
      throw new ValidationApiException(
        `Invalid query parameters: ${JSON.stringify(
          parsedQuery.error.flatten().fieldErrors
        )}`
      )
    }

    return {
      parameter: parsedQuery.data,
      parameterIndex: metadata.parameterIndex
    }
  }

  return null
}

/**
 * Decorator to validate the query of the request.
 *
 * @param schema - The Zod schema to validate the query against.
 * @returns A decorator function that can be used to decorate a controller method.
 */
export function Query(schema?: z.ZodSchema) {
  return function (
    target: object,
    propertyKey: string | symbol,
    parameterIndex: number
  ) {
    Reflect.defineMetadata(
      QUERY_KEY,
      {
        propertyKey,
        parameterIndex,
        schema
      },
      target,
      propertyKey
    )
  }
}
