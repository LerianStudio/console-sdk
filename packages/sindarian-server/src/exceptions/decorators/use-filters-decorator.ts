import { FILTER_KEY } from '@/constants/keys'
import { Class } from '@/types/class'

export function filterHandler(target: object) {
  return Reflect.getOwnMetadata(FILTER_KEY, target) || []
}

export function UseFilters(filters: Class[]): ClassDecorator {
  return (target: Function) => {
    const existingFilters: Class[] =
      Reflect.getOwnMetadata(FILTER_KEY, target) || []

    const updatedFilters = [...existingFilters, ...filters]

    Reflect.defineMetadata(FILTER_KEY, updatedFilters, target)
  }
}
