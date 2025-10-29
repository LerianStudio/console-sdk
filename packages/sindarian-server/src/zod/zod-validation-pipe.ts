import { injectable } from 'inversify'
import { ZodDto } from '@/zod/create-zod-dto'
import { ArgumentMetadata, PipeTransform } from '@/pipes/pipe-transform'
import { ValidationApiException } from '@/exceptions/api-exception'

@injectable()
export class ZodValidationPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata): any {
    try {
      // Check if the metadata has a metatype
      if (!metadata.metatype) {
        return value
      }

      const dto = metadata.metatype as ZodDto<any>

      // Check if the dto is a ZodDto
      if (!dto.isZodDto) {
        return value
      }

      return dto.create(value)
    } catch (error) {
      throw new ValidationApiException('Validation failed', error)
    }
  }
}
