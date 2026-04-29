import 'reflect-metadata'
import { z } from 'zod'
import { ZodValidationPipe } from './zod-validation-pipe'
import { createZodDto } from './create-zod-dto'
import { ArgumentMetadata } from '@/pipes/pipe-transform'
import { ValidationApiException } from '@/exceptions/api-exception'

describe('ZodValidationPipe', () => {
  let pipe: ZodValidationPipe

  beforeEach(() => {
    pipe = new ZodValidationPipe()
  })

  describe('Basic functionality', () => {
    it('should be instantiable', () => {
      expect(pipe).toBeDefined()
      expect(pipe).toBeInstanceOf(ZodValidationPipe)
    })

    it('should have a transform method', () => {
      expect(pipe.transform).toBeDefined()
      expect(typeof pipe.transform).toBe('function')
    })
  })

  describe('transform method', () => {
    it('should return value unchanged when no metatype is provided', () => {
      const value = { name: 'John', age: 30 }
      const metadata: ArgumentMetadata = {
        type: 'body',
        metatype: undefined
      }

      const result = pipe.transform(value, metadata)

      expect(result).toBe(value)
    })

    it('should return value unchanged when metatype is not a ZodDto', () => {
      const value = { name: 'John', age: 30 }
      const metadata: ArgumentMetadata = {
        type: 'body',
        metatype: class NotAZodDto {}
      }

      const result = pipe.transform(value, metadata)

      expect(result).toBe(value)
    })

    it('should validate and transform value when metatype is a ZodDto', () => {
      const schema = z.object({
        name: z.string(),
        age: z.number()
      })
      const UserDto = createZodDto(schema)

      const value = { name: 'John', age: 30 }
      const metadata: ArgumentMetadata = {
        type: 'body',
        metatype: UserDto
      }

      const result = pipe.transform(value, metadata)

      expect(result).toEqual({ name: 'John', age: 30 })
    })

    it('should throw ValidationApiException on validation failure', () => {
      const schema = z.object({
        name: z.string(),
        age: z.number()
      })
      const UserDto = createZodDto(schema)

      const invalidValue = { name: 'John', age: 'thirty' }
      const metadata: ArgumentMetadata = {
        type: 'body',
        metatype: UserDto
      }

      expect(() => pipe.transform(invalidValue, metadata)).toThrow(
        ValidationApiException
      )
      expect(() => pipe.transform(invalidValue, metadata)).toThrow(
        'Validation failed'
      )
    })

    it('should include validation errors in exception', () => {
      const schema = z.object({
        name: z.string(),
        age: z.number()
      })
      const UserDto = createZodDto(schema)

      const invalidValue = { name: 'John', age: 'thirty' }
      const metadata: ArgumentMetadata = {
        type: 'body',
        metatype: UserDto
      }

      try {
        pipe.transform(invalidValue, metadata)
        fail('Should have thrown ValidationApiException')
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationApiException)
        expect((error as ValidationApiException).getResponse()).toHaveProperty(
          'errors'
        )
      }
    })
  })

  describe('Validation scenarios', () => {
    it('should validate required fields', () => {
      const schema = z.object({
        name: z.string(),
        email: z.string().email()
      })
      const UserDto = createZodDto(schema)

      const metadata: ArgumentMetadata = {
        type: 'body',
        metatype: UserDto
      }

      // Missing email
      expect(() => pipe.transform({ name: 'John' }, metadata)).toThrow(
        ValidationApiException
      )

      // Missing name
      expect(() =>
        pipe.transform({ email: 'john@example.com' }, metadata)
      ).toThrow(ValidationApiException)

      // Valid data
      expect(
        pipe.transform({ name: 'John', email: 'john@example.com' }, metadata)
      ).toEqual({ name: 'John', email: 'john@example.com' })
    })

    it('should validate string constraints', () => {
      const schema = z.object({
        name: z.string().min(2).max(50)
      })
      const NameDto = createZodDto(schema)

      const metadata: ArgumentMetadata = {
        type: 'body',
        metatype: NameDto
      }

      // Too short
      expect(() => pipe.transform({ name: 'J' }, metadata)).toThrow(
        ValidationApiException
      )

      // Too long
      expect(() => pipe.transform({ name: 'a'.repeat(51) }, metadata)).toThrow(
        ValidationApiException
      )

      // Valid
      expect(pipe.transform({ name: 'John' }, metadata)).toEqual({
        name: 'John'
      })
    })

    it('should validate number constraints', () => {
      const schema = z.object({
        age: z.number().min(0).max(120)
      })
      const AgeDto = createZodDto(schema)

      const metadata: ArgumentMetadata = {
        type: 'body',
        metatype: AgeDto
      }

      // Below minimum
      expect(() => pipe.transform({ age: -1 }, metadata)).toThrow(
        ValidationApiException
      )

      // Above maximum
      expect(() => pipe.transform({ age: 121 }, metadata)).toThrow(
        ValidationApiException
      )

      // Valid
      expect(pipe.transform({ age: 30 }, metadata)).toEqual({ age: 30 })
    })

    it('should validate email format', () => {
      const schema = z.object({
        email: z.string().email()
      })
      const EmailDto = createZodDto(schema)

      const metadata: ArgumentMetadata = {
        type: 'body',
        metatype: EmailDto
      }

      // Invalid email
      expect(() => pipe.transform({ email: 'not-an-email' }, metadata)).toThrow(
        ValidationApiException
      )

      // Valid email
      expect(pipe.transform({ email: 'john@example.com' }, metadata)).toEqual({
        email: 'john@example.com'
      })
    })

    it('should validate enum values', () => {
      const schema = z.object({
        role: z.enum(['admin', 'user', 'guest'])
      })
      const RoleDto = createZodDto(schema)

      const metadata: ArgumentMetadata = {
        type: 'body',
        metatype: RoleDto
      }

      // Invalid enum value
      expect(() => pipe.transform({ role: 'superadmin' }, metadata)).toThrow(
        ValidationApiException
      )

      // Valid enum values
      expect(pipe.transform({ role: 'admin' }, metadata)).toEqual({
        role: 'admin'
      })
      expect(pipe.transform({ role: 'user' }, metadata)).toEqual({
        role: 'user'
      })
      expect(pipe.transform({ role: 'guest' }, metadata)).toEqual({
        role: 'guest'
      })
    })

    it('should validate array schemas', () => {
      const schema = z.object({
        tags: z.array(z.string()).min(1).max(5)
      })
      const TagsDto = createZodDto(schema)

      const metadata: ArgumentMetadata = {
        type: 'body',
        metatype: TagsDto
      }

      // Empty array
      expect(() => pipe.transform({ tags: [] }, metadata)).toThrow(
        ValidationApiException
      )

      // Too many items
      expect(() =>
        pipe.transform({ tags: ['1', '2', '3', '4', '5', '6'] }, metadata)
      ).toThrow(ValidationApiException)

      // Invalid item type
      expect(() => pipe.transform({ tags: [1, 2, 3] }, metadata)).toThrow(
        ValidationApiException
      )

      // Valid
      expect(pipe.transform({ tags: ['tag1', 'tag2'] }, metadata)).toEqual({
        tags: ['tag1', 'tag2']
      })
    })

    it('should validate nested objects', () => {
      const schema = z.object({
        user: z.object({
          name: z.string(),
          email: z.string().email()
        })
      })
      const UserDto = createZodDto(schema)

      const metadata: ArgumentMetadata = {
        type: 'body',
        metatype: UserDto
      }

      // Invalid nested email
      expect(() =>
        pipe.transform(
          {
            user: {
              name: 'John',
              email: 'invalid-email'
            }
          },
          metadata
        )
      ).toThrow(ValidationApiException)

      // Valid nested object
      expect(
        pipe.transform(
          {
            user: {
              name: 'John',
              email: 'john@example.com'
            }
          },
          metadata
        )
      ).toEqual({
        user: {
          name: 'John',
          email: 'john@example.com'
        }
      })
    })
  })

  describe('Schema transformations', () => {
    it('should apply schema transformations', () => {
      const schema = z.object({
        name: z.string().transform((val) => val.toUpperCase()),
        age: z.number()
      })
      const UserDto = createZodDto(schema)

      const value = { name: 'john', age: 30 }
      const metadata: ArgumentMetadata = {
        type: 'body',
        metatype: UserDto
      }

      const result = pipe.transform(value, metadata)

      expect(result).toEqual({ name: 'JOHN', age: 30 })
    })

    it('should apply default values', () => {
      const schema = z.object({
        name: z.string(),
        role: z.string().default('user'),
        isActive: z.boolean().default(true)
      })
      const UserDto = createZodDto(schema)

      const value = { name: 'John' }
      const metadata: ArgumentMetadata = {
        type: 'body',
        metatype: UserDto
      }

      const result = pipe.transform(value, metadata)

      expect(result).toEqual({ name: 'John', role: 'user', isActive: true })
    })

    it('should handle optional fields', () => {
      const schema = z.object({
        name: z.string(),
        age: z.number().optional(),
        email: z.string().email().optional()
      })
      const UserDto = createZodDto(schema)

      const value = { name: 'John' }
      const metadata: ArgumentMetadata = {
        type: 'body',
        metatype: UserDto
      }

      const result = pipe.transform(value, metadata)

      expect(result).toEqual({ name: 'John' })
    })

    it('should handle nullable fields', () => {
      const schema = z.object({
        name: z.string(),
        middleName: z.string().nullable()
      })
      const UserDto = createZodDto(schema)

      const metadata: ArgumentMetadata = {
        type: 'body',
        metatype: UserDto
      }

      const result1 = pipe.transform(
        { name: 'John', middleName: null },
        metadata
      )
      expect(result1).toEqual({ name: 'John', middleName: null })

      const result2 = pipe.transform(
        { name: 'John', middleName: 'Doe' },
        metadata
      )
      expect(result2).toEqual({ name: 'John', middleName: 'Doe' })
    })

    it('should apply coercion', () => {
      const schema = z.object({
        age: z.coerce.number(),
        active: z.coerce.boolean()
      })
      const CoerceDto = createZodDto(schema)

      const value = { age: '30', active: 'true' }
      const metadata: ArgumentMetadata = {
        type: 'body',
        metatype: CoerceDto
      }

      const result = pipe.transform(value, metadata)

      expect(result).toEqual({ age: 30, active: true })
    })
  })

  describe('Different parameter types', () => {
    it('should work with body type', () => {
      const schema = z.object({ name: z.string() })
      const Dto = createZodDto(schema)

      const metadata: ArgumentMetadata = {
        type: 'body',
        metatype: Dto
      }

      const result = pipe.transform({ name: 'John' }, metadata)
      expect(result).toEqual({ name: 'John' })
    })

    it('should work with query type', () => {
      const schema = z.object({
        page: z.string(),
        limit: z.string()
      })
      const QueryDto = createZodDto(schema)

      const metadata: ArgumentMetadata = {
        type: 'query',
        metatype: QueryDto
      }

      const result = pipe.transform({ page: '1', limit: '10' }, metadata)
      expect(result).toEqual({ page: '1', limit: '10' })
    })

    it('should work with param type', () => {
      const schema = z.object({
        id: z.string()
      })
      const ParamDto = createZodDto(schema)

      const metadata: ArgumentMetadata = {
        type: 'param',
        metatype: ParamDto
      }

      const result = pipe.transform({ id: '123' }, metadata)
      expect(result).toEqual({ id: '123' })
    })

    it('should work with custom type', () => {
      const schema = z.object({
        data: z.string()
      })
      const CustomDto = createZodDto(schema)

      const metadata: ArgumentMetadata = {
        type: 'custom',
        metatype: CustomDto
      }

      const result = pipe.transform({ data: 'test' }, metadata)
      expect(result).toEqual({ data: 'test' })
    })
  })

  describe('Complex validation scenarios', () => {
    it('should validate with custom refinements', () => {
      const schema = z.object({
        password: z
          .string()
          .min(8)
          .refine((val) => /[A-Z]/.test(val), {
            message: 'Password must contain at least one uppercase letter'
          })
      })
      const PasswordDto = createZodDto(schema)

      const metadata: ArgumentMetadata = {
        type: 'body',
        metatype: PasswordDto
      }

      // No uppercase
      expect(() =>
        pipe.transform({ password: 'password123' }, metadata)
      ).toThrow(ValidationApiException)

      // Valid
      expect(pipe.transform({ password: 'Password123' }, metadata)).toEqual({
        password: 'Password123'
      })
    })

    it('should validate with superRefine', () => {
      const schema = z
        .object({
          password: z.string(),
          confirmPassword: z.string()
        })
        .superRefine((data, ctx) => {
          if (data.password !== data.confirmPassword) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: 'Passwords do not match',
              path: ['confirmPassword']
            })
          }
        })
      const PasswordDto = createZodDto(schema)

      const metadata: ArgumentMetadata = {
        type: 'body',
        metatype: PasswordDto
      }

      // Mismatched passwords
      expect(() =>
        pipe.transform(
          { password: 'secret', confirmPassword: 'different' },
          metadata
        )
      ).toThrow(ValidationApiException)

      // Matching passwords
      expect(
        pipe.transform(
          { password: 'secret', confirmPassword: 'secret' },
          metadata
        )
      ).toEqual({
        password: 'secret',
        confirmPassword: 'secret'
      })
    })

    it('should handle union types', () => {
      const schema = z.object({
        value: z.union([z.string(), z.number()])
      })
      const UnionDto = createZodDto(schema)

      const metadata: ArgumentMetadata = {
        type: 'body',
        metatype: UnionDto
      }

      expect(pipe.transform({ value: 'text' }, metadata)).toEqual({
        value: 'text'
      })
      expect(pipe.transform({ value: 123 }, metadata)).toEqual({ value: 123 })
      expect(() => pipe.transform({ value: true }, metadata)).toThrow(
        ValidationApiException
      )
    })

    it('should strip unknown keys by default', () => {
      const schema = z.object({
        name: z.string(),
        age: z.number()
      })
      const UserDto = createZodDto(schema)

      const value = {
        name: 'John',
        age: 30,
        unknownField: 'should be stripped'
      }
      const metadata: ArgumentMetadata = {
        type: 'body',
        metatype: UserDto
      }

      const result = pipe.transform(value, metadata)

      expect(result).toEqual({ name: 'John', age: 30 })
      expect(result).not.toHaveProperty('unknownField')
    })

    it('should reject unknown keys in strict mode', () => {
      const schema = z
        .object({
          name: z.string(),
          age: z.number()
        })
        .strict()
      const StrictDto = createZodDto(schema)

      const value = {
        name: 'John',
        age: 30,
        unknownField: 'should cause error'
      }
      const metadata: ArgumentMetadata = {
        type: 'body',
        metatype: StrictDto
      }

      expect(() => pipe.transform(value, metadata)).toThrow(
        ValidationApiException
      )
    })
  })

  describe('Edge cases', () => {
    it('should handle null value', () => {
      const schema = z.object({
        name: z.string()
      })
      const UserDto = createZodDto(schema)

      const metadata: ArgumentMetadata = {
        type: 'body',
        metatype: UserDto
      }

      expect(() => pipe.transform(null, metadata)).toThrow(
        ValidationApiException
      )
    })

    it('should handle undefined value', () => {
      const schema = z.object({
        name: z.string()
      })
      const UserDto = createZodDto(schema)

      const metadata: ArgumentMetadata = {
        type: 'body',
        metatype: UserDto
      }

      expect(() => pipe.transform(undefined, metadata)).toThrow(
        ValidationApiException
      )
    })

    it('should handle empty object', () => {
      const schema = z.object({
        name: z.string()
      })
      const UserDto = createZodDto(schema)

      const metadata: ArgumentMetadata = {
        type: 'body',
        metatype: UserDto
      }

      expect(() => pipe.transform({}, metadata)).toThrow(ValidationApiException)
    })

    it('should work with empty schema', () => {
      const schema = z.object({})
      const EmptyDto = createZodDto(schema)

      const metadata: ArgumentMetadata = {
        type: 'body',
        metatype: EmptyDto
      }

      expect(pipe.transform({}, metadata)).toEqual({})
      expect(pipe.transform({ extra: 'field' }, metadata)).toEqual({})
    })

    it('should handle primitive values for object schemas', () => {
      const schema = z.object({
        name: z.string()
      })
      const UserDto = createZodDto(schema)

      const metadata: ArgumentMetadata = {
        type: 'body',
        metatype: UserDto
      }

      expect(() => pipe.transform('not an object', metadata)).toThrow(
        ValidationApiException
      )
      expect(() => pipe.transform(123, metadata)).toThrow(
        ValidationApiException
      )
    })
  })
})
