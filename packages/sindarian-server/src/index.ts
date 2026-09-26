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
//
// The two readers are here for the frame this package does not own: an
// application that renders its own envelope reads the status and the message
// off the exception itself, and both are values a subclass controls. Reading
// them any other way is what leaves a route with no response at all.
//
// `noProblemDetails` comes with them because it is the FALLBACK those readers
// take, and an application that has to invent its own sentence drifts from the
// one this package answers: the same failed read would then read differently
// depending on which frame answered it, which is the drift the readers were
// exported to close.
//
// `readWireField` is the guarded read underneath all of them, and it is here
// because an application rendering its own envelope reads a field of a value it
// does not own: one read, bounded, unable to throw. That rule is the one thing
// it must not have to reinvent — a copy of it drifts from this one silently,
// and the frame that spends it is the last one before a body.
export {
  ERROR_TEXT_MAX_LENGTH,
  MESSAGE_MAX_LENGTH,
  PROBLEM_FIELD_MAX_LENGTH,
  noProblemDetails,
  readWireField,
  readWireMessage,
  readWireStatus,
  toProblemMessage
} from './utils/error/to-problem-message'
export { APP_MIDDLEWARE } from './services/middleware'
export { CLASS_NAME_KEY } from './constants/keys'
