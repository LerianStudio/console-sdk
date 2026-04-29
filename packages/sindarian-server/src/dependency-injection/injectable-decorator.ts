import { injectable } from 'inversify'
import { INJECTABLE_KEY, CLASS_NAME_KEY } from '@/constants/keys'
import { Scope } from '@/constants/scopes'

export function injectableHandler(target: Function) {
  return Reflect.getOwnMetadata(INJECTABLE_KEY, target)
}

/**
 * Retrieves the original class name stored at decorator-evaluation time.
 * Falls back to constructor.name if no metadata is found (e.g. non-decorated classes).
 */
export function getClassName(target: Function): string {
  return (
    Reflect.getOwnMetadata(CLASS_NAME_KEY, target) ?? target.name ?? 'Unknown'
  )
}

export type InjectableOptions = {
  scope?: Scope
}

export function Injectable(options: InjectableOptions = {}): ClassDecorator {
  const { scope = Scope.DEFAULT } = options
  return (target: Function) => {
    Reflect.defineMetadata(INJECTABLE_KEY, { scope }, target)
    Reflect.defineMetadata(CLASS_NAME_KEY, target.name, target)

    if (options?.scope) {
      console.warn('Injectable: Scope option is not implemented.')
    }

    injectable()(target)
  }
}
