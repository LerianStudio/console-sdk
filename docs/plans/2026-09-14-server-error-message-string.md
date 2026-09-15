# The server always hands the caller a string message - Mini Plan

**Goal:** a caller of `@lerianstudio/sindarian-server` can read `message` as a string on
every failure path, so a route that classifies a failure with string methods has a live
branch instead of a dead one, and that string is never the failure's own words. The
transport frame was already there; the exception filter that writes the last body before
the wire was not.

**Product decision, Fred, 2026-09-15:** an unexpected error answers a generic message
plus the error code; the real text goes only to the structured log. That is a breaking
change on the 2.x line and it is the reason this is a `feat!`.

**Scope:** `packages/sindarian-server/src/exceptions/base-exception-filter.ts` and
`api-exception.ts`, their unit tests, one new controller plus one new spec in the
package's e2e app, and one job added to `.github/workflows/ci.yml` so those e2e cases gate
a pull request instead of only a release. No change to `HttpService`, to
`toProblemMessage`, or to any other package.

Status: Done.

## What the lane was opened for, and what was actually left

The lane was opened on a Console measurement: an upstream failure arrives with `message`
holding the upstream body instead of a sentence, so `error.message.includes(...)` never
matches and the route answers a generic 500.

**A correction to how that was first written up.** The opening note claimed two Reporter
routes were absorbing this defect with a classifier that accepted either a string or an
object. Both halves were wrong. Measured on `product-console` `origin/develop`
(`8b80bee`): the report download route is the ONLY Reporter route that classifies a
failure with string methods
(`src/core/infrastructure/http/controllers/report-controller.ts:94-99`, one route, two
`includes(...)` conditions inside it), and it does not accept an object message. It
narrows with `error instanceof Error` and then calls `.includes(...)`, and an
`ApiException` IS an `Error`, so an object message would make that call throw. What it
classifies is an `Error` thrown locally by the repository, not an upstream failure at
all. The only helper in the Reporter area that takes either type, `toErrorString` in
`reporter-report-mapper.ts:10-23`, normalises `metadata.error` on a SUCCESSFUL report
payload and never sees an exception.

**And a correction to that correction, which over-reached in the other direction.** An
earlier version of this section closed with "so there is no workaround in Console to
retire after this lands". That generalised a Reporter-scoped grep to all of Console, and
there is a counterexample on a money screen. Measured on `product-console`
`origin/develop` at `18ad63f`: the fee calculator replaces any failure message whose text
starts with `{` (`asSentence`, `src/app/(routes)/midaz/fees/calculator/fee-breakdown-display.tsx:186-193`),
and its own comment says why, that the reason the transport refused is frequently the
whole upstream body. It is fed at `calculator-tab-content.tsx:464-467` from
`estimationMutation.error.message`, which is the `ApiError` the browser fetcher builds
directly from the response body's `message` (`src/lib/fetcher/index.ts:394-403`), i.e.
the exact field this filter writes.

That guard still earns its place after the bump, and this PR is the reason it stays narrow:
this package now guarantees a string, and a generic sentence when it could not classify
the failure, but it has never guaranteed that an upstream's own `title` reads as a
sentence. Nobody should delete `asSentence` as dead defensive code. What the Console bump
lane owes, and this lane does not: measure every Console use case that throws a bare
`Error` carrying text meant for an operator, because that text is what this PR stops
putting on the wire.

One thing does get simpler on the Console side, and it needs no change there at all: the
browser fetcher already reads `code` off the body into `ApiError.code`
(`src/lib/fetcher/index.ts:394-403`, `ApiError` at `:6-18`), so the code this filter now
writes arrives on the error object a route handler already has.

**The upstream defect itself was already fixed here, before this lane opened.**
`ApiException` took `message` as a
constructor parameter property until `e51b5f0`, which meant it overwrote `Error.message`
with whatever was handed in. Eight commits on that file and on `http-service.ts`, between
`1c1aed9` and `5d9f6ce`, closed it, and they shipped in `2.0.0-beta.2` (2026-09-12) and
`2.0.0-beta.3` (2026-09-13).

