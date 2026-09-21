// `PipeHandler` is public for the same reason as its siblings in
// `controllers/decorators`: an application testing a controller resolves and
// runs its pipes itself. `PipeMetadata` stays private — it is not exported from
// `use-pipes.ts` at all, and publishing it is a wider decision than this.
export { PipeHandler, UsePipes } from './use-pipes'
