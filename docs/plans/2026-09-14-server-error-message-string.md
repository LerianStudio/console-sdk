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
package's e2e app, the package's `TECHNICAL.md` where it documents that filter, and one
job added to `.github/workflows/ci.yml` so those e2e cases gate a pull request instead of
only a release. No change to `HttpService`, to `toProblemMessage`, or to any other
package.

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
Re-run at the code-final head `2f8936e` (`2026-09-15 18:04:53 UTC`), six real sockets on
ephemeral loopback ports, harness at `/tmp/rv-sdkerr-sockets/probe.cjs` driving the built
`dist` through a concrete `HttpService`. An earlier version of this paragraph named the
previous pass's last CI commit, two changes below the shipping filter, so a negative claim
the whole change rests on was labelled as re-run against code that had since been
rewritten. The code-final head in this document is `2f8936e`, and every claim that has to
hold AT it was re-taken there: this socket table, the per-route and trap measurements, the
eight gates and the mutants. A RED block belongs to the pass that produced it and names its
own head, because a RED cannot be re-taken later without becoming a different measurement.
Output verbatim, the package's own `console.error` lines elided:

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
highest of (increment the last prerelease) and (apply the type to the latest version on
the branch, PRERELEASES INCLUDED, plus `-beta.1`).

That second term is the correction. An earlier version of this section said "apply the
type to the last STABLE release", and the harness pasted under it implemented that, so it
printed intermediates the library never computes. The shipped rule reads
`semver.inc(getLatestVersion(tagsToVersions(branch.tags), { withPrerelease: true }), type)`
(`lib/get-next-version.js:17`), which is 2.0.0-beta.3 here, not 1.3.0. Both rules answer
2.0.0-beta.4 today, which is why the wrong one survived three readings; they diverge the
moment `develop` sits on a patch prerelease ahead of `main`, where the stated rule gives
2.0.1-beta.2 and the shipped one gives 3.0.0-beta.1.

Run against the library itself rather than a reimplementation: `get-next-version.js`
imported straight from `node_modules`, fed the 41 real `sindarian-server-v*` tags merged
into `origin/develop`. The CI pin and the installed copy carry the same rule byte for
byte (`diff` of that file between `semantic-release@23.0.8`, pinned at `release.yml:255`,
and the installed 25.0.5, rc=0).

