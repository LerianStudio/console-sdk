# Close the status and base-class gaps of the typed exception branch

- **Repository**: `LerianStudio/console-sdk`, package `@lerianstudio/sindarian-server`
- **Branch**: `fix/typed-branch-status-and-base-class`, cut from `origin/develop` at `19839e9`
- **Baseline at the cut**: unit 897 passed / 38 suites, e2e 32 passed / 2 suites
- **Code-final head**: `d7d7d6e`, unit 953 passed / 39 suites, e2e 40 passed / 2 suites (fix
  pass 2; fix pass 1 ended at `243cfa3` with 945 and 38, and every block written then keeps the
  head it was measured at). Every
  number in this document is measured at a head that is NAMED next to it; the earlier heads and
  their counts are kept where they are, because a RED block is only evidence at the head it was
  taken on. The whole ladder was measured in fix pass 1, `2026-09-16 02:11:25 UTC` onward, by
  running `npx jest` in `packages/sindarian-server` in a detached worktree of each head with
  `node_modules` copied in: `aed0e2a` 930, `d0683c6` 932, `c5ee916` 934, `d5d5e54` 934,
  `5f07567` 934, and this head 945
- **Predecessor**: PR #191 (merged as `f4e17ae`, released `2.0.0-beta.5`). This lane closes what
  the review of that PR found after it merged, so every item here lands on `develop` as a
  follow-up rather than as a push to a closed branch.
- **Not a breaking change, with one caveat that is measured rather than argued.** What changes is
  almost entirely what happens to the shapes that used to produce NO response at all. The
  exception, found by the security review of this PR: a plain `HttpException` whose CONSTRUCTOR
  message runs past 2000 characters now serves a truncated body, and that shape produced a
  perfectly good response before. Measured on both builds,
  `new HttpException('x'.repeat(5000), 404).getResponse().message.length` reads 5000 against
  `origin/develop` (`getResponse()` there is `{ message: this.message }`) and 2000 here.
  `ApiException` was already 2000 on both, so only the base class moves. The consumer that meets
  it is Product Console, whose `toExceptionResponse(exception: HttpException)` spreads
  `getResponse()` straight into its response. The release decision stands, everything landing
  inside the already-open 2.0.0 major, but the justification had framed the guard as touching only
  messages written AFTER construction, and that was false.