Measured at the branch point `9ded7ed`, against real sockets: one that resets the
connection, one answering a `text/html` 502, one a `text/plain` 502, and three answering
JSON bodies. Every one of the six already produced a string:

| Upstream behaviour | Exception | `typeof message` | `message` |
|---|---|---|---|
| socket reset | ServiceUnavailable (503) | `string` | `The request to the upstream service could not be completed` |
| 502, `text/html` body | ServiceUnavailable (503) | `string` | `Upstream error body carried no problem details (status 502)` |
| 502, `text/plain` body | ServiceUnavailable (503) | `string` | `Upstream error body carried no problem details (status 502)` |
| 422, problem body with `title` | UnprocessableEntity (422) | `string` | `Insufficient funds` |
| 409, body with `code` only | ApiException (409) | `string` | `0031` |
| 400, body classifying nothing | BadRequest (400) | `string` | `Upstream error body carried no problem details (status 400)` |

That table was the one measurement block in this file with no command and no exit code.
Re-run at the code-final head `7034afc` (`2026-09-15 12:44:15 UTC`), six real sockets on
ephemeral loopback ports, harness at `/tmp/rv-sdkerr-sockets/probe.cjs` driving the built
`dist` through a concrete `HttpService`. Output verbatim, the package's own
`console.error` lines elided:

```
$ timeout 300 unshare -rn bash -c 'ip link set lo up && node /tmp/rv-sdkerr-sockets/probe.cjs'
rc=0
| socket reset | ServiceUnavailableApiException (503) | string | The request to the upstream service could not be completed |
| 502, text/html body | ServiceUnavailableApiException (503) | string | Upstream error body carried no problem details (status 502) |
| 502, text/plain body | ServiceUnavailableApiException (503) | string | Upstream error body carried no problem details (status 502) |
| 422, problem body with title | UnprocessableEntityApiException (422) | string | Insufficient funds |
| 409, body with code only | ApiException (409) | string | 0031 |
| 400, body classifying nothing | BadRequestApiException (400) | string | Upstream error body carried no problem details (status 400)  |
every message is a string: true
```

The 422's body also carried `detail: cpf 123.456.789-00 has 12.00 available`, and the
message is `Insufficient funds`: the transport keeps the classification and drops the
request's own values, which is the rule the filter now applies to an unexpected error too.
The same run also shows where an unexpected error's text goes: those elided lines are
`console.error('Request failed', {...})` and `console.error('Request error', {...})`, the
seam the filter now writes to.

**The Console does not have that fix, and this PR does not give it to them.**
`product-console/package.json` declares `"@lerianstudio/sindarian-server": "^1.2.0"`, a
range that can never resolve a 2.x version. Reaching the string message is a major-line
bump on the consumer, not a release of this package.

Two paths in this package were still open, and neither goes through `HttpService`.

### 1. The exception filter, for anything that is not an ApiException

`BaseExceptionFilter` writes the last body before the wire for every thrown value.
`ApiException` reduces its own message one frame down, so that branch was fine. Everything
else was serialised exactly as it arrived.

Measured end to end through `ServerFactory.handler` at the branch point, reading the real
`Response` each route produced. The first three rows are that measurement. The fourth is
not, and cannot be: that case produces no `Response` at all, which is the whole point of
it, so it was measured separately against a real Next server (below).

| A route threw | Status | `typeof body.message` | What the caller got |
|---|---|---|---|
| `{ message: { title, detail } }` | 500 | `object` | the upstream object, `detail` and all |
| `{ code: 'E_NOPE' }` | 500 | `undefined` | `{}`, no message field at all |
| `'something went wrong'` | 500 | `undefined` | `{}`, a string has no `.message` |
| `null` | see below | none | the filter threw on `.message`, so the pipeline never answered |

The first row also leaks: `detail` carried `cpf 123.456.789-00` and an internal hostname
into the browser, which is the leak `toProblemMessage` was written to stop one frame down.

**What the `null` row really did, corrected.** An earlier draft of this plan, of the PR
body and of two source comments said Next answered with a rendered error page of its own.
That was never measured and it is false. A route handler that throws answers `500` with a
ZERO-BYTE body and NO `content-type` header. Measured on Next 16.2.6 under `next start`
in a throwaway app, inside `unshare -rn`:

