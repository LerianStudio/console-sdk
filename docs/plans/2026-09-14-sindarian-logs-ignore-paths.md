# sindarian-logs lets a route opt out of the access line - Mini Plan

**Goal:** give an operator a way to stop a high-volume route from writing one
aggregated access line per hit, without losing the line when that route fails.
Opt-in, empty by default, so no existing consumer changes behaviour.

**Scope:** `packages/sindarian-logs` only. One new option on `LoggerAggregator`
plus its exported type, one guard in `finalizeContext`, one environment variable
read in `LoggerModule`'s existing provider factory, two test files, and the
package README. No change to `TraceMiddleware`, to the log shape, or to any
other package.

Status: Done. Code final at `774eff4`.

## Phase overview

| Phase | What lands | Commit |
|-------|------------|--------|
| 1 | `ignorePaths` on the aggregator, the matching rules, the error escape hatch | `67f37f8` |
| 2 | `LOG_IGNORE_PATHS`, so a `LoggerModule` consumer reaches the option | `3c1e2eb` |
| 3 | README: both ways to set it, what each pattern form matches, the safety rule | `39369a9` |
| 4 | The escape hatch survives the 1000-event cap, found in review | `64fa3db` |
| 5 | The escape hatch reads the response status, so a 5xx is never silenced | `bacc1aa` |
| 6 | README, feature bullet included: the rule the code delivers, not the one the guard could not reach | `774eff4` |

## Found by