```
$ node /tmp/rv-sdkerr-fix4/next-version.mjs
rc=0
tags on develop      : 41
highest prerelease   : 2.0.0-beta.3 (npm dist-tag develop)
develop, type=major -> 2.0.0-beta.4
develop, type=minor -> 2.0.0-beta.4
develop, type=patch -> 2.0.0-beta.4
main,    type=major -> 2.0.0
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
problem body, a thrown string, a thrown `null`, a thrown `undefined`. The body is now
`{"message":"Internal server error","code":"0004"}` at 500 for every one of them, and the
text goes to `console.error` instead. `0004` is not a new code: it is the one
`InternalServerErrorApiException` already carries.

**What each of those used to answer, corrected.** Two earlier versions of this paragraph
closed the enumeration with "its own text used to be the response body verbatim", and the
pass-2 review refuted it for three of the six shapes named. The refutation was right and
the following pass made the sentence wider instead of narrower, so it is answered here by
name. Measured at the branch point `9ded7ed` through the real `app.handler`: `throwing/string`
answered `500 {}`, `throwing/no-message` answered `500 {}`, and `throwing/null` produced no
`Response` at all. Only the shapes carrying a string under `message` put text on the wire:
the bare `Error`, the plain `HttpException`, and the object whose `message` is a sentence.
So there were two different defects, not one, and they changed in opposite directions: for
the text-carrying shapes a leak closed, and for the rest a body a caller could not read at
all became one it can. A consumer sizing this migration reads the enumeration and needs
that distinction, because their string-throwing routes were never leaking text to a user.

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
line to grep. The write is now unconditional.

**The record it writes is three fields, and this pass rebuilt it.** The first unconditional
version was `{ name, message: exception?.message ?? exception, stack }`, and review found
three defects in one line. It fell back on NULLISH, so a value carrying a PRESENT but empty
`message` logged `''` and dropped everything beside it: `{ message: '', code: 'E_NOPE',
detail: 'cpf ... at db-primary.internal:8080' }` wrote a line that said nothing at all, for
a value differing from a covered one only by `''` instead of `null`. It was unbounded, so a
route rethrowing a megabyte of upstream body wrote a megabyte per failed request. And
handing an object to `console.error` renders it two levels deep, so an RFC 9457 body's
`errors` map printed `errors: { payer: [Object] }`, eliding exactly the field that is the
incident.

The record is now, always:

```
{ name, message, value }
```

`name` is the value's own `name` when that is a string, else `typeof`. `message` is the
sentence an operator greps, present when the thrown value carried a string one, and it
decides nothing else. `value` is the whole thrown value rendered with
`util.inspect(value, { depth: 4, breakLength: Infinity, compact: true, customInspect: false })`.
All three are cut at `MESSAGE_MAX_LENGTH`, the same 2000 characters a message is bounded at
elsewhere in the package. There is no `stack` field: rendering an `Error` prints its stack,
inside that bound.

**The typed branch answers a string now too, which was the last shape defect in this
file.** `ApiException`'s constructor produces a sentence, so the filter answered
`exception.message` untouched, and that was the one place left trusting the value it was
handed. `Error.message` is a writable property. Reassigned after construction, whatever it
became went to the browser: measured on a 404, `e.message = { title: 'Gateway Timeout',
detail: 'cpf 123.456.789-00' }` answered
`{"message":{"title":"Gateway Timeout","detail":"cpf 123.456.789-00"}}`, an OBJECT under a
field documented as a sentence with a taxpayer id inside it, and `e.message = undefined`
answered `{}`, no field at all. Those are the two defects this lane was opened on, the
object body and the missing field, surviving on the branch the lane narrowed off.

A non-string is now replaced with `noProblemDetails(status)`, the constructor's OWN
fallback, which names the real status. Deliberately not `UNCLASSIFIED`: a 404 reading
`Internal server error` is the defect `names the real status when the message is empty`
exists to prevent, and M18 is the mutant that stops this branch reintroducing it one
mutation over. An empty string IS a string and passes through unchanged, so the pin from
the previous commit still reads `{ message: '' }`, and M14, which restores the pre-PR
`|| UNCLASSIFIED`, still kills.

Found by CodeRabbit on this branch and verified against the code before being fixed. The
reachability is the same thin one as the empty string, a post-construction mutation, and
the answer is different because the OUTCOME is different: an empty sentence is a bad
sentence, an object is not a sentence at all, and this file's whole claim is about the
type.

**And the record is written as JSON, on ONE physical line, which is the last defect this
lane found in it.** Handing `console.error` a record OBJECT does not produce one line, and
no option on our own `inspect` call can make it: Node renders a second argument with its
OWN `util.inspect` defaults, `breakLength: 128` and `compact: 3`. Measured through the real
pipeline at the previous head, `1b0218d`: the `object` route wrote SEVEN physical lines,
`errorlike` and `no-message` five each, the `error` route fifteen and `http-status`
seventeen. A line-oriented collector, the Docker json-file driver or Fluent Bit, ships each
of those as a separate event, so the taxpayer id and the internal host land in a DIFFERENT
event from the `Unhandled exception` label an operator greps for. That is the outcome
moving the text into the log was built to prevent, reappearing one frame further out.

Nothing in the suite could see it. All twenty-nine e2e and all twenty-nine filter unit
assertions read `console.error`'s ARGUMENTS through a jest spy, which intercepts before
Node formats them: the same blind spot the e2e suite was added to close on the response
side, one frame over on the log side.

A string argument is written through verbatim, and JSON has no multi-line string, so a
stack's newlines survive as escapes inside the single line rather than breaking it, and
what a collector receives is parseable as well as whole. `compact: true` is the other half:
without it `util.inspect` breaks a value nested three or more deep whatever `breakLength`
says, so the RFC 9457 body's own rendering was three lines, and those breaks would now ride
along inside the record as escapes for no reason. `message: undefined` becomes an absent
key rather than the word `undefined`, which says the same thing in less.

Three assertions pin it where the spy cannot: two format the captured arguments the way
Node does and read the physical lines back, and one swaps the global console for a REAL
`Console` writing into a captured stream and counts the writes. That third one exists
because spying `process.stderr.write` does NOT work here: jest replaces the global console
with one that buffers into the test report instead of writing to the process streams, so
that spy captures nothing at all and would have passed on an empty array.

**And the whole write is inside a guard, which is a reversal.** An earlier version of this
plan listed a thrown value with a throwing `message` getter as found-not-fixed, on the
argument that a `try`/`catch` is a branch for a state nobody produces. Review found a second
door into the same failure and that changed the answer: rendering a value runs its
`[util.inspect.custom]` function, which is not our code, can throw, and could also lie about
what it prints. Two doors, one guard, and the failure behind them is the worst one in this
file: this filter runs inside `ServerFactory._handleRequest`'s own catch block
(`server-factory.ts:204-216`), that call is not wrapped, so a filter that throws escapes the
request pipeline and the route answers a ZERO-BYTE body. That is the `throw null` failure
this lane opened on, reachable again through the line that was supposed to be the safe half.
`customInspect: false` closes the inspector door and prints the real fields; the `catch`
closes the getter and any proxy trap, and still writes `{ name: typeof exception }`, because
a 500 with no log line is what moving the text there was meant to prevent.

Measured at the code-final head `2f8936e`, four booby-trapped values plus the empty-message
shape through the real filter, each answering a body and writing exactly one call on
exactly one physical line. `physical_lines` is the count for the line `util.format` hands
the stream, and `record` its byte count with the stack included rather than elided:

```
trap: message getter     calls=1 physical_lines=1 record=37   name=6ch    message=absent value=absent
trap: custom inspector   calls=1 physical_lines=1 record=144  name=6ch    message=absent value=96ch
trap: name of 1MB        calls=1 physical_lines=1 record=4042 name=2000ch message=absent value=2000ch
thrown 2MB               calls=1 physical_lines=1 record=2048 name=6ch    message=absent value=2000ch
empty message            calls=1 physical_lines=1 record=160  name=6ch    message=0ch    value=99ch
  {"name":"object","message":"","value":"{ message: '', code: 'E_NOPE', detail: 'cpf 123.456.789-00 timed out at db-primary.internal:8080' }"}