```
$ timeout 300 unshare -rn bash /tmp/rv-sdkerr-nextprobe/probe.sh   # route: throw new Error(...)
rc=0
HTTP/1.1 500 Internal Server Error
vary: rsc, next-router-state-tree, next-router-prefetch, next-router-segment-prefetch
Date: Tue, 15 Sep 2026 00:00:18 GMT
Connection: keep-alive
Keep-Alive: timeout=5
Transfer-Encoding: chunked

body byte count:
0
status=500 content_type=[] size_download=0
what response.json() would do:
SyntaxError: Unexpected end of JSON input
```

The product conclusion is unchanged and if anything plainer: a caller promised a JSON
envelope cannot parse one. The client symptom to grep production logs for is
`SyntaxError: Unexpected end of JSON input`, not a parse failure on a leading `<`.
Console runs Next 16.3.4, the same major.

### 2. Metadata could put the object back

`ApiException.getResponse()` spread `metadata` over `code`, `title` and `message` rather
than under them, so a caller passing a `message` key in metadata replaced the coerced
sentence one line after the constructor produced it. Console passes metadata here today
(`{ details }` in two bank-transfer paths), and `message` is the next key anyone reaches
for.

## What shipped

`BaseExceptionFilter.catch` reduces whatever it was handed through `toProblemMessage`,
the one place that reduction already lives, and reads the message through `?.` so a
thrown `null` cannot make the filter itself throw. A string survives, bounded at 2000; a
problem object keeps only its classification; anything else becomes `Internal server
error`.

**An unexpected error answers the generic sentence and the code, and nothing else.** An
unexpected error is anything that is not one of this library's typed exceptions: a bare
`Error`, a plain `HttpException`, a thrown string, a thrown `null`. Its own text used to
be the response body verbatim. The body is now
`{"message":"Internal server error","code":"0004"}` at 500, and the text and the stack go
to `console.error` instead. `0004` is not a new code: it is the one
`InternalServerErrorApiException` already carries, so a caller reading codes can tell this
envelope from a sentence an upstream actually wrote.

The redaction rule itself was already in `toProblemMessage` and had never fired from this
frame, because the filter handed it `exception?.message`, a string by then, and a string
is the one thing the rule lets through. The filter now hands over the `Error` whole.
`ApiException` is narrowed off FIRST and keeps its message: it extends `HttpException`
extends `Error`, so redacting by `instanceof Error` alone would take the sentence off
every 401, 404 and 422 this library raises. A unit case pins that, and mutant M2 below
kills the version that does not narrow.

**Why `console.error` and not the package's `Logger`.** `Logger.error` writes through a
static logger an application has to register, and drops everything until it does.
Measured: Product Console passes `{ logger: process.env.ENABLE_DEBUG === 'true' }`
(`src/core/infrastructure/app.ts:4-6` on `origin/develop`), a BOOLEAN, and
`Logger.overrideLogger` stores a logger only when it is an object, so Console registers
none in either branch of its own config. Routing the last remaining copy of an unexpected
error's text through that seam would delete it. `console.error` is what
`HttpService.onRequestFailure` and `HttpService.catch` already use for exactly this, at
error level, with a label and a flat object.

`getResponse()` spreads metadata under the three named fields instead of over them.

The e2e app gained a `ThrowingController` with one route per shape and a spec that reads
the real `Response`. This matters because the filter's unit tests mock
`NextResponse.json`: they can assert the arguments and never the body a caller parses,
which is exactly where the `null` case hid. Two more routes and a second describe block
cover the unexpected errors: the bare `Error`, which carries the same host, port and
taxpayer id the `object` route carries so the two can be read against each other, and a
plain `HttpException`, whose status defect stays open and is pinned rather than changed.

The filter's status line lost a second operand that could never be false:
`exception instanceof ApiException && exception.getStatus` became
`exception instanceof ApiException`. `getStatus` is declared on `HttpException`, which
`ApiException` extends, so after the narrowing it is always there. The guard was carried
over from when `exception` was untyped and it did real work.

