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
| Phase 3 | `src-tauri/src/commands/fs.rs` + plugin/capability setup | 3.1-3.3 | pending |
| Phase 4 | `src/io/`, `src/state/actions.ts` | 4.1-4.3 | pending |
| Phase 5 | `src-tauri/src/menu.rs`, `src/menu/`, App.tsx integration | 5.1-5.3 | pending |
| Phase 6 | `src/styles/` | 6.1-6.2 | pending |

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

**Phase 2 follow-up TODOs (revisit in Phase 4):**
- Welcome doc uses `path: ''` (empty string) instead of `null`. Phase 4 may want to widen `open()` to `path: string | null` or seed via INITIAL.
- The `editorKey` remount trick is acknowledged transitional; Task 4.5 should formalize.
- Add direct unit tests for `markClean()` and `reset()` (currently only exercised transitively).
- Consider `open()` short-circuit when path+content match the current state.
- Consider Milkdown round-trip whitespace normalization that could mark welcome doc as dirty on first listener call.

### Phase 7 — Release (manager)

| Task | Status |
|---|---|
| Integration test | pending |
| Build + sign (unsigned ok for v0.0.1) | pending |
| Tag + release | pending |

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