```

The same five at the previous head `1b0218d`, which is what the one-line rule bought:
`physical_lines` 1, 5, 5, 5 and 5 respectively, for records of 38, 171, 4069, 2075 and 167
bytes. Only the trap whose record is `{ name }` alone was ever short enough to survive
Node's own `breakLength: 128`.

Measured at the code-final head `2f8936e` through the REAL pipeline (`app.handler`,
the package's own e2e app, `dist` rebuilt), one row per throwing route, body read off the
real `Response` and the `console.error` arguments formatted the way Node formats them. The
`bytes` figure is the whole line INCLUDING any stack, not a harness-elided one, and
`physical_lines` is what a line-oriented collector counts. The `<stack elided>` marker is
applied to the printed row only; the byte count is of the full line.

An earlier version of this block pasted a 173-byte single-line value for the `object` row
and did not reproduce at the head it named, which is how the false claim that the record
was one line survived a pass. These numbers were taken twice, once at `1b0218d` and once
here, with the same harness: a temporary `test/measure-record.ts` driving `app.handler` per
route and the filter directly for the traps, run under `ts-node` and removed afterwards.

```
$ cd packages/sindarian-server/test && ts-node --project tsconfig.json measure-record.ts
rc=0
object       500 {"message":"Internal server error","code":"0004"}
             log calls=1 physical_lines=1 bytes=193
             Unhandled exception {"name":"object","value":"{ message: { title: 'Gateway Timeout', detail: 'timed out at db-primary.internal:8080', errors: { payer: { document: 'cpf 123.456.789-00' } } } }"}
errorlike    500 {"message":"Internal server error","code":"0004"}
             log calls=1 physical_lines=1 bytes=234
             Unhandled exception {"name":"object","message":"connect ECONNREFUSED db-primary.internal:8080 for cpf 123.456.789-00","value":"{ message: 'connect ECONNREFUSED db-primary.internal:8080 for cpf 123.456.789-00', code: 'ECONNREFUSED' }"}
no-message   500 {"message":"Internal server error","code":"0004"}
             log calls=1 physical_lines=1 bytes=115
             Unhandled exception {"name":"object","value":"{ code: 'E_NOPE', detail: 'timed out at db-primary.internal:8080' }"}
string       500 {"message":"Internal server error","code":"0004"}
             log calls=1 physical_lines=1 bytes=70
             Unhandled exception {"name":"string","value":"'something went wrong'"}
null         500 {"message":"Internal server error","code":"0004"}
             log calls=1 physical_lines=1 bytes=52
             Unhandled exception {"name":"object","value":"null"}
undefined    500 {"message":"Internal server error","code":"0004"}
             log calls=1 physical_lines=1 bytes=60
             Unhandled exception {"name":"undefined","value":"undefined"}
error        500 {"message":"Internal server error","code":"0004"}
             log calls=1 physical_lines=1 bytes=1614
             Unhandled exception {"name":"Error","message":"connect ECONNREFUSED db-primary.internal:8080 for cpf 123.456.789-00","value":"Error: connect ECONNREFUSED db-primary.internal:8080 for cpf 123.456.789-00\n    at <stack elided>"}
http-status  500 {"message":"Internal server error","code":"0004"}
             log calls=1 physical_lines=1 bytes=1552
             Unhandled exception {"name":"Error","message":"no such ledger","value":"{ HttpException [Error]: no such ledger\n    at <stack elided>"}
DISTINCT_BODIES=1 BODY_BYTES=49
```

Eight shapes, one body of 49 bytes, eight log lines, and now eight PHYSICAL lines rather
than fifty-two. The same eight routes at `1b0218d`, same harness, same run shape:

```
object 7 lines / 242 bytes   errorlike 5 / 241   no-message 5 / 142   string 1 / 91
null 1 / 73                  undefined 1 / 81    error 15 / 1711      http-status 17 / 1668
DISTINCT_BODIES=1 BODY_BYTES=49
```

The body was already right; only the log was breaking apart. `errorlike` and `error` carry
byte-identical text under different shapes and are indistinguishable on the wire, which is
the whole claim. The `object` row is also the depth proof: its taxpayer id sits three
levels down under `errors`, where a real problem body puts a rejected value, and at the
default depth that field reads `[Object]`. It is the depth proof AND the line proof, and
those are two different failures: at the previous head the id was present and split across
event boundaries, so an operator grepping the label got a record with no incident in it.

The bound and the empty message, from the same run, are in the trap block above:
`thrown 2MB` gives `message=absent value=2000ch record=2048`, and the empty message keeps
every field beside it.

**What `0004` means, now that it is true.** A caller reading codes can tell this envelope
from a sentence an upstream actually wrote, because the two never arrive together: an
upstream's own classification reaches a caller as an `ApiException`, answered with
`{ message }` and NO code, and nothing on the unexpected path keeps a word of what it was
carrying. That sentence shipped in the previous version of this branch while the `object`
route answered `{"message":"Gateway Timeout","code":"0004"}`, which refuted it. It is
pinned now rather than asserted.

**One thing this moves rather than removes, and consumers must be told.** The thrown value
goes to the operator log as it came, bounded but not redacted, and a log is a less private
place than it looks: it is shipped onward by whatever collects stdout, and no key-based
redaction reaches inside a sentence.

**Said plainly, because an earlier version of this section did not.** That version cited the
SRE standard as "separately sanctioning error details with stack traces, so this is the
accepted trade". Read again, the sanction covers an `Error`'s message and stack; the same
list forbids PII and forbids raw request and response bodies at any level, and one of the
shapes this filter writes IS a rethrown counterparty body. So this is not a trade the
standard blesses. It is a deliberate decision, Fred's on 2026-09-15: the value goes to the
log for every shape, because the alternative on offer was a projection of named fields, and
at this frame there is no contract saying which key holds the incident. What the code does
about it is bound the write, so no single failure can flood a sink; what it does NOT do is
redact, and it says so in three places a consumer reads: the filter's own comment,
`TECHNICAL.md`, and the PR description. A consumer whose routes rethrow an upstream body
redacts in its log pipeline; the cheaper fix is omission at the throw site, which is why
"name what failed, not whose record it was" is written beside the code.

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
An eighth route throws `undefined`, the one shape with no route until this pass and the
one a `Promise.reject()` with no argument produces.

The package's own `TECHNICAL.md` documented this filter as extracting the status from
`getStatus()` and returning a standard error response, which is the opposite of what it
does for anything untyped, and its class hierarchy had `HttpException` extending
`ApiException` rather than the other way round. Both are corrected. The published README
documents the filter nowhere, so that block was the only place a consumer could have read
it.

The filter's status line lost a second operand that could never be false:
`exception instanceof ApiException && exception.getStatus` became
`exception instanceof ApiException`. `getStatus` is declared on `HttpException`, which
`ApiException` extends, so after the narrowing it is always there. The guard was carried
over from when `exception` was untyped and it did real work.

**And a pull request now RUNS those e2e cases.** It did not. `jest.config.ts` ignores
`<rootDir>/test`, so the package's `npm test` (38 suites, 873 tests) excludes every case
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

Re-measured at the code-final head `2f8936e` (`2026-09-15 18:05:39 UTC`) by driving the
REAL `BaseExceptionFilter` with real exception instances and reading the real `Response`
body, byte for byte what it printed at `4677bd4`. Re-taken rather than reasoned about,
because this pass DID change the `ApiException` branch: a message that is not a string is
now replaced. Every row below carries a string message from its constructor, so none of
them reaches that arm, and the run is what says so. Zero log lines were written on this
branch, which is the other half of the narrowing:

```
ValidationApiException               -> 400 {"message":"Validation failed"}
                                        getResponse(): {"errors":{"amount":["required"]},"code":"0007","title":"Validation Error","message":"Validation failed"}
