import z from 'zod'
import { createZodDto } from '@lerianstudio/sindarian-server'

// Define schemas and DTOs at module level for better TypeScript reflection
const CreateTestSchema = z.object({
  name: z.string().min(2).max(100)
})

const UpdateTestSchema = z.object({
  name: z.string().min(2).max(100)
})

// Export the DTO classes to ensure TypeScript properly tracks them
export class CreateTestDto extends createZodDto(CreateTestSchema) {}
export class UpdateTestDto extends createZodDto(UpdateTestSchema) {}
