import * as path from 'path'
import * as ts from 'typescript'
import * as barrel from './index'
import type {
  RouteContext,
  RouteMetadata,
  ParamMetadata,
  QueryMetadata,
  BodyMetadata,
  RequestMetadata
} from './index'

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
    'ERROR_TEXT_MAX_LENGTH',
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
    expect(barrel.ERROR_TEXT_MAX_LENGTH).toBe(4096)
    expect(barrel.MESSAGE_MAX_LENGTH).toBe(2000)
  })

  // The six TYPE exports carry no runtime value, so `toHaveProperty` above can
  // never see them — and a consumer needs them: `RouteContext` is the shape of
  // a `PipeHandler.execute` argument, and the five `*Metadata` types are what a
  // reflecting harness reads back.
  //
  // The typed declarations below are the guard a consumer's own `tsc` runs.
  // They do NOT guard anything here: this package's tests are not type-checked
  // (ts-jest diagnostics are off — measured: `const n: number = 'x'` in this
  // very file passes), so a dropped export would elide silently. The assertion
  // is what makes this suite go red, and it reads the entry point's exported
  // symbols through the compiler, which is the consumer's own view of it.
  it('exports the types a consumer needs to call the handlers', () => {
    const declarations: {
      context: RouteContext
      route: RouteMetadata
      param: ParamMetadata
      query: QueryMetadata
      body: BodyMetadata
      request: RequestMetadata
    } | null = null

    expect(declarations).toBeNull()

    const entry = path.join(__dirname, 'index.ts')
    const program = ts.createProgram([entry], {
      target: ts.ScriptTarget.ES2021,
      module: ts.ModuleKind.Node16,
      moduleResolution: ts.ModuleResolutionKind.Node16,
      strict: true,
      skipLibCheck: true,
      noEmit: true,
      experimentalDecorators: true,
      baseUrl: __dirname,
      paths: { '@/*': ['./*'] }
    })
    const checker = program.getTypeChecker()
    const entrySymbol = checker.getSymbolAtLocation(
      program.getSourceFile(entry)!
    )
    const exported = checker
      .getExportsOfModule(entrySymbol!)
      .map((symbol) => symbol.name)

    expect(
      [
        'RouteContext',
        'RouteMetadata',
        'ParamMetadata',
        'QueryMetadata',
        'BodyMetadata',
        'RequestMetadata'
      ].filter((name) => !exported.includes(name))
    ).toEqual([])
  })
})