UnprocessableEntityApiException      -> 422 {"message":"Insufficient funds"}
                                        getResponse(): {"code":"0006","title":"Unprocessable Entity","message":"Insufficient funds"}
UnauthorizedApiException             -> 401 {"message":"Session expired"}
                                        getResponse(): {"code":"0001","title":"Unauthorized","message":"Session expired"}
NotFoundApiException                 -> 404 {"message":"Ledger not found"}
                                        getResponse(): {"code":"0003","title":"Not Found","message":"Ledger not found"}
log calls on the typed branch = 0
```

Two facts, both pre-existing and neither changed by this PR. The exception that carries a
validation list is `ValidationApiException`, whose status is **400**, not 422; the 422
this library raises, `UnprocessableEntityApiException`, takes a message and nothing else.
And this filter answers ANY typed exception as `{ message }` alone: it never calls
`getResponse()`, so the `errors` list never reaches the wire through this package at all.
The list reaches a browser only in an application that writes its own filter and
serialises `getResponse()` itself, which is what Product Console's `GlobalExceptionFilter`
and this package's own e2e `AppExceptionFilter` do.

**One sentence, carried word for word here and in the PR body**, because a previous version
of this paragraph claimed the body carried it and the body carried a different, weaker
claim ("a 400 validation failure still names what failed", which the measurement above
refutes: a Zod form failure answers `Validation failed` and nothing about the field):

> A 401 still says the session expired, a 404 still names what was not found, and a 400
> from `ZodValidationPipe` still answers `Validation failed`, each the sentence this
> library wrote, unchanged to the byte.
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
   `@Catch()` and answers every `ApiException` itself, so all 29 e2e cases exercise the
   non-`ApiException` path only. The branch that serves every 401, 404 and 422 is covered
   by unit cases against a mocked `NextResponse.json`, which is the blind spot this suite
   was added to close. It matters more now that the narrowing carries the redaction, so the
   protection was put where it can fire: mutant M2 below deletes the narrowing and four
   unit cases die while the whole e2e suite stays green, one of them written for exactly
   that. Reaching it from e2e means a second app whose filter does not shadow it, which is
   a bigger harness than this lane needs.
4. **The e2e harness breaks if `test/` is installed on its own.** `npm install` there
   fetches a second copy of `next`, and the two `NextRequest` types are incompatible, so
   the suite fails to compile before running a single case. CI never hits it because
   `npm ci` at the root links the workspace and hoists one `next`. Left alone; the fix is
   a note or a workspace entry, and neither belongs in this PR.
5. **CLOSED, not carried: a thrown value that traps the log write.** This item was written
   as found-not-fixed one commit earlier, for a `message` getter that throws, on the
   argument that guarding it is a branch for a state nobody produces. A review then named a
   second door, a `[util.inspect.custom]` function that throws, which rendering the value
   runs by default. Two doors into the zero-byte-body failure, closed by one guard plus
   `customInspect: false`, with three cases and three mutants (M10, M11, M12). Recorded here
   because the reversal is the point: one trap read as a curiosity, two read as a hole.
6. **A mutated `ApiException` answers a blank message.** The filter answers
   `exception.message` when it is a string, with no emptiness fallback of its own, so
   `e.message = ''` assigned after construction reads back `404 {"message":""}`, which a UI
   renders as empty rather than as a sentence. Pinned, not fixed, and the reason is that
   the constructor makes it unreachable: every message goes through `toProblemMessage`,
   which substitutes a sentence naming the status. Restoring `|| UNCLASSIFIED` is one token
   and it is a product call, not a defect to close quietly, because it puts a branch back
   for a state this package cannot produce. The pin and M14 are what make either choice
   visible.

   The SHAPE half of the same mutation was fixed rather than pinned, and the split is
   deliberate. A non-string message put an object on the wire under a field documented as a
   sentence, which is the defect this lane exists to close and which falsifies the headline
   claim outright, so it is replaced with the constructor's own fallback. An empty string
   keeps the type promise and only reads badly, which is a judgement about copy rather than
   about a contract.

## Verification

Eight gates at `2f8936e`, the code-final head: four at the package level and four at
the monorepo root through turbo, counted against the block below rather than asserted. The
two CI-job arms under it are a ninth and tenth invocation of one of those eight, pinned
separately because the job's filter argument is what they check. Tree clean
(`git status --porcelain` showing only the plan before the docs commit).

```
$ cd packages/sindarian-server && npm test
rc=0
Test Suites: 38 passed, 38 total
Tests:       873 passed, 873 total

