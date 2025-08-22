export class HttpArgumentsHost {
  private request: any

  private response: any

  constructor(request: any, response: any) {
    this.request = request
    this.response = response
  }

  getRequest<T = Request>(): T {
    return this.request as T
  }

  getResponse<T = Response>(): T {
    return this.response as T
  }
}
