# sindarian-logs accepts the 2.x server line as a peer - Mini Plan

**Goal:** publish a `@lerianstudio/sindarian-logs` whose peer range admits the 2.x
server line, so a console pinning `@lerianstudio/sindarian-server@2.0.0-beta.3` installs
it on a clean `npm ci` with no `overrides` entry. Every version published so far carries
the old range, on both the 1.x and the 2.x line, so the consumer reaches this fix only by
crossing onto the next 2.x beta: see "What the consumer has to do". This package also
stops developing against a published copy of the server and links the sibling in this
repo.

**Scope:** `packages/sindarian-logs/package.json`, two ranges widened plus two
devDependencies added (`semver` and `@types/semver`, which the regression test uses); one
new regression test; `package-lock.json`, where the sibling link replaces a nested
registry copy of the server and the hoisted `node_modules/@types/semver` moves 7.7.1 to
7.8.0 to meet the new floor. No source change, no behaviour change in the shipped `dist`.

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

`packages/sindarian-logs/src/peer-dependencies.test.ts` holds four assertions:

1. both ranges declare the server at all, so deleting the key cannot pass;
2. the peer range admits `packages/sindarian-server/package.json`'s current `version`;
3. the dev range admits it too, which is what makes npm link the sibling;
4. the peer range still admits `1.3.0`, a concrete server version 1.x consumers install.

Assertion 4 exists because assertions 2 and 3 alone accept a bare `>=2.0.0-0`, which
would drop every 1.x consumer while staying green. Assertion 1 exists because `semver`
reads an empty range as `*`: with the previous `?? ''` fallback, a deleted key passed
the moment the server left prerelease.

## What the consumer has to do

**A major-line bump, not a beta bump.** product-console declares
`"@lerianstudio/sindarian-logs": "^1.1.0"` and its lockfile resolves `1.1.0`. Every
published version carries the old peer range, measured:

```
$ npm view @lerianstudio/sindarian-logs@1.1.0 peerDependencies
  '@lerianstudio/sindarian-server': '>=1.0.0-beta.27'
$ npm view @lerianstudio/sindarian-logs@1.2.0 peerDependencies        -> same
$ npm view @lerianstudio/sindarian-logs@1.3.0-beta.1 peerDependencies -> same
$ npm view @lerianstudio/sindarian-logs@2.0.0-beta.3 peerDependencies -> same
$ npm view @lerianstudio/sindarian-logs dist-tags
{ latest: '1.2.0', develop: '2.0.0-beta.3' }
```

So there is no 1.x release to bump into. This PR merges to `develop` and publishes
`2.0.0-beta.4` on the `develop` dist-tag, and the console crosses from `^1.1.0` to
`2.0.0-beta.4`, then deletes the `@lerianstudio/sindarian-server` override added in
product-console PR #959 (commit 4bb52b850).

What to check when crossing onto logs 2.x, all of it measured on this head:

