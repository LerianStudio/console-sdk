export class HttpArgumentsHost {
  private request: any

  private response: any

  constructor(request: any, response: any) {
    this.request = request
    this.response = response
  }

  getRequest<T>(): T {
    return this.request as T
  }

  getResponse<T>(): T {
    return this.response as T
  }
}
