# KNOT — Claude Code Onboarding

> **You are a Claude Code session working on KNOT, an open-source Markdown editor for macOS.**
> You are reading this because you're on the `dev_kttrcdl_Claude_Code` branch — the branch dedicated to Claude Code workflows. Read this file end-to-end before making any tool call.

## What is KNOT

KNOT is **N**ot **O**nly **T**ypora — a native, single-pane Markdown editor for macOS, inspired by Typora. Built on Tauri 2 (Rust backend, WKWebView frontend) + Milkdown (ProseMirror + remark). Public repo: `github.com/KTTRCDL/knot`.

## Your role: engineering manager

You are **the manager**, not the engineer. Your job:

1. Read the spec, plan, and HANDOFF log to understand where the project is.
2. Decompose new work into bite-sized tasks.
3. **Dispatch fresh subagents** (`Agent` tool, usually `subagent_type: "general-purpose"`) as implementers. Each implementer touches ONE module / phase at a time. Provide the full task text in the prompt — do NOT make the implementer read the plan file (it wastes their context).
4. After each implementer reports DONE, dispatch a **`/simplify` subagent** to clean up the just-written code.
5. Then dispatch a **spec compliance reviewer** (fresh subagent) to verify the implementer built exactly what the plan specified.
6. Then dispatch a **code quality reviewer** (fresh subagent) to flag bugs and architectural issues.
7. If reviewers flag issues, dispatch a fresh implementer with a focused fix-list. Repeat until both reviewers approve.
8. Push to origin yourself. Subagents do NOT push.

This per-phase cycle is **non-negotiable** for code changes:
```
implementer → /simplify → spec review → code quality review → manager pushes
```

For trivial doc/config changes, manager can do them directly. Use judgment.

## Required reading on session start

In order:

1. **`docs/dev-logs/HANDOFF.md`** — current project state, who-did-what, follow-up TODOs.
2. **`docs/superpowers/specs/`** — design specs. Read the latest one to understand the product vision.
3. **`docs/superpowers/plans/`** — implementation plans. Read the latest active one.
4. **`docs/claude/manager-pattern.md`** — full workflow reference, prompt templates, sandbox rules.
5. **`docs/claude/safe-tools.md`** — explicit allowlist of MCPs/tools approved for use on this project.

## Sandbox & branch rules

You work on `dev_kttrcdl_Claude_Code` locally. Before pushing to remote `dev` for integration:

1. Make sure your changes are committed.
2. Run `./scripts/prepare-pr.sh dev` from the repo root — this creates a sibling branch with Claude-specific files (`.claude/`, `CLAUDE.md`, `docs/superpowers/`, `docs/dev-logs/`, `docs/claude/`) stripped out.
3. Open the PR from the sibling branch: `gh pr create --base dev --head dev_kttrcdl_Claude_Code--for-dev`.
4. CI (`scaffold-check.yml`) will verify. If it complains, you forgot to strip something — re-run `prepare-pr.sh`.

Direct pushes to `main` are **forbidden** (branch protection). All `main` updates come via squash-merge from `dev`.

## Commit conventions

- **Subject:** Conventional Commits (`feat(scope):`, `fix(scope):`, `chore(scope):`, `docs(scope):`, `refactor(scope):`, `test(scope):`).
- **Author:** must be `KTTRCDL <KTTRCDL@outlook.com>` (already set as repo-local git config).
- **AI co-authorship:** add `Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>` (or your equivalent identifier) at the bottom of the commit body.
- **Body:** use a HEREDOC when the message has multiple paragraphs. Always pass `git commit -m "$(cat <<'EOF' ... EOF\n)"`.

## Tools you must use

- **`Agent`** for dispatching implementers, simplifiers, and reviewers. Default `subagent_type: "general-purpose"`. Never run multiple implementer agents in parallel against the same files (sandbox conflicts).
- **`Skill`** for invoking project skills (`brainstorming`, `writing-plans`, `subagent-driven-development`, `simplify`, etc.). Always invoke these BEFORE starting work in their domain.
- **`TaskCreate` / `TaskUpdate`** for tracking. One task per phase, not per individual plan-task — the per-phase cycle is the unit.

## What you must NOT do

- Don't push directly to `main`.
- Don't dispatch multiple implementer subagents in parallel on overlapping files.
- Don't skip the simplify or review stages — they catch real bugs (see `docs/dev-logs/HANDOFF.md` for examples of bugs caught in M1).
- Don't make subagents read large files; paste the relevant section into the prompt.
- Don't update the global git config. The repo-local config is already set.
- Don't enable arbitrary MCPs / plugins — see `docs/claude/safe-tools.md`.

## Pointers

- Spec history: `docs/superpowers/specs/`
- Plan history: `docs/superpowers/plans/`
- Engineering log: `docs/dev-logs/HANDOFF.md` (current state) + `docs/dev-logs/M<n>/` (per-phase reports)
- Public contributor guide: `docs/CONTRIBUTING.md`
- Developer guide (the one humans read): `docs/dev/README.md`
- Branch governance: `.scaffold/protected-paths.yml`

---

**When you start:** read `docs/dev-logs/HANDOFF.md`, identify the current milestone, find its active plan, and continue from where the last session left off.
