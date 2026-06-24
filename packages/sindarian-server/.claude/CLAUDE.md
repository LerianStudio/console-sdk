## Sindarian Server

NestJS-inspired framework for Next.js. Decorator-based routing, DI via Inversify, middleware pipeline.

### Architecture

Execution pipeline: Guards → Pipes → Interceptors → Handler → Interceptor cleanup → Response

Key abstractions:
- **Controllers**: `@Controller(path)` + route decorators (`@Get`, `@Post`, `@Put`, `@Patch`, `@Delete`)
- **Guards**: `CanActivate` interface, applied via `@UseGuards()`
- **Pipes**: `PipeTransform` interface, applied via `@UsePipes()`
- **Interceptors**: `Interceptor` abstract class, applied via `@UseInterceptors()`
- **Modules**: `@Module({ imports, controllers, providers })` for DI composition

### Key Patterns

- All decorators use `reflect-metadata` — `import 'reflect-metadata'` MUST be first line in `src/index.ts`
- Metadata keys are Symbols defined in `src/constants/keys.ts`
- Class-level decorators apply to all methods; method-level overrides class-level
- Multi-provider tokens (`APP_GUARD`, `APP_INTERCEPTOR`, `APP_FILTER`, `APP_PIPE`, `APP_MIDDLEWARE`) accumulate across modules, they don't replace
- Container resolution is async — always use `getAsync()`, not `get()`
- `applyDecorators()` in `src/utils/` composes multiple decorators into one

### Adding a New Decorator Type

1. Add Symbol key in `src/constants/keys.ts`
2. Create decorator function using `Reflect.defineMetadata(KEY, value, target)`
3. Create Handler class with static methods: `getMetadata()`, `register()`, `fetch()`, `execute()`
4. Export from feature barrel (e.g., `src/guards/index.ts`)
5. Re-export from `src/index.ts`

### Adding a Controller

1. Create `src/controllers/{name}.controller.ts` with `@Controller(path)` + route decorators
2. Register in a `@Module({ controllers: [...] })` 
3. Exports are automatic via barrel re-exports

### Subpath Exports

- Main: `@lerianstudio/sindarian-server` — all framework exports
- Zod: `@lerianstudio/sindarian-server/zod` — `createZodDto`, `ZodValidationPipe`

### Testing

- Jest + ts-jest, test files colocated: `{name}.test.ts`
- Mock `reflect-metadata` and Inversify container in tests
- Test pattern: verify metadata definition → handler registration → handler execution → edge cases
