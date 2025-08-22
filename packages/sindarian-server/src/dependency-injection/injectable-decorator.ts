import { injectable } from 'inversify'
import { INJECTABLE_KEY } from '@/constants/keys'
import { Scope } from '@/constants/scopes'

export function injectableHandler(target: Function) {
  return Reflect.getOwnMetadata(INJECTABLE_KEY, target)
}

export type InjectableOptions = {
  scope?: Scope
}

export function Injectable(options: InjectableOptions = {}): ClassDecorator {
  const { scope = Scope.DEFAULT } = options
  return (target: Function) => {
    Reflect.defineMetadata(INJECTABLE_KEY, { scope }, target)

    if (options?.scope) {
      console.warn('Injectable: Scope option is not implemented.')
    }

    injectable()(target)
  }
}
