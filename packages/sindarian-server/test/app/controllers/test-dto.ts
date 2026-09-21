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

// One required field with a length bound, and `.strict()` deliberately left OFF:
// the unknown-key case must be able to observe the stripping that arming the
// pipe introduces, rather than a refusal. See plan
// 2026-09-21-console-simplification C9.
const SearchTestSchema = z.object({
  term: z.string().min(2).max(50)
})

export class SearchTestDto extends createZodDto(SearchTestSchema) {}
