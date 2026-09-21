import * as barrel from './index'

// `HttpService`'s JSDoc tells an overrider to bound the fields it logs and to
// reduce a body to its classification. Both were unreachable from the package
// entry point, so the instruction pointed at nothing a consumer could import.
//
// The six argument and pipe handlers are here for the same reason: an
// application testing its own controllers reflects over them exactly as this
// package does, and with no public handler it reaches through a relative path
// into `dist/`, which the `exports` map refuses and a layout change breaks in
// silence. Asserting them as VALUES is the point — a type-only export would
// satisfy the compiler and still leave the consumer with nothing to call.
describe('package entry point', () => {
  it.each([
    'HttpService',
    'toProblemMessage',
    'PROBLEM_FIELD_MAX_LENGTH',
    'MESSAGE_MAX_LENGTH',
    'readWireField',
    'RouteHandler',
    'ParamHandler',
    'QueryHandler',
    'BodyHandler',
    'RequestHandler',
    'PipeHandler'
  ])('exports %s', (name) => {
    expect(barrel).toHaveProperty(name)
  })

  it('exports the bounds an override is told to respect', () => {
    expect(barrel.PROBLEM_FIELD_MAX_LENGTH).toBe(200)
    expect(barrel.MESSAGE_MAX_LENGTH).toBe(2000)
  })
})
