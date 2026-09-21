import {
  CanActivate,
  Controller,
  Delete,
  Get,
  Param,
  UseGuards
} from '@lerianstudio/sindarian-server'

/**
 * How often each guard was consulted, reset by the spec before every case.
 *
 * Guards are resolved from the container as singletons, so the spec cannot
 * reach the instances; a module-level tally is how it observes a guard running
 * twice, which is the half of the defect a status code cannot show.
 */
export const guardCalls = { read: 0, admin: 0 }

export class ReadGuard implements CanActivate {
  async canActivate(): Promise<boolean> {
    guardCalls.read++
    return true
  }
}

/**
 * Denies. On a controller that also carries a class-level guard this guard used
 * to be discarded outright, so the route answered 200 to everyone.
 */
export class AdminGuard implements CanActivate {
  async canActivate(): Promise<boolean> {
    guardCalls.admin++
    return false
  }
}

@Controller('/guarded')
@UseGuards(ReadGuard)
export class GuardedController {
  @Get(':id')
  public fetchById(@Param('id') id: string) {
    return { id }
  }

  @Delete(':id')
  @UseGuards(AdminGuard)
  public remove(@Param('id') id: string) {
    return { id, removed: true }
  }
}
