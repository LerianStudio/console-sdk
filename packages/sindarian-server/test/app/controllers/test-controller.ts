import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  UseInterceptors
} from '@lerianstudio/sindarian-server'
import { inject } from 'inversify'
import { TestService } from './test-service'
import { TestInterceptor } from './test-interceptor'
import { CreateTestDto, SearchTestDto, UpdateTestDto } from './test-dto'

@Controller('/test')
@UseInterceptors(TestInterceptor)
export class TestController {
  constructor(
    @inject(TestService)
    private readonly testService: TestService
  ) {}

  @Get()
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public fetchAll(@Query() query: any) {
    return this.testService.fetchAll()
  }

  // `SearchTestDto` is imported as a VALUE, never `import type`: an erased
  // annotation emits no `design:paramtypes` entry, so the pipe receives no
  // metatype and hands the query straight through.
  @Get('search')
  public search(@Query() query: SearchTestDto) {
    return query
  }

  @Get(':id')
  public fetchById(@Param('id') id: string) {
    return { id, name: 'test' }
  }

  @Post()
  public create(@Body() body: CreateTestDto) {
    return { id: 1, ...body }
  }

  @Patch(':id')
  public update(@Param('id') id: string, @Body() body: UpdateTestDto) {
    return { id, ...body }
  }

  @Delete(':id')
  public delete(@Param('id') id: string) {
    return { id, name: 'test' }
  }
}
