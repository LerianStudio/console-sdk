type CallHandler = {
  handle: (request: any) => Promise<any>
}

export abstract class Interceptor {
  abstract intercept(context: any, next: CallHandler): Promise<any>
}
