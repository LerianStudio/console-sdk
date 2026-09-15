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

**Corrected: what a consumer actually has to migrate, and it is not a code lookup.** An
earlier version of this section said the browser fetcher already reads `code` off the body
into `ApiError.code`, "so the code this filter now writes arrives on the error object a
route handler already has". The first clause is true and the conclusion does not follow,
for two independent reasons.

First, **this filter's body never reaches a Console caller**. Measured on
`product-console` `origin/develop` at `0b7db3a1f`: Console registers `GlobalExceptionFilter`
as `APP_FILTER` (`src/core/infrastructure/modules/app-module.ts:65-66`), and
`ServerFactory._fetchExceptionFilters` builds `[BaseExceptionFilter, ...APP_FILTERs]` and
then `.reverse()`s it (`server-factory.ts:370-388`), so every APP_FILTER runs BEFORE this
package's own. `GlobalExceptionFilter` ends in a catch-all that always returns a Response,
`{ code: '0500', message: 'Error on the Service. Please contact support.' }` at 500
(`src/core/infrastructure/global-exception-filter.ts:114`, its last statement), with no
branch for a plain `Error`. So `ApiError.code` on a Console 500 is `0500`, never `0004`, and this
change is invisible there until Console drops that filter.

Second, for a consumer where this filter DOES run, **there is no replacement
classification to move to**. The status is 500 and the code is `0004` for every unexpected
error alike: an ECONNREFUSED and a plain programming bug answer the same two values. A
route that today does `if (err.message.includes('ECONNREFUSED')) scheduleRetry()` cannot be
rewritten as `if (err.status === 500 && err.code === '0004') scheduleRetry()` without
turning a targeted retry into a retry on every deterministic bug.

The honest statement is that the classification is gone from the wire on purpose, and the
discriminator now lives only in the server log. A consumer that was branching on a 500's
message text has to stop branching, not re-point the branch. What the code IS good for is
the other direction: it tells a caller the sentence beside it is ours and carries no
information about the failure, so a UI can show its own copy instead of echoing a body it
cannot interpret.

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

**Which version carries this, measured rather than predicted.** An earlier version of the
PR body said "`develop` publishes the next beta on the 3.x line rather than 2.x". False.
`release.yml:239-240` makes `develop` a `prerelease: beta` branch, and on a prerelease
branch semantic-release does not apply the release type to the last version: it takes the
highest of (increment the last prerelease) and (apply the type to the last STABLE release,
plus `-beta.1`). Run verbatim with the repo's own semver 6.3.1 over the tags reachable from
`origin/develop`:

```
$ node /tmp/rv-sdkerr-fix3-semrel/next-version.cjs
rc=0
lastRelease (beta chan) : 2.0.0-beta.3
latest stable, no prerel: 1.3.0
type=major -> highest(inc(2.0.0-beta.3,prerelease)=2.0.0-beta.4, inc(1.3.0,major)-beta.1=2.0.0-beta.1) = 2.0.0-beta.4
type=minor -> highest(inc(2.0.0-beta.3,prerelease)=2.0.0-beta.4, inc(1.3.0,minor)-beta.1=1.4.0-beta.1) = 2.0.0-beta.4
type=patch -> highest(inc(2.0.0-beta.3,prerelease)=2.0.0-beta.4, inc(1.3.0,patch)-beta.1=1.3.1-beta.1) = 2.0.0-beta.4
main branch (not prerelease) would give: 2.0.0
```

So merging this publishes **2.0.0-beta.4** on the `develop` dist-tag, and the breaking
change moves no version line at all: the major number was already spent by
`2.0.0-beta.1`, which is `inc(1.3.0, major)` and is what the repo actually did on
2026-09-09. There is no stable 2.x (`git tag | grep -E '^sindarian-server-v2\.[0-9]+\.[0-9]+$'`
returns nothing, rc=1), and `npm view @lerianstudio/sindarian-server dist-tags` reads
`{ latest: '1.3.0', develop: '2.0.0-beta.3' }`. **The major lands as a stable `2.0.0` when
the line is promoted to `main`**, where the branch is not a prerelease and the rule is
`inc(lastRelease, type)` against 1.3.0.

The consumer-facing consequence: the Console bump lane pins on the `2.0.0-beta` line.
Pinning `^3.0.0-beta` fails `npm ci` on a version that will never be published.

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
body and of THREE source comments said Next answered with a rendered error page of its
own. Two were corrected in `7dda59f` (`base-exception-filter.ts` and its unit test); the
third, in `test/e2e/error-shape.spec.ts`, was corrected separately in `1f3c280`, which is
why an earlier version of this paragraph counted two. That was never measured and it is
false. A route handler that throws answers `500` with a
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