**And a pull request now RUNS those e2e cases.** It did not. `jest.config.ts` ignores
`<rootDir>/test`, so the package's `npm test` (38 suites, 853 tests) excludes every case
that reads a real `Response`, and `ci.yml` had only lint, test and build. The e2e suite
ran solely in `release.yml`, AFTER merge, where a red job blocks a publish instead of a
merge and the offending commit has to be reverted off `develop`. `ci.yml` gained a
`test-e2e` job mirroring the release one, over the same changed-paths matrix. The
`test:e2e` scripts already existed at the package and the monorepo root; the job is what
was missing. All five packages define one; the four that define it as `exit 0` stay a
no-op.

**It runs them, it does not block on them, and the earlier wording here said otherwise.**
Measured: `gh api repos/LerianStudio/console-sdk/rules/branches/develop` returns
`deletion,non_fast_forward,pull_request,repository_create,required_signatures` and NO
`required_status_checks` rule, with `required_approving_review_count` 0; classic
`branches/develop/protection` answers 404 Branch not protected. So no check on this repo
is a required context, this one included. What shipped is real and is the point, that the
cases are visible BEFORE merge instead of only in `release.yml` after it, where a red job
blocks a publish and the offending commit has to come back off `develop`. Making it a
block is one line on the develop ruleset, `Test E2E ${{ matrix.name }}` as a required
status check, and that is an org decision rather than a file in this PR.

### Behaviour that deliberately did not change

- **The exception filter's body is byte-identical for an `ApiException`.** Its message is
  already bounded and non-empty by construction, and `toProblemMessage` returns a string
  under 2000 characters unchanged. This is the narrow, true version of the claim; the
  wider one about `getResponse()` is corrected below.
- **The structured upstream body is still dropped, not carried on a typed field.** The
  brief that opened this lane asked for two things: a string `message`, AND the structured
  body travelling on a typed field such as `details`. Only the first shipped, and that is
  a decision, not an omission. Carrying the upstream body on a typed field re-opens the
  exact `detail`/`errors[]` leak this lane cites as its own justification: a taxpayer id
  and an internal hostname reaching the browser under a different key. Anyone diffing the
  brief against this PR should read that item as answered, not as unfinished.

### Corrected here: the serialisation order of `getResponse()` DID change

An earlier draft of the PR body said an upstream failure and any exception this library
raises put the identical bytes on the wire as before. That holds for the exception
filter's `{message}` body, and it is false for `getResponse()` on any exception carrying
metadata. Moving `...this.metadata` from last to first keeps the same keys and the same
values in a different order, and Console serialises `getResponse()` straight to the wire
(`src/app/api/shared/route-handler-utils.ts`, `toExceptionResponse`).

Measured by building `dist` twice, once with `api-exception.ts` held at the branch point
`9ded7ed` and once at this branch's head, then serialising. Output verbatim, rc=0 on both
builds and both node runs:

```
BEFORE ValidationApiException: {"code":"0007","title":"Validation Error","message":"Validation failed","errors":{"amount":["required"]}}
BEFORE {details} exception:    {"code":"0099","title":"Bank Transfer API Error","message":"stranded hold","details":{"pluginCode":"X","requestId":"r-1","transferId":"t-1"}}
BEFORE key order: code,title,message,errors | code,title,message,details

AFTER  ValidationApiException: {"errors":{"amount":["required"]},"code":"0007","title":"Validation Error","message":"Validation failed"}
AFTER  {details} exception:    {"details":{"pluginCode":"X","requestId":"r-1","transferId":"t-1"},"code":"0099","title":"Bank Transfer API Error","message":"stranded hold"}
AFTER  key order: errors,code,title,message | details,code,title,message

same key SET: true
same key ORDER: false
```

`ValidationApiException` is raised by this package's own `ZodValidationPipe`, and the
`{ details }` shape is Console's two bank-transfer exceptions
(`confirm-transfer-use-case.ts:110`, `bank-transfer-settings-repository.ts:210`, the only
two `new ApiException(` sites in that repo). A consumer reading JSON is unaffected. A
consumer byte-comparing the envelope, holding a golden fixture, or truncating a serialised
error in a log sink is: truncation now drops `message` first and keeps the metadata. No
such consumer exists in this monorepo or in Console today, and no test in either repo
pins key order, which is why no order pin is added here: it would freeze an order that
was just deliberately changed, for a consumer nobody has.

