# The Manager Pattern (Claude Code workflow)

This document is the canonical workflow Claude Code uses to develop KNOT. It mirrors the principles captured in your local memory (`~/.claude/projects/-Users-kttrcdl-project/memory/feedback_manager_pattern.md`) so future Claude Code sessions on a fresh machine can pick up the same pattern from the repo alone.

## Roles

| Role | Instance | Memory access |
|---|---|---|
| **Manager** | The session you're reading this in. | Local memory (`~/.claude/projects/.../memory/`). |
| **Implementer** | Fresh subagent dispatched via `Agent` tool. | None — gets full task text in the prompt. |
| **Simplifier** | Fresh subagent invoking `Skill("simplify")`. | None. |
| **Spec reviewer** | Fresh subagent. | None. |
| **Code quality reviewer** | Fresh subagent. | None. |

Subagents are **ephemeral**. They don't read manager memory; they don't share state with each other. Communication is one-way: prompt-in, report-out.

## Per-phase cycle

For every code-touching phase (i.e., a milestone's worth of tasks, or a feature):

```
implementer → /simplify → spec compliance review → code quality review → manager pushes
```

Each subagent is its own dispatch. Wait for one to return DONE before dispatching the next.

### 1. Implementer

Dispatch a fresh subagent with the **full text** of the plan tasks for this phase. Don't tell them to read the plan file — that wastes their context. Include:

- What to implement (full task text).
- Where (which files; explicit "sandbox" list).
- Scene-setting: where this fits in the larger project, what's already done.
- Conventions: commit style (Conventional Commits + HEREDOC + Co-Authored-By trailer).
- Forbidden paths: list files they MUST NOT touch.

Prompt template: see `~/.claude/plugins/cache/claude-plugins-official/superpowers/<version>/skills/subagent-driven-development/implementer-prompt.md`.

The implementer reports DONE / DONE_WITH_CONCERNS / BLOCKED / NEEDS_CONTEXT. Handle each:
- DONE → proceed.
- DONE_WITH_CONCERNS → read the concerns; address before review if material.
- NEEDS_CONTEXT → provide it, re-dispatch.
- BLOCKED → assess: more context? more capable model? smaller task? plan flaw?

### 2. Simplify pass

After the implementer reports DONE, dispatch a subagent that invokes the `simplify` skill on the diff. Its job:

- Identify reuse, dead code, repetition, premature abstraction.
- Apply small refactors (one commit) to clean up.
- Constrain to the implementer's sandbox.
- If nothing to do, report "no changes" and exit cleanly.

The simplify subagent **runs before the reviewers** so reviewers see the cleaned-up version.

### 3. Spec compliance review

Dispatch a fresh subagent. Its job: **verify the code matches the plan, no more and no less.**

- The reviewer does NOT trust the implementer's self-report.
- Reads actual files, runs actual commands, diffs against the plan.
- Reports ✅ Spec compliant, or ❌ with specific issues (file:line + what's missing or extra).

If ❌, dispatch a fresh implementer with the fix list. Re-review.

### 4. Code quality review

Only after spec compliance ✅. Dispatch a fresh subagent. Its job: **assess code quality.**

- Architecture, maintainability, edge cases, error handling.
- Test design (real behavior vs mock theater).
- Production readiness.
- Reports Strengths / Critical / Important / Minor / Recommendations / Assessment.

If Critical or Important issues, dispatch a fresh implementer with the fix list. Re-review.

### 5. Manager pushes

After both reviews pass:

- Manager commits any pending doc/HANDOFF updates.
- `git push origin dev_kttrcdl_Claude_Code` (this branch, with all the AI files intact).
- Updates `docs/dev-logs/HANDOFF.md` summarizing the phase.

To eventually merge into `dev` for cross-tool integration:

- Run `./scripts/prepare-pr.sh dev` from repo root → creates a sibling branch with forbidden files stripped.
- `gh pr create --base dev --head <sibling>`.
- Wait for CI; merge into `dev`.

## Sandbox discipline

Implementers and simplifiers MUST receive an explicit list of allowed/forbidden paths. They reliably respect it when stated. The most common drift sources:

- Implementer "helpfully" edits `docs/dev-logs/HANDOFF.md` — disallow.
- Implementer edits files outside their phase's scope — disallow.
- Implementer touches Rust when their phase is frontend (or vice versa).

In M1, every subagent dispatch had an explicit "**Do NOT touch:**" list and they respected it.

## Common pitfalls and lessons (from M1)

- **`react-hooks/set-state-in-effect` lint:** new in v7 of eslint-plugin-react-hooks. Fires on `setState` calls inside `useEffect`. Narrow `// eslint-disable-next-line` with a justification comment is the accepted workaround.
- **Mount-once components:** Milkdown's `<Editor>` reads props on mount only. Document this in JSDoc so callers know to remount via the React `key` prop. Pass stable callback identity (Zustand selector returns stable refs).
- **Atomic file writes:** static `.tmp` suffix is dangerous (collision + race). Always use a randomized suffix (`uuid::Uuid::new_v4().simple()`).
- **Save-As bug pattern:** don't mutate state BEFORE the dialog confirms. The cancel path loses the previous state. Always pick first, then mutate.
- **pnpm versioning:** pnpm 11+ needs Node ≥22.13. CI and local pinned to pnpm 9.15.x for Node 20 compatibility.

## When to break the pattern

The full cycle is overhead for trivial changes. Manager may directly:

- Update doc files (`HANDOFF.md`, `CHANGELOG.md`, etc.).
- Update CI config (when the change is mechanical).
- Apply a one-line typo fix.

For anything that touches `src/`, `src-tauri/`, `mcp/`, or test files → run the full cycle.

## Tooling

- `Agent` — dispatch subagents.
- `Skill` — invoke skills (`writing-plans`, `subagent-driven-development`, `simplify`, etc.).
- `TaskCreate` / `TaskUpdate` — track phase-level progress (one task per phase).
- `Bash`, `Edit`, `Read`, `Write` — direct manager actions.

See `safe-tools.md` for the MCP/tool allowlist.