$ cd packages/sindarian-server && npm run test:e2e
rc=0
Test Suites: 2 passed, 2 total
Tests:       29 passed, 29 total

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
@lerianstudio/sindarian-server:test:e2e: Tests:       29 passed, 29 total
 Tasks:    1 successful, 1 total

$ npm run test:e2e -- --filter=@lerianstudio/sindarian-ui     # a package with `exit 0`
rc=0
 Tasks:    1 successful, 1 total
```

### RED before GREEN, one failure on one physical line

Assertions first, source untouched. Header at the RED: `2026-09-15 17:32:20 UTC`, `HEAD
1b0218d`, `git status --porcelain` =

```
 M packages/sindarian-server/src/exceptions/base-exception-filter.test.ts
 M packages/sindarian-server/test/e2e/error-shape.spec.ts
```

```
$ cd packages/sindarian-server && npx jest src/exceptions/base-exception-filter.test.ts
rc=1
Tests:       16 failed, 17 passed, 33 total
  (13 of them on the record's new JSON shape, 3 on the physical-line cases)

$ cd packages/sindarian-server && npm run test:e2e
rc=1
Tests:       4 failed, 25 passed, 29 total
  ● keeps no part of an upstream problem object
    Expected substring: not "\n"
    Received string:        "Unhandled exception {
  ● answers JSON with a body at all, for a thrown null
    Expected substring: "\"value\":\"null\""
    Received string:    "Unhandled exception { name: 'object', message: undefined, value: 'null' }"
  ● answers JSON with a body at all, for a thrown undefined
  ● redacts a thrown Error, host, port and taxpayer id
```

The two `Received string` lines are the defect itself, printed by the suite that could not
see it before: the record arriving at the stream as a multi-line JavaScript literal instead
of one parseable line.

GREEN after the source change, `2026-09-15 17:33:16 UTC`, same HEAD, the filter now
modified too:

```
$ cd packages/sindarian-server && npx jest src/exceptions/base-exception-filter.test.ts
rc=0
Tests:       33 passed, 33 total

$ cd packages/sindarian-server && npm run test:e2e
rc=0
Tests:       29 passed, 29 total
```

Two of the four new cases are pins, not changes: `answers the message it was given, even a
mutated empty one` and `answers 500 for a value that only looks like an ApiException` were
GREEN at the RED head, because they record what the previous pass's two reductions already
answer. A pin cannot go red on its own, so each is proved by a mutant instead, M14 and M15
below, which is the only honest form of evidence available for a reduction whose whole
claim is that nothing could tell it apart.

The RED re-taken AT the code-final head is M16, which restores the record as an object and
changes nothing else: `unit rc=1, 16 failed / 21 passed; e2e rc=1, 4 failed / 25 passed`,
the same sixteen and the same four case names as the RED above, at `2f8936e`.

### RED before GREEN, a typed exception's message is a string

The last change of this pass, found by CodeRabbit and verified against the code before
being fixed. Assertions first, source untouched. Header at the RED: `2026-09-15 18:00:56
UTC`, `HEAD b5cc94a`, `git status --porcelain` =

```
 M packages/sindarian-server/src/exceptions/base-exception-filter.test.ts
```

```
$ cd packages/sindarian-server && npx jest src/exceptions/base-exception-filter.test.ts
rc=1
Tests:       4 failed, 33 passed, 37 total
  ● names the real status for an upstream problem object
    Expected: "string"   Received: "object"
  ● names the real status for a number
    Expected: "string"   Received: "number"
  ● names the real status for undefined
    Expected: "string"   Received: "undefined"
  ● names the real status for null
    Expected: "string"   Received: "object"
```

GREEN after the guard, `2026-09-15 18:01:20 UTC`, same HEAD, the filter modified too:

```
$ cd packages/sindarian-server && npx jest src/exceptions/base-exception-filter.test.ts
rc=0
Tests:       37 passed, 37 total
```

And the same five inputs through the real filter, reading the real `Response`, before and
after. Before, at `b5cc94a`:

```
message = "" (the pinned case)   -> 404 {"message":""}  typeof message = string
message = { title, detail }      -> 404 {"message":{"title":"Gateway Timeout","detail":"cpf 123.456.789-00"}}  typeof message = object
message = 42                     -> 404 {"message":42}  typeof message = number
message = undefined              -> 404 {}  typeof message = undefined
message = null                   -> 404 {"message":null}  typeof message = object
```

After, at the code-final head `2f8936e`:

```
message = "" (the pinned case)   -> 404 {"message":""}  typeof message = string
message = { title, detail }      -> 404 {"message":"Upstream error body carried no problem details (status 404)"}  typeof message = string
message = 42                     -> 404 {"message":"Upstream error body carried no problem details (status 404)"}  typeof message = string
message = undefined              -> 404 {"message":"Upstream error body carried no problem details (status 404)"}  typeof message = string
message = null                   -> 404 {"message":"Upstream error body carried no problem details (status 404)"}  typeof message = string
```

The taxpayer id and the upstream's `title` are gone from the body, the field is never
missing, the status is named rather than overwritten with a 500 sentence, and the pinned
empty string is untouched.

### RED before GREEN, rebuilding the log record

Assertions first, source untouched, on top of a fresh merge of `origin/develop` (`096af65`,
merged clean with no conflict). Header at the RED: `2026-09-15 16:02:58 UTC`, `HEAD
8784c79`, `git status --porcelain` =

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
  ● BaseExceptionFilter › an unexpected error › writes the Error text and its stack to the server log
  ● BaseExceptionFilter › an unexpected error › writes the text of a thrown object that is not an Error
  ● BaseExceptionFilter › an unexpected error › writes a thrown value that has no message at all
  ● BaseExceptionFilter › an unexpected error › keeps the fields beside an empty message
  ● BaseExceptionFilter › an unexpected error › prints a nested body to its leaf rather than [Object]
  ● BaseExceptionFilter › an unexpected error › bounds a thrown value of a megabyte
  ● BaseExceptionFilter › an unexpected error › bounds an Error message of a megabyte
  ● BaseExceptionFilter › an unexpected error › writes a thrown string
  ● BaseExceptionFilter › an unexpected error › writes a line for a thrown null without throwing
  ● BaseExceptionFilter › an unexpected error › answers and writes a line for a thrown undefined
Tests:       10 failed, 16 passed, 26 total

$ npm run test:e2e
rc=1
  ● Whatever a route throws, the body carries a string message › answers JSON with a body at all, for a thrown null
    Expected substring: "\"value\":\"null\""
    Received string:    "[[\"Unhandled exception\",{\"name\":\"object\",\"message\":null}]]"
  ● Whatever a route throws, the body carries a string message › answers JSON with a body at all, for a thrown undefined
    Expected substring: "\"value\":\"undefined\""
    Received string:    "[[\"Unhandled exception\",{\"name\":\"undefined\"}]]"
Tests:       2 failed, 27 passed, 29 total
```

The two `Received` values ARE the defect read off the real pipeline: the record a thrown
`null` and a thrown `undefined` produced carried the shape's name and nothing about the
failure, because the value itself was never written.

GREEN after the filter change, `2026-09-15 16:04:21 UTC`, same `HEAD 8784c79` with the
source modified, `npm run build` rc=0 first:

```
$ npx jest src/exceptions/base-exception-filter.test.ts
rc=0
Tests:       26 passed, 26 total

$ npm run test:e2e
rc=0
Test Suites: 2 passed, 2 total
Tests:       29 passed, 29 total
```

Re-taken at that pass's code-final head `4677bd4` (`2026-09-15 16:38:29 UTC`, `packages` clean
before), with only `base-exception-filter.ts` held at `8784c79`, the state this pass
started from, and every assertion at HEAD. `dist` rebuilt in between, source restored with
`git checkout HEAD -- <file>` and `git status --porcelain packages` empty afterwards. It
covers both code changes at once, since both are in that one file:

