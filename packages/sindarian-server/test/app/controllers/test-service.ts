import { injectable } from 'inversify'
import { getCurrentRequest } from '@lerianstudio/sindarian-server'

@injectable()
export class TestService {
  public fetchAll() {
    // Example: You can access the current request like this:
    // const request = getCurrentRequest()
    // if (request) {
    //   const url = new URL(request.url)
    //   const userAgent = request.headers.get('user-agent')
    //   // Use request data as needed
    // }
    
    return [{ id: 1, name: 'test' }]
  }
}