## Closed here, after the product decision

**A thrown `Error` put its own text on the wire, verbatim.** It was the one leak this
lane found and deferred, and the first version of this PR pinned it rather than closing
it, on the stated reason that Console classified on that text and nobody had measured
which callers. That reason was itself unmeasured and it was wrong: Console registers a
catch-all `GlobalExceptionFilter` as `APP_FILTER`, the SDK puts its own filter last, and
that app filter has no branch for a plain `Error`, so it answers a fixed
`Error on the Service. Please contact support.` and this package's body never reaches a
Console caller at all. Fred decided the wire behaviour on 2026-09-15 and it is now
closed: generic message, code, text to the log. The pin became its opposite, an assertion
that the host, the port and the taxpayer id are absent from the body and present in the
captured log.

That same measurement says who this protects, and it is not Console first. Console writes
its own catch-all and is already safe by accident; every other consumer of this package,
and Console itself the day it drops that filter, gets a library that does not put a
failure's own words on the wire. A library whose safety depends on each application
remembering to write a catch-all filter is not a safe library.

## Found by this lane, not fixed

1. **`BaseExceptionFilter` ignores `getStatus()` on a non-`ApiException`.** A plain
   `HttpException`, which the package exports and which carries a real status, is answered
   as 500. Out of scope for a message-shape fix; it is a status defect. It is now PINNED
   the way the `Error` leak was: `@Get('http-status')` throws
   `new HttpException('no such ledger', HttpStatus.NOT_FOUND)` and the e2e case asserts
   500, so giving it the real status later is a deliberate red test rather than a silent
   status change for every caller.
2. **`ZodValidationPipe` puts the whole `ZodError` in the response.** This is the SECOND
   open leak, and an earlier version of this plan called the `Error` one "the one leak",
   which was wrong even as it was written.
   `new ValidationApiException('Validation failed', error)` lands in metadata and
   `getResponse()` serialises it, so every rejected value reaches the browser. Arguably
   intended for form feedback, and the same argument `toProblemMessage` makes about
   `errors[]` applies against it. It has no pinning test and no e2e route, so reducing it
   later WOULD be a silent wire change for Console's forms. Needs a product decision, not
   a patch, and a pin the day the decision is taken.
3. **The e2e app's own filter shadows the `ApiException` branch.** `AppExceptionFilter` is
   `@Catch()` and answers every `ApiException` itself, so all 27 e2e cases exercise the
   non-`ApiException` path only. The branch that serves every 401, 404 and 422 is covered
   by unit cases against a mocked `NextResponse.json`, which is the blind spot this suite
   was added to close. It matters more now that the narrowing carries the redaction, so the
   protection was put where it can fire: mutant M2 below deletes the narrowing and four
   unit cases die, one of them written for exactly that. Reaching it from e2e means a
   second app whose filter does not shadow it, which is a bigger harness than this lane
   needs.
4. **The e2e harness breaks if `test/` is installed on its own.** `npm install` there
   fetches a second copy of `next`, and the two `NextRequest` types are incompatible, so
   the suite fails to compile before running a single case. CI never hits it because
   `npm ci` at the root links the workspace and hoists one `next`. Left alone; the fix is
   a note or a workspace entry, and neither belongs in this PR.

## Verification

All eight gates at `7034afc`, the code-final head, `2026-09-15 12:39:18 UTC`, tree clean
(`git status --porcelain` empty before and after).

```
$ cd packages/sindarian-server && npm test
rc=0
Test Suites: 38 passed, 38 total
Tests:       853 passed, 853 total

$ cd packages/sindarian-server && npm run test:e2e
rc=0
Test Suites: 2 passed, 2 total
Tests:       27 passed, 27 total

$ cd packages/sindarian-server && npm run lint
rc=0
> eslint .

$ cd packages/sindarian-server && npm run build
rc=0
> tsc && npm run build:paths

$ npm test        # turbo, every package
rc=0
 Tasks:    6 successful, 6 total

$ npm run test:e2e   # turbo, every package
rc=0
 Tasks:    5 successful, 5 total

$ npm run lint    # turbo, every package
rc=0
 Tasks:    5 successful, 5 total

$ npm run build   # turbo, every package
rc=0
 Tasks:    5 successful, 5 total
```

