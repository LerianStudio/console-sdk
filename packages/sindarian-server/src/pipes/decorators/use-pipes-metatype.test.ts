import 'reflect-metadata'
import z from 'zod'
import { Get } from '@/controllers/decorators/route-decorator'
import { Query } from '@/controllers/decorators/query-decorator'
import { Body } from '@/controllers/decorators/body-decorator'
import { createZodDto } from '@/zod/create-zod-dto'
import { PipeHandler } from './use-pipes'

/**
 * Proves a pipe receives the metatype declared on a `@Query()` argument.
 *
 * This suite lives beside `use-pipes.test.ts` instead of inside it because that
 * file mocks `@/controllers/decorators/route-decorator` wholesale and stubs
 * `RouteHandler.getMetadata` with a fixed `paramTypes` array, so nothing in it
 * can observe the real metadata read this suite exists to pin.
 *
 * Read order matters: `@Route` writes `ROUTE_KEY` onto the prototype (a method
 * decorator's `target`), while `ServerFactory` calls `PipeHandler.execute` with
 * the controller instance. Reading the wrong one leaves `paramTypes` empty and
 * every argument other than `@Body()` unvalidated — plan
 * 2026-09-21-console-simplification C9.
 */

class SearchQueryDto extends createZodDto(z.object({ q: z.string() })) {}
class CreateBodyDto extends createZodDto(z.object({ name: z.string() })) {}

class SearchController {
  @Get('search')
  search(@Query() query: SearchQueryDto) {
    return query
  }

  @Get('create')
  create(@Body() body: CreateBodyDto) {
    return body
  }
}

describe('PipeHandler.execute metatype resolution', () => {
  it('emits the DTO class into design:paramtypes (the premise of this suite)', () => {
    expect(
      Reflect.getMetadata(
        'design:paramtypes',
        SearchController.prototype,
        'search'
      )
    ).toEqual([SearchQueryDto])
  })

  it('gives the pipe the declared metatype of a @Query() argument', async () => {
    const pipe = { transform: jest.fn((value: any) => value) }
    const query = { q: 'lerian' }

    await PipeHandler.execute(
      new SearchController(),
      'search',
      [pipe],
      [{ type: 'query', parameter: query, parameterIndex: 0 }]
    )

    expect(pipe.transform).toHaveBeenCalledWith(query, {
      type: 'query',
      metatype: SearchQueryDto,
      data: query
    })
  })

  it('still gives the pipe the declared metatype of a @Body() argument', async () => {
    const pipe = { transform: jest.fn((value: any) => value) }
    const body = { name: 'lerian' }

    await PipeHandler.execute(
      new SearchController(),
      'create',
      [pipe],
      [{ type: 'body', parameter: body, parameterIndex: 0 }]
    )

    expect(pipe.transform).toHaveBeenCalledWith(body, {
      type: 'body',
      metatype: CreateBodyDto,
      data: body
    })
  })

  it('resolves the metatype from the prototype as well as from an instance', async () => {
    const pipe = { transform: jest.fn((value: any) => value) }

    await PipeHandler.execute(
      SearchController.prototype,
      'search',
      [pipe],
      [{ type: 'query', parameter: {}, parameterIndex: 0 }]
    )

    expect(pipe.transform.mock.calls[0][1]).toMatchObject({
      metatype: SearchQueryDto
    })
  })
})
