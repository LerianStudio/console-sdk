# Close the status and base-class gaps of the typed exception branch

- **Repository**: `LerianStudio/console-sdk`, package `@lerianstudio/sindarian-server`
- **Branch**: `fix/typed-branch-status-and-base-class`, cut from `origin/develop` at `19839e9`
- **Baseline at the cut**: unit 897 passed / 38 suites, e2e 32 passed / 2 suites
- **Code-final head**: `c5ee916`, unit 934 passed / 39 suites, e2e 33 passed / 2 suites
- **Predecessor**: PR #191 (merged as `f4e17ae`, released `2.0.0-beta.5`). This lane closes what
  the review of that PR found after it merged, so every item here lands on `develop` as a
  follow-up rather than as a push to a closed branch.
- **Not a breaking change.** Nothing a caller could reach through this package's own constructors
  changes shape; what changes is what happens to the shapes that used to produce NO response at
  all. The one wire-visible change of the 2.0.0 line, the operator log's second argument, shipped
  in #190 and is restated below because the release notes could not carry it.

## Phase overview

| # | Epic | Lands |
|---|---|---|
| 1 | The two exception readers become part of the published surface | `ecfb7eb` |
| 2 | A status that cannot carry a body is refused | `798bc6c` |
| 3 | The base class answers a guarded message | `f82cc22` |
| 4 | The operator record is built inside the guard that writes it | `0ea9582` |
| 5 | The bound covers keys, at any depth | `31c9fd5` |
| 6 | Two orphaned doc blocks reattached, three numbers corrected | `ba3bbd1` |
| 7 | The list shape of a bounded record pinned | `aed0e2a` |
| 8 | A cut key never swallows another field (review round) | `d0683c6` |
| 9 | A cut key never outgrows the ceiling either (review round) | `c5ee916` |

## Epic 1: the readers are published (`ecfb7eb`)

**Task 1.1.** `readWireMessage` and `readWireStatus` are exported from the package barrel.

An application that renders its own envelope, which is what Product Console does, reads the
status and the message off the exception itself. Both are values a subclass owns, both were
guarded only INSIDE this package, and neither reader could be imported, so a consumer could not
adopt the guard even knowingly.

**Task 1.2.** The e2e app's own filter, which is the shape an application copies, now builds its
response status with `readWireStatus(exception)` instead of `exception.getStatus()`.

RED, `2026-09-15 23:51:44 UTC`, head `19839e9`, tree carrying only the filter change:

```
$ npm run test:e2e
rc=1
app/app-exception-filter.ts:7:3 - error TS2305: Module '"@lerianstudio/sindarian-server"' has no exported member 'readWireStatus'.
Tests:       0 total
```

GREEN, `2026-09-15 23:52:05 UTC`, same head, export added:

```
$ npm run test:e2e
rc=0
Tests:       32 passed, 32 total

$ npx jest
rc=0
Tests:       897 passed, 897 total
```

## Epic 2: a status that carries no body is refused (`798bc6c`)

**Found by the contrarian of #191, REFUTED there with a live measurement.** `readWireStatus`
admitted 204, 205 and 304: each is an integer in 200 to 599, so the band check passed it, and the
runtime then refuses it the moment a body is attached, with a `TypeError` rather than the
`RangeError` the band was built against. A filter that throws escapes the request pipeline, so
the route answered a ZERO-BYTE body with no content-type, which is exactly the failure #191 says
it closed. No override is needed to reach it: `NO_CONTENT`, `RESET_CONTENT` and `NOT_MODIFIED`
are members of this package's own `HttpStatus` enum and type-legal in `ApiException`'s
constructor.

**Task 2.1.** `readWireStatus` refuses the three null-body statuses alongside the out-of-band
ones. **Task 2.2.** The band is pinned on the function itself, at both ends (199, 200, 599, 600)
and with a fractional in-range status, because both frames that read a status mock
`NextResponse.json` in their own tests and no mock refuses a status. **Task 2.3.** A route
throwing a 204 `ApiException` drives a REAL `Response` through the e2e app.

RED, `2026-09-15 23:53:30 UTC`, head `ecfb7eb`:

```
$ npx jest src/utils/error
rc=1
  ● readWireStatus › answers 500 for the unusable status 204
  ● readWireStatus › answers 500 for the unusable status 205
  ● readWireStatus › answers 500 for the unusable status 304
Tests:       3 failed, 34 passed, 37 total

$ npm run test:e2e
rc=1
  ● A typed exception carries a bounded sentence, however it was written › answers a body for a status that carries none
    TypeError: Response constructor: Invalid response status code 204
Tests:       1 failed, 32 passed, 33 total
```

