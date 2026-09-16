import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  ApiException,
  readWireStatus
} from '@lerianstudio/sindarian-server'
import { NextRequest, NextResponse } from 'next/server'

@Catch()
export class AppExceptionFilter extends ExceptionFilter {
  async catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const request = ctx.getRequest<NextRequest>()

    // Handle ApiException with more detailed response
    if (exception instanceof ApiException) {
      // The status is read through the package's reader, not off the exception,
      // because `getStatus()` belongs to the subclass and this frame is the one
      // that BUILDS the response: a status the runtime refuses to pair with a
      // body throws here, the throw escapes the request pipeline, and the route
      // answers a zero-byte body with no content-type. This app is the shape an
      // application copies, so it copies the guarded read.
      const status = readWireStatus(exception)

      return NextResponse.json(
        {
          timestamp: new Date().toISOString(),
          path: request.url,
          ...exception.getResponse()
        },
        { status }
      )
    }
  }
}
