import { ArgumentsHost } from '@/context/arguments-host'
import { HttpException } from './http-exception'

export abstract class ExceptionFilter {
  abstract catch(exception: HttpException, host: ArgumentsHost): Promise<any>
}
