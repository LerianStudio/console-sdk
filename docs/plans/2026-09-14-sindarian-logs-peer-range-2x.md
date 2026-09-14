# sindarian-logs accepts the 2.x server line as a peer - Mini Plan

**Goal:** a console that pins `@lerianstudio/sindarian-server@2.0.0-beta.3` installs
`@lerianstudio/sindarian-logs` on a clean `npm ci` with no `overrides` entry, and this
package develops against the server in this repo instead of a published copy.

**Scope:** `packages/sindarian-logs/package.json` (two ranges), one regression test,
`package-lock.json`. No source change, no behaviour change in the shipped `dist`.

Status: Done.

## The defect

Under semver a prerelease satisfies a range only when some comparator in the same
comparator set carries a prerelease on that comparator's own `major.minor.patch`.
`>=1.0.0-beta.27` anchors the tuple `1.0.0`, so `2.0.0-beta.3` never satisfies it,
while the stable `2.0.0` does. The hole opens on prereleases only, which is why it
stayed invisible until a consumer pinned a beta.

Two ranges in `packages/sindarian-logs/package.json` had that shape, and each one
failed in its own place:

| Range | Value before | What it broke |
|-------|--------------|---------------|
| `peerDependencies` | `>=1.0.0-beta.27` | product-console pinning server `2.0.0-beta.3` got `npm error Conflicting peer dependency: @lerianstudio/sindarian-server@1.3.0` on a clean `npm ci`, and shipped an `overrides` workaround (product-console PR #959, commit 4bb52b850) |
| `devDependencies` | `>=1.1.0` | npm refused to link the workspace sibling (`2.0.0-beta.3`) and downloaded the published **1.1.0** into `packages/sindarian-logs/node_modules/`, so every build and test of this package type-checked against a server one major line behind the one in this repo |

The second one is the same bug and was not in the report. `.claude/CLAUDE.md` says
"When modifying sindarian-server's public API, check sindarian-logs for breakage";
the link that would have caught it resolved to a registry copy.

## What shipped

Both ranges gained a clause anchored on the 2.x tuple:

- peer: `>=1.0.0-beta.27 || >=2.0.0-0`
- dev: `>=1.1.0 || >=2.0.0-0`

`packages/sindarian-logs/src/peer-dependencies.test.ts` asserts both ranges admit
`packages/sindarian-server/package.json`'s current `version`. The monorepo releases
both packages together, so the sibling's version is the right oracle: the next time
the server moves onto a beta line this range does not anchor, CI here goes red
before a consumer's install does.

## Known ceiling

No semver range can accept arbitrary future prereleases; the tuple rule makes that
inexpressible. Measured against the current range:

```
2.0.0-beta.3=true  2.1.0-beta.1=false  3.0.0-beta.1=false  1.4.0-beta.1=false
```

So `2.1.0-beta.1` and `3.0.0-beta.1` will need their own clause when those lines are
cut. The test above is what makes that a red build here instead of a surprise in a
console. Candidates that would have avoided the treadmill were checked and none
works: `*`, `>=0.0.0-0`, `>=2.0.0-0 <3.0.0-0` and `2.x` all reject `2.0.0-beta.3`
or `2.1.0-beta.1` or both.

## Verification

All commands run in `/srv/worktrees/sdk-logs-peer` on 2026-09-14.

### RED, before the ranges were widened

```
$ npx jest src/peer-dependencies.test.ts
  ● @lerianstudio/sindarian-server ranges › accepts the sibling version this monorepo publishes
    Expected: true
    Received: false
  ● @lerianstudio/sindarian-server ranges › links the sibling for development instead of a published copy
    Expected: true
    Received: false
Test Suites: 1 failed, 1 total
Tests:       2 failed, 2 total
```

### GREEN, after

```
$ npx jest src/peer-dependencies.test.ts
Test Suites: 1 passed, 1 total
Tests:       2 passed, 2 total
GREEN-rc=0
```

### The workspace link is real now

```
$ node -e "...print every sindarian-server entry in package-lock.json..."
node_modules/@lerianstudio/sindarian-server -> packages/sindarian-server
packages/sindarian-server -> 2.0.0-beta.3
```

Before: a third entry,
`packages/sindarian-logs/node_modules/@lerianstudio/sindarian-server -> 1.1.0`.

### Gates

```
$ npx turbo build --filter=@lerianstudio/sindarian-logs   -> Tasks: 2 successful, 2 total   BUILD-rc=0
$ npx turbo lint  --filter=@lerianstudio/sindarian-logs   -> Tasks: 1 successful, 1 total   LINT-rc=0
$ npx turbo test  --filter=@lerianstudio/sindarian-logs   -> Tests: 78 passed, 78 total     TEST-rc=0
```

The build is the load-bearing one: those 78 tests and that `tsc` now run against
server `2.0.0-beta.3`, not against `1.1.0`. They pass, so the 2.x server API is
compatible with this package.

### Install proof, a throwaway directory per case

RED A, the situation product-console is in today (published logs `2.0.0-beta.3`
next to server `2.0.0-beta.3`, `npm install --strict-peer-deps`):

```
npm error code ERESOLVE
npm error Found: @lerianstudio/sindarian-server@2.0.0-beta.3
npm error Could not resolve dependency:
npm error peer @lerianstudio/sindarian-server@">=1.0.0-beta.27" from @lerianstudio/sindarian-logs@2.0.0-beta.3
RED-A-rc=1
```

RED B, published logs `1.1.0`, same server pin:

```
npm error code ERESOLVE
npm error peer @lerianstudio/sindarian-server@">=1.0.0-beta.27" from @lerianstudio/sindarian-logs@1.1.0
RED-B-rc=1
```

GREEN, `npm pack` of this branch installed next to the same server pin:

```
$ npm install --strict-peer-deps
added 47 packages, and audited 48 packages in 7s
GREEN-rc=0
server: 2.0.0-beta.3
logs:   2.0.0-beta.3
logs peer range: >=1.0.0-beta.27 || >=2.0.0-0
nested duplicate server: none
```

## Follow-ups, found and not fixed here

1. **product-console unwinds its workaround.** Once this merges to `develop` and
   semantic-release publishes `@lerianstudio/sindarian-logs@2.0.0-beta.4`, bump it
   there and delete the `overrides` entry added in PR #959 (commit 4bb52b850).
2. **`package-lock.json` drifts from every release.** semantic-release commits only
   `package.json` and `CHANGELOG.md`, so the lock kept claiming
   `packages/sindarian-server -> 2.0.0-beta.1` while the manifest said
   `2.0.0-beta.3`. This PR refreshes it as a side effect; the drift returns on the
   next release unless the release job adds the lock to its git assets.
3. **The guard only fires when sindarian-logs is touched.** CI runs the test job per
   changed package, so a server-only bump onto a new beta line does not run this
   test until someone next touches sindarian-logs.