The exact command the new CI job runs, both arms:

```
$ npm run test:e2e -- --filter=@lerianstudio/sindarian-server
rc=0
@lerianstudio/sindarian-server:test:e2e: Tests:       27 passed, 27 total
 Tasks:    1 successful, 1 total

$ npm run test:e2e -- --filter=@lerianstudio/sindarian-ui     # a package with `exit 0`
rc=0
 Tasks:    1 successful, 1 total
```

### RED before GREEN, the redaction

Assertions first, source untouched. Header at the RED: `2026-09-15 12:35:55 UTC`,
`HEAD c42a3c6`, `git status --porcelain` =

```
 M packages/sindarian-server/src/exceptions/base-exception-filter.test.ts
 M packages/sindarian-server/test/app/controllers/throwing-controller.ts
 M packages/sindarian-server/test/e2e/error-shape.spec.ts
```

`dist` rebuilt first, because the e2e app resolves the package through `main`, not the
sources (`npm run build`, rc=0).

```
$ npx jest src/exceptions/base-exception-filter.test.ts
rc=1
Tests:       10 failed, 7 passed, 17 total

$ npm run test:e2e
rc=1
  ● An unexpected error answers a generic body, never its own text › redacts a thrown Error, host, port and taxpayer id
    Expected: "Internal server error"
    Received: "connect ECONNREFUSED db-primary.internal:8080 for cpf 123.456.789-00"
  ● An unexpected error answers a generic body, never its own text › answers 500 for a plain HttpException, and redacts it too
    Expected: "Internal server error"
    Received: "no such ledger"
  ● Whatever a route throws, the body carries a string message › names a sentence when the thrown value has no message
    Expected: "0004"
    Received: undefined
Tests:       3 failed, 24 passed, 27 total
```

The received values ARE the leak, read off a real Response at the branch this PR started
from: the host, the port and the taxpayer id, and a plain `HttpException`'s own text.

GREEN after the filter change, `2026-09-15 12:36:50 UTC`, same `HEAD c42a3c6` with the
source modified, `npm run build` rc=0 first:

```
$ npx jest src/exceptions/base-exception-filter.test.ts
rc=0
Tests:       17 passed, 17 total

$ npm run test:e2e
rc=0
Test Suites: 2 passed, 2 total
Tests:       27 passed, 27 total
```

### RED before GREEN, the earlier shape fix

The pin for the bare-`Error` leak, spec written before the route existed. Header at the
RED: `2026-09-15 00:01:38 UTC`, `HEAD ba3af4c`,
`git status --porcelain` = ` M packages/sindarian-server/test/e2e/error-shape.spec.ts`.

```
$ npm run test:e2e
rc=1
  ● A thrown Error still puts its own text on the wire › leaks the Error message verbatim, host, port and taxpayer id
    Expected: 500
    Received: 404
Test Suites: 1 failed, 1 passed, 2 total
Tests:       1 failed, 25 passed, 26 total

# GREEN, after adding the route (2026-09-15 00:02:03 UTC, same HEAD)
$ npm run test:e2e
rc=0
Test Suites: 2 passed, 2 total
Tests:       26 passed, 26 total
```

That case is the one this pass inverted: same route, opposite assertion. Its counts, 26
then and 27 now, are the whole of the 25/26/27 discrepancy a review thread asked about.

The four original RED cases, re-run at `9986c2a` with the two source files held at the
branch point `9ded7ed`, because the `null` case was renamed by this pass (its old name
asserted a rendered error page that does not exist):

```
$ git checkout 9ded7ed -- src/exceptions/base-exception-filter.ts src/exceptions/api-exception.ts
$ npm run test:e2e
rc=1
  ● ... › reduces an upstream problem object to its classification
    Expected: "string"   Received: "object"
  ● ... › names a sentence when the thrown value has no message
    Expected: "string"   Received: "undefined"
  ● ... › names a sentence for a thrown string
    Expected: "string"   Received: "undefined"
  ● ... › answers JSON with a body at all, for a thrown null
    TypeError: Cannot read properties of null (reading 'message')
      at BaseExceptionFilter.catch (../src/exceptions/base-exception-filter.ts:21:28)
      at ServerFactory._handleRequest (../src/server/server-factory.ts:216:46)
Test Suites: 1 failed, 1 passed, 2 total
Tests:       4 failed, 22 passed, 26 total
```

