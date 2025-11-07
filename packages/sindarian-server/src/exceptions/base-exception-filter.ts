import { HttpStatus } from '@/constants'
import { ApiException } from './api-exception'
import { ExceptionFilter } from './exception-filter'
import { NextResponse } from 'next/server'

export class BaseExceptionFilter implements ExceptionFilter {
  async catch(exception: any) {
    if (exception instanceof ApiException) {
      const status = exception.getStatus ? exception.getStatus() : 500

      return NextResponse.json(
        {
          message: exception.message || 'Internal server error'
        },
        { status }
      )
    }

    return NextResponse.json(
      {
        message: exception.message
      },
      { status: HttpStatus.INTERNAL_SERVER_ERROR }
    )
  }
}
