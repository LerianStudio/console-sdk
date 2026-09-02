# Release back-merge hygiene — Mini Plan

> **For implementers:** one-phase plan. Epics are parallel streams: dispatch every
> epic whose dependencies are met, at the same time, one agent per epic, same
> branch. All work lands in a single PR.

**Goal:** make a stuck main→develop back-merge impossible to miss (it froze the version line 4 times: 34, 12, 41 and 7+ days), by bumping the shared-workflow pin to the version that pushes the sync directly and fails loudly on conflict, and by documenting the mandatory back-merge.
**Scope:** `.github/workflows/release.yml` (one pin) + `docs/PROJECT_RULES.md`. No package code.

Decisions already made (Fred, 2026-09-03): back-merge only (no develop→main promotion); durable fix = workflow bump + doc. The back-merge itself ships separately as PR #164.

## Streams

| Epic | Delivers | Depends on | Files |
|------|----------|------------|-------|
| 1.1  | stuck back-merge becomes a red build, not a silent PR | none | `.github/workflows/release.yml` |
| 1.2  | the mandatory back-merge is written down with its failure mode | none | `docs/PROJECT_RULES.md` |
| 1.3  | integration + verification | 1.1, 1.2 | — (verification only) |

## Contracts

1. **Pin target:** `LerianStudio/github-actions-shared-workflows/.github/workflows/gptchangelog.yml@v1.65.0` (from `@v1.18.1`). If v1.65.0's required inputs/secrets are incompatible with what release.yml passes today, STOP and report the exact incompatibility — do not improvise a different version.
2. No other workflow, job, or input changes ride along.

---

### Epic 1.1: bump the gptchangelog shared-workflow pin

**Goal:** the sync step stops opening a manual-merge PR that conflicts and rots; from v1.63.0-beta.8 the shared workflow pushes the back-merge directly and hard-fails on conflict.
**Scope:** the single `uses:` pin in `release.yml` (~line 275).
**Dependencies:** none
**Done when:** the pin reads `@v1.65.0` and the call site is verified compatible with that version's interface.
**Status:** Done

#### Task 1.1.1: Bump the pin and verify the callee interface

- [x] Done

**Context:** `.github/workflows/release.yml` calls the org shared workflow `gptchangelog.yml@v1.18.1`. That version's sync step opens a PR main→develop, says "merge manually", and silently `exit 0`s while one is already open — the 4×-recurring freeze. v1.63.0-beta.8+ replaced it with a direct push (`chore(changelog): backmerge [skip ci]`) that exits 1 on conflict. 47 minors of drift sit between the pins, so the interface must be checked, not assumed.

**Implementation vision:** fetch the v1.65.0 tag's `gptchangelog.yml` from `LerianStudio/github-actions-shared-workflows` (`gh api` or raw URL); diff its `workflow_call` inputs/secrets/permissions against what release.yml passes at the call site; bump the pin only if compatible (Contract 1). Note in the commit body what the new version changes operationally (PR-based sync → direct push, loud failure).

**Files:**
- Modify: `.github/workflows/release.yml`

**Verification:** `python3 -c "import yaml,sys; yaml.safe_load(open('.github/workflows/release.yml'))"` parses; `actionlint` if available on PATH (report if not); a written input-by-input compatibility table in the report.

**Done when:** pin bumped, interface verified compatible, yaml valid.

---

### Epic 1.2: document the mandatory back-merge

**Goal:** the back-merge stops being undocumented bot behavior nobody owns.
**Scope:** `docs/PROJECT_RULES.md` — the branch-contract area (~line 32).
**Dependencies:** none
**Done when:** the rule exists with the mechanism and the failure mode.
**Status:** Done

#### Task 1.2.1: Write the back-merge rule into PROJECT_RULES

- [x] Done

**Context:** `docs/PROJECT_RULES.md:32` states the main/develop branch contract but never mentions that every stable release REQUIRES main to be merged back into develop. The reason is mechanical: `@semantic-release/git` commits the release `package.json`/`CHANGELOG.md` on main, so the stable tag is unreachable from develop until a back-merge lands — and semantic-release then freezes the prerelease base version (shipped: beta.7 published below the 1.3.0 stable; 1.2.0 froze for 41 days).

**Implementation vision:** add a short subsection after the branch contract: when a stable releases, the shared workflow pushes a back-merge (post-bump; cite the conflict-prone pair of files); if it fails, resolving it is a BLOCKING follow-up, not hygiene — with one sentence on the version-freeze mechanism and the four historical occurrences (PRs #90/#96/#112/#148, fixed by #145/#164). Match the file's existing voice and heading style.

**Files:**
- Modify: `docs/PROJECT_RULES.md`

**Verification:** every factual claim in the new text checked against the repo (tag reachability commands, PR numbers via `gh pr view`).

**Done when:** the rule is in, factual, and voice-matched.

---

### Epic 1.3: integration + verification

**Goal:** the combined diff is exactly the two implementation files plus this plan file, and CI-safe.
**Scope:** verification only.
**Dependencies:** 1.1, 1.2
**Done when:** diff scoped, yaml valid, claims verified.
**Status:** Done

#### Task 1.3.1: Verify the combined tree

- [x] Done

**Context:** repo CI ignores `**/*.md`, and workflow-file changes don't run package jobs — the executable gates here are the yaml parse and `actionlint` (against the pre-existing baseline), so the review weight falls on reading.

**Implementation vision:** `git diff --stat` touches only `.github/workflows/release.yml`, `docs/PROJECT_RULES.md`, and this plan file; re-run the yaml parse; re-read the compatibility table from 1.1 against the actual v1.65.0 file one more time.

**Verification:** commands exit 0, captured directly (never through a pipe).

**Done when:** all checks pass and epics 1.1-1.2 read Done.
