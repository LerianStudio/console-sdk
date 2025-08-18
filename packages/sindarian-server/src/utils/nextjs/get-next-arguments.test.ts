import {
  getNextRequestArgument,
  getNextParamArgument
} from './get-next-arguments'

describe('getNextRequestArgument', () => {
  it('returns the first argument when present', () => {
    const req = { foo: 'bar' }
    expect(getNextRequestArgument([req, { params: {} }])).toBe(req)
  })

  it('returns undefined if args is empty', () => {
    expect(getNextRequestArgument([])).toBeUndefined()
  })

  it('returns undefined if args is not provided', () => {
    // @ts-expect-error testing missing argument
    expect(getNextRequestArgument()).toBeUndefined()
  })

  it('returns null if first argument is null', () => {
    expect(getNextRequestArgument([null, { params: {} }])).toBeNull()
  })
})

describe('getNextParamArgument', () => {
  it('returns params property of second argument', async () => {
    const params = { id: 123 }
    expect(await getNextParamArgument([{}, { params }])).toBe(params)
  })

  it('returns undefined if second argument is missing', async () => {
    expect(await getNextParamArgument([{}])).toBeUndefined()
  })

  it('returns undefined if second argument has no params property', async () => {
    expect(await getNextParamArgument([{}, {}])).toBeUndefined()
  })

  it('returns undefined if params is undefined', async () => {
    expect(
      await getNextParamArgument([{}, { params: undefined }])
    ).toBeUndefined()
  })

  it('returns null if params is null', async () => {
    expect(await getNextParamArgument([{}, { params: null }])).toBeNull()
  })
})