```
$ npx jest src/exceptions/base-exception-filter.test.ts
rc=1
  ● BaseExceptionFilter › an unexpected error › writes the Error text and its stack to the server log
  ● BaseExceptionFilter › an unexpected error › writes the text of a thrown object that is not an Error
  ● BaseExceptionFilter › an unexpected error › writes a thrown value that has no message at all
  ● BaseExceptionFilter › an unexpected error › keeps the fields beside an empty message
  ● BaseExceptionFilter › an unexpected error › prints a nested body to its leaf rather than [Object]
  ● BaseExceptionFilter › an unexpected error › bounds a thrown value of a megabyte
  ● BaseExceptionFilter › an unexpected error › bounds a name of a megabyte
  ● BaseExceptionFilter › an unexpected error › bounds an Error message of a megabyte
  ● BaseExceptionFilter › an unexpected error › writes a thrown string
  ● BaseExceptionFilter › an unexpected error › writes a line for a thrown null without throwing
  ● BaseExceptionFilter › an unexpected error › answers a body when reading the thrown value throws
  ● BaseExceptionFilter › an unexpected error › ignores a custom inspection function on the thrown value
  ● BaseExceptionFilter › an unexpected error › answers and writes a line for a thrown undefined
Tests:       13 failed, 16 passed, 29 total

$ npm run test:e2e
rc=1
  ● Whatever a route throws, the body carries a string message › answers JSON with a body at all, for a thrown null
  ● Whatever a route throws, the body carries a string message › answers JSON with a body at all, for a thrown undefined
Tests:       2 failed, 27 passed, 29 total
```

### RED before GREEN, the fail-safe write

Assertions first, source untouched. Header at the RED: `2026-09-15 16:28:13 UTC`,
`HEAD 016092d`, `git status --porcelain` =
` M packages/sindarian-server/src/exceptions/base-exception-filter.test.ts`.

```
$ npx jest src/exceptions/base-exception-filter.test.ts
rc=1
  ● BaseExceptionFilter › an unexpected error › bounds a name of a megabyte
    Received length: 1000000
  ● BaseExceptionFilter › an unexpected error › answers a body when reading the thrown value throws
    Rejected to value: [Error: this getter is the trap]
  ● BaseExceptionFilter › an unexpected error › ignores a custom inspection function on the thrown value
    this inspector is the trap
Tests:       3 failed, 26 passed, 29 total
```

`Rejected to value` is the defect in two words: the filter did not answer, it threw, and
nothing above it catches a filter.

GREEN after the guard, `2026-09-15 16:28:46 UTC`, same HEAD with the source modified,
`npm run build` rc=0 first:

```
$ npx jest src/exceptions/base-exception-filter.test.ts
rc=0
Tests:       29 passed, 29 total

$ npm run test:e2e
rc=0
Tests:       29 passed, 29 total

$ npm test
rc=0
Tests:       865 passed, 865 total
```

