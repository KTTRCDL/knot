# Safe Tools & MCP Allowlist (Claude Code workflow)

This document defines which tools, plugins, and MCP servers are **safe to enable** when developing KNOT as a Claude Code session.

## Principle

**Default-deny.** Only enable tools listed here. If you need a new tool for a specific task, audit it first and add it to this allowlist via PR.

## Built-in tools (always safe)

- `Read`, `Edit`, `Write`, `Bash` — file/shell access (scoped by `.claude/settings.json` permissions).
- `Agent` — dispatch subagents.
- `Skill` — invoke project skills.
- `TaskCreate`, `TaskUpdate`, `TaskList`, `TaskGet`, `TaskOutput`, `TaskStop` — task tracking.
- `WebFetch`, `WebSearch` — external research (read-only).
- `Monitor` — long-running background process observation.

## Plugins (project-approved)

These are bundled with Claude Code and curated for KNOT development:

| Plugin | Purpose | Notes |
|---|---|---|
| `superpowers` | The skill family used for planning, executing, and reviewing (`brainstorming`, `writing-plans`, `subagent-driven-development`, `simplify`, etc.) | Required. The manager pattern depends on these skills. |
| `commit-commands` | `/commit`, `/commit-push-pr`, `/clean_gone` | Optional, helpful. |
| `ralph-loop` | Long-running autonomous loop | **Not used on this project.** Disable. |
| `chrome-devtools-mcp` | Browser automation for debugging the Tauri WebView | Use only when actively debugging the editor surface. Disable otherwise. |
| `microsoft-docs` | Microsoft tech research | Not relevant for KNOT (macOS / open-source stack). Disable. |

## MCP servers (project-approved)

Currently none beyond the bundled `claude_ai_Google_Drive` / `microsoft-learn` (both disabled for KNOT). KNOT-specific MCPs:

| MCP | Status | Purpose |
|---|---|---|
| `knot` (`mcp/`) | **Planned (MX milestone)** | Exposes KNOT's Markdown processing to external AI tools. Not installable yet. |

## Forbidden tools

Don't enable these on the project:

- Any MCP that exposes shell command execution beyond what `Bash` already does.
- Any MCP that has write access to your global filesystem.
- Any plugin that auto-pushes commits or auto-opens PRs without manager review.
- Any plugin that ingests your code into a third-party model for training without your control.

## Audit cadence

This document is reviewed:

- At the start of each milestone (manager confirms the list still applies).
- When a new MCP or plugin is being considered (PR adds to this list).
- After any security-relevant disclosure in the broader Claude Code ecosystem.

## Reporting concerns

If you suspect a tool was misused or has unexpected side effects, stop work, document the symptom in `docs/dev-logs/HANDOFF.md`, and disable the tool before proceeding.
