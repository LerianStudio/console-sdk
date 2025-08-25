import { ExceptionFilter } from './exception-filter'
import { NextResponse } from 'next/server'

export class BaseExceptionFilter implements ExceptionFilter {
  async catch(exception: any) {
    const status = exception.getStatus ? exception.getStatus() : 500

    return NextResponse.json(
      {
        message: exception.message || 'Internal server error'
      },
      { status }
    )
  }
}
