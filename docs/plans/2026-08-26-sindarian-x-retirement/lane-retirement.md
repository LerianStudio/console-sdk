# Sindarian-X Retirement Lane Implementation Plan

> **For implementers:** This lane is orchestrator-executed (cross-repo verification,
> release promotion, registry/repo administration). Read `index.md` in this directory
> FIRST — the retirement lane row and § Merge Order bind this plan.

**Goal:** sindarian-x is dead: npm package deprecated, repo archived, no live consumer, and the four apps pin a stable (non-beta) sindarian-ui.

**Architecture:** Four sequential phases. Absence verification is read-only grep across five repos. Promotion is a single develop→main merge in console-sdk (semantic-release publishes the stable from main). Re-pin is one small PR per app repo. Administration is two idempotent registry/host actions (npm deprecate, GitHub archive).

**Tech Stack:** git grep, gh CLI, npm CLI, semantic-release (existing workflows).

**Lane:** retirement
**Depends on:** app-consignado (br-consignado-gw#123, MERGED), app-matcher (matcher#376, MERGED), app-lender (lender#183, MERGED), app-cockpit (br-sfn#143, in review)
**Branch (docs):** `docs/lane-retirement` — execution is orchestrated directly; no dedicated worktree beyond this document.

## Phase Overview

| Phase | Milestone | Epics | Status |
|-------|-----------|-------|--------|
| 1 | absence verified across the five repos | 1.1 | Detailed |
| 2 | console-sdk stable released from main | 2.1 | Detailed |
| 3 | four apps pin the stable release | 3.1 | Epic-level |
| 4 | npm deprecation live + repo archived | 4.1 | Detailed |

---

### Epic 1.1: Cross-repo absence verification

**Goal:** No live consumer of `@lerianstudio/sindarian-x` exists.
**Scope:** read-only. The check that matters is STRICT absence — real dependencies and imports — not textual mentions.
**Dependencies:** none (verifiable per-repo as each app lane merges)
**Done when:** the scan returns zero hits outside the explicit allowlist in every repo's develop.
**Status:** Doing

**Explicit allowlist (by design, not failures) — every hit must match one of these exact classes:**
1. `docs/plans/**` at any depth — plans reference the name intentionally (matcher has two nested plan dirs: `site/docs/plans/`, `ui/docs/plans/`).
2. Generated CHANGELOGs (matcher, console-sdk) — release history is not falsified.
3. Named equivalence tests that cite their origin by design: `packages/sindarian-ui/src/__tests__/tokens-contract.test.ts` (FC-3), `packages/sindarian-ui/src/domain/legacy-equivalence.test.ts`.
4. Provenance comments inside sindarian-ui source: `src/domain/index.ts:3`, `src/enterprise/index.ts:3` (and short-name mentions in `.storybook/main.ts`, `src/charts/index.ts`).
5. `br-sfn/.impeccable/critique/2026-07-10*` — dated historical critique record.

**Verification (executed 2026-08-26, pre-cockpit-merge):** test files stay IN the scan — only `docs/plans` and CHANGELOGs are excluded by pattern; everything else is judged against the allowlist by hand.

```sh
git grep -l "@lerianstudio/sindarian-x" origin/develop -- \
  '*.json' '*.ts' '*.tsx' '*.js' '*.mjs' '*.yaml' \
  ':!docs/plans' ':!*/docs/plans/*' ':!*CHANGELOG*'
# gate: every resulting path is in the allowlist above; anything else = FAIL
```

| Repo | Hits | Outside allowlist | Verdict |
|------|------|-------------------|---------|
| matcher | 0 | 0 | clean |
| lender | 0 | 0 | clean |
| br-consignado-gw | 0 | 0 | clean |
| br-sfn | 360 (pre-merge) / 0 on `feat/migrate-to-sindarian-ui` | 0 at #143 | clean at #143 merge |
| console-sdk | 4 (2 provenance sub-barrel comments + 2 equivalence tests) | 0 | clean |

Re-run the br-sfn row after #143 merges; expected 0.

### Epic 2.1: Promote console-sdk develop → main (stable release)

**Goal:** A stable (non-beta) sindarian-ui exists on npm so apps can leave the beta pin.
**Scope:** one PR `develop` → `main` in console-sdk, merge commit (squash is disabled org-wide). semantic-release on main publishes the stable versions of every package with accumulated changes (sindarian-ui carries the absorbed surface + ESM dual build + radix/focus fixes).
**Dependencies:** app-cockpit merged (#143) — merge order rule 5 in index.md: promotion happens in this lane, before the npm deprecation.
**Done when:** release run on main is green; `npm view @lerianstudio/sindarian-ui dist-tags.latest` shows the new stable.
**Status:** Pending

#### Task 2.1.1: Open and merge the promotion PR

- [ ] Done

**Context:** develop is N releases ahead of main (last stable: sindarian-ui 1.2.0). All content is already CI-validated and CodeRabbit-reviewed per-PR on develop.
**Implementation vision:** `gh pr create --base main --head develop` in console-sdk; title `release: promote develop to main (sindarian-ui enterprise surface + ESM build)`. CI + CodeRabbit gates as usual; merge with merge commit. Watch the main release run to green.
**Verification:** `npm view @lerianstudio/sindarian-ui dist-tags --json` — `latest` moves past 1.2.0.
**Done when:** stable published; dist-tags recorded in this file.

### Epic 3.1: Re-pin the four apps to the stable

**Goal:** No production app pins a beta.
**Scope:** one commit per app repo (package manifest + lockfile; br-consignado-gw also drops the `minimumReleaseAgeExclude` beta entry from `pnpm-workspace.yaml` if the stable's age satisfies the guard). Full suite + build per app; PR per repo; CI + CodeRabbit; merge.
**Dependencies:** Epic 2.1
**Done when:** four PRs merged; each app's lockfile resolves the stable from the registry.
**Status:** Pending

### Epic 4.1: Registry deprecation and repo archive

**Goal:** accidental re-adoption of sindarian-x is discouraged at the registry (npm deprecation warns on install; it does not block downloads) and impossible via the repo (archived, read-only).
**Scope:** npm + GitHub administration. Both idempotent.
**Dependencies:** Epics 1.1–3.1 complete (deprecate last, per merge order).
**Done when:** `npm view @lerianstudio/sindarian-x deprecated` returns the message; `gh api repos/LerianStudio/lib-sindarian-ui --jq .archived` returns true.
**Status:** Pending

#### Task 4.1.1: Deprecate the npm package — FRED or service-account token

- [ ] Done

**Context:** the package owner on npm is the service account `lerianstudio <srv.iam@lerian.studio>`. The orchestrator's machine has no npm login (`npm whoami` → ENEEDAUTH), so this command needs Fred (or a one-shot `NPM_TOKEN=<service token> npm deprecate ...`).
**Implementation vision:** authenticate through a throwaway npm userconfig so no pre-existing `~/.npmrc` token is touched:
```sh
export NPM_CONFIG_USERCONFIG=$(mktemp)
trap 'rm -f "$NPM_CONFIG_USERCONFIG"; unset NPM_TOKEN NPM_CONFIG_USERCONFIG' EXIT
printf '//registry.npmjs.org/:_authToken=%s\n' "$NPM_TOKEN" > "$NPM_CONFIG_USERCONFIG"
[ "$(npm whoami)" = "lerianstudio" ] || { echo "wrong npm identity, aborting" >&2; exit 1; }
npm deprecate "@lerianstudio/sindarian-x@*" \
  "Retired 2026-08. Use @lerianstudio/sindarian-ui (console-sdk) — full surface absorbed as of 1.2.0-beta.14 and later."
```
**Verification:** every published version carries the message, not just latest: `npm view "@lerianstudio/sindarian-x@*" version deprecated --json` — assert the message on each entry.
**Done when:** deprecation message live for all versions.

#### Task 4.1.2: Archive the GitHub repo — orchestrator

- [ ] Done

**Context:** orchestrator credentials have `admin: true` on `LerianStudio/lib-sindarian-ui` (verified 2026-08-26).
**Implementation vision:** confirm no open PRs/issues worth migrating. Set the pointer description FIRST (description edits are impossible after archiving without unarchiving): `gh api -X PATCH repos/LerianStudio/lib-sindarian-ui -f description='RETIRED — absorbed into @lerianstudio/sindarian-ui (github.com/LerianStudio/console-sdk)'`. Then archive: `gh api -X PATCH repos/LerianStudio/lib-sindarian-ui -F archived=true` (`-F` sends a real Boolean; `-f` would send the string "true").
**Verification:** both fields in one read: `gh api repos/LerianStudio/lib-sindarian-ui --jq '{archived,description}'` → archived true AND the pointer description.
**Done when:** repo read-only with a pointer description.
