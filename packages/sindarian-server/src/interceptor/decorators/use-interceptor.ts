import { Interceptor } from '../interceptor'

export function UseInterceptors(...interceptors: Interceptor[]) {
  return (target: any, key: string, descriptor: PropertyDescriptor) => {
    Reflect.defineMetadata('interceptors', interceptors, descriptor.value)
  }
}
