import { injectable } from 'inversify'

@injectable()
export class TestService {
  public fetchAll() {
    return [{ id: 1, name: 'test' }]
  }
}
