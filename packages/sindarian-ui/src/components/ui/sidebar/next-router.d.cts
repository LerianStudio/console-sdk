import type { SidebarRouter } from './sidebar-router'

/**
 * Resolves next/link + next/navigation, or null when Next.js is absent.
 * Implemented in `next-router.cjs` — see that file for why it is CommonJS.
 */
export declare function loadNextRouter(): SidebarRouter | null
