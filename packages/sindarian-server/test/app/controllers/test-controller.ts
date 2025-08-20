import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  BaseController,
  UseInterceptors
} from '@lerianstudio/sindarian-server'
import { inject } from 'inversify'
import { TestService } from './test-service'
import { TestInterceptor } from './test-interceptor'

@Controller('/test')
@UseInterceptors(TestInterceptor)
export class TestController extends BaseController {
  constructor(
    @inject(TestService)
    private readonly testService: TestService
  ) {
    super()
  }

  @Get()
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public fetchAll(@Query() query: any) {
    return this.testService.fetchAll()
  }

  @Get(':id')
  public fetchById(@Param('id') id: string) {
    return { id, name: 'test' }
  }

  @Post()
  public create(@Body() body: any) {
    return { id: 1, ...body }
  }

  @Patch(':id')
  public update(@Param('id') id: string, @Body() body: any) {
    return { id, ...body }
  }

  @Delete(':id')
  public delete(@Param('id') id: string) {
    return { id, name: 'test' }
  }
}
