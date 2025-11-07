import { CATCH_KEY } from '@/constants/keys'
import { Class } from '@/types/class'

type CatchMetadata = {
  type: Class
}

export function catchHandler(target: object): CatchMetadata {
  return Reflect.getOwnMetadata(CATCH_KEY, target)
}

export function Catch(errorType?: Class): ClassDecorator {
  return (target: any) => {
    Reflect.defineMetadata(CATCH_KEY, { type: errorType }, target)
  }
}