**An unexpected error answers the generic sentence and the code, and nothing else.** An
unexpected error is anything that is not one of this library's typed exceptions: a bare
`Error`, a plain `HttpException`, an object carrying a string `message`, an upstream
problem body, a thrown string, a thrown `null`. Its own text used to be the response body
verbatim. The body is now `{"message":"Internal server error","code":"0004"}` at 500, for
every one of them, and the text and the stack go to `console.error` instead. `0004` is not
a new code: it is the one `InternalServerErrorApiException` already carries.

`ApiException` is narrowed off FIRST and keeps its message: it extends `HttpException`
extends `Error`, so redacting by `instanceof Error` would take the sentence off every 401,
404 and 422 this library raises. A unit case pins that, and mutant M2 below kills the
version that does not narrow. Past that narrowing nothing is asked about the thrown value
at all: every value there is unexpected by construction, so the body is a constant and
`toProblemMessage` is not consulted on that path.

**The reduction is not consulted there, and the first version of this change wrongly
thought it was enough.** That version asked `exception instanceof Error` and handed
everything else to `toProblemMessage(exception?.message, ...)`, which is the transport's
rule: a string survives bounded at 2000, a problem object keeps its `title`. Applied
HERE, one frame from the wire, that rule leaked, because the values reaching this frame
are not an upstream's body, they are what a route threw:

- `throw { message: e.message }`, the ordinary rethrow in a TypeScript route, is not an
  `Error`. Its text reached the browser word for word, while the identical text inside an
  `Error` was redacted. The thrown shape decided what a caller read, which is the one
  thing this lane exists to stop.
- an upstream problem body handed straight to `throw` kept its `title` on the wire AND
  carried `code: "0004"`, so a caller reading codes was told the library wrote a sentence
  it did not write. That is what made the code unreadable, and it is now the e2e case
  `keeps no part of an upstream problem object`.
- a 2000-character cap is not a redaction. A host, a port and a taxpayer id fit in eighty.

**And the log write was narrow in the same place, which was worse.** It sat inside the
same `instanceof Error` branch, so for a thrown object the text was not redacted, it was
deleted: the response had already stopped carrying the upstream's `detail` and nothing
wrote it anywhere. An operator paged on a spike of 500s had no host, no request and no
line to grep. The write is now unconditional, and a value with no `message` is handed to
`console.error` whole rather than stringified, because `String({ code, detail })` is
`[object Object]` and those fields are the incident.

