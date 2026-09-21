import { useClickAway, useStepper, useTime, useToast } from '@/index'

/**
 * HOOKS THIS PACKAGE SHIPS BUT A CONSUMER CANNOT IMPORT.
 *
 * `use-time.ts` and `use-click-away.ts` are built into `dist/hooks/`, and the
 * package used them internally, but neither reached the package barrel. A
 * consumer's only route to them was a deep `@lerianstudio/sindarian-ui/dist/
 * hooks/use-time` import, which pins the consumer to the build layout and is
 * invisible to the package's type entry point — so Product Console kept copies
 * instead.
 *
 * A barrel line is exactly what a later refactor drops without anything going
 * red: every internal caller imports through `@/hooks/...` and would not
 * notice. This case is the only thing that does notice, so it asserts the
 * PUBLIC surface — the package's own entry point, the file the build turns
 * into `dist/index.js` — rather than the hook modules.
 */
const PUBLISHED_HOOKS = [
  ['useClickAway', useClickAway],
  ['useStepper', useStepper],
  ['useTime', useTime],
  ['useToast', useToast]
] as const

describe('hooks published from the package entry point', () => {
  it.each(PUBLISHED_HOOKS)('exports %s', (_name, hook) => {
    expect(typeof hook).toBe('function')
  })
})
