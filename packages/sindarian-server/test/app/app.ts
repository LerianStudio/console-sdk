import 'reflect-metadata'
import { ServerFactory } from '@lerianstudio/sindarian-server'
import { AppModule } from './app-module'

export const app = ServerFactory.create(AppModule)

app.setGlobalPrefix('/api/v1')