GREEN, `2026-09-15 23:54:14 UTC`, same head:

```
$ npx jest
rc=0
Tests:       914 passed, 914 total

$ npm run test:e2e
rc=0
Tests:       33 passed, 33 total
```

## Epic 3: the base class answers a guarded message (`f82cc22`)

**Found by the security and test reviewers of #191.** `HttpException` is exported from the
package barrel and is the TYPE an application's filter declares, so a plain `HttpException` there
reaches the base class and not the subclass. Its `getResponse()` returned `this.message` raw: no
read guard, no bound, no fallback. All three defects #191 closed on `ApiException` still
reproduced on its parent.

**Task 3.1.** `HttpException.getResponse()` reads through `readWireMessage`, with the
constructor's own status-naming fallback, and the status for that sentence through
`readWireStatus`. **Task 3.2.** `ApiException.getResponse()` spreads `super.getResponse()` rather
than reading the message a second time: ONE reader, and spreading the base class last is also
what keeps metadata under the named fields.

RED, `2026-09-15 23:55:12 UTC`, head `798bc6c`:

```
$ npx jest src/exceptions/http-exception.test.ts
rc=1
  ● HttpException › a message written after construction › answers a sentence naming the real status for an upstream problem object
    Expected: "Upstream error body carried no problem details (status 404)"
    Received: {"detail": "cpf 123.456.789-00", "title": "Gateway Timeout"}
  ● HttpException › a message written after construction › answers a sentence naming the real status for undefined
    Received: undefined
  ● HttpException › a message written after construction › bounds a five-megabyte message at two thousand characters
    Expected length: 2000
    Received length: 5000000
Tests:       6 failed, 3 passed, 9 total
```

GREEN, `2026-09-15 23:56:08 UTC`, same head:

```
$ npx jest
rc=0
Tests:       920 passed, 920 total

$ npm run test:e2e
rc=0
Tests:       33 passed, 33 total

$ npm run lint
rc=0
```

## Epic 4: the record is built inside the guard that writes it (`0ea9582`)

**Found by the security reviewer of #191.** `logErrorLine` wrapped `JSON.stringify`, but the
record came from `this.describeRequestError(...)` evaluated as its ARGUMENT, one frame outside
the guard and inside `request`'s own try. `describeRequestError` is documented as overridable, so
an override that throws turned an upstream 409 into the 503 that means "the upstream never
answered", and wrote no line to say why.

**Task 4.1.** `logErrorLine` takes a FUNCTION and calls it inside the same guard as the write.
All four call sites hand one over, so every builder is covered, including the `String(error)` in
`onRequestFailure` that throws on a symbol. **Task 4.2.** A record that cannot be built or cannot
be serialised is announced with its bounded reason, so the missing fields have an explanation.
The existing cyclic case gains that reason, which is a deliberate change to what that line says.

RED, `2026-09-15 23:58:35 UTC`, head `f82cc22`:

```
$ npx jest src/services/http-service.test.ts
rc=1
  ● HttpService › one failed call is one physical log line › keeps the real status when the record cannot be built
    expect(received).not.toBeInstanceOf(expected)
    Expected constructor: not ServiceUnavailableApiException
  ● HttpService › one failed call is one physical log line › bounds the reason a record could not be built
Tests:       2 failed, 66 passed, 68 total
```

GREEN, `2026-09-15 23:59:59 UTC`, same head:

```
$ npx jest
rc=0
Tests:       922 passed, 922 total

$ npm run test:e2e
rc=0
Tests:       33 passed, 33 total

$ npm run lint
rc=0
```

## Epic 5: the bound covers keys, at any depth (`31c9fd5`)

**Found by both reviewers of #191.** The replacer bounded string VALUES only: a KEY passed
through at whatever length an upstream sent it, and nothing pinned the at-any-depth half either,
so a bound narrowed to the top level passed all 897 cases. Both reach the record through
`describeRequestError`, the hook whose own documentation warns against spreading an upstream
body into it.

