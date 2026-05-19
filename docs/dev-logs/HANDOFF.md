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

### Phase 0 — Scaffold (manager)

| Task | Status | Notes |
|---|---|---|
| 0.1 Pre-flight | done | Installed: pnpm@9.15.0, tmux@3.6a, Rust (in progress). Node@20.20.1, gh@2.88.1 already present. GitHub user: KTTRCDL. |
| 0.2 Scaffold Tauri | pending | After Rust install completes. |
| 0.3 Git init + LICENSE + README | pending | |
| 0.4 GitHub repo create | pending | Repo will be `KTTRCDL/knot`. |
| 0.5 CI workflow | pending | |

### Phase 1-6 — Engineers (parallel after Phase 0)

| Engineer | Owns | Tasks | Status |
|---|---|---|---|
| Engineer-1 | `src/editor/` | 1.1-1.4 | pending |
| Engineer-2 | `src/state/`, `src/io/`, `src-tauri/src/commands/fs.rs` | 2.1-4.3 | pending |
| Engineer-3 | `src-tauri/src/menu.rs`, `src/menu/`, `src/styles/` | 5.1-6.2 | pending |

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
