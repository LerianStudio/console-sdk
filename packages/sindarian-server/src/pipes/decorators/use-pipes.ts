import { PIPE_KEY } from '@/constants/keys'
import { PipeTransform } from '../pipe-transform'
import { Class } from '@/types/class'
import { getClassMethods } from '@/utils/class/get-class-methods'
import {
  RouteContext,
  RouteHandler
} from '@/controllers/decorators/route-decorator'
import { Container } from '@/dependency-injection'

type PipeMetadata = {
  pipes: (Class<PipeTransform> | PipeTransform)[]
}

export class PipeHandler {
  static getClassMetadata(target: object): PipeMetadata | undefined {
    return Reflect.getOwnMetadata(PIPE_KEY, target)
  }

  static getMethodMetadata(
    target: object,
    propertyKey: string | symbol
  ): PipeMetadata | undefined {
    // First check if metadata exists directly on the target (method-level decorator)
    let metadata = Reflect.getOwnMetadata(PIPE_KEY, target, propertyKey)

    // If not found, check on the constructor prototype (class-level decorator)
    if (!metadata && target.constructor) {
      metadata = Reflect.getOwnMetadata(
        PIPE_KEY,
        target.constructor.prototype,
        propertyKey
      )
    }

    return metadata
  }

  static register(container: Container, target: Class) {
    const metadata = PipeHandler.getClassMetadata(target)

    if (metadata && metadata?.pipes?.length !== 0) {
      const { pipes } = metadata

      pipes.forEach((pipe) => {
        PipeHandler._register(container, pipe)
      })
    }

    // Register methods pipes
    const methodNames = getClassMethods(target)

    methodNames.forEach((methodName) => {
      const methodMetadata: PipeMetadata = Reflect.getOwnMetadata(
        PIPE_KEY,
        target.prototype,
        methodName
      )
      if (methodMetadata) {
        methodMetadata.pipes.forEach((pipe) => {
          PipeHandler._register(container, pipe)
        })
      }
    })
  }

  static async fetch(
    container: Container,
    target: object,
    methodName: string | symbol
  ): Promise<PipeTransform[]> {
    const pipes: PipeTransform[] = []
    const metadata = PipeHandler.getClassMetadata(target.constructor)

    if (metadata && metadata.pipes.length > 0) {
      pipes.push(
        ...(await Promise.all(
          metadata.pipes.map((pipe) => PipeHandler._fetch(container, pipe))
        ))
      )
    }

    const methodMetadata = PipeHandler.getMethodMetadata(target, methodName)

    if (methodMetadata) {
      pipes.push(
        ...(await Promise.all(
          methodMetadata.pipes.map((pipe) =>
            PipeHandler._fetch(container, pipe)
          )
        ))
      )
    }

    return pipes
  }

  static async execute(
    target: object,
    propertyKey: string | symbol,
    pipes: PipeTransform[],
    args: RouteContext[]
  ): Promise<any[]> {
    const metadata = RouteHandler.getMetadata(target.constructor, propertyKey)

    if (pipes.length === 0) {
      return args.map((arg) => arg.parameter)
    }

    // Get paramTypes from route metadata (which contains the method parameter types)
    const paramTypes = metadata?.paramTypes || []

    const pipedArgs = await Promise.all(
      args.map(async (arg) => {
        // Get the parameter type for this argument - prefer arg.paramType over paramTypes array
        const metatype = arg.paramType || paramTypes[arg.parameterIndex]

        // Process through pipes (pipes parameter contains resolved instances)
        let result = arg.parameter
        for (const pipe of pipes) {
          result = await pipe.transform(result, {
            type: arg.type || 'custom',
            metatype: metatype,
            data: arg.parameter
          })
        }

        return {
          ...arg,
          parameter: result
        }
      })
    )

    return pipedArgs.map((arg) => arg.parameter)
  }

  private static async _fetch(
    container: Container,
    pipe: Class<PipeTransform> | PipeTransform
  ) {
    if (typeof pipe === 'function') {
      return container.getAsync<PipeTransform>(pipe)
    }
    return container.getAsync<PipeTransform>(pipe.constructor as any)
  }

  private static async _register(
    container: Container,
    pipe: Class<PipeTransform> | PipeTransform
  ) {
    // If it's a class constructor (function), register it in the container
    if (typeof pipe === 'function') {
      if (!container.isBound(pipe)) {
        container.bind(pipe).toSelf().inSingletonScope()
      }
    } else {
      // If it's an instance, bind it to its constructor class as a constant value
      container.bind(pipe.constructor).toConstantValue(pipe)
    }
  }
}

export function UsePipes(...pipes: (Class<PipeTransform> | PipeTransform)[]) {
  return (
    target: any,
    propertyKey?: string | symbol,
    descriptor?: PropertyDescriptor
  ) => {
    if (descriptor && propertyKey) {
      // Method decorator
      Reflect.defineMetadata(PIPE_KEY, { pipes }, target, propertyKey)

      return
    } else {
      // Class decorator
      const methodNames = getClassMethods(target)

      // Store class-level pipes metadata
      Reflect.defineMetadata(PIPE_KEY, { pipes, paramTypes: [] }, target)

      // Process each method and store its paramTypes
      methodNames.forEach((methodName) => {
        // Store method-specific metadata with class pipes and method paramTypes
        Reflect.defineMetadata(
          PIPE_KEY,
          { pipes },
          target.prototype,
          methodName
        )
      })
    }
  }
}
