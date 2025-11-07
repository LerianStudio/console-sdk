import { FILTER_KEY } from '@/constants/keys'
import { Container } from '@/dependency-injection'
import { Class } from '@/types/class'
import { ExceptionFilter } from '../exception-filter'

export type FilterMetadata = {
  filters: Class[]
}

export class FilterHandler {
  static getMetadata(target: object): FilterMetadata {
    const metadata = Reflect.getOwnMetadata(FILTER_KEY, target)
    if (metadata) {
      return { filters: metadata }
    }
    return { filters: [] }
  }

  static async register(container: Container, target: object) {
    const { filters } = this.getMetadata(target)

    await Promise.all(
      filters.map((filter) => FilterHandler._register(container, filter))
    )
  }

  static async fetch(container: Container, target: object) {
    const { filters } = this.getMetadata(target)

    return Promise.all(
      filters.map((filter) => this._fetch(container, filter))
    ) as Promise<ExceptionFilter[]>
  }

  static async _fetch(
    container: Container,
    filter: ExceptionFilter | Class<ExceptionFilter>
  ) {
    // If it's a class constructor (function), resolve from container
    if (typeof filter === 'function') {
      return container.getAsync<ExceptionFilter>(filter)
    }
    // If it's an instance, resolve from container using its constructor
    return container.getAsync<ExceptionFilter>(filter.constructor as any)
  }

  static async _register(
    container: Container,
    filter: ExceptionFilter | Class<ExceptionFilter>
  ) {
    if (typeof filter === 'function') {
      container.bind(filter).to(filter).inSingletonScope()
    } else {
      container.bind(filter.constructor).toConstantValue(filter)
    }
  }
}

export function UseFilters(filters: Class[]): ClassDecorator {
  return (target: Function) => {
    const existingFilters: Class[] =
      Reflect.getOwnMetadata(FILTER_KEY, target) || []

    const updatedFilters = [...existingFilters, ...filters]

    Reflect.defineMetadata(FILTER_KEY, updatedFilters, target)
  }
}