**The inert reduction, proved before deleting it.** `ApiException`'s constructor already
runs its message through `toProblemMessage`, so the filter's second call was the identity
function. Two probes at `8784c79`, each built and run in full:

```
# probe A: { message: exception.message }
unit rc=0 Tests: 21 passed, 21 total   e2e rc=0 Tests: 28 passed, 28 total
# probe B: { message: exception.message || UNCLASSIFIED }   (the literal pre-PR expression)
unit rc=0 Tests: 21 passed, 21 total   e2e rc=0 Tests: 28 passed, 28 total
```

Nothing in either suite could tell the three versions apart, which is what an inert call
looks like from the outside. It is gone, and the line reads `{ message: exception.message }`.

### RED before GREEN, widening the redaction to every shape

Assertions first, source untouched, on top of a fresh merge of `origin/develop`
(`ea23be7`, merged clean with no conflict). Header at the RED: `2026-09-15 13:59:24 UTC`,
`HEAD 1ac3ff5`, `git status --porcelain` =

(That merge commit was `88c9956` when the run happened. The reword recorded below rewrote
every commit above the breaking one, so the same tree now sits at `1ac3ff5`; the shas in
this section are the current ones, and `88c9956` no longer exists on the branch.)

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

GREEN after the filter change, `2026-09-15 14:01:02 UTC`, same `HEAD 1ac3ff5` with the
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

M1 to M12 were applied at `4677bd4`, `dist` rebuilt, run, then reverted with
`git checkout -- <file>`, with `git status --porcelain` verified empty after every revert
(`clean-after-Mn=0` printed each time), `2026-09-15 16:33:53 UTC` onward. M16 to M18 were
applied the same way at the code-final head `2f8936e`, `2026-09-15 18:02:18 UTC` onward,
and the counts printed for M13 to M15 are from the run at `712f004`, before the four
`ApiException` cases existed. Each was reverted with `git checkout -- <file>` and
`clean-after-Mn=0` printed. e2e is out of 29 throughout.

**Each row's counts belong to the head that row names, and the bases differ.** M1 to M12
are out of 29 cases at `4677bd4`; M13 to M15 are out of 33 at `712f004`; M16, M17 and M18
are out of 37 at the code-final head `2f8936e`. Two earlier sentences here said otherwise,
that M13 to M16 gave identical results across two heads and that the whole table had been
re-measured at one head. Neither can be true: the `ApiException` fix added four cases, so
a file of 33 and a file of 37 cannot print the same totals even when the same single case
dies. Every KILL in the table reproduces; it is the totals that are per-head.

A review of the table before this correction reproduced every row except M4, whose printed
numbers belonged to a strictly smaller mutation than the one the row described; M4 below is
the mutation as written, with the numbers it actually prints.

M13 to M16 have since been re-taken at the code-final head of the follow-up lane,
`547f176`, out of 896 unit cases and 32 e2e:
`docs/plans/2026-09-15-typed-exception-fail-safe.md`. M14 there is applied as this row
writes it, which is the reading that also removes the `typeof` guard, and M16 lands on all
three writers because the serialisation moved into one function.

| # | Mutation | Result |
|---|---|---|
| M1 | the response goes back to reading the thrown value, `toProblemMessage(exception instanceof Error ? exception : exception?.message, ...)`, i.e. the previous version of this branch | unit rc=1, **5 failed** / 24 passed; e2e rc=1, **2 failed** / 27 passed: `keeps no part of an upstream problem object` and `keeps no part of a thrown object whose message is a string` |
| M2 | the `ApiException` narrowing dropped (`false && exception instanceof ApiException`), so a typed exception is redacted like anything else | unit rc=1, **4 failed** / 25 passed: `should handle ApiException with getStatus method`, `names the real status when the message is empty`, `never redacts an ApiException, which is an Error too`, `should handle ApiException with custom status codes`; e2e rc=0, 29 passed, which is found-not-fixed item 3 in one line |
| M3 | the whole `console.error` write removed | unit rc=1, **13 failed** / 16 passed; e2e rc=1, **8 failed** / 21 passed |
| M4 | the optional chaining dropped from the log reads, as written (`exception.name`, `exception.message`) | unit rc=1, **2 failed** / 27 passed; e2e rc=1, **2 failed** / 27 passed. With the guard in place this no longer takes the response down, it degrades the line to the fallback record, which is the point of the guard |
| M5 | `code` dropped from the body | unit rc=1, **11 failed** / 18 passed; e2e rc=1, **8 failed** / 21 passed |
| M6 | the log write put back behind `if (exception instanceof Error)`, i.e. the previous version of this branch | unit rc=1, **11 failed** / 18 passed; e2e rc=1, **6 failed** / 23 passed |
| M7 | the 2000-character bound dropped from all three fields, record shape otherwise unchanged | unit rc=1, **3 failed** / 26 passed, one per bounded field; e2e rc=0, 29 passed |
| M8 | the render depth back to the default (`inspect(exception, { breakLength: Infinity, customInspect: false })`) | unit rc=1, **1 failed** / 28 passed; e2e rc=1, **1 failed** / 28 passed: `keeps no part of an upstream problem object`, on the `[Object]` assertion |
| M9 | `message` back to the nullish fallback, `message ?? exception`, i.e. the previous version of this branch | unit rc=1, **4 failed** / 25 passed; e2e rc=0, 29 passed |
| M10 | `customInspect: false` dropped, so rendering runs the value's own inspector again | unit rc=1, **1 failed** / 28 passed: `ignores a custom inspection function on the thrown value`; e2e rc=0, 29 passed |
| M11 | the guard around the write removed | unit rc=1, **1 failed** / 28 passed: `answers a body when reading the thrown value throws`, which REJECTS rather than answering; e2e rc=0, 29 passed |
| M12 | the bound dropped from `name` only | unit rc=1, **1 failed** / 28 passed: `bounds a name of a megabyte`; e2e rc=0, 29 passed |
| M13 | `compact: true` dropped from the render, so the value breaks at three levels deep again | unit rc=1, **1 failed** / 32 passed: `writes a three-level upstream body on one line`; e2e rc=0, 29 passed (at `712f004`, 33 cases) |
| M14 | the pre-PR `ApiException` fallback restored (`exception.message \|\| UNCLASSIFIED`), i.e. the previous version of this branch | unit rc=1, **1 failed** / 32 passed: `answers the message it was given, even a mutated empty one`; e2e rc=0, 29 passed (at `712f004`, 33 cases, where this branch carried no `typeof` guard yet, so the mutation is the fallback alone; the same text at a head that HAS the guard removes that too, and kills six) |
| M15 | the narrowing duck-typed (`instanceof ApiException \|\| typeof exception?.getStatus === 'function'`) | unit rc=1, **1 failed** / 32 passed: `answers 500 for a value that only looks like an ApiException`; e2e rc=1, **1 failed** / 28 passed: `answers 500 for a plain HttpException, and redacts it too` (at `712f004`, 33 cases) |
| M16 | the record handed to `console.error` as an OBJECT again, i.e. the previous version of this branch | unit rc=1, **16 failed** / 21 passed; e2e rc=1, **4 failed** / 25 passed (at `2f8936e`, 37 cases) |
| M17 | the string guard removed from the `ApiException` branch (`{ message: exception.message }`), i.e. the previous version of this branch | unit rc=1, **4 failed** / 33 passed, one per non-string shape; e2e rc=0, 29 passed |
| M18 | the guard's fallback as `UNCLASSIFIED` instead of `noProblemDetails(status)`, so a 404 says `Internal server error` | unit rc=1, **4 failed** / 33 passed; e2e rc=0, 29 passed |

