// The handler classes travel with their decorators: an application that tests
// its own controllers reflects over this metadata exactly as the framework
// does, and without them it reaches through a relative path into `dist/` that
// the package's `exports` map refuses. `RouteContext` comes with them because
// it is the shape a caller has to build to invoke one.
export { Controller } from './controller-decorator'
export { Param, ParamHandler, type ParamMetadata } from './param-decorator'
export { Query, QueryHandler, type QueryMetadata } from './query-decorator'
export {
  Request,
  RequestHandler,
  type RequestMetadata
} from './request-decorator'
export {
  Body,
  BodyHandler,
  DEFAULT_MAX_BODY_BYTES,
  type BodyMetadata,
  type BodyOptions
} from './body-decorator'
export {
  Get,
  Post,
  Put,
  Patch,
  Delete,
  RouteHandler,
  type RouteMetadata,
  type RouteContext
} from './route-decorator'