**Task 5.1.** Keys are cut at the same ceiling, wherever they sit. The object is rebuilt ONLY
when a key is actually over the ceiling, so an object that needs no cutting keeps its identity
and the serialiser's own cycle detection still refuses a cycle as a cycle instead of walking
copies of it. **Task 5.2.** The guarantee is pinned on the function itself, in a new test file:
the three records this package writes are all flat with fixed short keys, so no assertion through
a caller could see either half.

RED, `2026-09-16 00:01:15 UTC`, head `0ea9582`:

```
$ npx jest src/utils/error/log-error-line.test.ts
rc=1
  ● logErrorLine › bounds a key at two thousand characters
    Expected length: 2000
    Received length: 5000
  ● logErrorLine › bounds a key three levels down
Tests:       2 failed, 5 passed, 7 total
```

GREEN, `2026-09-16 00:01:52 UTC`, same head:

```
$ npx jest
rc=0
Tests:       929 passed, 929 total

$ npm run test:e2e
rc=0
Tests:       33 passed, 33 total

$ npm run lint
rc=0
```

## Epic 6: the doc blocks and the numbers (`ba3bbd1`)

**Task 6.1. Two orphaned JSDoc blocks reattached.** #191 inserted a new block BETWEEN an existing
block and the declaration it documented, twice, so the published types carried no description at
all for `toProblemMessage` and two stacked blocks on `ApiException.getResponse()`. Verified on
the emitted types after `npm run build` at `ba3bbd1`: `dist/utils/error/to-problem-message.d.ts`
now declares `toProblemMessage` with its own block directly above it, and
`dist/exceptions/api-exception.d.ts` carries one.

**Task 6.2. `util.inspect` defaults.** The mechanism sentence quoted `breakLength: 128`. Measured
on the runtime this package is built against:

```
$ node -e "console.log(require('util').inspect.defaultOptions.breakLength, require('util').inspect.defaultOptions.compact, process.version)"
80 3 v24.21.0
```

`compact: 3` was right; 128 was not. The conclusion survives a fortiori, the real threshold being
lower, and the number is corrected in `log-error-line.ts`, `http-service.test.ts` and
`base-exception-filter.test.ts`.

**Task 6.3. Physical lines, not newline characters.** The e2e comment said "seventeen physical
lines" for the old-way rendering of the error record. Measured in situ at this head, by
formatting the parsed record the old way inside that very test and counting both ways, twice:

```
INSITU error newlines=16 lines=17
INSITU object newlines=3 lines=4
```

So SEVENTEEN is the line count here and sixteen is the newline count, and the file's own
definition of one physical line, zero newlines, is the arithmetic that settles it. The review of
#191 measured the same rendering in another copy and got 17 newlines / 18 lines: the count
follows the stack's frames and what they render to, which is why the comment now says which
number it is quoting and that one line is the only fact in it. The `SEVEN` and `fifteen` the
filter's own comment cites come from the #190 harness over a record that still held the thrown
value itself, and both files now say so rather than implying one runner.

**Task 6.4. TECHNICAL.md.** The status paragraph no longer equates "a number no response can
carry" with "outside 200 to 599". The message paragraph names the base class as the reader.
The bound paragraph says keys and depth, and says the bound is per string and not on their
number. Two paragraphs are added: how an application builds its own response status
(`readWireStatus`, never `getStatus()` on that frame), and the log-shape change below.

**The 2.0.0 log-shape sentence.** The second argument of every `console.error` this package
writes is a JSON STRING since 2.0.0, where it used to be a record OBJECT. That is the package's
ordinary output on every unreachable upstream and every failed response, not an exotic shape, and
a consumer that read that argument as an object, a test asserting `toHaveBeenCalledWith('Request
failed', { method: 'GET' })` or a console-to-structured-logger bridge, sees a string now. It
shipped inside the 2.0.0 major that #190 opened, so this lane is not breaking and carries no
footer, but the sentence now exists in TECHNICAL.md, which is what the release notes could not
carry.

## Epic 7: the list shape of a bounded record (`aed0e2a`)

Bounding a key means rebuilding the object that owns it, and an array is an object. The rebuild
is already skipped when nothing needs cutting, which covers every ordinary list, so the array
guard only earns its place for an array carrying a NAMED property over the ceiling beside its
indices. Mutant N19 survived without this case; it dies with it.

## Epic 8: a cut key never swallows another field (`d0683c6`)