M1 and M6 are the first pair, the two halves of one narrowing: M1 is the text reaching the
wire, M6 is the text reaching nothing at all. M7, M8 and M9 are the log record's three, one
per defect review found in it. M10, M11 and M12 are the fail-safe's three. Every one of
them was live behaviour on some earlier head of this branch with no test that could see it,
which is why they are recorded as previous versions rather than as invented edits.

M13 to M16 are this pass, and M16 is the one that matters: it restores the record as an
OBJECT, which is what the previous head shipped, and twenty cases go red where none could
before. M13 is the narrower half, and it kills on the unit side only, which is correct and
worth saying plainly: with the record serialised as JSON, a value broken over three lines
is still ONE physical line, its breaks carried as escapes. Dropping `compact: true` costs
readability inside the record, not the line, so the only assertion that can see it is the
one reading `value` itself.

M17 and M18 are the `ApiException` branch's two halves: M17 is a non-string message
reaching the browser as it was, M18 is the replacement naming the wrong status. Both kill
on the unit side only, because the e2e app's routes throw values a constructor never saw
and no e2e route mutates a typed exception.

M14 and M15 are pins for two reductions this branch made and argued in comments rather than
measured. M14 is the `ApiException` message fallback: the reduction is unreachable through
the constructor, which always substitutes a sentence, so the case mutates `.message` to
empty AFTER construction, which is the only input that can tell the two versions apart.
M15 is the `getStatus` guard the same pass deleted: the narrowing is `instanceof`, not a
duck-type, and M15 proves it by making it a duck-type and watching a plain `HttpException`
stop being redacted.

Unit counts for M1 to M12 are out of 29, for M13 to M15 out of 33, and for M16 to M18 out of
37: this pass added four cases, three reading the physical log line and one reading the
mutated empty message, and M16 onward were taken after them.

M5 is also the pin that closed a gap a review found: two e2e cases asserted the status and
the message but not `code`, so the headline table was pinned for five of the seven routes
that existed then. Both assert it now, and M5 kills 8 e2e cases where it used to kill 5.

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
ports at `9ded7ed`, at `24a7777`, at `4677bd4`, and once more at the code-final head
`2f8936e` with the command and exit code pasted beside the table. Identical output every time: this PR
changes nothing on the transport frame, redaction included, because an `ApiException` is
narrowed off before it.

### The breaking footer was reworded, and that rewrote the branch

`conventional-changelog` renders the `BREAKING CHANGE:` footer of the one `feat!` commit as
the `### BREAKING CHANGES` section of the release notes, and this repo has squash merge
disabled (`allow_squash_merge=false`), so that commit lands on `develop` verbatim. Its
footer still carried the migration advice this document retracted two passes ago: classify
on the status and the code. Measured through the real pipeline, every unexpected error
answers the same status and the same code, so a consumer following it would turn a targeted
retry into a retry on every deterministic bug. The retraction had reached the plan and the
PR description, which is to say the two artefacts nobody outside the repo reads, and not
the one that ships.

The footer now says what shipped and what to do: one body for every shape, the real text in
the operator log, do not branch on the message text and do not re-point that branch at the
status or the code, typed exceptions unchanged.

Reworded with `GIT_SEQUENCE_EDITOR` marking `reword` and `git rebase -i --rebase-merges -S`,
which rewrote the five commits above it, merge included. Verified: the tree is byte-identical
to the pre-rebase head (`git diff` between them is empty, and `HEAD^{tree}` is the same
object), and every commit on the branch still reads `G` under `fred@fredamaral.com.br`.