- **Provenance of the 2.0.0 log-shape change, corrected twice.** The operator log's second
  argument becoming a JSON STRING shipped with PR #191, released as `2.0.0-beta.5`. NOT with #190,
  which shipped as `2.0.0-beta.4`. **Corrected again in fix pass 2, after the contrarian refuted
  the replacement sentence as well**: fix pass 1 wrote that #190 "opened the major" and that its
  release was `2.0.0-beta.3`, and both are false. `git log --format='%h %ad %s' --date=iso-strict
  -- packages/sindarian-server/package.json` puts `2.0.0-beta.1` at `c471157`,
  `2026-09-09T14:06:18Z`, immediately after PR #183, which left the line six days and three
  releases old (`beta.1`, `beta.2`, `beta.3`) by the time #190 merged at `92fadc7`,
  `2026-09-15T18:25:01Z` (**corrected in fix pass 3**: the earlier phrasing, "six days and three
  releases before #190 merged", reads as three releases having happened in between, and two did,
  `beta.2` at `0259453` and `beta.3` at `b6d0be6`; Task 21.5 declared this corrected while
  correcting TECHNICAL.md and the PR body only); `7dd44f6 chore(sindarian-server): release
  v2.0.0-beta.4` lands 94 seconds after that merge, so `2.0.0-beta.3` is the version in the TREE
  at the merge, before semantic-release bumped, and `2.0.0-beta.4` is the release #190 shipped as.
  `git ls-tree -r 7dd44f6 -- packages/sindarian-server/src/utils/error/` lists no
  `log-error-line.ts`, so the practical guidance stands unchanged; the release it names did not.
  Measured also:
  `git ls-tree -r 92fadc7 -- packages/sindarian-server/src/utils/error/` (the #190 merge, whose
  `package.json` reads `2.0.0-beta.3` for that reason) lists no `log-error-line.ts`, and at that
  commit
  `http-service.ts:289` still reads `console.error('Request failed', {`, the record OBJECT.
  `f4e17ae` (the #191 merge) is where the file first appears, and `19839e9` is the release commit
  that bumped to beta.5. A consumer pinned to `2.0.0-beta.3` or `2.0.0-beta.4` still receives the
  object and has nothing to change yet, which is the opposite of what a release-facing sentence
  was telling them. TECHNICAL.md now names the release rather than the major.

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
| 10 | The adversarial key case walks the retry path in use (review round) | `d5d5e54` |
| 11 | The metadata a typed exception answers is read, not taken (fix pass 1) | `c59ccb4` |
| 12 | The line an unreachable upstream writes is pinned (fix pass 1) | `dec2481` |
| 13 | A record builder that throws a non-Error names the reason (fix pass 1) | `c4543ef` |
| 14 | A record's keys are measured without reading its values (fix pass 1) | `179d6df` |
| 15 | The mark on a cut key is documented as the code writes it (fix pass 1) | `ff1d297` |
| 16 | The fallback sentence is published beside its readers (fix pass 1) | `7ff938c` |
| 17 | Every null-body status is driven through a real Response (fix pass 1) | `85e6882` |
| 18 | The documents say what was measured (fix pass 1) | `cc897fd`, `243cfa3` |
| 19 | The code and title a route wrote are read, not taken (fix pass 2) | `615eb5e` |
| 20 | One read of metadata, and a reason no value can give, are pinned (fix pass 2) | `e1e3c7c`, `6e5b30a` |
| 21 | The documents qualify what the guards cost and keep (fix pass 2) | `4fb996d`, `eeb9ba3`, `d7d7d6e` |

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
All four call sites hand one over, so every builder is covered, `onRequestFailure`'s included.
**Corrected in fix pass 1:** this task originally justified itself with "the `String(error)` in
`onRequestFailure` that throws on a symbol", and that mechanism does not exist. `String(sym)` is
the one legal stringification of a symbol and never throws (only `${sym}` and `sym + ''` do), so
a thrown symbol walks that builder to a perfectly good line, before this change as much as after.
What actually throws in that builder is the read one operand over, `error.message`, when the
thrown Error carries a getter that throws, and Epic 12 below is the case that pins it.
**Task 4.2.** A record that cannot be built or cannot
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

So SEVENTEEN was the line count under that invocation and sixteen the newline count, and the
file's own definition of one physical line, zero newlines, is the arithmetic that settles it.

**Corrected in fix pass 1: the digit does not belong in the shipped comment, and the cause the
comment gave for the drift was wrong.** It is not copy-to-copy variation. It is how the suite is
invoked, and it reproduces on demand. Re-measured in situ on one build at `cc897fd`, by
formatting the parsed record the old way inside that very test:

```
$ npm run test:e2e            # the gate: two specs, so this one runs in a jest worker
INSITU error newlines=17 lines=18

$ npx jest e2e/error-shape.spec.ts
INSITU error newlines=16 lines=17

$ npx jest -i e2e/error-shape.spec.ts
INSITU error newlines=16 lines=17
```

Two suites make jest use a worker and the extra frame is the whole difference; `-i` changes
nothing. So the number Epic 6.3 pasted is the single-spec one while the gate the repository runs
gives one more, and a reader reproducing the comment's own procedure through `npm run test:e2e`
could never arrive at the digit it named. The comment now states the fact that holds, which is
the count this file actually asserts: one line, zero newlines. The `SEVEN` and `fifteen` the
filter's own comment cites come from the #190 harness over a record that still held the thrown
value itself, and both files say so rather than implying one runner.

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

**Corrected in fix pass 2: "since 2.0.0" is false for FOUR of the five published 2.0.0 versions,
and #190 did not open the major.** Four, not the two the reviewer who raised it named and not the
two an earlier draft of this paragraph repeated: `git ls-tree -r <release> --
packages/sindarian-server/src/utils/error/` lists no `log-error-line.ts` at `c471157` (beta.1),
`0259453` (beta.2), `b6d0be6` (beta.3) or `7dd44f6` (beta.4), and lists it at `19839e9` (beta.5).
The three middle releases still carry the record OBJECT literally, `console.error('Request
failed', {` in `http-service.ts`; beta.1 predates that writer entirely and logs
`console.error('Request error', { response, error })`, an object as well. Raised by the test reviewer, who found that this paragraph
still carried the pre-correction provenance while the header bullet above it carried the
correction, with nothing here flagging it, and by the contrarian, who found the header bullet's
replacement wrong as well. The measured sequence: the major opened at `2.0.0-beta.1`
(`c471157`, 2026-09-09); `beta.2` and `beta.3` follow; #190 merged (`92fadc7`) and shipped as
`beta.4` (`7dd44f6`); #191 merged (`f4e17ae`) and shipped as `beta.5` (`19839e9`), and that is
where `log-error-line.ts` first exists. So a consumer on `beta.3` or `beta.4` still receives the
record OBJECT and has nothing to change. What is not breaking is unchanged: everything lands
inside an already-open major. TECHNICAL.md names both releases and says neither opened the line.

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

GREEN, `2026-09-16 00:27:03 UTC`, same head. **Re-measured in fix pass 1 and corrected**: this
block pasted 934, and the tree it describes is the one `d0683c6` committed, which measures 932.
The two unit totals in this document were transposed, 934 here and 932 in the Verification block,
and both have now been re-run rather than reasoned about. Measured
`2026-09-16 02:11:25 UTC` in a detached worktree of `d0683c6` with `node_modules` copied in:

```
$ npx jest
rc=0
Test Suites: 39 passed, 39 total
Tests:       932 passed, 932 total

$ npm run test:e2e
rc=0
Tests:       33 passed, 33 total

$ npm run lint
rc=0

$ npm run build
rc=0
```

The neighbouring heads were measured the same way in the same worktree, so the ladder is on the
record rather than inferred: `c5ee916` and `d5d5e54` each read `Tests: 934 passed, 934 total`.

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

## Epic 10: the adversarial case walks the retry path in use (`d5d5e54`)

**Raised by CodeRabbit on PR #192, third round, and right.** The record in Epic 9's case occupied
the candidates the ONE-CHARACTER mark produced, which is what keeps that case red on the
implementation it was written against, but means the decimal retry collides once rather than two
thousand times. The case now occupies BOTH sequences, `~4200.1` through `~4200.2100` and the
legacy `~4200`, `~4200~`, `~4200~~` chain, so the bounded path is walked to its end AND the case
still fails on the growth it was written against.

Verified at `2026-09-16 00:53:59 UTC`, on the working tree at `d6332e8` carrying the reworked
case, which is the content `d5d5e54` then committed: it passes on the current implementation (12
of 12 in that file) and, with mutant N21 applied, fails with `Expected: 2000`, which is the proof
that it is still a regression test rather than only a shape test. The gates and the mutants below
are re-taken after that commit, at a head that carries it.

## Epic 11: the metadata a typed exception answers is read, not taken (`c59ccb4`)

**Found by the contrarian of this PR, with a live probe at `15f53a3`, and it REFUTED the
headline.** The claim was that a typed exception can no longer leave a route with no response at
all on either frame that answers one. `ApiException.getResponse()` is
`{ ...this.metadata, code, title, ...super.getResponse() }`: this lane guarded the message and the
status on that line and left the THIRD value a route controls, the constructor's own fifth
parameter, spread first and unguarded. A spread is a READ, so an own enumerable accessor that
throws never produced a body; and a value `JSON.stringify` refuses, a `bigint`, which is what a pg
driver hands back for an int64 amount, produced one that failed one frame later where the response
is serialised. Both escaped `app.handler` with no Response object at all, which is the zero-byte
failure this branch says it closes, reached through the recipe TECHNICAL.md prescribes.

**Task 11.1.** Metadata is taken as a JSON ROUND TRIP rather than checked and then spread: a check
on one read and a use of another is not a guard, the argument `readWireMessage` is built on. Every
accessor runs exactly once, inside the try, and what comes back is by construction a thing the
serialiser cannot refuse. **Task 11.2.** A round trip that fails answers `code`, `title` and
`message` alone and the drop is announced on the operator log as `Exception metadata dropped`,
with its bounded reason, built inside `logErrorLine`'s own guard so a reason that cannot be read
is announced rather than thrown a second time. **Task 11.3.** Both probes become e2e routes,
`typed-meta-trap` and `typed-meta-bigint`, driven through the real `app.handler`.

RED, `2026-09-16 01:47:40 UTC`, head `15f53a3`, tree carrying only the two routes and their cases:

```
$ npm run test:e2e
rc=1
  ● A typed exception carries a bounded sentence, however it was written › answers a body at all for metadata carrying a getter that throws
    Error: metadata getter exploded
      at Object.get [as details] (app/controllers/throwing-controller.ts:179:15)
      at ApiException.getResponse (../src/exceptions/api-exception.ts:51:15)
      at AppExceptionFilter.catch (app/app-exception-filter.ts:31:24)
  ● A typed exception carries a bounded sentence, however it was written › answers a body at all for metadata carrying a value that cannot be serialised
    TypeError: Do not know how to serialize a BigInt
      at NextResponse.json (../../../node_modules/next/src/server/web/spec-extension/response.ts:113:41)
      at AppExceptionFilter.catch (app/app-exception-filter.ts:27:27)
Tests:       2 failed, 33 passed, 35 total
```

Those two stacks are the finding: one throw inside `getResponse()`, one inside the serialiser,
both above the frame that would have built a Response.

GREEN, `2026-09-16 01:49:10 UTC` onward, same head:

```
$ npx jest
rc=0
Tests:       938 passed, 938 total

$ npm run test:e2e
rc=0
Tests:       35 passed, 35 total
```

**What a caller could notice.** **Corrected in fix pass 2 and again in fix pass 3 (2026-09-16),
where the absolute this paragraph used to state was still standing after Task 21.1 reported it
closed.** Nothing on the wire FOR A ROOT THAT IS A PLAIN OBJECT CARRYING NO `toJSON` OF ITS OWN,
which is every shape this package and Console pass: the response is serialised with
`JSON.stringify` anyway, and it drops the same functions, `undefined`s and symbols the round trip
drops, in the same key order, so for those the bytes are identical. Three roots are not that
shape, all three measured on a pre-fix build against this one: a class whose `toJSON` sits on the
PROTOTYPE served the instance's data (`{"cents":1500}`) and serves what `toJSON` returns
(`{"amount":15}`); a root carrying `toJSON` as an OWN ENUMERABLE property had that function copied
onto the body, where the serialiser CALLED it, so its return became the whole response
(`{"amount":15}` and nothing else, envelope and named fields gone) and now sits under the named
fields; and a `Date` root serves twenty-four numbered character keys where it served none. What
changes for everything else is `getResponse()` read IN MEMORY: a class instance arrives as its
data rather than as itself. The method is documented as the body a caller receives, which is data. The metadata is
NOT bounded at 2000 characters, which the fix brief offered as an option: `ValidationApiException`
puts every Zod issue of a rejected form under `errors`, a legitimately wide shape a consumer
renders per field, and cutting each of its strings would change a shipped behaviour to buy nothing
against the defect actually found, which is about reads and serialisability rather than size.

## Epic 12: the line an unreachable upstream writes is pinned (`dec2481`)

**Found by the test reviewer of this PR.** Epic 4 moved four record builders inside the write
guard. Three of them have cases; `onRequestFailure`'s had none, so reverting THAT call site to its
eager form, which is exactly the shape this branch changed, survived every unit and e2e case in
the package. The caller still receives its bounded exception either way, because `request`'s own
`catch {}` swallows a failing failure-logger by design, so nothing else in the suite moves and the
operator line simply disappears.

**Task 12.1.** A service whose `onBeforeFetch` throws an `Error` carrying a throwing `message`
getter asserts exactly ONE `Request failed` call, whose parsed record is the announcement with the
bounded reason. That is the shape that actually throws in this builder, and it is what replaces
the symbol the plan used to cite (see the correction in Epic 4).

RED, `2026-09-16 01:51:00 UTC`, head `c59ccb4`, the eager call site applied as a single-occurrence
replacement:

```
$ npx jest src/services/http-service.test.ts
rc=1
  ● HttpService › one failed call is one physical log line › announces an unreachable upstream whose reason cannot be read
    expect(received).toHaveLength(expected)
    Expected length: 1
    Received length: 0
    Received array:  []
Tests:       1 failed, 68 passed, 69 total
```

Zero lines written, which is the loss the mutant makes invisible today.

GREEN, `2026-09-16 01:51:16 UTC`, same head, the eager form reverted:

```
$ npx jest
rc=0
Tests:       939 passed, 939 total

$ npm run lint
rc=0
```

## Epic 13: a record builder that throws a non-Error names the reason (`c4543ef`)

**Found by the code reviewer of this PR.** The announcement fell back to `typeof failure` when the
thrown value had no string `message`, so a `describeRequestError` override writing
`throw 'payer missing from body'`, which is a thing consumers write, produced
`{"record":"unserialisable","cause":"string"}`. The doc block and TECHNICAL.md both promise the
bounded REASON, and an operator reading the only sentence that explains an empty record got the
name of a type. The package already had the pattern one file over: `onRequestFailure` writes
`error instanceof Error ? error.message : String(error)`.

**Task 13.1.** The reason is the bounded `String()` of whatever was thrown when it is not an
`Error`. It is safe here for the same reason the `message` read above it is: the inner `try` falls
back to the bare announcement when the read itself throws.

RED, `2026-09-16 01:51:58 UTC`, head `dec2481`:

```
$ npx jest src/utils/error/log-error-line.test.ts
rc=1
  ● logErrorLine › names what a record builder threw when it was not an Error
    Expected: "payer missing from body"
    Received: "string"
  ● logErrorLine › bounds what a record builder threw
    Expected length: 2000
    Received length: 6
    Received string: "string"
Tests:       2 failed, 12 passed, 14 total
```

GREEN, `2026-09-16 01:52:17 UTC`, same head:

```
$ npx jest
rc=0
Tests:       941 passed, 941 total

$ npm run test:e2e
rc=0
Tests:       35 passed, 35 total

$ npm run lint
rc=0
```

## Epic 14: a record's keys are measured without reading its values (`179d6df`)

**Found by the code reviewer of this PR.** Asking whether a key is over the ceiling is a question
about the KEY, and `Object.entries` read every value in every object of every record to ask it. So
a record carrying an accessor, which is what a `describeRequestError` override returning a class
instance or a lazily computed field carries, ran that accessor TWICE per failed upstream call,
once here and once in the serialiser, on the error path.

**Task 14.1.** `Object.keys` answers the same question reading nothing; `Object.entries` moves
into the rebuild branch, where the values are actually needed. The key order the two produce is
the same, so the entry index the mark is built from is unchanged.

RED, `2026-09-16 01:53:03 UTC`, head `c4543ef`:

```
$ npx jest src/utils/error/log-error-line.test.ts
rc=1
  ● logErrorLine › reads a record value once on the path that cuts nothing
    Expected: 1
    Received: 2
Tests:       1 failed, 14 passed, 15 total
```

GREEN, `2026-09-16 01:53:18 UTC`, same head:

```
$ npx jest
rc=0
Tests:       942 passed, 942 total

$ npm run lint
rc=0
```

## Epic 15: the mark on a cut key is documented as the code writes it (`ff1d297`)

**Found by the code reviewer of this PR.** `boundKey`'s doc said a cut key carries a mark only
when it would land on a name already in the object. The code marks EVERY cut key: a record with a
single 5000-character key and nothing to collide with is written as `KKK...KKK~0`, so an operator
debugging that `~0` went looking for a duplicate that was never there. The two `bounds a key`
cases assert a length and never look at the text, so neither the unconditional mark nor a change
to it was pinned.

**Task 15.1.** The doc says what the code does: every cut key carries `~<index>`, which is what
tells an operator the name was cut, and what a collision costs is the retry `~<index>.<attempt>`.
**Task 15.2.** The emitted key content is pinned once. **Task 15.3.** The 116-column comment line
the review flagged is rewrapped to the file's 80.

The gain is a mutant that used to survive. The plan's N20 row records that a narrower first
version, replacing only the FIRST candidate with the plain cut, SURVIVED and was discarded as
equivalent. With the content pinned it is a kill, taken at `ff1d297` as the mark dropped from the
first candidate:

```
$ npx jest src/utils/error/log-error-line.test.ts
rc=1
  ● logErrorLine › bounds a key at two thousand characters
    Expected: "KKK...KKK~0"
    Received: "KKK...KKK"
Tests:       1 failed, 14 passed, 15 total
```

It is re-taken at the code-final head as N26 in the table below.

## Epic 16: the fallback sentence is published beside its readers (`7ff938c`)

**Found by the code reviewer of this PR.** Epic 1 exported `readWireMessage` and `readWireStatus`
for the frame this package does not own, and left `noProblemDetails` module-private. An
application calling `readWireMessage(exception, fallback)` therefore had to invent its own
sentence, so the same failed read would read one way from this package's filter and another from
the consumer's, which is precisely the drift the export exists to close.

RED, `2026-09-16 01:55:42 UTC`, head `ff1d297`, tree carrying only the e2e case that imports it:

```
$ npm run test:e2e
rc=1
e2e/error-shape.spec.ts:2:10 - error TS2305: Module '"@lerianstudio/sindarian-server"' has no exported member 'noProblemDetails'.
Tests:       21 passed, 21 total
```

GREEN, `2026-09-16 01:55:54 UTC`, same head:

```
$ npm run test:e2e
rc=0
Tests:       36 passed, 36 total

$ npx jest
rc=0
Tests:       942 passed, 942 total
```

## Epic 17: every null-body status is driven through a real Response (`85e6882`)

**Found by the test and security reviewers of this PR, as an overstated claim rather than a
defect.** The lane said all three null-body statuses were measured through a real `Response`; only
204 was. There was one route, `typed-nullbody`, and 205 and 304 rested on `readWireStatus`'s own
unit rows, which are an assertion about a set-membership table rather than about the runtime that
refuses the members. The package filter's own unusable-status table had the same hole from the
other side: its rows were 0, 700, NaN and 199, and the comment above them stated only the
`RangeError` half of the rule, in the very file this lane exists for.

**Task 17.1.** Three routes, `typed-nullbody-204`, `-205` and `-304`, each driven through the real
app handler. **Task 17.2.** The filter's table gains `[204]`, `[205]` and `[304]`, and its comment
states both halves: the `RangeError` outside 200 to 599 AND the runtime's `TypeError` on a
null-body status INSIDE the band.

RED, `2026-09-16 01:56:58 UTC`, head `7ff938c`, with the null-body half of `readWireStatus`
removed:

```
$ npx jest src/exceptions/base-exception-filter.test.ts
rc=1
  ● BaseExceptionFilter › answers 500 for the unusable status 204
  ● BaseExceptionFilter › answers 500 for the unusable status 205
  ● BaseExceptionFilter › answers 500 for the unusable status 304
Tests:       3 failed, 47 passed, 50 total

$ npm run test:e2e
rc=1
  ● answers a body for the status 204, which carries none
    TypeError: Response constructor: Invalid response status code 204
  ● answers a body for the status 205, which carries none
    TypeError: Response constructor: Invalid response status code 205
  ● answers a body for the status 304, which carries none
    TypeError: Response constructor: Invalid response status code 304
Tests:       3 failed, 35 passed, 38 total
```

Three real `TypeError`s from three real `Response` constructions, where before this epic the
mutation produced one. GREEN, `2026-09-16 01:57:16 UTC`, same head, guard restored,
`clean-after-N11=0`:

```
$ npx jest
rc=0
Tests:       945 passed, 945 total

$ npm run test:e2e
rc=0
Tests:       38 passed, 38 total

$ npm run lint
rc=0
```

## Epic 18: the documents say what was measured (`cc897fd`, `243cfa3`)

Both commits touch `packages/`, so both sit before the code-final head rather than in the docs
commit that closes this pass. `cc897fd` carries TECHNICAL.md: the release the log shape changed in
(see the provenance bullet at the top), the metadata read of Epic 11, and `noProblemDetails` named
as the fallback an adopting application should take rather than invent. `243cfa3` carries the e2e
comment's line count (see the correction in Epic 6.3).

## Epic 19: the code and title a route wrote are read, not taken (`615eb5e`)

**Found by the security review of fix pass 1, with a live probe, and it refuted the lane's
headline a second time.** Epic 11 guarded the metadata and the claim became "no unguarded read is
left on the frame an application renders its own envelope from". Two were: `code` and `title` sat
on that same line, taken exactly as the metadata had been. Neither needs an override or an exotic
value. Both are declared `string` and both are satisfied with no cast by the `any` a database row
is, which is the premise Epic 11 itself rests on, so `new ApiException(row.code, row.title, ...)`
compiles. (**Corrected in fix pass 3**: this paragraph used to add "and `title` is a writable
property, which is how `message` reached the wire as an upstream object in the first place".
`title` is `readonly`; see Task 26.1. Writing either field after construction needs a cast, which
is the one thing `message` never needed, and the reachability argument stands on the constructor
alone.) A `code` getter that throws returned NO
body at all, so the throw escaped `app.handler` above the frame that would have built a Response,
and unlike the metadata case it wrote no operator line either. A `title` an upstream body had been
written into serialised perfectly well and carried that body, internal host and all, to the
browser under a field this package documents as a short classification.

**Task 19.1.** The reader family gets its one implementation, `readWireField(read, limit)`: one
read, bounded at a ceiling the caller names, cannot throw, and it answers `undefined` rather than
spending a fallback, because a frame that answers a whole body has to KNOW a field was dropped in
order to announce it, and asking the value a second time is the rule the family exists to keep.
`readWireMessage` is now that function plus its fallback, so there is one guard rather than two.

**Task 19.2.** `ApiException.getResponse()` reads both fields through it, bounded at
`PROBLEM_FIELD_MAX_LENGTH`, which is the argument that constant already makes about these exact
two fields. A `code` that does not read back as a string answers `UNCLASSIFIED_CODE`, the `0004`
this library already gives a failure it cannot classify; a `title` answers `noProblemTitle(status)`,
the reason phrase of the status the response actually carries, which is the title every typed
exception in this file already uses for its own status. `UNCLASSIFIED_CODE` moves from the filter
to sit beside the readers, because the filter imports `ApiException` and could not be imported
back.

**Task 19.3.** The drop is announced as `Exception classification dropped`, naming the FIELD and
the status rather than a reason. The reason lives in the value that failed and the read of it is
what failed, so naming it would break Task 19.1; the field name plus the substitute is the whole
story here, which is exactly what the metadata line cannot say.

**Task 19.4.** Both shapes get an e2e route and are driven through the real handler.

RED, `2026-09-16 03:20:05 UTC`, head `17d7acd`, tree carrying only the test changes:

```
$ npx jest src/exceptions/api-exception.test.ts
rc=1
  ● ApiException › the classification a route wrote › answers the unclassified code when the code getter throws
  ● ApiException › the classification a route wrote › answers the status title when the title is an object
  ● ApiException › the classification a route wrote › answers both fallbacks in one line when neither is readable
  ● ApiException › the classification a route wrote › bounds a code and a title an upstream sized
  ● ApiException › the classification a route wrote › names a status the registry has no phrase for
Tests:       5 failed, 52 passed, 57 total

$ npm run test:e2e
rc=1
  ● A typed exception carries a bounded sentence, however it was written › answers a body at all when reading the code throws

    code getter exploded

      at NotFoundApiException.get [as code] (app/controllers/throwing-controller.ts:252:15)
      at NotFoundApiException.getResponse (../src/exceptions/api-exception.ts:111:18)
      at AppExceptionFilter.catch (app/app-exception-filter.ts:31:24)
      at ServerFactory._handleRequest (../src/server/server-factory.ts:216:46)

  ● A typed exception carries a bounded sentence, however it was written › answers a string title when a route wrote an object

    Expected: "Not Found"
    Received: {"detail": "timed out at db-primary.internal:8080", "title": "Gateway Timeout"}

Tests:       2 failed, 38 passed, 40 total
```

The first stack is the whole point: the throw leaves `app.handler` itself, above the frame that
would have built a Response, so the caller receives nothing at all rather than a body.

GREEN, `2026-09-16 03:22:25 UTC`, same head, guard added:

```
$ npx jest
rc=0
Tests:       950 passed, 950 total

$ npm run test:e2e
rc=0
Tests:       40 passed, 40 total

$ npm run lint
rc=0

$ npm run build
rc=0
```

**Live, at the code-final head `d7d7d6e`, through a real `Response` built with the recipe
TECHNICAL.md prescribes** (`Response.json({ ...envelope, ...exception.getResponse() }, { status:
readWireStatus(exception) })`), against the built `dist`, `2026-09-16 03:55:49 UTC`:

```
code getter throws
  status=404 body={"timestamp":"...","code":"0004","title":"Not Found","message":"Ledger not found"}
  operator lines: Exception classification dropped {"dropped":["code"],"status":404}
title is an upstream object
  status=404 body={"timestamp":"...","code":"0003","title":"Not Found","message":"Ledger not found"}
  operator lines: Exception classification dropped {"dropped":["title"],"status":404}
code is a bigint from a row
  status=404 body={"timestamp":"...","code":"0004","title":"Not Found","message":"Ledger not found"}
  operator lines: Exception classification dropped {"dropped":["code"],"status":404}
nothing wrong
  status=404 body={"timestamp":"...","code":"0003","title":"Not Found","message":"Ledger not found"}
  operator lines: (none)
```

The bigint row is the shape a pg driver produces and it never had a test. **Corrected in fix pass
3 (2026-09-16), the contrarian having refuted the sentence that stood here.** It said the value
"does not throw, it simply is not a string, and it used to travel to the wire as one". It did not
travel anywhere: re-measured on a pre-fix build of this tree through a real `Response`, a bigint
`code` ESCAPED with `TypeError: Do not know how to serialize a BigInt` and produced NO Response at
all, which is the same zero-response failure this branch documents for bigint METADATA, so the row
is more severe than the sentence said. After Epic 22 below, a bigint `code` reads as its digits
(`"10"`) and a pg INT `5` reads as `"5"`, so neither costs the route anything and neither is
replaced.

## Epic 20: one read, and a reason no value can give (`e1e3c7c`, `6e5b30a`)

Two properties that hold in shipped code and had nothing holding them. Neither has a RED at this
head, because both pin behaviour that is already correct; the RED is the mutant, and both mutants
are in the fix pass 2 table below.

**Task 20.1, the one-read property of Epic 11.** Rewriting `readWireMetadata` to check one read
and spread another passes all 945 unit and all 38 e2e cases of fix pass 1, and puts the route back
where it was. The case is a metadata value that answers `1` on its first read and a driver's
`bigint` on its second, which is what a memoising or retrying accessor over a ledger row does. It
asserts one read and a body that survives serialisation. Mutant N27 kills it.

**Task 20.2, what the round trip changes.** One case pins the shape the security reviewer found:
a metadata root carrying its OWN `toJSON` now decides the body, where the spread copied the
function and the serialiser dropped it.

**Task 20.3, the inner reason guard of Epic 13.** `String(failure)` replaced a `typeof` that
cannot throw, and nothing covered the new throw path: deleting that guard passes every gate and
restores the 503-for-a-409 defect Epic 4 exists to close. The case is a `describeRequestError`
override that throws a value with no path to a primitive at all, a null-prototype object with no
`toString`, no `valueOf` and no `Symbol.toPrimitive`. The caller still receives the 409 the
upstream answered, and the announcement stands with no reason attached, because there is none to
be had. Mutant N28 kills it.

## Epic 21: the documents qualify what the guards cost and keep (`4fb996d`, `eeb9ba3`, `d7d7d6e`)

TECHNICAL.md, the `readWireMetadata` doc block and one comment in the filter, so all three sit at
or before the code-final head rather than in the docs commit.

**Task 21.1.** "For any metadata that worked before, the bytes on the wire are unchanged" was an
absolute, and two roots break it. Measured on this build, the shipped `getResponse()` against the
frame it replaced: a plain object, an array, a string, a number and a nested `toJSON` are
identical; a root carrying its own `toJSON` served `{"cents":1500,...}` before and serves
`{"amount":15,...}` now; a `Date` root served nothing before and now serves twenty-four numbered
character keys, because the round trip turns it into a string and a string spreads by index. The
sentence is now quantified in both places. **Fix pass 3 correction (2026-09-16): two, not four.**
Epic 11's "What a caller could notice" above and the Found-by row below both said the quantifier
had landed everywhere it was named; it had landed in `api-exception.ts` and TECHNICAL.md, and the
plan's own Epic 11 copy still stated the absolute. It is corrected there now, and the mechanism
for the OWN-ENUMERABLE root, which this task also got wrong, is in Epic 23. The `Date` root is
named rather than guarded: refusing
a non-object root would also change what a plain string root has always served.

**Task 21.2.** What the round trip COSTS was written nowhere, next to a sentence saying the size
behaviour had not moved. Measured with the 4.1 MB `{ errors: [...] }` a rejected form produces:
`getResponse()` costs roughly 18 ms (18.4 and 18.9 in two runs, each the mean of five calls on a
shared box) against 0.001 ms for the spread it replaced, on top of the 6.5 ms the response
serialisation always cost. Error path only, and a caller sizes it by sending a body that fails
validation. The magnitude is the fact; the digits are one machine's.

**Task 21.3.** The filter bullet saying an `ApiException` is answered "at its own status from
`getStatus()`" now says it is read through `readWireStatus`, which is what the two bullets below
it already said and what the filter has done since Epic 2.

**Task 21.4 (`eeb9ba3`).** Moving `UNCLASSIFIED_CODE` out of `base-exception-filter.ts` in Epic 19
left its explanatory block sitting directly above `export class BaseExceptionFilter`, where a
`/** */` block is read as the class's own documentation. It is a line comment now, so nothing
attaches it to the class.

**Task 21.5 (`d7d7d6e`).** The provenance sentence said the major opened "six days and three
releases before #190 merged", which reads as three releases having happened in between; two did.
It now says the line was three releases old when that PR landed.

Both are comment and prose only, and both are inside `packages/`, so each became the code-final
head in turn. Every gate and all six mutants above were re-run at each of the three, with
identical counts and case names.

## Epic 22: a primitive code or title keeps its own value (`b49c3d7`)

**Found by the contrarian of fix pass 2, live.** The guard of Epic 19 treated everything that was
not a `string` as a failed read, and the contrarian measured what that costs: `new
ApiException(row.error_code, ...)` with a pg `INT` column served `{"code":5,...}` at 404 before
the guard, perfectly well, and served `{"code":"0004",...}` after it, with the route's real code
surviving in neither the body nor the operator line, which names the field and not its value. The
substitute destroyed a value that was fine.

**The product decision taken here.** A PRIMITIVE is stringified and bounded, not replaced.
`readWireField` answers `String(value)` for a string, a number as it is spelled (`NaN` and
`Infinity` included), a `bigint` and a boolean, cut at the caller's limit. An object, an array, a
function, a symbol, `null` and `undefined` still answer `undefined`, so the caller spends its
fallback and announces the drop: those are the shapes an upstream BODY arrives as, and
`String({})` is `[object Object]`, which is a serialisation and not a classification.
`readWireMessage` is `readWireField` plus a fallback, so it inherits the rule and a numeric
message now reads as its digits.

Measured at `ab7ee5b` through a real `Response` against the built dist, beside a pre-fix build of
the same tree:

```
code is a pg INT 5      before {"code":5,...}      now {"code":"5",...}     no operator line
code is a bigint 10n    before NO RESPONSE:        now {"code":"10",...}    no operator line
                        Do not know how to serialize a BigInt
code is true            before {"code":true,...}   now {"code":"true",...}  no operator line
title is a number 502   before {"title":502,...}   now {"title":"502",...}  no operator line
code is an object       before {"code":{"a":1},..} now {"code":"0004",...}  Exception classification dropped {"dropped":["code"],"status":404}
code is an array        before {"code":["a"],...}  now {"code":"0004",...}  the same line
code is null            before {"code":null,...}   now {"code":"0004",...}  the same line
```

**Every pass-2 case that assumed a bigint answers `0004` was re-run and rewritten.** `answers both
fallbacks in one line when neither is readable` used `BigInt(7)` for the code and a cycle for the
title; it uses an upstream object for the code now, which is the shape the fallback exists for,
and keeps the cycle. Three `it.each` rows asserting that a numeric MESSAGE answers the fallback
sentence (in `api-exception.test.ts`, `http-exception.test.ts` and `base-exception-filter.test.ts`)
were removed and replaced by three cases naming the new rule, `reads a numeric message as its
digits`.

Mutants N34 and N35 are the two directions of the rule.

## Epic 23: what each metadata root served, measured rather than described (`b49c3d7`, `ab7ee5b`)

**Found by the test reviewer of fix pass 2.** The case Epic 21 added to close the "bytes on the
wire" finding pins `{ cents: 1500, toJSON: () => ({ amount: 15 }) }`, an object literal whose
`toJSON` is an OWN ENUMERABLE property, while the sentence above it, TECHNICAL.md and the PR body
all describe a money CLASS, whose `toJSON` sits on the prototype. Those are two different
mechanisms and the documents named neither correctly: a prototype `toJSON` is never copied by a
spread, and an own-enumerable one is copied and then CALLED, not "dropped".

**Both measured on a pre-fix build of this tree** (the guard reverted on `getResponse()`, `dist`
rebuilt, `2026-09-16 04:54:58 UTC`), and again at this head, through
`Response.json({ ...envelope, ...exception.getResponse() }, { status: readWireStatus(exception) })`:

```
root = new Money(1500), toJSON on the PROTOTYPE
  before {"timestamp":"T","cents":1500,"code":"0003","title":"Not Found","message":"Ledger not found"}
  now    {"timestamp":"T","amount":15,"code":"0003","title":"Not Found","message":"Ledger not found"}
root = { cents: 1500, toJSON: () => ({ amount: 15 }) }, OWN ENUMERABLE
  before {"amount":15}          <- the WHOLE response: envelope and all three named fields gone
  now    {"timestamp":"T","amount":15,"code":"0003","title":"Not Found","message":"Ledger not found"}
```

So the caveat the documents carry is true of the CLASS shape and only that one: a consumer reading
`cents` reads nothing after this release. The own-enumerable shape is REPAIRED rather than changed,
and before the fix it was the worst root of the three, because the serialiser called the copied
function and let its return replace the application's own envelope. The reverted build and a
reconstruction of the same frame inside one process agreed row for row, which is what makes the
reconstruction usable for the rest of the table.

A case for the class shape is added, `lets a metadata root whose class has a toJSON decide the
body`, and the mechanism sentence is rewritten in all three places it appears: the test comment,
the `readWireMetadata` doc block and TECHNICAL.md. Epic 11's "What a caller could notice" is
corrected too, which is the other half of the finding that Task 21.1 reported closed and was not.

## Epic 24: the metadata line is built from a read that happened (`b49c3d7`)

**Found by both reviewers of fix pass 2, Medium.** `readWireMetadata`'s log builder read
`this.code` and `this.title` raw, the two values the same commit had just established cannot be
trusted. When both guards fire, each field was read TWICE inside one `getResponse()`, which makes
the "each field read once" sentence shipped in the code comment, in TECHNICAL.md and in the PR
body false on exactly the path fix pass 2 added. Worse than the count: the builder THROWS on the
first of those reads, so `logErrorLine` keeps the label, loses the fields and names the cause it
can still reach.

Measured before the fix, through a real `Response`, with a throwing `code` getter and a throwing
metadata getter on one exception:

```
Exception metadata dropped {"record":"unserialisable","cause":"code getter exploded"}
Exception classification dropped {"dropped":["code"],"status":404}
```

The metadata line names the CODE's failure as its own cause, has lost both identifying fields, and
the metadata's real reason (`md exploded`) appears nowhere. At `ab7ee5b`, the same input:

```
Exception classification dropped {"dropped":["code"],"status":404}
Exception metadata dropped {"code":"0004","title":"Not Found","cause":"md exploded"}
```

**The fix.** `getResponse()` reads the classification FIRST, into a local, and hands it to
`readWireMetadata`, which spreads it into the log record. The body's key order is untouched,
metadata still under the three named fields. The alternative the brief offered, emitting the
metadata line with field NAMES only as the classification line does, was rejected: the fields are
what ties a metadata drop to the route that caused it, and the guarded read already has them.
What changed observably in the log is the ORDER of the two lines when both fire, the
classification's now being written first, because that is the order the reads happen in.

RED is `reads the code once when the metadata drops beside it`, which counts the reads with a
getter counter and asserts one body with the real status, exactly one read of `code`, both lines
written and no false cause. Mutant N33 restores the raw read.

## Epic 25: the type a consumer compiles against (`b49c3d7`)

**Found by the security reviewer of fix pass 2, Low.** The metadata guard of Epic 11 narrowed the
emitted type of `ApiException.getResponse()` from `any` (which `...this.metadata` widened it to on
`develop`) to `{ message: string; code: string; title: string }`. Metadata keys are part of this
body by design, so a consumer that spreads it into its own envelope and reads one back, which is
what Product Console does with `{ details }`, stops compiling at the 2.x bump.

The return type is now written out as those three fields intersected with
`Record<string, unknown>`. Measured against the emitted `.d.ts` with strict `tsc`:
`getResponse().details` compiles as `unknown`, `getResponse().message` is still a `string`, and
`(getResponse().details as X).requestId` compiles. **The residue, which is in the PR body's
caveats**: reading THROUGH such a key with no cast, `getResponse().details.requestId`, compiled on
`develop` where the type was `any` and now reads `TS18046: 'body.details' is of type 'unknown'`.
That is the only type-level change in the 2.x line and TECHNICAL.md names it.

**The pin is in the e2e suite, not the unit suite, and that is not a preference.** This package's
unit jest runs through ts-jest with `isolatedModules: true` in `tsconfig.eslint.json`, so it
TRANSPILES and type-checks nothing: the same probe placed in `api-exception.test.ts` ran green
against the narrow type. The e2e suite has no such setting and resolves the package through
`file:../`, so it compiles against the emitted `.d.ts` a consumer installs. RED there is the whole
suite refusing to run: `e2e/error-shape.spec.ts:405:17 - error TS2339: Property 'details' does not
exist on type '{ message: string; code: string; title: string; }'`. Mutant N37 restores it.

**A trap worth writing down.** N37 SURVIVED its first run: jest's cache keys a spec by its own
content and its transform config, not by the `.d.ts` of a package it imports, so a spec that
compiled once keeps compiling from cache while the emitted type changes underneath it. It is a
kill with `--no-cache` (`1 failed, 1 passed`, the error above, e2e rc=1), and the final e2e gate
was re-run with `--no-cache` for the same reason.

## Epic 26: the documents and the numbers (`ab7ee5b`, this plan)

**Task 26.1, `title` is not writable.** The contrarian measured it: the constructor declares
`public readonly title`, the PR's own e2e route concedes it with `(exception as any).title = ...`,
and under strict `tsc` against the emitted types both `e.title = x` and `e.code = x` are TS2540
while `new ApiException(row.code, row.title, ...)` with an `any` row compiles (positive and
negative control in one file, rc=2 and rc=0). "Or a cast" and the writable-title clause are gone
from the `readWireClassification` doc block, TECHNICAL.md, the test's describe comment and the PR
body; the `any`-row premise stays, and it is true of both fields.

**Task 26.2, the caveats.** TECHNICAL.md's "which is the only shape here that produced a good
response before" was false. After Epic 22 the measured pair is: a `code` or `title` past 200
characters is truncated, and one that is an object, an array, `null` or a function is replaced by
the fallback with its value surviving nowhere. Both are in TECHNICAL.md, in the PR body's caveats
and in "Found, not fixed" where the second belongs.

**Task 26.3, the one title that is not a status phrase.** The justification on `noProblemTitle`
claimed every typed exception in this package carries its status's reason phrase as its title.
Measured against `STATUS_CODES` on Node v24.21.0 for all eight: seven match,
`ValidationApiException` does not, being 'Validation Error' at 400 where the phrase is 'Bad
Request'. That is the class Console raises for every rejected form. The sentence now says seven of
eight and names the exception, in the doc block, in TECHNICAL.md and in the test comment, and a
case pins the answer: `answers Bad Request, not Validation Error, for a rejected form`.

**Task 26.4, the bigint row.** Corrected in Epic 19's live block above, re-measured on a pre-fix
build.

**Task 26.5, the quantifier places.** Corrected in Epic 11 and in Task 21.1 above, which is where
the Found-by row said they already were.

**Task 26.6, the provenance bullet.** Corrected at the top of this document, which is where Task
21.5 said it was.

**Task 26.7, the counts, recounted from the tables in this document.** Twenty-two DISTINCT
mutations, `N11` to `N32`, before this pass. Runs: eleven rows at `d5d5e54`, eleven at `243cfa3`,
and six taken at each of three heads in fix pass 2, which is eighteen, so FORTY runs, not the
twenty-eight the PR body claimed and not the twenty-two the Found-by row described. This pass adds
five mutations, `N33` to `N37`, in six runs (N37 twice, the first of them cached), so the branch
total is **twenty-seven distinct mutations, `N11` to `N37`, in forty-six runs**. The same two
numbers are now in the PR body.

## Found by the review round of this PR, and where each one lands

Three reviewers plus a contrarian, on `15f53a3`. The contrarian REFUTED the lane's headline with
a live probe, which is Epic 11. Nothing below is dismissed: each is closed by code or answered
here by name.

| Found | Where it lands |
|---|---|
| Contrarian, live at HEAD: `metadata` is the third unguarded read on the `getResponse()` frame | Epic 11, code |
| Contrarian: the log-shape change is attributed to #190 and shipped in #191 / `2.0.0-beta.5` | Provenance bullet at the top; TECHNICAL.md, `cc897fd` |
| Test reviewer: the `onRequestFailure` half of Epic 4 has no test | Epic 12, code |
| Code reviewer: a non-Error thrown by a record builder announces `cause: "string"` | Epic 13, code |
| Code reviewer: `Object.entries` evaluates every accessor twice to measure key lengths | Epic 14, code |
| Code reviewer: `boundKey`'s doc says a mark only on collision; the code marks every cut key | Epic 15, code |
| Code reviewer, Info: one comment line left at 116 columns | Epic 15, Task 15.3 |
| Code reviewer: `noProblemDetails` is not exported beside the two readers | Epic 16, code |
| Test reviewer: the package filter's unusable-status table has no 204/205/304 row | Epic 17, code |
| Test and security reviewers, contrarian: only 204 is driven through a real `Response` | Epic 17, code |
| Test reviewer: Task 4.1's "`String(error)` throws on a symbol" is false | Epic 4, corrected in place |
| All three reviewers and the contrarian: the Verification block pastes 932 at a head measuring 934 | Verification, both blocks re-taken at `243cfa3` |
| Test reviewer: Epic 8's GREEN pastes 934 where the tree measures 932 | Epic 8, re-measured at `d0683c6` |
| Code, test and security reviewers: the cross-document RED citation is by line number | Corrections section, cited by heading |
| Test and security reviewers: `SEVENTEEN PHYSICAL LINES` does not reproduce, and the stated cause is wrong | Epic 6.3, re-measured three ways; the digit is out of the shipped comment, `243cfa3` |
| Security reviewer: "Not a breaking change" is false for a long plain `HttpException` message | Caveat bullet at the top, measured on both builds |
| All three reviewers and the contrarian: the PR body is three code commits stale | The body is rewritten at the code-final head |
| Security reviewer, Info: the `cause` field widens the unredacted operator-log surface | Found, not fixed, item 4 |
| Test reviewer: two assertions pin a V8 internal error string | Found, not fixed, item 7 |

## Found by the review round of fix pass 1, and where each one lands

Two reviewers plus a contrarian, on `17d7acd`. The contrarian confirmed the metadata guard against
thirteen hostile inputs and refuted one named conjunct of the claim; the security reviewer refuted
the headline itself, again with a live probe, which is Epic 19. Nothing below is dismissed.

| Found | Where it lands |
|---|---|
| Security reviewer, live at HEAD: `code` and `title` are the last two unguarded reads on the `getResponse()` frame | Epic 19, code |
| Test reviewer: the one-read property of the metadata guard has no test | Epic 20, Task 20.1, code |
| Test reviewer: the inner reason guard's new throw path has no test | Epic 20, Task 20.3, code |
| Test and security reviewers: "the bytes on the wire are unchanged" is false for a root `toJSON` and for a non-object root | Epic 21, Task 21.1, in two of the four places named, plus a case. **The remaining two are corrected in fix pass 3**, Epic 23 |
| Security reviewer: the round trip's cost on the error path is undocumented | Epic 21, Task 21.2, measured |
| Contrarian: #190 did not open the major, and shipped as `2.0.0-beta.4`, not `beta.3` | Provenance bullet at the top, re-measured; TECHNICAL.md |
| Test reviewer: Epic 6's log-shape paragraph carries the pre-correction provenance with no marker | Epic 6, correction added |
| Test and security reviewers: the #191 plan still blames the physical-line drift on another copy | Corrections section, re-measured in situ here |
| Contrarian: the PR body's "found, not fixed" list drops item 8, which qualifies a claim in the body | The body is rewritten at the code-final head |
| Test reviewer, Info: "twenty-two mutants" counts six re-takes as separate mutations | The body says twenty-two distinct mutations, N11 to N32. **The run count it carried, twenty-eight, was wrong and is corrected in fix pass 3**: forty, because the last six were taken at three heads. Recounted from the tables below in Epic 26 |
| Security reviewer, Info: `Exception metadata dropped` is a new unredacted operator-log sink | Found, not fixed, item 9 |

## Found by the review round of fix pass 2, and where each one lands

Two reviewers plus a contrarian, on `4c45798`. The contrarian drove sixteen hostile shapes through
a real `Response` against the built dist and found no escape; both reviewers report that every
value a route controls on that frame is read inside a guard. What they refuted is four measured
sentences and one narrowing nobody had noticed. Nothing below is dismissed.

| Found | Where it lands |
|---|---|
| Both reviewers, Medium: the metadata log builder still reads `this.code` and `this.title` raw, so a field is read twice and the line can name a false cause | Epic 24, code |
| Contrarian: a `code` that is a primitive but not a string served a good response before and is now replaced, its value named nowhere | Epic 22, code, as a product decision |
| Test reviewer, Medium: the toJSON case pins one shape and the documents describe another, and the mechanism sentence is false for both | Epic 23, a case plus three rewrites |
| Security reviewer, Low: `getResponse()`'s emitted type narrowed from `any`, so a consumer reading a metadata key stops compiling | Epic 25, code plus a compile pin in the e2e suite |
| Security reviewer, Low: `noProblemTitle`'s justification is false for `ValidationApiException` | Epic 26, Task 26.3, corrected and pinned |
| Contrarian: `title` is `readonly`, not "writable after construction" | Epic 26, Task 26.1, corrected in four places |
| Contrarian and security reviewer: the caveat list misses a `code` or `title` that is not a string at all | Epic 26, Task 26.2, and Found-not-fixed item 11 |
| Contrarian: the bigint row escaped at serialisation, it never reached the wire | Epic 26, Task 26.4, re-measured |
| Both reviewers: the quantifier correction landed in two places, not the four the table claimed | Epic 26, Task 26.5 |
| Both reviewers: the provenance bullet still carries the phrasing Task 21.5 declared corrected | Epic 26, Task 26.6 |
| Contrarian and security reviewer: the mutant run counts disagree between the body and this plan | Epic 26, Task 26.7, recounted |
| Security reviewer, Info: the round-trip cost did not reproduce within 50% (29.1 to 29.6 ms against 18.4) | Left as it stands: both documents already say to read the magnitude and not the digits, and the reviewer's own scaling puts the two runs on one machine's spread |

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
6. **Metadata is guarded but not BOUNDED.** Epic 11 makes it impossible for metadata to cost a
   route its response; it does not cap its size. `ValidationApiException` puts every Zod issue of
   a rejected form under `errors`, which a consumer renders per field, so a per-string cut at 2000
   would change a shipped behaviour to buy nothing against the defect that was found. A route
   attaching a megabyte to metadata serves a megabyte, exactly as before.
7. **Two assertions pin a V8 error string**, `Converting circular structure to JSON`, in
   `log-error-line.test.ts` and `http-service.test.ts`. That text is the engine's wording for a
   cycle, not a contract this package owns, so a Node change turns both red for a behaviour that
   did not move. Raised by the test reviewer of this PR. Left alone deliberately: the propagation
   of a reason is pinned exactly elsewhere, on strings this repository controls
   (`cannot read properties of undefined (reading payer)`, and now `payer missing from body`), so
   the cost of the engine string is a false red rather than a missed defect, and relaxing the two
   assertions is a change to tests this pass did not otherwise touch.
8. **The cut-key retry loop still reads values on the rebuild path.** Epic 14 removed the read
   from the measuring path, which is every record. An object that actually needs a key cut is
   rebuilt through `Object.entries`, so its accessors run once there and once in the serialiser's
   walk of the copy. That is one read of the original, not two, and it is the path where the
   values are genuinely needed.
9. **`Exception metadata dropped` is a second unredacted operator-log sink**, carrying a route's
   own failure text: a metadata getter that interpolates a customer's data into its error writes
   that text under `cause`, bounded at 2000 characters and redacted by nothing. Raised by the
   security reviewer of fix pass 1 as an Info, because item 4 above enumerates only the
   record-builder reason and a reader auditing the log surface from that list would not find this
   one. Consistent with the declared posture, so no fix is requested; named here so the list is
   the whole surface. The classification line added in Epic 19 is NOT a third: it carries a field
   name and a status, both of them this package's own words.
10. **A metadata root that is not an object after the round trip serves numbered character keys.**
    A `Date` passed as the whole metadata is the reachable case, and it served nothing at all
    before Epic 11. Documented in TECHNICAL.md and in the code rather than guarded, because
    refusing a non-object root would change what a plain string root has always served, which is
    those same numbered keys. Raised by the security reviewer of fix pass 1.
11. **A `code` or `title` that is an object, an array, `null` or a function is replaced, and its
    own value is named nowhere.** It serialised into the body before this branch, so the shape
    produced a good response; the operator line names the FIELD and the status, never what the
    field held, because naming it would mean reading the value a second time or serialising a
    thing this frame has just decided it cannot trust. Epic 22 keeps every PRIMITIVE, which is the
    reachable half (a pg `INT` code); what is left is the half whose text would be a serialisation
    of an object, and that is the defect the guard exists for. Raised by the contrarian and the
    security reviewer of fix pass 2, and listed in the PR body's caveats.

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
- `docs/plans/2026-09-15-typed-exception-fail-safe.md` again, in fix pass 2. The correction this
  PR wrote into that file blamed the one-line drift on "another copy", which this PR's own shipped
  comment and Epic 6.3 both refute, so one push was shipping both the wrong cause and its
  correction. Both reviewers of fix pass 1 raised it. Re-measured in situ here rather than
  repeated, by parsing the written line back and formatting it the old way inside that very test,
  `2026-09-16 03:58:25 UTC`, head `d7d7d6e`, Node v24.21.0 with
  `util.inspect.defaultOptions.breakLength` 80:

  ```
  $ npx jest --verbose            # both specs, which is the set the gate runs
  INSITU2 newlines=17 lines=18

  $ npx jest e2e/error-shape.spec.ts
  INSITU2 newlines=16 lines=17

  $ npx jest -i e2e/error-shape.spec.ts
  INSITU2 newlines=16 lines=17
  ```

  The copy is not the variable; the invocation is, and two specs make jest use a worker whose
  extra frame is the whole difference. `--verbose` is needed only to SEE the line: a multi-suite
  run swallows a passing test's console output, which is why the instrumented gate run printed
  nothing at all the first time. That file's sentence now names the invocation.
- PR #191's body says "Two RED blocks before their fixes" while its plan documents FOUR. A merged
  body cannot be corrected; it is recorded here. The four are cited by HEADING, not by line
  number: `### RED before GREEN: a typed exception's message`, `: one line per failed call`,
  `: a message read twice` and `: the review round`. An earlier version of this line gave the
  offsets 178, 237, 283 and 313, which were the numbers at `origin/develop` and which THIS PR
  invalidates, because its own hunks add five lines to that same file above all four of them. A
  heading survives an edit above it; an offset does not.

## Verification

Every command below was run verbatim in `/srv/worktrees/sdk-typed-fix1`.

### Fix pass 3, at the code-final head `ab7ee5b`

**RED, `2026-09-16 04:57:46 UTC`, head `4c45798`**, `git status --porcelain` showing the three
test files only. Every case the new rules produce fails before the code changes:

```
$ npx jest src/exceptions
rc=1
Tests:       7 failed, 157 passed, 164 total
  ApiException > message coercion > a message written after construction > reads a numeric message as its digits
  ApiException > the classification a route wrote > reads the code once when the metadata drops beside it
  ApiException > the classification a route wrote > answers a pg INT code as its digits
  ApiException > the classification a route wrote > answers a driver's bigint code as its digits
  ApiException > the classification a route wrote > answers a boolean code as its digits
  ApiException > the classification a route wrote > answers a NaN code, spelled as it reads as its digits
  HttpException > a message written after construction > reads a numeric message as its digits
```

**RED for the type, `2026-09-16 04:59:52 UTC`, same head.** The whole suite refuses to run, which
is the point of putting the pin where the compiler looks:

```
$ npm run test:e2e
rc=1
FAIL e2e/error-shape.spec.ts
  ● Test suite failed to run
    e2e/error-shape.spec.ts:405:17 - error TS2339: Property 'details' does not exist on type
    '{ message: string; code: string; title: string; }'.
Test Suites: 1 failed, 1 passed, 2 total
```

One more case went red with the fix rather than before it and is counted with the rest:
`BaseExceptionFilter > ... > names the real status for a number`, which asserted the old rule; it
is replaced by `reads a numeric message as its digits, at the real status`.

**GREEN, package gates at `ab7ee5b`, `2026-09-16 05:07:56 UTC`**, `git status --porcelain` empty:

```
$ npm test
rc=0
Test Suites: 39 passed, 39 total
Tests:       964 passed, 964 total

$ npm run test:e2e
rc=0
Test Suites: 2 passed, 2 total
Tests:       41 passed, 41 total

$ npm run lint
rc=0

$ npm run build
rc=0
```

Monorepo root, `2026-09-16 05:08:19 UTC` onward:

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

$ npx turbo run test:e2e --filter=@lerianstudio/sindarian-server --force
rc=0
 Tasks:    1 successful, 1 total
```

And the e2e re-run with the cache disabled, `2026-09-16 05:12:37 UTC`, after the mutants and the
rebuild, because Epic 25 found that jest caches a spec's type check across a `.d.ts` change:

```
$ npx jest --no-cache            # in packages/sindarian-server/test
rc=0
Test Suites: 2 passed, 2 total
Tests:       41 passed, 41 total
```

**LIVE at `ab7ee5b`**, through a real `Response` with the recipe TECHNICAL.md prescribes, against
the dist rebuilt from the clean head (`build rc=0`, emitted type re-read as
`... & Record<string, unknown>`):

```
code is a pg INT 5      404 {"timestamp":"T","code":"5","title":"Not Found","message":"Ledger not found"}       (none)
code is a bigint 10n    404 {"timestamp":"T","code":"10",...}                                                   (none)
title is a number 502   404 {"timestamp":"T","code":"0003","title":"502",...}                                   (none)
code is an object       404 {"timestamp":"T","code":"0004",...}    Exception classification dropped {"dropped":["code"],"status":404}
code getter throws      404 {"timestamp":"T","code":"0004",...}    the same line
title is an object      404 {"timestamp":"T","code":"0003","title":"Not Found",...}   the same line, dropped ["title"]
code getter throws AND metadata getter throws
                        404 {"timestamp":"T","code":"0004","title":"Not Found","message":"Ledger not found"}
                        Exception classification dropped {"dropped":["code"],"status":404}
                        Exception metadata dropped {"code":"0004","title":"Not Found","cause":"md exploded"}
nothing wrong           404 {"timestamp":"T","code":"0003","title":"Not Found",...}   (none)
```

The last row of the group is the one Epic 24 is about: the metadata line carries its own reason
and the fields that identify the incident, where before it carried `{"record":"unserialisable",
"cause":"code getter exploded"}` and nothing else. The package renders no UI, so there is no
browser artefact; the two e2e routes drive the same frame through the real `app.handler`.

### Fix pass 2, at the code-final head `d7d7d6e`

Package gates, `2026-09-16 03:55:49 UTC`, `git status --porcelain` empty:

```
$ npm test
rc=0
Test Suites: 39 passed, 39 total
Tests:       953 passed, 953 total

$ npm run test:e2e
rc=0
Test Suites: 2 passed, 2 total
Tests:       40 passed, 40 total

$ npm run lint
rc=0

$ npm run build
rc=0
```

Monorepo root, `2026-09-16 03:56:21 UTC` onward, same head, `git status --porcelain` empty:

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

$ npx turbo run test:e2e --filter=@lerianstudio/sindarian-server --force   # the CI job's arm
rc=0
@lerianstudio/sindarian-server:test:e2e: Tests:       40 passed, 40 total
 Tasks:    1 successful, 1 total
```

The blocks for fix pass 1 follow, at the head they were taken on.

**Both blocks below were re-taken from scratch at the code-final head of fix pass 1.** The
previous package block pasted `Tests: 932 passed` under a header arguing the block was fresh, and
932 was the total two code commits earlier, at `d0683c6`. Three reviewers raised it and one
CodeRabbit thread was resolved with the number still wrong. Nothing here is carried over from an
earlier head: every line below is output from the run named above it.

Package gates, `2026-09-16 02:04:43 UTC`, head `243cfa3`, `git status --porcelain` empty:

```
$ npm test
rc=0
Test Suites: 39 passed, 39 total
Tests:       945 passed, 945 total

$ npm run test:e2e
rc=0
Test Suites: 2 passed, 2 total
Tests:       38 passed, 38 total

$ npm run lint
rc=0

$ npm run build
rc=0
```

Monorepo root, `2026-09-16 02:05:07 UTC` onward, same head, `git status --porcelain` empty:

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
@lerianstudio/sindarian-server:test:e2e: Tests:       38 passed, 38 total
 Tasks:    1 successful, 1 total
```

### Mutants

Eleven were taken at `d5d5e54`, the code-final head before fix pass 1, `2026-09-16 00:54:49 UTC`
onward, each applied with an exact single-occurrence replacement, `dist` rebuilt by the e2e run,
reverted with `git checkout -- packages`, and `clean-after-<id>=0` printed after every revert.
Unit counts in that table are out of 934 and e2e out of 33. Numbering continues #191's, which
ended at N10.

**Fix pass 1 re-took eleven at its own code-final head `243cfa3`**, `2026-09-16 02:05:56 UTC`
onward, each reverted with `clean-after=0` printed: the five new ones, N22 to N26, plus N11 and
the five that touch `log-error-line.ts`, because this pass changed that file. Their table follows
this one. Unit counts there are out of 945 and e2e out of 38.

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
| N20 | the whole uniquifier dropped, so cut keys merge again | unit rc=1, **3 failed**: the two `keeps both fields` cases and the ceiling case; e2e rc=0. It is the state the first review round found, and what Epic 8 exists for. A narrower first version of this row, replacing only the FIRST candidate with the plain cut, SURVIVED and was discarded as equivalent rather than recorded as a hole: the retry loop recovers the mark, and a plain cut that collides with nothing is a correct name |
| N21 | the mark grown one character per retry again | unit rc=1, **1 failed**: `holds the ceiling against a record that occupies the candidates`; e2e rc=0. It is the state the second review round found, and what Epic 9 exists for |

### Mutants of fix pass 1, at `243cfa3`

Unit counts out of 945, e2e out of 38. Every row was applied as an exact single-occurrence
replacement and reverted with `clean-after=0`. `dist` was rebuilt after the last row, and the
package e2e re-run green, because a mutant's own `pretest` build leaves the mutated `dist` behind
even after the source is restored.

| # | Mutation | Result |
|---|---|---|
| N22 | the metadata guard removed, `...this.readWireMetadata()` back to `...this.metadata` | unit rc=1, **3 failed**: the three `metadata a route attached` cases; e2e rc=1, **2 failed**: `answers a body at all for metadata carrying a getter that throws` and `... a value that cannot be serialised`. This is Epic 11 and the contrarian's refutation |
| N23 | `onRequestFailure`'s record built eagerly again | unit rc=1, **1 failed**: `announces an unreachable upstream whose reason cannot be read`; e2e rc=0. It SURVIVED every case before Epic 12 |
| N24 | the reason for a non-Error back to `typeof failure` | unit rc=1, **2 failed**: `names what a record builder threw when it was not an Error` and `bounds what a record builder threw` |
| N25 | the keys measured through `Object.entries` again | unit rc=1, **1 failed**: `reads a record value once on the path that cuts nothing` |
| N26 | the mark dropped from a cut key's FIRST candidate | unit rc=1, **1 failed**: `bounds a key at two thousand characters`. This is the narrower version of N20 that SURVIVED at `d5d5e54` and was recorded there as equivalent; the key-content pin of Epic 15 is what makes it a kill |
| N11 | the null-body statuses admitted again (re-take) | unit rc=1, **7 failed**, was 4 at `d5d5e54`: the three `readWireStatus` rows, the three new `BaseExceptionFilter` rows of Epic 17, and `names 500 when the status cannot be used either`; e2e rc=1, **3 failed**, was 1: the 204, 205 and 304 routes |
| N14 | the key bound removed (re-take) | unit rc=1, **5 failed**: both `bounds a key` cases, `keeps both fields when two keys share their first two thousand characters`, `keeps every cut key within the ceiling when it has to retry` and the ceiling case |
| N15 | the key bound narrowed to the top level (re-take) | unit rc=1, **1 failed**: `bounds a key three levels down`. Narrower than the row it re-takes: this replacement keeps the string-value bound at depth and drops only the KEY half at depth, which is the half `Object.keys` touched |
| N18 | the reason dropped from the announcement (re-take) | unit rc=1, **7 failed**, was 4: the four of the original row plus the two new non-Error cases of Epic 13 and the new `onRequestFailure` case of Epic 12 |
| N20 | the whole uniquifier dropped (re-take) | unit rc=1, **4 failed**, was 3: the three of the original row plus `bounds a key at two thousand characters`, which is the content pin of Epic 15 |
| N21 | the mark grown one character per retry again (re-take) | unit rc=1, **1 failed**: `holds the ceiling against a record that occupies the candidates` |

### Mutants of fix pass 2, at `d7d7d6e`

Six, `2026-09-16 03:57:02 UTC` onward, unit counts out of 953 and e2e out of 40. The same six were
taken at `4fb996d` and again at `eeb9ba3`, and re-taken here after each prose-only commit, with
identical counts and case names all three times. Each was applied
as an exact single-occurrence replacement, asserted as one occurrence before the run, and reverted
with `clean-after=0` printed. `dist` was rebuilt from the clean head afterwards, because a
mutant's own e2e `pretest` leaves the mutated build behind: measured this pass, a live probe run
against that stale `dist` reported a drop with NO operator line and was a measurement of N31, not
of the head.

| # | Mutation | Result |
|---|---|---|
| N27 | the metadata round trip back to check-then-spread, `JSON.stringify(this.metadata); return { ...this.metadata }`, which is the shape the doc block forbids | unit rc=1, **2 failed**: `reads a metadata value once, so a second read cannot decide the body` (`Expected: 1, Received: 2`) and `lets a metadata root with its own toJSON decide the body`. It SURVIVED all 945 unit and all 38 e2e cases of fix pass 1 |
| N28 | the inner reason guard deleted, so `String(failure)` runs unguarded | unit rc=1, **1 failed**: `keeps the real status when the reason cannot be read either`, on `Expected constructor: not ServiceUnavailableApiException`, which is the 503-for-a-409 defect restored. It SURVIVED all 945 unit and all 38 e2e cases of fix pass 1 |
| N29 | the code guard removed, `readWireField(() => this.code, ...)` back to `this.code` | unit rc=1, **3 failed**: the throwing-getter case, the both-fallbacks case and the bound case; e2e rc=1, **1 failed**: `answers a body at all when reading the code throws` |
| N30 | the title guard removed, the same way | unit rc=1, **3 failed**: the object-title case, the both-fallbacks case and the bound case; e2e rc=1, **1 failed**: `answers a string title when a route wrote an object` |
| N31 | the drop announced to nobody, the line and its field list deleted | unit rc=1, **4 failed**: all four classification cases that read the line; e2e rc=1, **2 failed**: both new routes |
| N32 | the classification bound widened to the message ceiling | unit rc=1, **1 failed**: `bounds a code and a title an upstream sized` |

### Mutants of fix pass 3, at `ab7ee5b`

Five mutations in six runs, `2026-09-16 05:09:33 UTC` onward, unit counts out of 964 and e2e out
of 41. Each was applied as an exact single-occurrence replacement, which the editor asserts by
refusing a match that is not unique, and reverted with `clean-after=0` printed. `dist` was rebuilt
from the clean head afterwards and the emitted type read back, because a mutant's own e2e
`pretest` leaves the mutated build behind.

| # | Mutation | Result |
|---|---|---|
| N33 | the metadata log line built from `this.code` and `this.title` again, the pass-2 shape | unit rc=1, **1 failed**: `reads the code once when the metadata drops beside it` |
| N34 | `readWireField` back to strings only, so a primitive is replaced again | unit rc=1, **7 failed**: the four `as its digits` classification rows and the three numeric-message cases in `api-exception`, `http-exception` and `base-exception-filter` |
| N35 | the type filter dropped, so everything but `null` and `undefined` is stringified | unit rc=1, **13 failed**: both non-primitive classification rows, the both-fallbacks case, the object-title case, the rejected-form parity case and every upstream-problem-object message case across the three suites |
| N36 | the metadata round trip back to check-then-spread (a re-take of N27, for the new case) | unit rc=1, **3 failed**: `reads a metadata value once...`, `keeps the named fields when a metadata root has its own toJSON` and the new `lets a metadata root whose class has a toJSON decide the body` |
| N37 | the emitted return type narrowed back to the three named fields | unit rc=0 and build rc=0, both blind to it; e2e rc=1, **the suite refuses to run**: `TS2339: Property 'details' does not exist on type '{ message: string; code: string; title: string; }'`. It SURVIVED its first run at 964 unit and 41 e2e, from jest's cache, and is a kill with `--no-cache` |

N37's first run is the sixth, and it is left in the count rather than tidied away: a cached type
check is exactly the way this pin could rot without anyone noticing.