**Raised by CodeRabbit on PR #192, and real.** Bounding a key is a rename, and two keys that
share their first 2000 characters rename to the SAME key: an object holds one of those, the later
field wins, and the earlier one leaves the record with nothing saying it was there. An upstream
field map keyed by long URNs is exactly the shape that shares a prefix. A cut key can also land on
a key that was already exactly at the ceiling. So the bound this lane added was itself a way to
lose a field from the last copy of what broke.

**Task 8.1.** A cut key that would land on a name already in the object carries a mark built from
its own entry index, so it is stable for a given record rather than a count of collisions seen so
far. Keys that were never over the ceiling are seeded first and are never the ones that move.

RED, `2026-09-16 00:26:37 UTC`, head `d9b2ef7`:

```
$ npx jest src/utils/error/log-error-line.test.ts
rc=1
  ● logErrorLine › keeps both fields when two keys share their first two thousand characters
    Expected length: 2
    Received length: 1
  ● logErrorLine › keeps both fields when a cut key lands on an existing one
Tests:       2 failed, 8 passed, 10 total
```

GREEN, `2026-09-16 00:27:03 UTC`, same head:

```
$ npx jest
rc=0
Tests:       934 passed, 934 total

$ npm run test:e2e
rc=0
Tests:       33 passed, 33 total

$ npm run lint
rc=0

$ npm run build
rc=0
```

## Epic 9: a cut key never outgrows the ceiling either (`c5ee916`)

**Raised by CodeRabbit on PR #192, second round, and real.** The mark that keeps a cut key unique
grew by one character per retry, and the slice that makes room for it was not floored: a record
whose keys are an upstream's own can occupy the first candidates deliberately, and after about two
thousand of them the slice end went negative and the writer emitted a key SEVEN THOUSAND
characters long, inside the guard whose whole point is that one bad upstream cannot fill a log
sink. Verified against the code as it stood before the fix, first as a standalone reproduction of
`boundKey` with 2100 candidates occupied (`candidate length = 7000`), then in situ.

**Task 9.1.** The mark counts in DIGITS, `~<index>` then `~<index>.<attempt>`, so its length grows
logarithmically and cannot approach the ceiling before the record runs out of names to collide
with. The slice end is floored at zero, and the retry loop is bounded by `taken.size`, which is at
most one name per entry.

RED, `2026-09-16 00:41:30 UTC`, head `1c72d16`:

```
$ npx jest src/utils/error/log-error-line.test.ts
rc=1
  ● logErrorLine › holds the ceiling against a record that occupies the candidates
    Expected: 2000
    Received: 7000
Tests:       1 failed, 11 passed, 12 total
```

GREEN, `2026-09-16 00:42:37 UTC`, same head:

```
$ npx jest
rc=0
Tests:       934 passed, 934 total

$ npm run test:e2e
rc=0
Tests:       33 passed, 33 total

$ npm run lint
rc=0

$ npm run build
rc=0
```

## Found, not fixed

1. **Product Console still builds its response status with `exception.getStatus()`**
   (`src/app/api/shared/route-handler-utils.ts`). The reader it needs is now exported and
   documented; adopting it is a console lane, deliberately out of scope here.
2. **A cyclic record whose key is ALSO over the ceiling** runs out of stack instead of being
   refused as a cycle. Both end in the same written line, the announcement with its reason, and
   the shape needs a cycle and a 2000-character key in one record.
3. **The bound is per string, not per record.** Ten thousand short fields are ten thousand short
   fields. Nothing this package writes has more than six; an override that returns an upstream's
   field map decides its own width, and that is now stated rather than implied.
4. **The operator log is unredacted, including the reason a record could not be built.** That
   reason is an override's own error text. The posture is #190's, documented in TECHNICAL.md and
   in the writer itself: redaction is the consumer's log pipeline, and the cheaper fix is at the
   throw site.
5. **A plain `HttpException` is still answered 500 by the package filter**, whatever status it
   carries. Pinned by an e2e case since #190, unchanged here.

## Corrections to earlier plans in this repository

- `docs/plans/2026-09-14-server-error-message-string.md`, row M14: the amended text ended "the
  same text at a head that HAS the guard removes that too, and kills six" with no head named.
  Re-measured at `2f8936e`, the only head in that document carrying the `typeof` guard, in a
  throwaway worktree of that commit: 37 cases, mutation applied to the `ApiException` branch as
  `{ message: exception.message || UNCLASSIFIED }`, result `Tests: 5 failed, 32 passed, 37 total`.
  FIVE, not six: the four `names the real status for %s` cases plus `answers the message it was
  given, even a mutated empty one`. The row now says five and names the head.