- **The 2.0.0 major is not a sindarian-logs breaking change.** It came from
  `2d80366 fix(sindarian-ui)!: accept rich confirmation copy, require pendingLabel`
  ("BREAKING CHANGE: ConfirmationDialog requires `pendingLabel` whenever `loading` is
  passed"). This repo's semantic-release analyses every commit since the package's own
  tag without scoping to the package path, so one breaking commit anywhere majors every
  package released that day. That is also why `packages/sindarian-logs/CHANGELOG.md`
  reads as a list of sindarian-ui entries. Crossing logs onto 2.x does not move
  sindarian-ui, which the console pins separately at `1.2.0-beta.13`.
- **No exported API changed.** `git diff sindarian-logs-v1.1.0..HEAD --
  packages/sindarian-logs/src/index.ts` is empty, and the only source file the package
  changed since 1.1.0 is `src/decorators/http-log-helper.ts`.
- **Two things change in the HTTP log line** that `@LogHttpCall()` and
  `LoggableHttpService` emit. The URL is logged as origin plus pathname, so the query
  string and the fragment are gone (they carried caller filters: tax ids, document
  numbers, account ids). And on a failure the detail is `error.message || error.code`
  and nothing else, where a missing message previously meant `JSON.stringify(error)`,
  which for an HTTP client is the whole upstream response body.
- **So the console's check is its log readers**, not its code: a grep, alert or
  dashboard keyed on a query string or on a serialised error body loses that text.

## Known ceiling

No semver range can accept arbitrary future prereleases; the tuple rule makes that
inexpressible. Measured against the shipped ranges with semver 7.8.5:

```
1.0.0-beta.27  peer=true   dev=false
1.1.0          peer=true   dev=true
1.3.0          peer=true   dev=true
2.0.0-beta.3   peer=true   dev=true
2.0.0          peer=true   dev=true
2.1.0-beta.1   peer=false  dev=false
2.1.0          peer=true   dev=true
3.0.0-beta.1   peer=false  dev=false
```

So `2.1.0-beta.1` and `3.0.0-beta.1` will need their own clause when those lines are
cut. Candidates that would have avoided the treadmill were checked and none works:
`*`, `>=0.0.0-0`, `>=2.0.0-0 <3.0.0-0` and `2.x` all reject `2.0.0-beta.3` or
`2.1.0-beta.1` or both.

## What the test actually guards, and what it does not

The test fires on a pull request that changes `packages/sindarian-logs`. It does not
fire when the server cuts the beta line that breaks the range, and no arrangement of
this repo's workflows makes it fire there:

- `ci.yml` runs on `pull_request` only, and its matrix comes from the changed paths at
  path level 2, so a PR touching only `packages/sindarian-server` schedules only the
  server's jobs.
- The version bump itself is a `chore(sindarian-server): release vX [skip ci]` commit
  that the release job pushes straight to `develop`. `ci.yml` never runs on a push, and
  `[skip ci]` stops the release workflow from re-entering, so nothing runs CI on the
  commit that introduces the break.

Running the changed package's dependents (`turbo --filter=...<pkg>`) was the obvious
repair and was measured to be defeated by the very failure it targets. Turbo reads the
range out of `package.json` to decide whether the sibling is an internal dependency, so
the moment the devDependency range stops admitting the server version, the edge
disappears and the dependents filter schedules nothing:

```
$ npx turbo test --filter=@lerianstudio/sindarian-server --dry=json
packages: ["@lerianstudio/sindarian-server"]

$ npx turbo test --filter=...@lerianstudio/sindarian-server --dry=json
packages: ["@lerianstudio/sindarian-logs","@lerianstudio/sindarian-server"]

# same command, with the devDependency range put back to ">=1.1.0"
$ npx turbo test --filter=...@lerianstudio/sindarian-server --dry=json
packages: ["@lerianstudio/sindarian-server"]
```

A new server beta line breaks the peer range and the dev range together, so at that
moment the third case is what CI would see. The dependents filter is therefore not a
guard against this defect, and `ci.yml` is left alone.

**True guarantee:** a range that stops admitting the sibling turns the next pull request
touching `packages/sindarian-logs` red here. On a new server prerelease line, the first
alarm remains a consumer's install.

A durable repair exists and is bigger than this PR: make the devDependency stop being a
semver range at all, with npm's `workspace:*` protocol, so the sibling link and the
turbo edge cannot break; then a dependents filter in the three `ci.yml` jobs would run
the logs suite on every server PR. That changes the lockfile and the published manifest,
so it is a follow-up, not a line in this one.

## Verification

All commands run in `/srv/worktrees/sdk-logs-peer` on 2026-09-14.

### RED, the two ranges as the parent b6d0be6 declares them

The test file is new, so there is nothing to run on the parent; `git show
b6d0be6:packages/sindarian-logs/src/peer-dependencies.test.ts` answers `fatal: path ...
exists on disk, but not in 'b6d0be6'`. The RED below is this test over the parent's two
range values, restored into `package.json`:

```
peer=>=1.0.0-beta.27  dev=>=1.1.0
  ● @lerianstudio/sindarian-server ranges › accepts the sibling version this monorepo publishes
  ● @lerianstudio/sindarian-server ranges › links the sibling for development instead of a published copy
Test Suites: 1 failed, 1 total
Tests:       2 failed, 2 passed, 4 total
rc=1
```

### RED, the peer key deleted

```
  ● @lerianstudio/sindarian-server ranges › declares the server in both ranges
  ● @lerianstudio/sindarian-server ranges › accepts the sibling version this monorepo publishes
  ● @lerianstudio/sindarian-server ranges › keeps the 1.x server line consumers still install
Test Suites: 1 failed, 1 total
Tests:       3 failed, 1 passed, 4 total
rc=1
```

### RED, the peer range replaced by a bare `>=2.0.0-0`

The two sibling assertions stay green, which is the point: only the 1.x assertion
catches a range that would drop every 1.x consumer.

```
  ● @lerianstudio/sindarian-server ranges › keeps the 1.x server line consumers still install
Test Suites: 1 failed, 1 total
Tests:       1 failed, 3 passed, 4 total
rc=1
```

### GREEN

```
$ npx jest src/peer-dependencies.test.ts
Test Suites: 1 passed, 1 total
Tests:       4 passed, 4 total
rc=0
```

### The workspace link is real now

```
$ node -e "const l=require('./package-lock.json');for(const [p,v] of Object.entries(l.packages)) if(p.includes('sindarian-server')) console.log(p,'=>',JSON.stringify({link:v.link,resolved:v.resolved,version:v.version}))"
node_modules/@lerianstudio/sindarian-server => {"link":true,"resolved":"packages/sindarian-server"}
packages/sindarian-server => {"version":"2.0.0-beta.3"}
```

Before: a third entry,
`packages/sindarian-logs/node_modules/@lerianstudio/sindarian-server -> 1.1.0`.

### Gates

```
$ npx turbo lint --filter=@lerianstudio/sindarian-logs     -> Tasks: 1 successful, 1 total   LINT-rc=0
$ npm run test  -- --filter=@lerianstudio/sindarian-logs   -> Tests: 80 passed, 80 total     TEST-rc=0
$ npm run build -- --filter=@lerianstudio/sindarian-logs   -> Tasks: 2 successful, 2 total   BUILD-rc=0
```

The build is the load-bearing one: those 80 tests and that `tsc` now run against
server `2.0.0-beta.3`, not against `1.1.0`. They pass, so the 2.x server API is
compatible with this package.

### Install proof, a throwaway directory per case

Each case is `npm install <logs> @lerianstudio/sindarian-server@2.0.0-beta.3
--strict-peer-deps` in an empty directory.

RED, published logs `1.1.0`, which is what product-console resolves today:

```
npm error code ERESOLVE
npm error Found: @lerianstudio/sindarian-server@2.0.0-beta.3
npm error Could not resolve dependency:
npm error peer @lerianstudio/sindarian-server@">=1.0.0-beta.27" from @lerianstudio/sindarian-logs@1.1.0
rc=1
```

RED, published logs `2.0.0-beta.3`, the current `develop` dist-tag:

```
npm error code ERESOLVE
npm error Found: @lerianstudio/sindarian-server@2.0.0-beta.3
npm error Could not resolve dependency:
npm error peer @lerianstudio/sindarian-server@">=1.0.0-beta.27" from @lerianstudio/sindarian-logs@2.0.0-beta.3
rc=1
```

GREEN, `npm pack` of this branch:

```
added 49 packages, and audited 50 packages in 7s
rc=0
server: 2.0.0-beta.3
logs:   2.0.0-beta.3
logs peer range: >=1.0.0-beta.27 || >=2.0.0-0
nested duplicate server copies: 0
```

The package count moves with the registry, since npm resolves the other peers
(`next`, `pino`, `inversify`, `reflect-metadata`) fresh on each run.

## Follow-ups, found and not fixed here

1. **product-console crosses onto logs 2.x.** Once this merges to `develop` and
   semantic-release publishes `@lerianstudio/sindarian-logs@2.0.0-beta.4`, move
   `^1.1.0` to `2.0.0-beta.4` there and delete the `@lerianstudio/sindarian-server`
   override added in PR #959 (commit 4bb52b850). Details and the checks in
   "What the consumer has to do".
2. **`package-lock.json` drifts from every release.** semantic-release commits only
   `package.json` and `CHANGELOG.md`, so the lock kept claiming
   `packages/sindarian-server -> 2.0.0-beta.1` while the manifest said
   `2.0.0-beta.3`. This PR refreshes it as a side effect; the drift returns on the
   next release unless the release job adds the lock to its git assets.
3. **A server release cannot fail this test.** The bump lands as a `[skip ci]` push and
   the guard is a pull-request job. The durable repair is the `workspace:*`
   devDependency plus a dependents filter, described in "What the test actually guards".
