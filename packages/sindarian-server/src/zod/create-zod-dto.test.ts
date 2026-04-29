import { z } from 'zod'
import { createZodDto, ZodDto, UnknownSchema } from './create-zod-dto'

describe('createZodDto', () => {
  describe('Basic functionality', () => {
    it('should create a ZodDto class from a Zod schema', () => {
      const schema = z.object({
        name: z.string(),
        age: z.number()
      })

      const UserDto = createZodDto(schema)

      expect(UserDto).toBeDefined()
      expect(UserDto.isZodDto).toBe(true)
      expect(UserDto.schema).toBe(schema)
    })

    it('should mark the created class with isZodDto flag', () => {
      const schema = z.object({ id: z.number() })
      const TestDto = createZodDto(schema)

      expect(TestDto.isZodDto).toBe(true)
    })

    it('should attach the schema to the created class', () => {
      const schema = z.object({
        email: z.string().email()
      })

      const EmailDto = createZodDto(schema)

      expect(EmailDto.schema).toBe(schema)
    })
  })

  describe('create method', () => {
    it('should parse valid input using the schema', () => {
      const schema = z.object({
        name: z.string(),
        age: z.number()
      })

      const UserDto = createZodDto(schema)
      const input = { name: 'John', age: 30 }
      const result = UserDto.create(input)

      expect(result).toEqual(input)
    })

    it('should throw error for invalid input', () => {
      const schema = z.object({
        name: z.string(),
        age: z.number()
      })

      const UserDto = createZodDto(schema)
      const invalidInput = { name: 'John', age: 'thirty' }

      expect(() => UserDto.create(invalidInput)).toThrow()
    })

    it('should apply schema transformations', () => {
      const schema = z.object({
        name: z.string().transform((val) => val.toUpperCase()),
        age: z.number()
      })

      const UserDto = createZodDto(schema)
      const input = { name: 'john', age: 30 }
      const result = UserDto.create(input)

      expect(result).toEqual({ name: 'JOHN', age: 30 })
    })

    it('should apply schema defaults', () => {
      const schema = z.object({
        name: z.string(),
        role: z.string().default('user')
      })

      const UserDto = createZodDto(schema)
      const input = { name: 'John' }
      const result = UserDto.create(input)

      expect(result).toEqual({ name: 'John', role: 'user' })
    })

    it('should validate required fields', () => {
      const schema = z.object({
        name: z.string(),
        email: z.string().email()
      })

      const UserDto = createZodDto(schema)

      expect(() => UserDto.create({ name: 'John' })).toThrow()
      expect(() => UserDto.create({ email: 'john@example.com' })).toThrow()
    })

    it('should handle optional fields', () => {
      const schema = z.object({
        name: z.string(),
        age: z.number().optional()
      })

      const UserDto = createZodDto(schema)
      const result = UserDto.create({ name: 'John' })

      expect(result).toEqual({ name: 'John' })
    })
  })

  describe('Schema validation types', () => {
    it('should work with string schema', () => {
      const schema = z.object({
        name: z.string().min(2).max(50)
      })

      const NameDto = createZodDto(schema)

      expect(() => NameDto.create({ name: 'J' })).toThrow() // Too short
      expect(() => NameDto.create({ name: 'a'.repeat(51) })).toThrow() // Too long
      expect(NameDto.create({ name: 'John' })).toEqual({ name: 'John' })
    })

    it('should work with number schema', () => {
      const schema = z.object({
        age: z.number().min(0).max(120)
      })

      const AgeDto = createZodDto(schema)

      expect(() => AgeDto.create({ age: -1 })).toThrow()
      expect(() => AgeDto.create({ age: 121 })).toThrow()
      expect(AgeDto.create({ age: 30 })).toEqual({ age: 30 })
    })

    it('should work with boolean schema', () => {
      const schema = z.object({
        isActive: z.boolean()
      })

      const StatusDto = createZodDto(schema)

      expect(StatusDto.create({ isActive: true })).toEqual({ isActive: true })
      expect(StatusDto.create({ isActive: false })).toEqual({ isActive: false })
      expect(() => StatusDto.create({ isActive: 'yes' })).toThrow()
    })

    it('should work with date schema', () => {
      const schema = z.object({
        birthDate: z.date()
      })

      const DateDto = createZodDto(schema)
      const date = new Date('2000-01-01')

      expect(DateDto.create({ birthDate: date })).toEqual({ birthDate: date })
      expect(() => DateDto.create({ birthDate: '2000-01-01' })).toThrow()
    })

    it('should work with enum schema', () => {
      const schema = z.object({
        role: z.enum(['admin', 'user', 'guest'])
      })

      const RoleDto = createZodDto(schema)

      expect(RoleDto.create({ role: 'admin' })).toEqual({ role: 'admin' })
      expect(() => RoleDto.create({ role: 'superadmin' })).toThrow()
    })

    it('should work with array schema', () => {
      const schema = z.object({
        tags: z.array(z.string())
      })

      const TagsDto = createZodDto(schema)

      expect(TagsDto.create({ tags: ['tag1', 'tag2'] })).toEqual({
        tags: ['tag1', 'tag2']
      })
      expect(() => TagsDto.create({ tags: 'tag1' })).toThrow()
      expect(() => TagsDto.create({ tags: [1, 2] })).toThrow()
    })

    it('should work with nested object schema', () => {
      const schema = z.object({
        user: z.object({
          name: z.string(),
          email: z.string().email()
        })
      })

      const UserDto = createZodDto(schema)
      const input = {
        user: {
          name: 'John',
          email: 'john@example.com'
        }
      }

      expect(UserDto.create(input)).toEqual(input)
      expect(() =>
        UserDto.create({
          user: {
            name: 'John',
            email: 'invalid-email'
          }
        })
      ).toThrow()
    })

    it('should work with union schema', () => {
      const schema = z.object({
        value: z.union([z.string(), z.number()])
      })

      const UnionDto = createZodDto(schema)

      expect(UnionDto.create({ value: 'text' })).toEqual({ value: 'text' })
      expect(UnionDto.create({ value: 123 })).toEqual({ value: 123 })
      expect(() => UnionDto.create({ value: true })).toThrow()
    })

    it('should work with literal schema', () => {
      const schema = z.object({
        type: z.literal('user')
      })

      const LiteralDto = createZodDto(schema)

      expect(LiteralDto.create({ type: 'user' })).toEqual({ type: 'user' })
      expect(() => LiteralDto.create({ type: 'admin' })).toThrow()
    })
  })

  describe('Schema refinements', () => {
    it('should work with custom refinements', () => {
      const schema = z.object({
        password: z
          .string()
          .min(8)
          .refine((val) => /[A-Z]/.test(val), {
            message: 'Password must contain at least one uppercase letter'
          })
      })

      const PasswordDto = createZodDto(schema)

      expect(PasswordDto.create({ password: 'Password1' })).toEqual({
        password: 'Password1'
      })
      expect(() => PasswordDto.create({ password: 'password1' })).toThrow()
      expect(() => PasswordDto.create({ password: 'Pass1' })).toThrow() // Too short
    })

    it('should work with superRefine', () => {
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

      expect(
        PasswordDto.create({
          password: 'secret',
          confirmPassword: 'secret'
        })
      ).toEqual({
        password: 'secret',
        confirmPassword: 'secret'
      })
      expect(() =>
        PasswordDto.create({
          password: 'secret',
          confirmPassword: 'different'
        })
      ).toThrow()
    })
  })

  describe('Complex schemas', () => {
    it('should work with deeply nested schemas', () => {
      const schema = z.object({
        company: z.object({
          name: z.string(),
          address: z.object({
            street: z.string(),
            city: z.string(),
            country: z.string()
          })
        })
      })

      const CompanyDto = createZodDto(schema)
      const input = {
        company: {
          name: 'ACME Corp',
          address: {
            street: '123 Main St',
            city: 'New York',
            country: 'USA'
          }
        }
      }

      expect(CompanyDto.create(input)).toEqual(input)
    })

    it('should work with array of objects', () => {
      const schema = z.object({
        users: z.array(
          z.object({
            name: z.string(),
            age: z.number()
          })
        )
      })

      const UsersDto = createZodDto(schema)
      const input = {
        users: [
          { name: 'John', age: 30 },
          { name: 'Jane', age: 25 }
        ]
      }

      expect(UsersDto.create(input)).toEqual(input)
      expect(() =>
        UsersDto.create({
          users: [{ name: 'John', age: 'thirty' }]
        })
      ).toThrow()
    })

    it('should work with optional nested objects', () => {
      const schema = z.object({
        name: z.string(),
        address: z
          .object({
            street: z.string(),
            city: z.string()
          })
          .optional()
      })

      const UserDto = createZodDto(schema)

      expect(UserDto.create({ name: 'John' })).toEqual({ name: 'John' })
      expect(
        UserDto.create({
          name: 'John',
          address: { street: '123 Main', city: 'NYC' }
        })
      ).toEqual({
        name: 'John',
        address: { street: '123 Main', city: 'NYC' }
      })
    })

    it('should strip unknown keys in strict mode', () => {
      const schema = z
        .object({
          name: z.string(),
          age: z.number()
        })
        .strict()

      const StrictDto = createZodDto(schema)

      expect(() =>
        StrictDto.create({
          name: 'John',
          age: 30,
          extra: 'field'
        })
      ).toThrow()
    })

    it('should allow unknown keys by default', () => {
      const schema = z.object({
        name: z.string(),
        age: z.number()
      })

      const UserDto = createZodDto(schema)
      const result = UserDto.create({
        name: 'John',
        age: 30,
        extra: 'field'
      })

      // By default, Zod strips unknown keys
      expect(result).toEqual({ name: 'John', age: 30 })
    })
  })

  describe('Edge cases', () => {
    it('should handle empty object schema', () => {
      const schema = z.object({})
      const EmptyDto = createZodDto(schema)

      expect(EmptyDto.create({})).toEqual({})
    })

    it('should handle null values for nullable fields', () => {
      const schema = z.object({
        name: z.string(),
        middleName: z.string().nullable()
      })

      const UserDto = createZodDto(schema)

      expect(UserDto.create({ name: 'John', middleName: null })).toEqual({
        name: 'John',
        middleName: null
      })
      expect(UserDto.create({ name: 'John', middleName: 'Doe' })).toEqual({
        name: 'John',
        middleName: 'Doe'
      })
    })

    it('should handle undefined for optional fields', () => {
      const schema = z.object({
        name: z.string(),
        age: z.number().optional()
      })

      const UserDto = createZodDto(schema)

      expect(UserDto.create({ name: 'John', age: undefined })).toEqual({
        name: 'John'
      })
    })

    it('should work with coercion', () => {
      const schema = z.object({
        age: z.coerce.number(),
        active: z.coerce.boolean()
      })

      const CoerceDto = createZodDto(schema)

      expect(CoerceDto.create({ age: '30', active: 'true' })).toEqual({
        age: 30,
        active: true
      })
    })
  })

  describe('Type safety', () => {
    it('should maintain static typing through ZodDto interface', () => {
      const schema = z.object({
        id: z.number(),
        name: z.string()
      })

      const UserDto: ZodDto<typeof schema> = createZodDto(schema)

      // These assertions verify the type structure
      expect(UserDto.isZodDto).toBe(true)
      expect(UserDto.schema).toBe(schema)
      expect(typeof UserDto.create).toBe('function')
    })

    it('should work with custom UnknownSchema implementation', () => {
      const customSchema: UnknownSchema = {
        parse: (input: unknown) => {
          if (typeof input === 'object' && input !== null) {
            return input
          }
          throw new Error('Invalid input')
        }
      }

      const CustomDto = createZodDto(customSchema)

      expect(CustomDto.create({ test: 'value' })).toEqual({ test: 'value' })
      expect(() => CustomDto.create('string')).toThrow()
    })
  })
})
