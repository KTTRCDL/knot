# ClaudeTeam — Detailed Onboarding for KNOT

This document is for the **first time** you stand up a ClaudeTeam deployment on KNOT. After the first session you can usually rely on `CLAUDETEAM.md` at the repo root for context.

## Prerequisites

- A server (Linux, macOS, or a VM) with:
  - Git
  - tmux 3.x+
  - Rust stable (`rustup`)
  - Node 20 + pnpm 9.15.x
  - The ClaudeTeam runtime installed (clone from `https://github.com/zylMozart/ClaudeTeam`)
- A Feishu (Lark) workspace with:
  - A bot app created via the [Feishu open platform](https://open.feishu.cn/app)
  - The bot added to a group chat
  - `FEISHU_APP_ID` and `FEISHU_APP_SECRET` available as env vars or in the toml
- `gh` CLI authenticated against `KTTRCDL/knot`

## First-time setup on your server

```bash
# 1. Clone knot and check out the ClaudeTeam branch
git clone git@github.com:KTTRCDL/knot.git
cd knot
git checkout dev_kttrcdl_ClaudeTeam

# 2. Set repo-local commit author
git config user.email "KTTRCDL@outlook.com"
git config user.name "KTTRCDL"

# 3. Fill in claudeteam.toml
$EDITOR claudeteam.toml
# Replace the REPLACE_ME values for project.root and feishu.chat_id

# 4. Set state dir (or use the default .claudeteam/state)
export CLAUDETEAM_STATE_DIR="$(pwd)/.claudeteam/state"
mkdir -p "$CLAUDETEAM_STATE_DIR"

# 5. Install project deps
pnpm install
cd src-tauri && cargo build && cd ..

# 6. Run ClaudeTeam init
claudeteam init --config claudeteam.toml

# 7. Start the manager
claudeteam start
```

The Feishu group should now receive a "ClaudeTeam manager online" message. Send `/help` in the chat to see commands.

## First conversation with the human

The very first thing you (the manager agent) do in the Feishu chat:

```
Manager> Loaded KNOT project context.
        Branch: dev_kttrcdl_ClaudeTeam
        Latest tag: v0.0.1 (M1 — Foundation, shipped 2026-05-19)
        Last commit: <sha> <subject>
        Open milestone: M2 — Renderers (per docs/superpowers/specs/)
        No active plan yet for M2.

        Ready when you are. Two options:
        (1) /hire planner to write M2 plan
        (2) Give me direct instructions
```

## Per-phase cycle commands

For each phase of a milestone:

```
# In the Feishu chat:
> /hire implementer-A "Implement Phase 1 of M2: KaTeX math renderer.
>   Sandbox: src/editor/plugins/math/. Tests: src/editor/plugins/math/__tests__/.
>   Plan text:
>   <paste full Phase 1 of M2 plan here>"

# Wait for implementer-A to report DONE in their pane.
# Then:
> /hire simplifier-A "/simplify the commits between <base> and <head>"

# Wait for DONE. Then:
> /hire spec-reviewer-A "Verify Phase 1 of M2 against plan.
>   Plan text: ... HEAD_SHA: ... BASE_SHA: ..."

# If ❌: /hire fix-implementer-A "<fix list>"  → re-review.
# If ✅: /hire code-reviewer-A "Review code quality.
>   Plan: ... BASE_SHA: ... HEAD_SHA: ..."

# If issues: fix loop. If approved: manager commits HANDOFF update, pushes.
# /fire all role:implementer to clean up panes.
```

## Visibility into worker work

The human can `tmux attach -t claudeteam` to see all worker panes. The manager can summarize via `/health` or `/team`. Workers can be paused / resumed.

## Pushing changes

The manager NEVER pushes directly to `main` or `dev`. The flow:

1. Work happens on `dev_kttrcdl_ClaudeTeam` (this branch).
2. When a milestone is ready: manager runs `./scripts/prepare-pr.sh dev` to create a clean sibling branch.
3. Manager opens PR via `gh pr create --base dev --head dev_kttrcdl_ClaudeTeam--for-dev`.
4. CI gates: `scaffold-check.yml` + `ci.yml` (frontend, backend, build).
5. Once green, the human (KTTRCDL) reviews and squash-merges.
6. For release: human opens `dev → main` PR, tags `v0.0.X`, which triggers `release.yml`.

## Tool/MCP allowlist

See `docs/claudeteam/agents.md` for per-worker tool restrictions. The general rules:

- All workers may use `git`, `pnpm`, `cargo`, file editing tools, and the test/lint commands.
- No worker is allowed to: `sudo`, `git push --force`, `git config --global`, install global tools, run `curl | sh`.
- The manager handles all `gh pr` and `git push` operations.

## Recovering from outage

ClaudeTeam's watchdog auto-recovers individual workers. If the whole runtime crashes:

```bash
# state survives in $CLAUDETEAM_STATE_DIR
claudeteam start
# the manager reconnects to the in-progress phase
```

If state is corrupted:

```bash
# Read docs/dev-logs/HANDOFF.md to find the last committed state
# Manually reset:
git status
# Either continue from the last commit, or:
git reset --hard origin/dev_kttrcdl_ClaudeTeam
```

## Hand-off to a human

If the manager hits a wall (unclear spec, contradictory plan, repeated worker failures):

1. Post detailed status to the Feishu chat: what was attempted, what failed, what's needed.
2. Update `docs/dev-logs/HANDOFF.md` with a "BLOCKED: <reason>" section.
3. Wait for the human to respond.