- `docs/plans/2026-09-15-typed-exception-fail-safe.md`: the `breakLength: 128` figure is corrected
  to the measured 80, and the "seventeen physical lines" line now says which count it is.
- PR #191's body says "Two RED blocks before their fixes" while its plan documents FOUR, at lines
  178, 237, 283 and 313 of that file. A merged body cannot be corrected; it is recorded here.

## Verification

Every command below was run verbatim in `/srv/worktrees/sdk-typed-fix1`.

Package gates, `2026-09-16 00:42:37 UTC`, head `c5ee916`, `git status --porcelain` empty:

```
$ npm test
rc=0
Test Suites: 39 passed, 39 total
Tests:       932 passed, 932 total

$ npm run test:e2e
rc=0
Test Suites: 2 passed, 2 total
Tests:       33 passed, 33 total

$ npm run lint
rc=0

$ npm run build
rc=0
```

Monorepo root, `2026-09-16 00:46:45 UTC` onward, same head:

```
$ npm test
rc=0
 Tasks:    6 successful, 6 total

$ npm run test:e2e
rc=0
 Tasks:    5 successful, 5 total

$ npm run lint
rc=0
 Tasks:    5 successful, 5 total

$ npm run build
rc=0
 Tasks:    5 successful, 5 total

$ npm run test:e2e -- --filter=@lerianstudio/sindarian-server   # the CI job's arm
rc=0
@lerianstudio/sindarian-server:test:e2e: Tests:       33 passed, 33 total
 Tasks:    1 successful, 1 total
```

### Mutants

Eleven, all at the code-final head `c5ee916`, `2026-09-16 00:43:08 UTC` onward, each applied with
an exact single-occurrence replacement, `dist` rebuilt by the e2e run, reverted with `git checkout
-- packages`, and `clean-after-<id>=0` printed after every revert. Unit counts are out of 934 and
e2e out of 33 throughout. Numbering continues #191's, which ended at N10.

| # | Mutation | Result |
|---|---|---|
| N11 | the null-body statuses admitted again | unit rc=1, **4 failed**: the three `readWireStatus` rows and `names 500 when the status cannot be used either`; e2e rc=1, **1 failed**: `answers a body for a status that carries none` |
| N12 | the base class returns its message unread | unit rc=1, **15 failed** across both exception suites; e2e rc=1, **3 failed**: the object, the five-megabyte body and the throwing getter |
| N13 | the record built outside the write guard again | unit rc=1, **2 failed**: `keeps the real status when the record cannot be built` and `bounds the reason a record could not be built`; e2e rc=0 |
| N14 | the key bound removed | unit rc=1, **5 failed**: both `bounds a key` cases and the three collision cases; e2e rc=0 |
| N15 | the bound narrowed to the top level | unit rc=1, **5 failed**: both three-levels-down cases and the three collision cases; e2e rc=0 |
| N16 | the band widened by one, `status <= 600` | unit rc=1, **1 failed**: `answers 500 for the unusable status 600`; e2e rc=0. It survived every case of #191 |
| N17 | `Number.isInteger` dropped | unit rc=1, **1 failed**: `answers 500 for the unusable status 404.5`; e2e rc=0. It survived every case of #191 |
| N18 | the reason dropped from the announcement | unit rc=1, **4 failed**: the two build cases, the cyclic transport case and `announces a cyclic record with the reason`; e2e rc=0 |
| N19 | an array rebuilt like any other object | unit rc=1, **1 failed**: `keeps an array a list even when it carries an oversized name`; e2e rc=0. It SURVIVED at `ba3bbd1` and is what Epic 7 exists for |
| N20 | the whole uniquifier dropped, so cut keys merge again | unit rc=1, **3 failed**: the two `keeps both fields` cases and the ceiling case; e2e rc=0. It is the state the first review round found, and what Epic 8 exists for. Taken at `c5ee916` at `2026-09-16 00:45:52 UTC`, `clean-after-N20=0`. A narrower first version of this row, replacing only the FIRST candidate with the plain cut, survived and was discarded as equivalent: the retry loop recovers the mark, and a plain cut that collides with nothing is a correct name |
| N21 | the mark grown one character per retry again | unit rc=1, **1 failed**: `holds the ceiling against a record that occupies the candidates`; e2e rc=0. It is the state the second review round found, and what Epic 9 exists for |