22 passed there, not 21: the bare-`Error` case passed at the branch point too, because at
that point it still asserted the leak. That is what proved the leak was pre-existing
rather than introduced by the shape fix, and it is the measurement the product decision
was taken against.

Earlier RED runs, from the first pass, unchanged:

```
# filter unit tests, before the fix (HEAD 9ded7ed)
Tests:       7 failed, 7 passed, 14 total
# after
Tests:       14 passed, 14 total

# getResponse metadata, before the fix (HEAD 79e4853)
  ● ApiException > message coercion > metadata never replaces the named fields
    Expected: "Upstream timed out"
    Received: {"detail": "cpf 123.456.789-00"}
Tests:       1 failed, 38 passed, 39 total
# after
Tests:       39 passed, 39 total
```

### Mutants

Each one applied at `7034afc`, `dist` rebuilt, run, then reverted with
`git checkout HEAD --`, with `git status --porcelain` verified empty after every revert.
`2026-09-15 12:37:59 UTC` onward.

| # | Mutation | Command | Result |
|---|---|---|---|
| M1 | redaction removed: the `Error` is handed over as `exception?.message` again, as before this PR | `npm run test:e2e` | rc=1, 2 failed / 25 passed / 27. Received `connect ECONNREFUSED db-primary.internal:8080 for cpf 123.456.789-00` and `no such ledger` |
| M2 | the `ApiException` narrowing dropped (`false && exception instanceof ApiException`), so a typed exception is redacted as an `Error` | `npx jest src/exceptions/base-exception-filter.test.ts` | rc=1, 4 failed / 13 passed / 17, including `never redacts an ApiException, which is an Error too` |
| M3 | the `console.error` write removed | unit, then `npm run test:e2e` | unit rc=1, 1 failed / 16 passed (`writes the Error text and its stack to the server log`); e2e rc=1, 2 failed / 25 passed, both log assertions |
| M4 | `exception?.message` narrowed to `exception.message` | `npm run test:e2e` | rc=1, KILLED the `null` case with the original `TypeError: Cannot read properties of null` |
| M5 | `code` dropped from the body | unit, then `npm run test:e2e` | unit rc=1, 9 failed / 8 passed; e2e rc=1, 3 failed / 24 passed |

M2 is the one that matters most, and it is the repair shape an earlier version of this
plan wrote down as the future fix for the leak. `exception instanceof Error ? UNCLASSIFIED
: ...` redacts every `ApiException` too, because `ApiException extends HttpException
extends Error`: `UnauthorizedApiException('Session expired')` would answer
`401 {"message":"Internal server error"}`, and a 404 and a 422 the same way. An engineer
following that note would have seen the one deliberate red it promised and lost the
message on every failure a consumer shows a user. The shipped narrowing is what prevents
it, and M2 is what proves the narrowing is live.

The operand M2 did NOT restore is dead by construction, not by luck. Every exported
`ApiException` subclass, plus a prototype-only instance that never ran a constructor,
carries a truthy `getStatus`, inherited from `HttpException.prototype`:

```
$ node -e '<instantiate all 9 exported classes + Object.create(ApiException.prototype)>'
rc=0
  ApiException getStatus truthy: true status: 500      ... (9 classes, all true)
  prototype-only instance (no constructor run) getStatus truthy: true
  getStatus is an own property of ApiException.prototype? false
  ...inherited from HttpException.prototype? true
VERDICT: every value passing `instanceof ApiException` has a truthy getStatus: true
```

The socket measurement in the table above ran under `unshare -rn` on ephemeral loopback
ports at `9ded7ed`, at `24a7777`, and once more at the code-final head `7034afc` with the
command and exit code pasted beside the table. Identical output all three times: this PR
changes nothing on the transport frame, redaction included, because an `ApiException` is
narrowed off before it.
