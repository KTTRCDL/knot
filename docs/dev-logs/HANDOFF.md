# KNOT Engineering Handoff Log

This file is the **manager's working board** for KNOT development. It tracks:

- Who owns what (manager / engineer subagents)
- Current status of every milestone task
- Open questions / blockers
- Decisions made and recorded after the spec

The spec is at [`../superpowers/specs/2026-05-19-knot-design.md`](../superpowers/specs/2026-05-19-knot-design.md).
The active plan is at [`../superpowers/plans/2026-05-19-knot-m1-foundation.md`](../superpowers/plans/2026-05-19-knot-m1-foundation.md).

---

## Team

| Role | Identity | Memory |
|---|---|---|
| **Manager** | Claude (this session) | Reads/writes `~/.claude/projects/-Users-kttrcdl-project/memory/` |
| **Engineer-1** | Subagent, ephemeral. Worktree-isolated. | None — gets the plan and spec by path, returns a report. |
| **Engineer-2** | Subagent, ephemeral. Worktree-isolated. | None. |
| **Engineer-3** | Subagent, ephemeral. Worktree-isolated. | None. |

Each engineer subagent works on **its own worktree** (`isolation: "worktree"`) and writes its progress report to `docs/dev-logs/M<n>/<task-name>.md` inside its branch. The manager merges the worktree back to `main` after review.

---

## M1 — Foundation (in progress)

### Phase 0 — Scaffold (manager) — DONE

| Task | Status | Notes |
|---|---|---|
| 0.1 Pre-flight | done | Installed: pnpm@9.15.0, tmux@3.6a, Rust 1.95.0. Node@20.20.1, gh@2.88.1. GitHub user: KTTRCDL. |
| 0.2 Scaffold Tauri | done | Tauri 2.11.2, react-ts template. Crate renamed knot-scaffold → knot, lib name knot_lib. |
| 0.3 Git init + LICENSE + README | done | First commit `ee58777`. |
| 0.4 GitHub repo create | done | https://github.com/KTTRCDL/knot — public. Branch protection (no force-push, no delete) on `main`. |
| 0.5 CI workflow | done | `.github/workflows/ci.yml` with frontend/backend/build jobs. First run id 26089756846. |

### Phase 1-6 — Engineers (serial dispatch, two-stage review per phase)

| Phase | Owns | Tasks | Status |
|---|---|---|---|
| **Phase 1** | `src/editor/`, `src/App.tsx`, `src/App.module.css` | 1.1-1.4 | ✅ **DONE** (7 commits, see below) |
| **Phase 2** | `src/state/`, `src/App.tsx` | 2.1-2.4 | ✅ **DONE** (3 commits, see below) |
| **Phase 3** | `src-tauri/src/commands/fs.rs` + plugin/capability setup | 3.1-3.3 | ✅ **DONE** (5 commits, see below) |
| **Phase 4** | `src/io/`, `src/state/actions.ts` | 4.1-4.3 | ✅ **DONE** (3 commits, see below) |
| **Phase 5+6** | `src-tauri/src/menu.rs`, `src/menu/`, `src/styles/`, App.tsx, main.tsx | 5.1-6.2 | ✅ **DONE** (7 commits, see below) |

#### Phase 1 result

Initial (3 commits): `b5eb042` deps · `9d85b39` Editor component · `9c6e3e2` App wire.
Review fixes (4 commits): `78fdb21` stronger test · `51bc8bf` cancelled flag · `b4916d6` CSS fallbacks · `734a758` mount-once JSDoc.

- Spec compliance: ✅ approved (one minor 3-comment-line deviation around `eslint-disable-next-line`, accepted).
- Code quality round 1: "With fixes" — 4 Important issues.
- Code quality round 2 (after fixes): ✅ approved. Breakage test confirmed new assertions actually catch Crepe failures.
- Decision: leave the 1.67 MB Vite chunk warning (Milkdown+ProseMirror) as a known follow-up. Tauri local bundle, not web-shipped, so accepting for v0.x.
- Decision: minor follow-ups (DEFAULT_DOC drift, prevMarkdown short-circuit, useState discard comment) deferred — not blocking.

#### Phase 2 result

Commits: `605ed10` zustand dep · `93def90` document store (TDD: 4 tests + impl) · `eaf2844` App wire (Zustand selectors + editorKey remount).

- Spec compliance: ✅ approved. App.tsx adds one `eslint-disable-next-line react-hooks/set-state-in-effect` on the `setEditorKey` line (rule is real and necessary — verified by removing the disable and lint errors out).
- Code quality: ✅ approved. Zero Critical/Important issues. 5 Minor items captured below as follow-ups.

#### Phase 3 result

Initial commits: `9ef430e` plugins · `dc1c2a7` fs commands + 4 tests · `565e899` register + capabilities.
Polish commits (from code review follow-up): `2e2b8c7` randomized temp suffix · `6edd415` 3 new tests (sibling-temp, missing-parent, stale-temp).

- Spec compliance: ✅ approved. Deviations: rustfmt reflow on fs.rs (cosmetic).
- Code quality: "Yes, with a small follow-up" — applied as the 2 polish commits. 7 tests total, all green.
- `pnpm tauri build --no-bundle` succeeds end-to-end with new commands + capabilities.

**Phase 3 follow-up TODOs (revisit in later phases):**
- I2 (`tmp_path_for` trailing-slash edge case) — defer until M2/M3 when more file paths flow through.
- I4 (concurrent-writer correctness) — randomized suffix mitigated to "last-write-wins"; revisit if real concurrency emerges.
- I5 (tagged error enum instead of stringified errors) — useful when Phase 4 wants to discriminate `NotFound` from `PermissionDenied` for UX.

#### Phase 4 result

