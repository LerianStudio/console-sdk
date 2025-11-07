import type * as z3 from 'zod/v3'
import { $ZodType } from 'zod/v4/core/index.cjs'

export interface UnknownSchema {
  parse(input: unknown): unknown
  array?: () => UnknownSchema
}

export interface ZodDto<TSchema extends UnknownSchema> {
  new (): ReturnType<TSchema['parse']>
  isZodDto: true
  schema: TSchema
  create(input: unknown): ReturnType<TSchema['parse']>
}

export function createZodDto<
  TSchema extends
    | UnknownSchema
    | z3.ZodTypeAny
    | ($ZodType & { parse: (input: unknown) => unknown })
>(schema: TSchema) {
  class AugmentedZodDto {
    public static readonly isZodDto = true
    public static readonly schema = schema

    public static create(input: unknown) {
      return this.schema.parse(input)
    }
  }

  return AugmentedZodDto as unknown as ZodDto<TSchema>
}