The console lane that added the CSP violation sink (product-console #968)
measured this while trying to bound the cost of that endpoint. `TraceMiddleware`
wraps every request and `LoggerAggregator.finalizeContext` writes one line per
request unconditionally; the only constructor option was `{ debug?: boolean }`.
So an anonymous, high-volume route produced one log line per hit, and nothing
the handler could do would bound it: the line is written by the aggregator after
the handler has already returned. Product Console has two such routes, the CSP
violation sink every browser tab can post to, and the two liveness probes
Kubernetes calls on a timer.

## Epic 1: the aggregator option

**Task 1.1 - the option and its type.** `LoggerAggregatorOptions` is now an
exported type (`debug`, `ignorePaths`) rather than the inline `{ debug?: boolean }`
the constructor carried. Exported so a consumer can name the shape it passes.

**Task 1.2 - the matching rules.** Two forms, no regex, because a regex in an
environment variable is a way to turn a typo into a silent outage:

| Pattern | Matches | Does not match |
|---------|---------|----------------|
| `/api/csp-report` | that path, exactly | `/api/csp-report/legacy` |
| `/api/admin/health/*` | `/api/admin/health/alive`, `/api/admin/health/readyz`, anything deeper | `/api/admin/health`, `/api/admin/healthz` |

The prefix form keeps its trailing slash (`pattern.slice(0, -1)`, not `-2`), so
`/api/admin/health/*` cannot swallow a sibling route whose name merely starts
with the same letters. `/api/admin/healthz` staying loud is a pinned test, not
an accident.

**Task 1.3 - where the guard sits.** In `finalizeContext`, which is the one
place every entry point reaches: `TraceMiddleware`, `withTrace`, and a root
`@Traceable` context all funnel through `runWithContext`. A guard in the
middleware would have covered the middleware only.

**Task 1.4 - the escape hatch.** The line is dropped only when the escalated
level is below `error`. A thrown error and a recorded `.error()` both escalate
the request, so both still write the full entry with every event in it.
Everything below, `warn` and `audit` included, stays silent: a route that warns
on each malformed payload would otherwise defeat the bound it was silenced for.

## Epic 1b: the escape hatch had a hole, found in review

CodeRabbit found it on PR #189 and it was real. A request context stops
recording at `MAX_EVENTS` (1000), and the old cap dropped the 1001st event
whatever it was. So a request that recorded a thousand events and then failed
lost the error event, escalated to whatever the thousand were, and with
`ignorePaths` on that path the guard then discarded the entry entirely. The
promise this whole change rests on, that silencing a route never hides its
failures, had a reachable counterexample.

An error now takes the oldest event's slot rather than being dropped. The entry
stays capped at 1000, the failure is in it, and the level of the whole entry is
`error` again.

That repairs one pre-existing information loss that has nothing to do with
`ignorePaths`: before this, a request that errored past the cap wrote an entry
whose level contradicted what actually happened. Only the error case is
repaired. `addEvent` still returns early for any non-error event at the cap, so
a thousand info events followed by a `warn` still writes `level: info`. An
earlier draft of this section said "any request past the cap", which overstated
it.

## Epic 1c: the escape hatch was unreachable over HTTP, found by review

The review of this PR refuted the headline claim, and it was right. Everything
above pins the aggregator's own rule by calling `runWithContext` directly. No
test, and no live proof, went through the route a request actually takes.

In `sindarian-server`, `ServerFactory.handler` runs the middleware chain around
`_handleRequest`, and `_handleRequest` wraps guards, pipes, interceptors and the
controller in a `try/catch` that converts EVERY exception into a `Response`,
either through an exception filter or through the default
`NextResponse.json({message:'Internal server error'},{status:500})`.
`TraceMiddleware` sits outside that. So the `catch` inside `runWithContext`, the
only place in this package that records a `request_error` event, cannot fire for
an ordinary request failure. The aggregator sees a normal return, escalates to
`info`, matches `isIgnored`, and writes nothing.

Two reachable instances, both on the configuration the README recommends:

1. A controller on a silenced path throws. The caller gets HTTP 500 and the log
   is empty.
2. Product Console's own `/api/admin/health/readyz` does not throw when a
   dependency is down: it records `logger.warn(...)` and returns 503. The warn
   is exactly what the guard is designed to silence, so the log is empty while
   Kubernetes pulls the pod out of rotation.

**The guard now reads the response status.** `setResponseMetadata` already
stores it on the context before `finalizeContext` runs, so the evidence was
there and unused:

```ts
const failed =
  escalatedLevel === 'error' || (context.statusCode ?? 0) >= 500

if (!failed && this.isIgnored(context.path)) return
```

A 4xx stays silent. A malformed payload is the caller's problem, not the
route's, and a sink that rejects thousands of them is the case the bound exists
for. That is a decision, so it is pinned by its own test and by mutant C below.

The direct `runWithContext` tests are kept and renamed. They pin the
aggregator's rule for a caller that lets a throw out, which `withTrace` and a
root `@Traceable` still can; they no longer carry names that claim the HTTP
guarantee. The guarantee is now carried by `src/logger-pipeline.test.ts`, the
first test in this package that builds a real `ServerFactory` app and calls
`app.handler`.

## Epic 2: reaching the option from a consumer

`LoggerModule` builds the aggregator in its own factory, so importing the module
left no way to pass the option short of re-declaring the whole provider and
copying the `ENABLE_DEBUG` read along with it, which then rots the first time
this package adds an option.

`LOG_IGNORE_PATHS` is a comma-separated list, trimmed, blanks dropped. It sits
next to `ENABLE_DEBUG` in the same factory and answers the same kind of
question. Which routes are noise is a property of the traffic, not of the code:
it should move at a restart, not at a release.

## Known ceilings

1. **Nothing in CI type-checks the option.** `tsconfig.json` excludes
   `**/*.test.ts` from the build, and `ts-jest` runs under
   `isolatedModules: true`, so no gate type-checks a consumer-shaped call. The
   RED below is the evidence: with `ignorePaths` absent from the type, the suite
   ran and failed on assertions rather than failing to compile. The widening
   matters for the consumer's own `tsc`, which is where it is felt.
2. **The module test reaches an internal.** `@Module` parks its provider list on
   the class prototype under `__providers__`, and sindarian-server does not
   export that key (`PROVIDERS_PROPERTY` is internal to
   `src/constants/keys.ts`). The test hard-codes the string and throws a named
   error if the lookup comes back empty, so a framework change turns it red
   rather than quietly green.
3. **A non-path context can be matched in principle.** `withTrace` and a root
   `@Traceable` pass an operation name where the middleware passes a URL path,
   so an `ignorePaths` entry shaped like an operation name would match one.
   Every documented pattern starts with `/`, so it does not arise in practice,
   and no guard was added for it.
4. **This PR silences nothing by itself.** Product Console still has to set
   `LOG_IGNORE_PATHS` once it crosses onto the release that carries this.
5. **A 5xx with no recorded error event is written at `info`.** The entry
   carries `statusCode: 500`, which is what keeps it, but the level is whatever
   the events escalated to. So an operator alerting on `level=error` does not
   see a throwing route; one alerting on `statusCode >= 500` does, and the
   README says so. Escalating the level from the status was deliberately NOT
   done here: it would change the level of every 5xx for every consumer of this
   package, silenced route or not, which is a much wider change than this lane
   owns. Follow-up 5.
6. **The cap evicts `events[0]` whatever it holds.** When an error arrives at
   the cap and slot zero already holds an error, the earlier failure, usually
   the causal one, is the one lost. Strictly better than dropping the new error
   (the level would then contradict the request), so it stands, with the
   trade-off written in the comment at `addEvent`.
7. **The new pipeline test replaces the repository binding.** It imports the
   real `LoggerModule` and then re-provides `LoggerRepository`, relying on the
   container's documented last-provider-wins rule, so the aggregator factory
   and its `LOG_IGNORE_PATHS` read are exactly a consumer's. If that override
   rule ever changes, the test binds nothing and goes red rather than quietly
   asserting against a pino repository that swallows the calls.

## Verification

All commands run in `/srv/worktrees/sdk-logs-ignore` on 2026-09-14.
The suite passes 81 tests on the parent `9ded7ed` and 99 on the final head.

### RED, the aggregator option

```
$ date -u                                    Mon Sep 14 22:54:33 UTC 2026
$ git rev-parse HEAD                         9ded7edcfcfeb51ff2b3dc3b661ef2f7eb848434
$ git status --porcelain                      M packages/sindarian-logs/src/aggregator/logger-aggregator.test.ts
$ npx jest src/aggregator/logger-aggregator.test.ts
  ● LoggerAggregator › ignorePaths › should write no access line for an exactly ignored path
  ● LoggerAggregator › ignorePaths › should silence every child of a prefix pattern
  ● LoggerAggregator › ignorePaths › should stay silent for anything below error
  ● LoggerAggregator › ignorePaths › should match any of several patterns
Test Suites: 1 failed, 1 total
Tests:       4 failed, 38 passed, 42 total
RED1-rc=1
```

The six `ignorePaths` cases that pass here are the ones asserting the unchanged
behaviour, which is the point: the option is inert until the guard exists. One
failure body, verbatim:

```
  ● LoggerAggregator › ignorePaths › should write no access line for an exactly ignored path
    expect(received).toHaveLength(expected)
    Expected length: 0
    Received length: 1
    Received array:  [{"log": {"duration": 0, "events": [{"level": "INFO", "message": "violation received", ...}], "level": "info", "method": "POST", "path": "/api/csp-report"}, "method": "info"}]
```

### GREEN, the aggregator option

```
$ date -u                                    Mon Sep 14 22:55:29 UTC 2026
$ git rev-parse HEAD                         9ded7edcfcfeb51ff2b3dc3b661ef2f7eb848434
$ git status --porcelain                      M packages/sindarian-logs/src/aggregator/logger-aggregator.test.ts
                                              M packages/sindarian-logs/src/aggregator/logger-aggregator.ts
$ npx jest src/aggregator/logger-aggregator.test.ts
Test Suites: 1 passed, 1 total
Tests:       42 passed, 42 total
GREEN1-rc=0
```

### RED, the environment variable

```
$ date -u                                    Mon Sep 14 22:57:00 UTC 2026
$ git rev-parse HEAD                         67f37f820e83bb51cca8cc3305f86e9ed5237a85
$ git status --porcelain                     ?? packages/sindarian-logs/src/logger-module.test.ts
$ npx jest src/logger-module.test.ts
  ● LoggerModule › should silence the paths named in LOG_IGNORE_PATHS
  ● LoggerModule › should trim entries and drop the blanks
    Received array:  [{... "path": "/api/csp-report"}, {... "path": "/api/admin/health/readyz"}]
Test Suites: 1 failed, 1 total
Tests:       2 failed, 3 passed, 5 total
RED2-rc=1
```

### GREEN, the environment variable

```
$ date -u                                    Mon Sep 14 22:57:19 UTC 2026
$ git rev-parse HEAD                         67f37f820e83bb51cca8cc3305f86e9ed5237a85
$ git status --porcelain                      M packages/sindarian-logs/src/logger-module.ts
                                             ?? packages/sindarian-logs/src/logger-module.test.ts
$ npx jest src/logger-module.test.ts
Test Suites: 1 passed, 1 total
Tests:       5 passed, 5 total
GREEN2-rc=0
```

### RED, the hole in the escape hatch

```
$ date -u                                    Mon Sep 14 23:07:45 UTC 2026
$ git rev-parse HEAD                         87eb1b6e39ce4251714604ef005aed718158c66a
$ git status --porcelain                      M packages/sindarian-logs/src/aggregator/logger-aggregator.test.ts
$ npx jest src/aggregator/logger-aggregator.test.ts
  ● LoggerAggregator › addEvent › should keep an error event that arrives at the cap
    Expected: "the one that matters"
    Received: "event-999"
  ● LoggerAggregator › ignorePaths › should still write when an error is recorded past the event cap
    Expected length: 1
    Received length: 0
    Received array:  []
  ● LoggerAggregator › ignorePaths › should still write when a throw lands past the event cap
    Expected length: 1
    Received length: 0
    Received array:  []
Test Suites: 1 failed, 1 total
Tests:       3 failed, 42 passed, 45 total
RED3-rc=1
```

`Received array: []` on both ignored-path cases is the defect stated plainly:
the request failed and nothing at all was written.

### GREEN, the hole closed

```
$ date -u                                    Mon Sep 14 23:08:00 UTC 2026
$ git rev-parse HEAD                         87eb1b6e39ce4251714604ef005aed718158c66a
$ git status --porcelain                      M packages/sindarian-logs/src/aggregator/logger-aggregator.test.ts
                                              M packages/sindarian-logs/src/aggregator/logger-aggregator.ts
$ npx jest
Test Suites: 8 passed, 8 total
Tests:       99 passed, 99 total
GREEN3-rc=0
```

### Gates, at the first code-final head

```
$ date -u                 Mon Sep 14 22:59:31 UTC 2026
$ git rev-parse HEAD      39369a9165eeca06d6fcf5616f9e9e791f4586b7
$ git status --porcelain  (empty)

$ npx turbo lint --filter=@lerianstudio/sindarian-logs
   Tasks:    1 successful, 1 total                          LINT-rc=0

$ npm run test -- --filter=@lerianstudio/sindarian-logs
   @lerianstudio/sindarian-logs:test: Test Suites: 8 passed, 8 total
   @lerianstudio/sindarian-logs:test: Tests:       96 passed, 96 total
   Tasks:    3 successful, 3 total                          TEST-rc=0

$ npm run build -- --filter=@lerianstudio/sindarian-logs
   Tasks:    2 successful, 2 total                          BUILD-rc=0

$ grep -n "LoggerAggregatorOptions" packages/sindarian-logs/dist/aggregator/logger-aggregator.d.ts
3:export type LoggerAggregatorOptions = {
23:    constructor(loggerRepository: LoggerRepository, options?: LoggerAggregatorOptions);
```

The test task builds sindarian-server first (`test` dependsOn `^build`), so
those 96 tests ran against the sibling server in this repo, not a published copy.

### Gates, re-run at the true final head after the review fix

```
$ date -u                 Mon Sep 14 23:09:20 UTC 2026
$ git rev-parse HEAD      64fa3dbe30f843612fc2bc36f7a44008ae61bdb8
$ git status --porcelain   M docs/plans/2026-09-14-sindarian-logs-ignore-paths.md   (this file, nothing else)

$ npx turbo lint  --filter=@lerianstudio/sindarian-logs    Tasks: 1 successful   LINT-rc=0
$ npm run test -- --filter=@lerianstudio/sindarian-logs    Tasks: 3 successful   TEST-rc=0
     @lerianstudio/sindarian-logs:test: Test Suites: 8 passed, 8 total
     @lerianstudio/sindarian-logs:test: Tests:       99 passed, 99 total
$ npm run build -- --filter=@lerianstudio/sindarian-logs   Tasks: 2 successful   BUILD-rc=0
```

### The two live proofs this document used to carry are withdrawn

Both ran a script that wired a real `TraceMiddleware` and a real
`PinoLoggerRepository` and then supplied its OWN `next()` that throws. In the
shipped pipeline `next` is `() => this._handleRequest(...)`, which never
throws, because `_handleRequest` catches everything and returns a `Response`.
So the survivor line they showed, `ERROR /api/csp-report ["sink is down"]`,
was produced by a callback shape the product cannot produce, and the conclusion
drawn from it, that a silenced route still reports its failures, was the
opposite of what the same request does through `app.handler`. They are replaced
below rather than kept, because evidence that cannot fail is worse than none.

## Verification, fix pass 1: the HTTP pipeline

### RED, the guard over a real server

A new test builds `ServerFactory.create(AppModule)` with `LoggerModule`
imported and `LOG_IGNORE_PATHS=/api/admin/health/*`, mounts a controller that
throws and one that answers 503 after `logger.warn`, and calls `app.handler`.

```
$ date -u                     Tue Sep 15 00:01:41 UTC 2026
$ git rev-parse HEAD          6b389ca6c0956e14b46d5b17061ddc4db8b6ab85
$ git status --porcelain      ?? packages/sindarian-logs/src/logger-pipeline.test.ts
$ npx jest src/logger-pipeline.test.ts
  ● a silenced route over the real server pipeline › should write the entry when a silenced route answers 503
    Expected length: 1
    Received length: 0
    Received array:  []
  ● a silenced route over the real server pipeline › should write the entry when a controller on a silenced route throws
    Expected length: 1
    Received length: 0
    Received array:  []
Test Suites: 1 failed, 1 total
Tests:       2 failed, 1 passed, 3 total
RED-rc=1
```

`Received array: []` twice is the defect stated plainly: the request answered
503 and 500 respectively, and nothing at all was written. The one case that
passes is the 200, which is correctly silent.

Three cases here, four in the file today: the 4xx case was added afterwards,
once mutant C showed that "a 4xx stays silent" had nothing behind it. It is a
pin on a decision, not a second defect. Re-running today's four-case file
against the parent guard shows the same two failures and no others:

```
$ git show 6b389ca:packages/sindarian-logs/src/aggregator/logger-aggregator.ts > <same path>
$ grep -n "escalatedLevel !== 'error'" packages/sindarian-logs/src/aggregator/logger-aggregator.ts
199:    if (escalatedLevel !== 'error' && this.isIgnored(context.path)) return
$ npx jest src/logger-pipeline.test.ts
  ● a silenced route over the real server pipeline › should write the entry when a silenced route answers 503
  ● a silenced route over the real server pipeline › should write the entry when a controller on a silenced route throws
Tests:       2 failed, 2 passed, 4 total
rc=1
```

### GREEN, the guard reading the status

Re-measured on the commit that carries the fix, with a clean tree, after the
two commits were rebuilt to fold in a prettier wrap (see the note below).

```
$ date -u                     Tue Sep 15 00:14:15 UTC 2026
$ git rev-parse HEAD          bacc1aaab8a6cf30ff77944e16bf709f6cb2c016
$ git status --porcelain      (empty)
$ npx jest
Test Suites: 9 passed, 9 total
Tests:       103 passed, 103 total
GREEN-rc=0
```

The package goes from 8 suites and 99 tests to 9 and 103.

The first GREEN ran at 00:04:05 UTC on a commit that no longer exists: the
guard line was over 80 columns, `eslint` failed the lint gate on it, and rather
than leave a lint-red commit in a history that merges commit by commit, both
commits were rebuilt from the same tree with the wrap folded into the first.
The sha above is the reachable one, re-run rather than re-labelled.

The docs commit was then amended a second time, at 00:19:19 UTC, to correct the
feature bullet at `README.md:13` that the prior review had asked for. That
amend discarded `036ce0f` and made `774eff4` the reachable docs commit. The two
trees differ by that one README line and by nothing under `packages/*/src`, so
the gates below hold as measured, but `036ce0f` is contained by no branch and
must not be cited as an anchor: `774eff4` is the code-final head.

### Mutants, all measured at the code-final head `774eff4`

Each was applied with the Edit tool, run, then reverted with
`git checkout --`, and the tree was confirmed clean after every one.

| # | Mutation | Expected to break | Result |
|---|----------|-------------------|--------|
| A | `(context.statusCode ?? 0) >= 500` becomes `> 500` | the throwing route, whose status is exactly 500 | 1 failed, 102 passed. Killed |
| B | the status limb removed, back to `escalatedLevel === 'error'` alone | both the 503 and the 500 | 2 failed, 101 passed. Killed |
| C | `>= 500` widened to `>= 400` | the 401, which must stay silent | 1 failed, 102 passed. Killed |

Mutant C exists because "a 4xx stays silent" is a decision, and a decision with
no test behind it is prose. It was added after mutant A and B had already
passed, precisely because a first run of C would have survived.

### Gates, at the code-final head

```
$ date -u                  Tue Sep 15 00:19:27 UTC 2026
$ git rev-parse HEAD       774eff4c582d0067046b977bc90283f3d42bb76d
$ git status --porcelain   (empty)

$ npm test -w packages/sindarian-logs
   Test Suites: 9 passed, 9 total
   Tests:       103 passed, 103 total                        GATE1-rc=0

$ npm test                 Tasks: 6 successful, 6 total      GATE2-rc=0
$ npm run lint             Tasks: 5 successful, 5 total      GATE3-rc=0
$ npm run build            Tasks: 5 successful, 5 total      GATE4-rc=0

$ grep -n "LoggerAggregatorOptions\|ignorePaths" \
    packages/sindarian-logs/dist/aggregator/logger-aggregator.d.ts
3:export type LoggerAggregatorOptions = {
19:    ignorePaths?: string[];
25:    constructor(loggerRepository: LoggerRepository, options?: LoggerAggregatorOptions);
54:     * Matches a request path against the configured `ignorePaths`.
```

`npm run lint` is `eslint --fix` under turbo; `git status --porcelain` was empty
after it, so it changed nothing.

### Gates re-run after the prose fix pass, at `bc2eaf6`

The prose pass changed three files and no behaviour: the README, the
`ignorePaths` TSDoc, and this plan. Lint and the package suite were re-run at
its head, so the two counts below are measured at `bc2eaf6` rather than
re-labelled from the row above. The rest of the evidence in this document was
measured at `774eff4` and is not restated here.

```
$ date -u                  Tue Sep 15 12:31:11 UTC 2026
$ git rev-parse HEAD       bc2eaf622f25433fcf57cab280ea50e5990c5273
$ git status --porcelain   (empty)

$ npm run lint             Tasks: 5 successful, 5 total      GATE5-rc=0

$ npm test -w packages/sindarian-logs
   Test Suites: 9 passed, 9 total
   Tests:       103 passed, 103 total                        GATE6-rc=0
```

### Live proof, through `app.handler` this time

A script requiring the BUILT `@lerianstudio/sindarian-logs` and
`@lerianstudio/sindarian-server`, building a real `ServerFactory` app with
`LoggerModule` imported, keeping `LoggerModule`'s own `PinoLoggerRepository`,
and calling `app.handler` six times. Nothing supplies its own `next()`. Progress
goes to stderr, so stdout is only what pino wrote to fd 1; the table below is
that stdout, parsed.

Six requests: a 200 probe, the 503 readyz, a throwing route, a 401, a route
that records 1000 events and then throws, and one unsilenced route.

```
$ export NODE_PATH=/srv/worktrees/sdk-logs-ignore/node_modules
$ git rev-parse HEAD      774eff4c582d0067046b977bc90283f3d42bb76d

--- RUN A, LOG_IGNORE_PATHS unset ---                                  A-rc=0
INFO  /api/admin/health/alive    status=200 events=0    []
WARN  /api/admin/health/readyz   status=503 events=1    ["MongoDB is disconnected"]
INFO  /api/admin/health/boom     status=500 events=0    []
INFO  /api/admin/health/rejected status=401 events=0    []
INFO  /api/admin/health/flood    status=500 events=1000 ["probe-999"]
INFO  /api/ledgers               status=200 events=0    []
access lines: 6

--- RUN B, LOG_IGNORE_PATHS=/api/csp-report,/api/admin/health/* ---     B-rc=0
WARN  /api/admin/health/readyz   status=503 events=1    ["MongoDB is disconnected"]
INFO  /api/admin/health/boom     status=500 events=0    []
INFO  /api/admin/health/flood    status=500 events=1000 ["probe-999"]
INFO  /api/ledgers               status=200 events=0    []
access lines: 4
```

The two routine hits on the silenced route are gone, the 200 and the 401. All
three failures are kept. Note `events=0` on the throwing route: the framework
converted the throw to a 500 before the aggregator could record anything, so the
status is the entire signal, which is the ceiling written up above.

The raw line for the readiness probe, verbatim from stdout:

```
{"level":"WARN","time":"2026-09-15T00:20:51.991Z","env":"production","msg":"{\"level\":\"warn\",\"method\":\"GET\",\"path\":\"/api/admin/health/readyz\",\"duration\":0.001,\"events\":[{\"timestamp\":\"2026-09-15T00:20:51.990Z\",\"message\":\"MongoDB is disconnected\",\"operation\":\"HealthController\",\"level\":\"WARN\"}],\"statusCode\":503,\"traceId\":\"13b927c8-a590-483e-8207-4570e5e3bce4\"}"}
```

### The same run on the parent commit, which is the defect

Only `logger-aggregator.ts` was reverted to `6b389ca`, the package rebuilt, and
the identical six requests pushed with the identical `LOG_IGNORE_PATHS`. Then
the file was restored and the package rebuilt again; the tree was clean at
`774eff4` before and after.

```
$ git show 6b389ca:packages/sindarian-logs/src/aggregator/logger-aggregator.ts > <same path>
$ grep -n "escalatedLevel !== 'error'" packages/sindarian-logs/src/aggregator/logger-aggregator.ts
199:    if (escalatedLevel !== 'error' && this.isIgnored(context.path)) return
$ npm run build -w packages/sindarian-logs

--- RUN B-BEFORE, LOG_IGNORE_PATHS=/api/csp-report,/api/admin/health/* ---  rc=0
REQUEST /api/admin/health/alive    -> HTTP 200
REQUEST /api/admin/health/readyz   -> HTTP 503
REQUEST /api/admin/health/boom     -> HTTP 500
REQUEST /api/admin/health/rejected -> HTTP 401
REQUEST /api/admin/health/flood    -> HTTP 500
REQUEST /api/ledgers               -> HTTP 200

INFO  /api/ledgers               status=200 events=0    []
access lines: 1
```

One line, for the route nobody silenced. A 503 readiness probe, a 500 throw and
a capped 500 all returned a failure to their caller and wrote nothing, on the
shipped artifact, with the value this README recommends. That is the whole
finding, measured, and the run above it is the same measurement after the fix.

## Follow-ups, found and not fixed here

1. **Product Console sets the variable.** Once this publishes on the `develop`
   channel and the console crosses onto it, set
   `LOG_IGNORE_PATHS=/api/csp-report,/api/admin/health/*` there. The console
   currently declares `@lerianstudio/sindarian-logs` at a version older than the
   2.x line (see `docs/plans/2026-09-14-sindarian-logs-peer-range-2x.md`), so the
   crossing comes first.
2. **A consumer cannot pass options to `LoggerModule` at all.** The environment
   variable exists because the module has no `forRoot`-style configuration seam,
   and every future option will face the same wall. Adding one is a change to
   sindarian-server's module system, not to this package.
3. **The parent worktree had to build sindarian-server by hand** before a bare
   `npx jest` resolved `@lerianstudio/sindarian-server` at all. Going through
   turbo hides this; a fresh clone running `npx jest` inside the package sees
   two suites fail to run. Worth a line in the package README or a pretest
   script.
4. **A non-error request that answers 5xx is still recorded as `info`.** Nothing
   in this package turns a failing status into a failing level, silenced route
   or not, so a throwing controller writes `level: info, statusCode: 500`
   everywhere, not only on an ignored path. That predates this feature and this
   lane deliberately did not change it, because the level of every 5xx entry for
   every consumer is a wider blast radius than an opt-out flag should carry. If
   it is wanted, it belongs in `escalateLevel` with its own decision and its own
   release note.
5. **`addEvent` still drops a non-error event at the cap.** A thousand info
   events followed by a `warn` writes `level: info`. Only the error case takes
   the oldest slot. Same shape of fix, not needed by anything today.
6. **Nothing tests `withTrace` or a root `@Traceable` against `ignorePaths`.**
   Both pass an operation name where the middleware passes a URL path, so a
   pattern shaped like an operation name would match one. Known ceiling 3, still
   unguarded, still not reachable from any documented pattern.

## Answering the review of this PR, finding by finding

| Finding | Where it landed |
|---------|-----------------|
| The ignore guard consults only the escalated level, so a 5xx on a silenced route writes nothing | Fixed in `bacc1aa`. Epic 1c, RED/GREEN above, mutants A and B, and the before/after live runs |
| Same root cause on the README's own readyz example | Fixed. The README now states the status rule and says the 503 is written; the live proof exercises that exact endpoint |
| The plan's Live proof sections cannot detect the defect | Withdrawn, with the reason written where they stood. Replaced by a proof through `app.handler` |
| README: "an error thrown out of the handler ... writes the full entry" is false for the thrown half | Rewritten. The README now says a throw becomes a 5xx and is kept by the status, not by the throw |
| The tests that pin the "a thrown error still writes" half never go through `app.handler` | `src/logger-pipeline.test.ts` added; the three direct tests renamed to say "callback throw" and carry a comment pointing at the pipeline test |
| README states the safety rule as unconditional under the one wiring it documents | Rewritten as a two-limb rule with the 4xx exclusion and the level-versus-status ceiling spelled out. The feature bullet at the top said silencing "still writes its errors", which reads as error-level events only and would send a reader to the wrong conclusion about the 503 probe; it now names both limbs |
| `context.events.shift()` can evict an earlier error | Not changed; the trade-off is now written in the comment at `addEvent` and as known ceiling 6 |
| "Those are Product Console's two uses" is present tense about something not true yet | Reworded to what the console intends to set, naming that it still pins a 1.x and that the sink is unmerged |
| PR body says five requests over a six-row block | PR body rewritten against the runs above, which are six requests and are labelled six |
| One added line carries U+2014 | That bullet is back to its pre-branch text and the new clause is its own bullet, so a sweep of the diff for U+2014 now returns 0 |
| The cap repair is narrower than "any request past the cap" | Corrected in Epic 1b and recorded as follow-up 5 |
