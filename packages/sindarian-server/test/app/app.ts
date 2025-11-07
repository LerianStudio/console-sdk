import 'reflect-metadata'
import { ServerFactory } from '@lerianstudio/sindarian-server'
import { AppModule } from './app-module'
import { AppExceptionFilter } from './app-exception-filter'

export const app = ServerFactory.create(AppModule)

app.setGlobalPrefix('/api/v1')
app.useGlobalFilters(new AppExceptionFilter())
