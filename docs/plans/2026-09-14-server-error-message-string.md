# The server always hands the caller a string message - Mini Plan

**Goal:** a caller of `@lerianstudio/sindarian-server` can read `message` as a string on
every failure path, so a route that classifies a failure with string methods has a live
branch instead of a dead one. The transport frame was already there; the exception filter
that writes the last body before the wire was not.

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

So there is no workaround in Console to retire after this lands. The defect is real; the
sentence describing who was absorbing it was not.

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
error`. The two branches collapse into one, because after the reduction they differed
only by status.

`getResponse()` spreads metadata under the three named fields instead of over them.

The e2e app gained a `ThrowingController` with one route per shape and a spec that reads
the real `Response`. This matters because the filter's unit tests mock
`NextResponse.json`: they can assert the arguments and never the body a caller parses,
which is exactly where the `null` case hid. A fifth route and a second describe block PIN
the bare-`Error` leak that is NOT fixed here, so the four passing cases beside it cannot
be misread as closing it.

The filter's status line lost a second operand that could never be false:
`exception instanceof ApiException && exception.getStatus` became
`exception instanceof ApiException`. `getStatus` is declared on `HttpException`, which
`ApiException` extends, so after the narrowing it is always there. The guard was carried
over from when `exception` was untyped and it did real work.

**And the PR gate now runs those e2e cases.** It did not. `jest.config.ts` ignores
`<rootDir>/test`, so the package's `npm test` (38 suites, 850 tests) excludes every case
that reads a real `Response`, and `ci.yml` had only lint, test and build. The e2e suite
ran solely in `release.yml`, AFTER merge, where a red job blocks a publish instead of a
merge and the offending commit has to be reverted off `develop`. `ci.yml` gained a
`test-e2e` job mirroring the release one, over the same changed-paths matrix. The
`test:e2e` scripts already existed at the package and the monorepo root; the job is what
was missing. Packages that define it as `exit 0` stay a no-op.

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

## Found by this lane, not fixed

1. **A thrown `Error` still puts its own text on the wire, verbatim.** This is a leak
   class, and it is open. The filter reduces `exception?.message`, which is already a
   string by the time `toProblemMessage` sees it, so that function's `Error` rule (return
   the fallback, never the text) can never fire from this frame. Measured through the real
   pipeline: a route doing
   `throw new Error('connect ECONNREFUSED 10.0.0.5:8080 for cpf 123.456.789-00')` answers
   `500 application/json {"message":"connect ECONNREFUSED 10.0.0.5:8080 for cpf 123.456.789-00"}`.
   The identical values thrown as a problem object one route over ARE stripped, which is
   what makes this worth naming: the adjacent passing e2e case must not be read as
   covering it. Pre-existing, not introduced here, and left open on purpose: closing it
   changes what callers see, Console classifies on this text today, and nobody has
   measured which callers. The e2e suite now PINS the current behaviour
   (`test/e2e/error-shape.spec.ts`, the second describe block) so that closing it is a
   deliberate red test rather than a silent wire change. Needs a product decision.
2. **`BaseExceptionFilter` ignores `getStatus()` on a non-`ApiException`.** A plain
   `HttpException`, which the package exports and which carries a real status, is answered
   as 500. Out of scope for a message-shape fix; it is a status defect.
3. **`ZodValidationPipe` puts the whole `ZodError` in the response.**
   `new ValidationApiException('Validation failed', error)` lands in metadata and
   `getResponse()` serialises it, so every rejected value reaches the browser. Arguably
   intended for form feedback, and the same argument `toProblemMessage` makes about
   `errors[]` applies against it. Needs a product decision, not a patch.
4. **The e2e harness breaks if `test/` is installed on its own.** `npm install` there
   fetches a second copy of `next`, and the two `NextRequest` types are incompatible, so
   the suite fails to compile before running a single case. CI never hits it because
   `npm ci` at the root links the workspace and hoists one `next`. Left alone; the fix is
   a note or a workspace entry, and neither belongs in this PR.

## Verification

All eight gates at `9986c2a`, the code-final head, tree clean (`git status --porcelain`
empty before and after).

```
$ cd packages/sindarian-server && npm test
rc=0
Test Suites: 38 passed, 38 total
Tests:       850 passed, 850 total

$ cd packages/sindarian-server && npm run test:e2e
rc=0
Test Suites: 2 passed, 2 total
Tests:       26 passed, 26 total

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
@lerianstudio/sindarian-server:test:e2e: Test Suites: 2 passed, 2 total
@lerianstudio/sindarian-server:test:e2e: Tests:       26 passed, 26 total
 Tasks:    1 successful, 1 total

$ npm run test:e2e -- --filter=@lerianstudio/sindarian-ui     # a package with `exit 0`
rc=0
 Tasks:    1 successful, 1 total
```

### RED before GREEN

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

22 passed there, not 21: the new bare-`Error` pin passes at the branch point too. That is
the correct signal and it is why the case is a pin rather than a regression guard. The
leak predates this PR and this PR does not close it.

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

Each one applied at `9986c2a`, run, then reverted with `git checkout HEAD --`, with
`git status --porcelain` verified empty after every revert.

| # | Mutation | Command | Result |
|---|---|---|---|
| M1 | filter redacts a thrown `Error` (`exception instanceof Error ? UNCLASSIFIED : ...`) | `npm run test:e2e` | rc=1, KILLED the new pin: expected the ECONNREFUSED text, received `Internal server error`. 1 failed, 25 passed |
| M2 | `exception instanceof ApiException` forced to `false && ...` | `npx jest src/exceptions/base-exception-filter.test.ts` | rc=1, 3 failed, 11 passed. The branch the simplification kept is live |
| M3 | `exception?.message` narrowed to `exception.message` | `npm run test:e2e` | rc=1, KILLED the renamed `null` case with the original `TypeError: Cannot read properties of null` |

M1 is the point of the pin: closing the leak turns a green test red on purpose, so nobody
changes what the browser sees without seeing this file first.

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
ports, at `9ded7ed` and again at `24a7777`, with identical output: this PR changes nothing
on the transport frame.
