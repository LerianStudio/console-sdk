# The server always hands the caller a string message - Mini Plan

**Goal:** a caller of `@lerianstudio/sindarian-server` can read `message` as a string on
every failure path, so a route that classifies a failure with string methods has a live
branch instead of a dead one. The transport frame was already there; the exception filter
that writes the last body before the wire was not.

**Scope:** `packages/sindarian-server/src/exceptions/base-exception-filter.ts` and
`api-exception.ts`, their unit tests, and one new controller plus one new spec in the
package's e2e app. No change to `HttpService`, to `toProblemMessage`, or to any other
package.

Status: Done.

## What the lane was opened for, and what was actually left

The lane was opened on a Console measurement: an upstream failure arrives with `message`
holding the upstream body instead of a sentence, so `error.message.includes(...)` never
matches and the route answers a generic 500. Two Reporter routes carry a shape-tolerant
classifier as a workaround.

That defect is real and it is already fixed here. `ApiException` took `message` as a
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
`Response` each route produced:

| A route threw | Status | `typeof body.message` | What the caller got |
|---|---|---|---|
| `{ message: { title, detail } }` | 500 | `object` | the upstream object, `detail` and all |
| `{ code: 'E_NOPE' }` | 500 | `undefined` | `{}`, no message field at all |
| `'something went wrong'` | 500 | `undefined` | `{}`, a string has no `.message` |
| `null` | none | none | the filter threw on `.message`, so the pipeline never answered and Next served its own HTML page |

The first row also leaks: `detail` carried `cpf 123.456.789-00` and an internal hostname
into the browser, which is the leak `toProblemMessage` was written to stop one frame down.
The last row is worse than a wrong shape: a browser calling `response.json()` on an HTML
page fails on the first character.

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
which is exactly where the `null` case hid.

### Behaviour that deliberately did not change

- A plain `Error` keeps its own message on the wire. `toProblemMessage` returns the
  fallback for an `Error` *value*, but what is passed here is `exception.message`, which
  is already a string by then. Redacting a thrown `Error` is a policy change, not a shape
  fix, and it is not this lane's.
- An `ApiException` body is byte-identical. Its message is already bounded and non-empty
  by construction, and `toProblemMessage` returns a string under 2000 characters
  unchanged.

## Found by this lane, not fixed

1. **`BaseExceptionFilter` ignores `getStatus()` on a non-`ApiException`.** A plain
   `HttpException`, which the package exports and which carries a real status, is answered
   as 500. Out of scope for a message-shape fix; it is a status defect.
2. **`ZodValidationPipe` puts the whole `ZodError` in the response.**
   `new ValidationApiException('Validation failed', error)` lands in metadata and
   `getResponse()` serialises it, so every rejected value reaches the browser. Arguably
   intended for form feedback, and the same argument `toProblemMessage` makes about
   `errors[]` applies against it. Needs a product decision, not a patch.
3. **The e2e harness breaks if `test/` is installed on its own.** `npm install` there
   fetches a second copy of `next`, and the two `NextRequest` types are incompatible, so
   the suite fails to compile before running a single case. CI never hits it because
   `npm ci` at the root links the workspace and hoists one `next`. Left alone; the fix is
   a note or a workspace entry, and neither belongs in this PR.

## Verification

All of it at `24a7777`, the code-final head.

```
$ cd /srv/worktrees/sdk-error-shape/packages/sindarian-server && npm test
Test Suites: 38 passed, 38 total
Tests:       850 passed, 850 total
rc=0

$ npm run lint
> eslint .
rc=0

$ npm run build
> tsc && npm run build:paths
rc=0

$ cd /srv/worktrees/sdk-error-shape && npm test          # turbo, every package
 Tasks:    6 successful, 6 total
rc=0

$ npm run lint                                            # turbo, every package
 Tasks:    5 successful, 5 total
rc=0

$ cd packages/sindarian-server/test && npm test           # e2e, real dispatch
Test Suites: 2 passed, 2 total
Tests:       25 passed, 25 total
rc=0
```

RED before GREEN, both at the stated head.

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

# e2e through ServerFactory.handler, with the two source files held at 9ded7ed
  ● reduces an upstream problem object to its classification
    Expected: "string"   Received: "object"
  ● names a sentence when the thrown value has no message
    Expected: "string"   Received: "undefined"
  ● names a sentence for a thrown string
    Expected: "string"   Received: "undefined"
  ● answers JSON, not an HTML page, for a thrown null
    TypeError: Cannot read properties of null (reading 'message')
      at BaseExceptionFilter.catch (../src/exceptions/base-exception-filter.ts:21:28)
      at ServerFactory._handleRequest (../src/server/server-factory.ts:216:46)
Tests:       4 failed, 21 passed, 25 total
# after
Tests:       4 passed, 4 total
```

The socket measurement in the table above ran under `unshare -rn` on ephemeral loopback
ports, at `9ded7ed` and again at `24a7777`, with identical output: this PR changes nothing
on the transport frame.
