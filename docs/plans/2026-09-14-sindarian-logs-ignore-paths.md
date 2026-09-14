# sindarian-logs lets a route opt out of the access line - Mini Plan

**Goal:** give an operator a way to stop a high-volume route from writing one
aggregated access line per hit, without losing the line when that route fails.
Opt-in, empty by default, so no existing consumer changes behaviour.

**Scope:** `packages/sindarian-logs` only. One new option on `LoggerAggregator`
plus its exported type, one guard in `finalizeContext`, one environment variable
read in `LoggerModule`'s existing provider factory, two test files, and the
package README. No change to `TraceMiddleware`, to the log shape, or to any
other package.

Status: Done. Code final at `64fa3db`.

## Phase overview

| Phase | What lands | Commit |
|-------|------------|--------|
| 1 | `ignorePaths` on the aggregator, the matching rules, the error escape hatch | `67f37f8` |
| 2 | `LOG_IGNORE_PATHS`, so a `LoggerModule` consumer reaches the option | `3c1e2eb` |
| 3 | README: both ways to set it, what each pattern form matches, the safety rule | `39369a9` |
| 4 | The escape hatch survives the 1000-event cap, found in review | `64fa3db` |

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

That also repairs a pre-existing information loss that has nothing to do with
`ignorePaths`: before this, any request past the cap wrote an entry whose level
contradicted what actually happened.

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

### Live proof, against the built package

Not a unit test and not a mock: a script requiring the built
`@lerianstudio/sindarian-logs`, resolving the aggregator through
`LoggerModule`'s own provider factory, wiring a real `TraceMiddleware` and a
real `PinoLoggerRepository`, and pushing five real `NextRequest`s through it.
The last one throws inside a silenced path. Output is what pino actually wrote
to stdout.

```
$ export NODE_PATH=/srv/worktrees/sdk-logs-ignore/node_modules

# RUN A: LOG_IGNORE_PATHS unset                                A-rc=0
INFO  /api/csp-report
INFO  /api/admin/health/alive
INFO  /api/admin/health/readyz
INFO  /api/ledgers
ERROR /api/csp-report
access lines: 5

# RUN B: LOG_IGNORE_PATHS=/api/csp-report,/api/admin/health/*  B-rc=0
INFO  /api/ledgers        []
ERROR /api/csp-report     ["sink is down"]
access lines: 2
```

Three routine hits on the two silenced routes are gone; the failure on a
silenced route is not, and it still carries its events. The raw line, verbatim:

```
{"level":"ERROR","time":"2026-09-14T23:00:30.009Z","env":"production","msg":"{\"level\":\"error\",\"method\":\"GET\",\"path\":\"/api/csp-report\",\"duration\":0,\"events\":[{\"timestamp\":\"2026-09-14T23:00:30.009Z\",\"message\":\"sink is down\",\"operation\":\"request_error\",\"level\":\"ERROR\",\"error\":\"sink is down\"}],\"traceId\":\"37c25b69-efba-4679-9c38-18b68c87fd49\"}"}
```

### Live proof again, on the build that carries the review fix

Same script at `64fa3db`, with a sixth request added: one that records a
thousand events on a silenced route and then throws, which is the case the
review found. `events=` is the length of the entry's event array and the value
printed after it is its last event.

```
--- RUN A, LOG_IGNORE_PATHS unset ---                           A-rc=0
INFO  /api/csp-report          events=0    []
INFO  /api/admin/health/alive  events=0    []
INFO  /api/admin/health/readyz events=0    []
INFO  /api/ledgers             events=0    []
ERROR /api/csp-report          events=1    ["sink is down"]
ERROR /api/csp-report          events=1000 ["sink is down"]
access lines: 6

--- RUN B, LOG_IGNORE_PATHS=/api/csp-report,/api/admin/health/* ---   B-rc=0
INFO  /api/ledgers             events=0    []
ERROR /api/csp-report          events=1    ["sink is down"]
ERROR /api/csp-report          events=1000 ["sink is down"]
access lines: 3
```

The capped request on a silenced route writes an entry at `error` whose last
event is the failure, on the shipped artifact. Before the fix that line did not
exist at all.

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
