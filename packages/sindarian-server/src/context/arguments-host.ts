import { NextResponse } from 'next/server'
import { HttpArgumentsHost } from './http-arguments-host'

type ArgumentsType = 'http'

export class ArgumentsHost {
  private readonly type: ArgumentsType
  private args: any[]
  private context: Record<ArgumentsType, HttpArgumentsHost>

  constructor(args: any[], type = 'http') {
    this.args = args
    this.type = type as ArgumentsType
    this.context = {
      http: new HttpArgumentsHost(args[0], NextResponse)
    }
  }

  getType(): ArgumentsType {
    return this.type
  }

  getArgs() {
    return this.args
  }

  getArgsByIndex(index: number) {
    return this.args[index]
  }

  switchToHttp(): HttpArgumentsHost {
    return this.context.http
  }
}
