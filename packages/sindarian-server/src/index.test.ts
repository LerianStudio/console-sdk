import * as barrel from './index'

// `HttpService`'s JSDoc tells an overrider to bound the fields it logs and to
// reduce a body to its classification. Both were unreachable from the package
// entry point, so the instruction pointed at nothing a consumer could import.
describe('package entry point', () => {
  it.each([
    'HttpService',
    'toProblemMessage',
    'PROBLEM_FIELD_MAX_LENGTH',
    'MESSAGE_MAX_LENGTH'
  ])('exports %s', (name) => {
    expect(barrel).toHaveProperty(name)
  })

  it('exports the bounds an override is told to respect', () => {
    expect(barrel.PROBLEM_FIELD_MAX_LENGTH).toBe(200)
    expect(barrel.MESSAGE_MAX_LENGTH).toBe(2000)
  })
})
