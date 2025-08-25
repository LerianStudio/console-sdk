import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  ApiException
} from '@lerianstudio/sindarian-server'
import { NextRequest, NextResponse } from 'next/server'

@Catch()
export class AppExceptionFilter extends ExceptionFilter {
  async catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const request = ctx.getRequest<NextRequest>()
    const status = exception.getStatus()

    // Handle ApiException with more detailed response
    if (exception instanceof ApiException) {
      return NextResponse.json(
        {
          timestamp: new Date().toISOString(),
          path: request.url,
          ...exception.getResponse()
        },
        { status }
      )
    }

    // Handle generic HttpException
    return NextResponse.json(
      {
        timestamp: new Date().toISOString(),
        path: request.url,
        message: exception.message
      },
      { status }
    )
  }
}
