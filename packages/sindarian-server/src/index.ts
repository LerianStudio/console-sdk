// Central export file (barrel) for all plugin components.
// Ensure 'reflect-metadata' is loaded before any decorators are used.

import 'reflect-metadata'

export * from './constants'
export * from './utils/apply-decorators'
export * from './context'
export * from './exceptions'
export * from './guards'
export * from './interceptor'
export * from './logger'
export * from './controllers'
export * from './dependency-injection'
export * from './modules'
export * from './middleware'
export * from './pipes'
export * from './server'
export * from './zod'

// Services
export { REQUEST } from './services/request'
export { APP_GUARD } from './services/guards'
export { APP_INTERCEPTOR } from './services/interceptor'
export { APP_FILTER } from './services/filters'
export { APP_PIPE } from './services/pipes'
export { FetchModuleOptions, HttpService } from './services/http-service'
// The bounds a `catch` or `describeRequestError` override is told to respect,
// and the reducer that applies them.
export {
  MESSAGE_MAX_LENGTH,
  PROBLEM_FIELD_MAX_LENGTH,
  toProblemMessage
} from './utils/error/to-problem-message'
export { APP_MIDDLEWARE } from './services/middleware'
export { CLASS_NAME_KEY } from './constants/keys'
