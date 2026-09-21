import { Controller, Get, Param } from '@lerianstudio/sindarian-server'

/**
 * The nested two-parameter shape a real console runs, which neither other
 * controller here covers: two named segments on one path, both resolved from
 * the URL the framework matched rather than from the object Next handed the
 * route file.
 *
 * Contract: plan 2026-09-21-console-simplification C9.
 */
@Controller('/organizations/:id/ledgers/:ledgerId/accounts')
export class LedgerController {
  @Get('/')
  public fetchAll(
    @Param('id') organizationId: string,
    @Param('ledgerId') ledgerId: string
  ) {
    return { organizationId, ledgerId }
  }
}