Commits: `fad1f0a` deps · `af6d2aa` io wrapper (5 tests) · `2cc95f2` actions (6 tests).
- Spec compliance: ✅ approved. Zero drift from plan.
- Code quality: "Yes — with follow-up TODOs filed." 2 Important + 5 Minor issues, all non-blocking for the phase.

**Phase 4 follow-up TODOs (Phase 5 MUST handle Important #2; rest can wait):**
- **(Important, Phase 5 wires it)** Error handling for `readFile`/`writeFile` rejections. Pattern A chosen: Phase 5 menu handlers will wrap each action call in try/catch and surface user-facing errors via `@tauri-apps/plugin-dialog`'s `message()` API.
- **(Important, deferrable)** `pickFileToSave` should default to current filename (`basename(state.path)`) for Save-As UX.
- **(Minor)** `pickFileToSave` has a redundant `as string | null` cast — simplify to `return result;` or runtime-narrow with `typeof === 'string'`.
- **(Minor)** Add `markSaved(path)` action to the store; replace `saveDoc`'s imperative `setState`.
- **(Minor)** Add error-path tests for io (`invoke` rejects) and actions (readFile/writeFile reject).
- **(Minor, Phase 5+)** App.tsx welcome doc uses `path: ''` — should be `path: null` (carries forward from Phase 2 M1).

#### Phase 5+6 result (combined per plan dependency)

Initial commits: `cbb2bd1` theme tokens · `1d23736` theme.ts + tests · `3bb0f5f` Rust menu · `065efe9` menu dispatcher · `f20970e` App.tsx wire + safeAction.
Review fix commits: `2c05264` Save As bug (path-preservation + 3 tests) · `165b5c1` theme test gap (localStorage clear assertion).

- Spec compliance: ✅ approved with zero drift. 5-commit ordering preserved.
- Code quality round 1: "With fixes" — 1 Critical (Save As clears path before cancellable dialog) + 1 Important (test gap).
- Code quality round 2 (after fixes): all critical/important resolved. New `saveDocAs()` action lives in `src/state/actions.ts` for Save-As; old `useDocumentStore.setState({ path: null })` workaround removed.
- 25 frontend tests pass (was 22 → 25 after the +3 saveDocAs tests). 7 Rust tests pass.
- `pnpm tauri build --no-bundle` succeeds end-to-end with menu + capabilities + Phase 4 plugins all wired.

**Phase 5+6 follow-up TODOs (carry to Phase 7 prep or beyond):**
- Welcome doc `path: ''` vs `path: null` consistency (deferred from Phase 2/4).
- Document menu-event-dispatcher contract on `registerMenuEvents` (handlers must not let promises reject — `safeAction` is the catch).
- Move `safeAction` to `src/lib/` if/when a second caller appears (M2+).
- Static menu: no dynamic enable/disable for items (Save when not dirty). M2 concern.
- Titlebar height hardcoded 28px — move to `--knot-titlebar-h` token when Phase 7 wires `titleBarStyle: "Overlay"`.
- Defensive guard in `getTheme()` for unexpected `data-theme` values.

**Phase 2 follow-up TODOs (revisit in Phase 4):**
- Welcome doc uses `path: ''` (empty string) instead of `null`. Phase 4 may want to widen `open()` to `path: string | null` or seed via INITIAL.
- The `editorKey` remount trick is acknowledged transitional; Task 4.5 should formalize.
- Add direct unit tests for `markClean()` and `reset()` (currently only exercised transitively).
- Consider `open()` short-circuit when path+content match the current state.
- Consider Milkdown round-trip whitespace normalization that could mark welcome doc as dirty on first listener call.

### Phase 7 — Release (manager) — DONE

| Task | Status |
|---|---|
| 7.1 Polish `tauri.conf.json` | ✅ (commit `7f13ad8`) |
| 7.2 `.github/workflows/release.yml` | ✅ (commit `7f13ad8`) |
| 7.3 Local `pnpm tauri build` → `.dmg` | ✅ 5 MB DMG, 11 MB .app, aarch64 |
| 7.4 Tag + push `v0.0.1` | ✅ tag pushed; release workflow triggered (run id 26095250098) |

**Final M1 totals:** 33 commits on `main`. Tests: 25 frontend (Vitest) + 7 Rust (cargo test) = 32 total. Bundle: ~5 MB `.dmg`, ~11 MB `.app`. All 7 gates (test/typecheck/lint/build/cargo fmt/cargo clippy/cargo test) green.

DMG SHA-256: `1705050610b9b8569ffbe4e3ea8a677d5d1fcbc56b0a48e14ec8706974a419b0`.

---

## Open questions / decisions log

- **2026-05-19** Decided: pnpm pinned to **9.15.x** because pnpm@latest needs Node ≥22.13 and local Node is 20.20.1. CI also pinned to pnpm@9. Reason: avoid forcing a Node upgrade on the user.
- **2026-05-19** Decided: GitHub username canonical case is **KTTRCDL**. Plan references updated.

---

## tmux conventions

Long-running processes (dev server, test watcher, Rust cargo build) live in named tmux sessions so the user can `tmux attach -t knot:<window>` to inspect.

| Session | Window | Purpose |
|---|---|---|
| `knot` | `dev` | `pnpm tauri dev` — the live app |
| `knot` | `test-web` | `pnpm test -- --watch` — frontend test watcher |
| `knot` | `test-rs` | `cargo watch -x test` — Rust test watcher |
| `knot` | `manager` | Free shell for manager-issued commands |

Create with: `tmux new-session -d -s knot -n manager` then `tmux new-window -t knot -n dev` etc.
Inspect from outside: `tmux capture-pane -t knot:dev -p | tail -40`.
Attach (user): `tmux attach -t knot`.
