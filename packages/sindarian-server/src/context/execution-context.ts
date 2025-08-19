import { Class } from '@/types/class'
import { ArgumentsHost } from './arguments-host'

export class ExecutionContext extends ArgumentsHost {
  private classType: Class
  private handler: Function

  constructor(classType: Class, handler: Function, args: any[], type = 'http') {
    super(args, type)
    this.classType = classType
    this.handler = handler
  }

  getClass<T>(): Class<T> {
    return this.classType as Class<T>
  }

  getHandler(): Function {
    return this.handler
  }
}
