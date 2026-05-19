# ClaudeTeam Agent Definitions for KNOT

This document defines the **roles** ClaudeTeam may hire. Each role is mirrored in `claudeteam.toml` under `[[agents]]`. Use this doc when designing prompts and tuning the deployment.

## Role overview

| Role | When to hire | Concurrency |
|---|---|---|
| `frontend-engineer` | Phase work touches `src/` | Multiple instances OK if modules don't overlap. |
| `backend-engineer` | Phase work touches `src-tauri/` | Multiple instances OK if modules don't overlap. |
| `mcp-engineer` | Phase work touches `mcp/` | One at a time (small module). |
| `simplifier` | Always — after each implementer DONE | One at a time. |
| `spec-reviewer` | Always — after each simplifier DONE | One at a time. |
| `code-reviewer` | Always — after each spec-reviewer ✅ | One at a time. |
| `planner` | At milestone start | One at a time. |
| `manager` | Implicit; runs you (the controller) | Singleton. |

## frontend-engineer

**Sandbox:** `src/`, `tests/`, `package.json`, `tsconfig*.json`, `vite.config.ts`, `vitest.config.ts`.

**Forbidden:** `src-tauri/`, `mcp/`, `docs/`, `.scaffold/`, `.github/`.

**Required commands before commit:**
- `pnpm typecheck`
- `pnpm lint --max-warnings 0`
- `pnpm test -- --run`

**TDD discipline:**
- Write failing test first, commit nothing.
- Implement minimum code to pass test.
- Commit test + impl together (one commit per logical step).

**Lint workarounds:** `react-hooks/set-state-in-effect` fires on `setState` inside `useEffect`. Use a narrowly-scoped `// eslint-disable-next-line react-hooks/set-state-in-effect` with a justification comment, NOT a block disable.

**Common gotchas:**
- Milkdown's `<Editor>` is mount-once: changing `initialContent` after mount does nothing. Use React `key` to remount.
- Zustand selectors return stable refs — pass them directly as event handlers.

## backend-engineer

**Sandbox:** `src-tauri/`, `tests/` (Rust-side), `.scaffold/` (read-only reference).

**Forbidden:** `src/`, `mcp/`, `docs/`, `.github/`.

**Required commands before commit:**
- `cargo fmt --check` (auto-fix with `cargo fmt` if needed)
- `cargo clippy --all-targets -- -D warnings`
- `cargo test --all`

**TDD:** prefer `#[cfg(test)] mod tests` colocated with the code. Tests use `tempfile::tempdir()` for filesystem work.

**Common patterns:**
- Atomic writes: write to `<path>.knot-tmp.<uuid>` then `fs::rename`. Use `uuid::Uuid::new_v4().simple()` for the suffix to avoid collisions.
- Tauri commands: two-layer pattern. `#[tauri::command]` wrapper takes serializable `String` types; inner `_impl` function takes `Path` for unit testability.
- Error mapping: `.map_err(|e| e.to_string())` is acceptable for now; a tagged error enum (per Phase 4 follow-up) is the eventual upgrade.

## mcp-engineer

**Sandbox:** `mcp/` only.

**Forbidden:** everything else.

**Required commands before commit (once mcp/ is more than a placeholder):**
- `cd mcp && cargo fmt --check && cargo clippy --all-targets -- -D warnings && cargo test --all`

**Security guardrails:**
- All file-system tools default to read-only.
- Writes require `--allow-write <folder>` at server startup; reject if path is outside that folder (after canonicalization).
- Use `--max-file-size <bytes>` to bound memory.

## simplifier

**Sandbox:** whatever the prior implementer touched (read the diff first to find out).

**Job:** invoke the `simplify` skill on the commit range `BASE_SHA..HEAD_SHA`. The skill (a) reviews for reuse / quality / efficiency, then (b) applies fixes.

**Output:** one focused commit titled `refactor(simplify): <what was simplified>` OR a "no changes needed" report.

## spec-reviewer

**Job:** verify the implementer built exactly what the plan specified — no more, no less.

**Required reads:**
- The plan task text (provided in the prompt).
- The actual code via `git show <sha>` and direct file reads.

**Verification:** do NOT trust the implementer's self-report. The reviewer must independently confirm by reading code.

**Output:**
- ✅ Spec compliant
- ❌ Issues: bulleted list with file:line evidence

## code-reviewer

**Model:** prefer the most capable model available (Opus). Reviews catch bugs cheaper here than later.

**Job:** assess code quality independent of spec.

**Checks:**
- Clean separation of concerns.
- Edge cases handled.
- Error handling appropriate.
- Type safety where applicable.
- DRY / YAGNI / no premature abstraction.
- Test design (real behavior vs mock theater).
- Architecture compatibility with the rest of the project.
- Production-readiness for the project's stage.

**Output format:**
```
### Strengths
[...]
### Issues
#### Critical (Must Fix)
#### Important (Should Fix)
#### Minor (Nice to Have)
### Recommendations
### Assessment
**Ready to merge?** Yes | No | With fixes
**Reasoning:** [...]
```

## planner

**When to hire:** at the start of a new milestone (e.g., "/hire planner 'Write M2 plan from spec docs/superpowers/specs/<latest>.md'").

**Job:** invoke the `superpowers:writing-plans` skill to produce a detailed implementation plan.

**Output:** a `docs/superpowers/plans/<date>-knot-<milestone>.md` file. Workflow:
1. Read the spec.
2. Decompose into phases.
3. For each phase, write detailed step-by-step tasks (with exact code where applicable).
4. Self-review the plan (placeholder scan, type consistency, spec coverage).
5. Hand the plan path back to the manager.

## manager

**Implicit role.** The agent that reads `CLAUDETEAM.md`, hires/fires workers, talks to the human via Feishu, pushes commits.

**Does NOT write code itself.** The manager's job is orchestration.

**Persistent across hire/fire events.** ClaudeTeam runtime treats the manager as a singleton.

## Concurrency rules

- Multiple `implementer` workers may run **only if their sandboxes don't overlap**. Frontend + backend can run in parallel; two frontend workers must not touch the same files.
- `simplifier`, `spec-reviewer`, `code-reviewer` run **strictly sequentially** within a phase.
- `planner` is single-instance per milestone.

## Model selection

| Role | Recommended model |
|---|---|
| frontend-engineer | claude-sonnet-4-6 |
| backend-engineer | claude-sonnet-4-6 |
| mcp-engineer | claude-sonnet-4-6 |
| simplifier | claude-sonnet-4-6 |
| spec-reviewer | claude-sonnet-4-6 |
| code-reviewer | claude-opus-4-7 |
| planner | claude-opus-4-7 |
| manager | claude-opus-4-7 |

Reviewers and planners benefit most from the more capable model. Implementers do fine with sonnet.
