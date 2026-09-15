# The typed exception branch is fail-safe too, and every failure log is one line

- Repository: `LerianStudio/console-sdk`, package `@lerianstudio/sindarian-server`
- Branch: `fix/typed-exception-fail-safe`, cut from `origin/develop` at `7dd44f6`
- Code-final head: `dd76fc2`
- Status: complete, gates green, ten mutants killed at the code-final head
- Follows: `docs/plans/2026-09-14-server-error-message-string.md` (PR #190, merged).
  Every item here is a finding against that pass, made by the review that ran after
  it merged.

## Phase Overview

PR #190 closed two holes in what a failed request tells a caller: an unexpected error
stopped putting its own text on the wire, and its record stopped breaking across
physical lines in the operator log. The review of that pass found the same two rules
broken one frame over, in three places it had not reached.

| # | What was still open | Where |
|---|---|---|
| 1 | The typed branch read the thrown value twice and read it unguarded | `base-exception-filter.ts` |
| 2 | A message written after construction was unbounded | the same branch |
| 3 | `ApiException.getResponse()`, the OTHER reader of that message, had no guard at all | `api-exception.ts` |
| 4 | The transport's two operator logs still handed `console.error` an object | `http-service.ts` |
| 5 | Three statements about the pass were wrong or missing | plan, `TECHNICAL.md`, an e2e comment |

## Epic 1: one guarded read, wherever a message is answered

### Task 1.1: read the message once, inside a guard, bounded

`readWireMessage(source, fallback)` in `utils/error/to-problem-message.ts` is the whole
fix, and it is the only new function. It reads `message` ONCE into a local, returns it
cut at `MESSAGE_MAX_LENGTH` when it is a string, returns the fallback otherwise, and
cannot throw.

Three defects close with it:

- **Check-then-use.** `typeof exception.message === 'string' ? exception.message : ...`
  reads the property twice, and `message` is a property the throw site owns. A getter
  answering a sentence first and an object second passed the check and handed over the
  object. Measured through the real filter before the fix: a 404 answering
  `{"message":{"title":"Gateway Timeout","payer":"cpf 123.456.789-00"}}`.
- **No bound.** The constructor caps every message it is handed at 2000 characters; a
  property written afterwards never passed through it. `e.message = upstreamText` with
  a 5 MB body answered a 5,000,014-byte response.
- **No guard.** A `message` getter that throws took the response down entirely. This
  filter runs inside `ServerFactory._handleRequest`'s own catch block (`:206-216`),
  which does not wrap the filter call, so a throw escapes the pipeline and the route
  answers a ZERO-BYTE body with no content-type. That is `SyntaxError: Unexpected end
  of JSON input` for a caller promised an envelope, which is the failure `throw null`
  produced until #190 closed it on the OTHER branch.

### Task 1.2: the status read is guarded too, and names itself when it can

`getStatus()` is inherited from `HttpException`, but a subclass may override it with
anything, and an override that throws reached the same zero-byte body. The typed branch
now reads it inside a `try`, keeps the real status in the answer whenever the read
succeeded, and answers 500 when even that was unreadable. The sentence stays the
constructor's own, `noProblemDetails(status)`, because a 404 that says `Internal server
error` is the defect `names the real status when the message is empty` exists to
prevent.

### Task 1.3: `getResponse()` reads through the same function

`ApiException.getResponse()` is what an application serialising the exception itself
reads, which Product Console does. It returned `message: this.message` untouched, so
every defect above was still shipped on that path: the object, the missing field, the
megabyte. One guard where the message is READ covers both callers, which is a smaller
diff than a second branch beside the first.

## Epic 2: one failure is one line, in all three writers

### Task 2.1: `logErrorLine`

`utils/error/log-error-line.ts` is the one writer: a label, then the record serialised
as JSON beside it, every string at any depth cut at `MESSAGE_MAX_LENGTH`.

#190 fixed this in the exception filter only, and the two writes that actually carry
upstream data are in the transport: `onRequestFailure` wrote `console.error('Request
failed', { method, url, cause })` and the default `catch` wrote `console.error('Request
error', describeRequestError(...))`. Node renders a second argument with its own
`util.inspect` defaults, `breakLength: 128` and `compact: 3`. A real ledger URL beside a
connection string is already past that, so the first record broke across FIVE physical
lines and the second across EIGHT, measured in the RED below. A line-oriented collector,
the Docker json-file driver or Fluent Bit, ships each as a separate event, so the
internal host and the taxpayer id an upstream failure carries land in a different event
from the label an operator greps for.

The bound moved into the writer with the same move: it used to be three `.slice` calls
at the filter's own fields and nothing at all on the transport's, where `cause` is an
upstream's own text.

## Epic 3: what the documents say

- `TECHNICAL.md` described the record as a bare `{ name, message, value }` object. It
  now says it is one JSON line beside a label, that the transport's two failure logs
  are written the same way, and what a typed exception answers for a message written
  after construction.
- **The PII caveat, in the one place a consumer reads.** The record is unredacted: it
  carries the whole thrown value within the bound, so a route that rethrows an upstream
  body puts that body, taxpayer ids and internal hosts included, into the operator log.
  That is deliberate, it is the last remaining copy of what broke, and redaction is the
  log pipeline's job. #190's BREAKING CHANGE footer said only that the text moved to
  the log, and release notes cannot be edited afterwards, so the caveat is in
  `TECHNICAL.md` and in this lane's PR description.
- The e2e comment claiming thirteen physical lines for a record object named a number
  no frame produces. Measured here by formatting the same three fields the old way:
  seventeen under the jest e2e runner, against the fifteen the filter's comment cites
  for the ts-node harness. The count follows the stack's depth, so the comment now
  names its frame.
- `2026-09-14-server-error-message-string.md`: rows M13 to M16 carried counts from
  heads the prose did not name, and two sentences in the preamble could not both be
  true. Each row now names the head and the case basis it was taken at, the false
  sentences are corrected, and all four are re-taken at this lane's code-final head.

## Found by this lane, not fixed

1. **A throwing `message` getter on the typed branch writes no log line.** The
   unexpected branch writes one before answering; the typed branch answers the fallback
   sentence silently. Nothing is lost that an operator needs, the exception is one a
   route constructed, but the fact that a getter threw is not written down anywhere.
2. **`onRequestFailure` can still be silenced by the value it is logging.** `error
   instanceof Error ? error.message : String(error)` can throw, through the same getter
   or a `toString` that throws, and `request`'s own catch swallows it, so the call
   leaves no record. Pre-existing and contained: the bounded exception still reaches the
   caller.
3. **The bound is characters, the documented cost is bytes.** JSON escaping expands a
   control character to six bytes, so a record of 2000-character fields can reach tens
   of kilobytes. Still bounded, which is what the bound is for, but the published
   figures in #190's plan are character-derived.
4. **A plain `HttpException` is still answered 500** whatever status it carries, pinned
   by `answers 500 for a plain HttpException, and redacts it too`. Carried over from
   #190 unchanged.

## Verification

Every command below was run verbatim in `/srv/worktrees/sdk-typed-failsafe`, with the
header printed by the same call.

### RED before GREEN: a typed exception's message

`2026-09-15 18:57:36 UTC`, `HEAD 7dd44f6`, `git status --porcelain` =

```
 M packages/sindarian-server/src/exceptions/api-exception.test.ts
 M packages/sindarian-server/src/exceptions/base-exception-filter.test.ts
 M packages/sindarian-server/test/app/controllers/throwing-controller.ts
 M packages/sindarian-server/test/e2e/error-shape.spec.ts
```

```
$ cd packages/sindarian-server && npx jest src/exceptions
rc=1
Tests:       10 failed, 113 passed, 123 total
  ● a typed exception whose message cannot be trusted › answers a string for a message that changes between reads
  ● a typed exception whose message cannot be trusted › answers a body when the message getter throws
  ● a typed exception whose message cannot be trusted › answers a body at 500 when getStatus throws
  ● a typed exception whose message cannot be trusted › bounds a message written after construction
  ● ApiException › a message written after construction › names the real status for an upstream problem object
  ● ApiException › a message written after construction › names the real status for a number
  ● ApiException › a message written after construction › names the real status for undefined
  ● ApiException › a message written after construction › names the real status for null
  ● ApiException › a message written after construction › bounds a message written after construction
  ● ApiException › a message written after construction › answers a sentence when the message getter throws

$ cd packages/sindarian-server && npm run test:e2e
rc=1
Tests:       3 failed, 29 passed, 32 total
  ● A typed exception carries a bounded sentence › names the real status instead of an upstream object
  ● A typed exception carries a bounded sentence › bounds a five-megabyte message at two thousand characters
  ● A typed exception carries a bounded sentence › answers a body at all when reading the message throws
```

The third e2e failure is the defect itself rather than an assertion: the raw `trap`
error escapes the handler, which is the zero-byte body.

```
  ● answers a body at all when reading the message throws

    trap

      146 |     Object.defineProperty(exception, 'message', {
      147 |       get() {
    > 148 |         throw new Error('trap')
```

GREEN after the source change, `2026-09-15 18:59:47 UTC`, same `HEAD 7dd44f6`:

```
$ cd packages/sindarian-server && npx jest
rc=0
Tests:       883 passed, 883 total

$ cd packages/sindarian-server && npm run test:e2e
rc=0
Tests:       32 passed, 32 total
```

### RED before GREEN: one line per failed call

`2026-09-15 19:01:37 UTC`, `HEAD a58ff52`, `git status --porcelain` =

```
 M packages/sindarian-server/src/services/http-service.test.ts
```

```
$ cd packages/sindarian-server && npx jest src/services/http-service.test.ts
rc=1
Tests:       6 failed, 58 passed, 64 total
  ● one failed call is one physical log line › writes an unreachable upstream on one line
  ● one failed call is one physical log line › writes a failed response on one line
  ● one failed call is one physical log line › bounds what an upstream failure writes
  ● what an unreachable upstream writes down › logs the method, the path and what actually broke
  ● what an unreachable upstream writes down › records a success body that was never JSON
  ● what an unreachable upstream writes down › records a catch override that threw something unexpected
```

The first of those prints the defect, five physical lines with the taxpayer id on one of
its own:

```
    Expected substring: not "
    "
    Received string:        "Request failed {
      method: 'GET',
      url: 'https://api.example.com/v1/organizations/o-1/ledgers',
      cause: 'fetch failed: connect ECONNREFUSED db-primary.internal:8080 for cpf 123.456.789-00'
    }"
```

GREEN, `2026-09-15 19:04:11 UTC`, same `HEAD a58ff52`: four further cases went red on the
way, the suite's own assertions that read the record as an object; they parse it now.

```
$ cd packages/sindarian-server && npx jest
rc=0
Tests:       886 passed, 886 total

$ cd packages/sindarian-server && npm run test:e2e
rc=0
Tests:       32 passed, 32 total
```

### RED before GREEN: a message read twice

Found by mutant N3 at `0344d50`, which SURVIVED: a version reading the message twice
passed every case, because the guard's own catch turns the second read into the fallback
and the case asserted only that the answer was a string. The cases now assert the exact
sentence, and a second case makes every read a string, which no type error can catch.

`2026-09-15 19:11:17 UTC`, `HEAD 0344d50`, `git status --porcelain` =

```
 M packages/sindarian-server/src/exceptions/base-exception-filter.test.ts
```

```
$ python3 /tmp/rv-sdktyped-impl-mutate.py N3   # the double read restored
$ cd packages/sindarian-server && npx jest src/exceptions/base-exception-filter.test.ts
rc=1
Tests:       2 failed, 40 passed, 42 total
  ● answers the message it checked, not a later read
  ● answers the message it checked when every read is a string
```

GREEN with the mutation reverted, `2026-09-15 19:11:26 UTC`:

```
$ cd packages/sindarian-server && npx jest
rc=0
Tests:       887 passed, 887 total
```

### Gates at the code-final head

`2026-09-15 19:16:06 UTC`, `HEAD dd76fc2`, `git status --porcelain` empty (0 lines).

```
$ cd packages/sindarian-server && npx jest
rc=0
Test Suites: 38 passed, 38 total
Tests:       887 passed, 887 total

$ cd packages/sindarian-server && npm run test:e2e
rc=0
Test Suites: 2 passed, 2 total
Tests:       32 passed, 32 total

$ cd packages/sindarian-server && npm run lint
rc=0
> eslint .

$ cd packages/sindarian-server && npm run build
rc=0
> tsc && npm run build:paths
```

At the monorepo root, `2026-09-15 19:16:31 UTC`, same head:

```
$ npm test
rc=0
Cached:    3 cached, 6 total

$ npm run test:e2e
rc=0
Cached:    3 cached, 5 total

$ npm run lint
rc=0
Cached:    4 cached, 5 total

$ npm run build
rc=0
Cached:    4 cached, 5 total

$ npm run test:e2e -- --filter=@lerianstudio/sindarian-server   # the CI job's arm
rc=0
@lerianstudio/sindarian-server:test:e2e: Tests:       32 passed, 32 total
 Tasks:    1 successful, 1 total
```

### Mutants

Ten, all at the code-final head `dd76fc2`, `2026-09-15 19:12:15 UTC` onward, each
applied with an exact single-occurrence replacement, `dist` rebuilt by the e2e run,
reverted with `git checkout -- packages`, and `clean-after-<id>=0` printed after every
revert. Unit counts are out of 887 and e2e out of 32 throughout.

M13 to M16 are #190's four rows, re-taken here; N1 to N7 are this lane's.

| # | Mutation | Result |
|---|---|---|
| M13 | `compact: true` dropped from the render | unit rc=1, **1 failed**: `writes a three-level upstream body on one line`; e2e rc=0 |
| M14 | the pre-PR `ApiException` answer restored, as the row writes it (`{ message: exception.message \|\| UNCLASSIFIED }`), which removes the guard, the bound and the status-naming fallback together | unit rc=1, **6 failed**: `answers the message it was given, even a mutated empty one`, `bounds a message written after construction`, and the four `names the real status for %s`; e2e rc=0 |
| M15 | the narrowing duck-typed (`instanceof ApiException \|\| typeof exception?.getStatus === 'function'`) | unit rc=1, **1 failed**: `answers 500 for a value that only looks like an ApiException`; e2e rc=1, **1 failed**: `answers 500 for a plain HttpException, and redacts it too` |
| M16 | the record handed to `console.error` as an OBJECT again, now inside `logErrorLine`, so it lands on all THREE writers rather than the filter alone | unit rc=1, **26 failed**; e2e rc=1, **4 failed** |
| N1 | the bound dropped from `readWireMessage` | unit rc=1, **2 failed**, `bounds a message written after construction` in both the filter's suite and the exception's; e2e rc=1, **1 failed**: the five-megabyte route |
| N2 | the guard dropped from `readWireMessage` | unit rc=1, **1 failed**: `answers a sentence when the message getter throws`, the `getResponse()` side; e2e rc=1, **1 failed**: the throwing-getter route. The filter's own case survives this one, because the filter's `try` around `getStatus` catches it as well, which is the point of having both |
| N3 | the message read TWICE (`typeof source.message === 'string' ? source.message.slice(...)`) | unit rc=1, **2 failed**: both `answers the message it checked` cases; e2e rc=0. It SURVIVED at `0344d50` and is what the third RED block above exists for |
| N4 | the guard removed from `getResponse()` only (`message: this.message`) | unit rc=1, **6 failed**, all on the exception's own suite; e2e rc=1, **3 failed**, all three typed routes. This is the pair to N1 and N2: removing the guard from one caller fails tests |
| N5 | the `try` dropped from the typed branch, status read unguarded | unit rc=1, **1 failed**: `answers a body at 500 when getStatus throws`; e2e rc=0 |
| N7 | the bound dropped from `logErrorLine` | unit rc=1, **4 failed**: the three `bounds a ... of a megabyte` cases and `bounds what an upstream failure writes` |

### Live proof

The three e2e cases are the live half: they drive the REAL Next handler through
`app.handler`, with the test app's own exception filter registered, and read a REAL
`Response` body rather than a mocked `NextResponse.json`. That app filter answers an
`ApiException` by spreading `ApiException.getResponse()` into its envelope, which is
exactly how an application that renders its own body reads the message, so these cases
exercise the accessor and not the package's filter. There is no browser in this lane: the
package ships no user interface.