Measured at the code-final head `62dfdbe` through the REAL pipeline (`app.handler`, the
package's own e2e app, `dist` rebuilt), one row per throwing route, body read off the
real `Response` and the `console.error` payload captured:

```
object       500 {"message":"Internal server error","code":"0004"}
             log calls=1 payload={"name":"object","message":{"title":"Gateway Timeout","detail":"cpf 123.456.789-00 timed out at db-primary.internal:8080"}}
errorlike    500 {"message":"Internal server error","code":"0004"}
             log calls=1 payload={"name":"object","message":"connect ECONNREFUSED db-primary.internal:8080 for cpf 123.456.789-00"}
no-message   500 {"message":"Internal server error","code":"0004"}
             log calls=1 payload={"name":"object","message":{"code":"E_NOPE","detail":"timed out at db-primary.internal:8080"}}
string       500 {"message":"Internal server error","code":"0004"}
             log calls=1 payload={"name":"string","message":"something went wrong"}
null         500 {"message":"Internal server error","code":"0004"}
             log calls=1 payload={"name":"object","message":null}
error        500 {"message":"Internal server error","code":"0004"}
             log calls=1 payload={"name":"Error","message":"connect ECONNREFUSED db-primary.internal:8080 for cpf 123.456.789-00","stack":"<stack>"}
http-status  500 {"message":"Internal server error","code":"0004"}
             log calls=1 payload={"name":"Error","message":"no such ledger","stack":"<stack>"}
```

Seven shapes, one body, seven log lines. `errorlike` and `error` carry byte-identical
text under different shapes and are now indistinguishable on the wire, which is the whole
claim.

**What `0004` means, now that it is true.** A caller reading codes can tell this envelope
from a sentence an upstream actually wrote, because the two never arrive together: an
upstream's own classification reaches a caller as an `ApiException`, answered with
`{ message }` and NO code, and nothing on the unexpected path keeps a word of what it was
carrying. That sentence shipped in the previous version of this branch while the `object`
route answered `{"message":"Gateway Timeout","code":"0004"}`, which refuted it. It is
pinned now rather than asserted.

**One thing this moves rather than removes, and consumers must be told.** The text goes to
the operator log verbatim, and a log is a less private place than it looks: it is shipped
onward by whatever collects stdout, and no key-based redaction reaches inside a sentence.
The filter comment now says so in as many words: do not interpolate a customer's data into
an `Error` message. The SRE standard's prohibited-fields list forbids a CPF in a log while
separately sanctioning error details with stack traces, so this is the accepted trade and
the correct posture is omission at the throw site, not a second redactor here.

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
`<rootDir>/test`, so the package's `npm test` (38 suites, 857 tests) excludes every case
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

### Corrected here: what the untouched branch actually answers

An earlier version of this plan and of the PR body reassured a consumer that "a 401 still
says the session expired, a 404 still names what was not found, a 422 still lists what
failed validation". The first two halves are right. The third is wrong twice over, and it
is the sentence a consumer reads before accepting a breaking release.

Measured at the code-final head `62dfdbe` by driving the REAL `BaseExceptionFilter` with
real exception instances and reading the real `Response` body:

```
ValidationApiException(msg, {amount:[required]}) -> 400 {"message":"Validation failed"}
                                                    getResponse(): {"errors":{"amount":["required"]},"code":"0007","title":"Validation Error","message":"Validation failed"}
UnprocessableEntityApiException(msg)             -> 422 {"message":"Insufficient funds"}
                                                    getResponse(): {"code":"0006","title":"Unprocessable Entity","message":"Insufficient funds"}
UnauthorizedApiException(msg)                    -> 401 {"message":"Session expired"}
                                                    getResponse(): {"code":"0001","title":"Unauthorized","message":"Session expired"}
NotFoundApiException(msg)                        -> 404 {"message":"Ledger not found"}
                                                    getResponse(): {"code":"0003","title":"Not Found","message":"Ledger not found"}
```

Two facts, both pre-existing and neither changed by this PR. The exception that carries a
validation list is `ValidationApiException`, whose status is **400**, not 422; the 422
this library raises, `UnprocessableEntityApiException`, takes a message and nothing else.
And this filter answers ANY typed exception as `{ message }` alone: it never calls
`getResponse()`, so the `errors` list never reaches the wire through this package at all.
The list reaches a browser only in an application that writes its own filter and
serialises `getResponse()` itself, which is what Product Console's `GlobalExceptionFilter`
and this package's own e2e `AppExceptionFilter` do.

The honest sentence, and the one now in the PR body: a 401, a 404 and a 400 validation
failure still carry the sentence this library wrote for them, unchanged to the byte.
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

**A thrown `Error` put its own text on the wire, verbatim.** It was the leak this lane
found FIRST and deferred, not its only one: the `ZodValidationPipe` leak at Found-not-fixed
item 2 was also found here and is still open, and an earlier version of this line called
the `Error` one "the one leak", which the same document corrects thirty lines later. The
first version of this PR pinned it rather than closing
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
   open leak of the two this lane found; the `Error` one above is the first.
   `new ValidationApiException('Validation failed', error)` lands in metadata and
   `getResponse()` serialises it, so every rejected value reaches the browser **in an
   application that serialises `getResponse()` itself**, which Product Console's
   `GlobalExceptionFilter` does. It does NOT reach the browser through this package's own
   filter, which answers a typed exception as `{ message }` alone and never calls
   `getResponse()` (measured above). Arguably intended for form feedback, and the same
   argument `toProblemMessage` makes about `errors[]` applies against it. It has no
   pinning test and no e2e route, so reducing it later WOULD be a silent wire change for
   Console's forms. Needs a product decision, not a patch, and a pin the day the decision
   is taken.
3. **The e2e app's own filter shadows the `ApiException` branch.** `AppExceptionFilter` is
   `@Catch()` and answers every `ApiException` itself, so all 28 e2e cases exercise the
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

All eight gates at `62dfdbe`, the code-final head, `2026-09-15 14:07:49 UTC`, tree clean
(`git status --porcelain` empty before and after).

```
$ cd packages/sindarian-server && npm test
rc=0
Test Suites: 38 passed, 38 total
Tests:       857 passed, 857 total

$ cd packages/sindarian-server && npm run test:e2e
rc=0
Test Suites: 2 passed, 2 total
Tests:       28 passed, 28 total

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
@lerianstudio/sindarian-server:test:e2e: Tests:       28 passed, 28 total
 Tasks:    1 successful, 1 total

$ npm run test:e2e -- --filter=@lerianstudio/sindarian-ui     # a package with `exit 0`
rc=0
 Tasks:    1 successful, 1 total
```

### RED before GREEN, widening the redaction to every shape

Assertions first, source untouched, on top of a fresh merge of `origin/develop`
(`ea23be7`, merged clean with no conflict). Header at the RED: `2026-09-15 13:59:24 UTC`,
`HEAD 88c9956`, `git status --porcelain` =

```
 M packages/sindarian-server/src/exceptions/base-exception-filter.test.ts
 M packages/sindarian-server/test/app/controllers/throwing-controller.ts
 M packages/sindarian-server/test/e2e/error-shape.spec.ts
```

`dist` rebuilt first (`npm run build`, rc=0), because the e2e app resolves the package
through `main`, not the sources.

```
$ npx jest src/exceptions/base-exception-filter.test.ts
rc=1
  ● BaseExceptionFilter › should handle exception without getStatus method (default to 500)
  ● BaseExceptionFilter › should handle non-ApiException
  ● BaseExceptionFilter › the body always carries a string message › keeps no part of an upstream classification
  ● BaseExceptionFilter › the body always carries a string message › drops an unbounded message rather than capping it
  ● BaseExceptionFilter › an unexpected error › writes the text of a thrown object that is not an Error
  ● BaseExceptionFilter › an unexpected error › writes a thrown value that has no message at all
  ● BaseExceptionFilter › an unexpected error › writes a thrown string
  ● BaseExceptionFilter › an unexpected error › writes a line for a thrown null without throwing
Tests:       8 failed, 13 passed, 21 total

$ npm run test:e2e
rc=1
  ● Whatever a route throws, the body carries a string message › keeps no part of an upstream problem object
    Expected: "Internal server error"
    Received: "Gateway Timeout"
  ● Whatever a route throws, the body carries a string message › keeps no part of a thrown object whose message is a string
    Expected: "Internal server error"
    Received: "connect ECONNREFUSED db-primary.internal:8080 for cpf 123.456.789-00"
  ● Whatever a route throws, the body carries a string message › names a sentence when the thrown value has no message
  ● Whatever a route throws, the body carries a string message › names a sentence for a thrown string
  ● Whatever a route throws, the body carries a string message › answers JSON with a body at all, for a thrown null
Tests:       5 failed, 23 passed, 28 total
```

The two `Received` values ARE the defect, read off a real `Response` at the head this
pass started from: an upstream's own title stamped with the code that means the library
could not classify the failure, and the connection string that the sibling `error` route
had already had stripped from it. The three cases with no printed value are the log half:
`console.error` was called zero times for a thrown object, a thrown string and a thrown
`null`, so that text was not moved anywhere, it was gone.

GREEN after the filter change, `2026-09-15 14:01:02 UTC`, same `HEAD 88c9956` with the
source modified, `npm run build` rc=0 first:

```
$ npx jest src/exceptions/base-exception-filter.test.ts
rc=0
Tests:       21 passed, 21 total

$ npm run test:e2e
rc=0
Test Suites: 2 passed, 2 total
Tests:       28 passed, 28 total
```

### RED before GREEN, the first redaction

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

Each one applied at the implementation commit, `dist` rebuilt, run, then reverted with
`git checkout -- <file>`, with `git status --porcelain` verified empty after every revert
(`clean-after-Mn=yes` printed each time). `2026-09-15 14:03:51 UTC` onward. Unit counts
are out of 21, e2e out of 28.

| # | Mutation | Result |
|---|---|---|
| M1 | the response goes back to reading the thrown value, `toProblemMessage(exception instanceof Error ? exception : exception?.message, ...)`, i.e. the previous version of this branch | unit rc=1, **4 failed** / 17 passed; e2e rc=1, **2 failed** / 26 passed: `keeps no part of an upstream problem object` and `keeps no part of a thrown object whose message is a string` |
| M2 | the `ApiException` narrowing dropped (`false && exception instanceof ApiException`), so a typed exception is redacted like anything else | unit rc=1, **4 failed** / 17 passed: both `should handle ApiException` cases, `names the real status when the message is empty`, and `never redacts an ApiException, which is an Error too` |
| M3 | the `console.error` write removed entirely | unit rc=1, **5 failed** / 16 passed; e2e rc=1, **7 failed** / 21 passed |
| M4 | the optional chaining dropped from the log reads (`exception.name`, `exception.message`, `exception.stack`) | unit rc=1, **2 failed** / 19 passed; e2e rc=1, **1 failed** / 27 passed, with the original `TypeError: Cannot read properties of null (reading 'name')` |
| M5 | `code` dropped from the body | unit rc=1, **9 failed** / 12 passed; e2e rc=1, **5 failed** / 23 passed |
| M6 | the log write put back behind `if (exception instanceof Error)`, i.e. the previous version of this branch | unit rc=1, **4 failed** / 17 passed, all four of the new log cases; e2e rc=1, **5 failed** / 23 passed |

M1 and M6 are this pass's pair, and they are the two halves of the same narrowing: M1 is
the text reaching the wire, M6 is the text reaching nothing at all. Both were live
behaviour on the previous head of this branch, and neither had a test that could see it,
which is why the mutants are recorded as the previous version rather than as an invented
edit.

M2 guards the widest blast radius of the three, and it is the repair shape an earlier
version of this plan wrote down as the future fix for the leak. `exception instanceof Error ? UNCLASSIFIED
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
