# KNOT — Developer Guide

You're on the `dev` branch — the integration trunk. All PRs to `main` come from here.

## Branch topology

```
main                          ← release branch (squash-merged from dev only)
└─ dev                        ← integration branch (you are here)
   ├─ dev_kttrcdl_Claude_Code  ← Claude Code workflow (CLAUDE.md, docs/superpowers/, ...)
   ├─ dev_kttrcdl_ClaudeTeam   ← ClaudeTeam workflow (CLAUDETEAM.md, claudeteam.toml, ...)
   └─ feature/*                ← short-lived feature branches (humans)
```

Personal/workflow branches add tooling-specific files (Claude Code config, ClaudeTeam config). Those files are **forbidden** on `dev` and `main` — `.scaffold/protected-paths.yml` is the source of truth, and `.github/workflows/scaffold-check.yml` enforces it on every PR.

## Workflow

### From a feature branch (humans)

```bash
git checkout dev
git pull
git checkout -b feature/<short-name>
# ... work, commit ...
git push -u origin feature/<short-name>
gh pr create --base dev --head feature/<short-name>
```

### From a `dev_<name>_<workflow>` branch (humans + AI)

If you're working on a personal/workflow branch that contains files forbidden on `dev` (e.g., `CLAUDE.md`, `docs/superpowers/`), use the strip helper before the PR:

```bash
git checkout dev_alice_Claude_Code
# ... work, commit ...
./scripts/prepare-pr.sh dev
# Helper creates dev_alice_Claude_Code--for-dev with forbidden paths removed
gh pr create --base dev --head dev_alice_Claude_Code--for-dev
```

CI on the PR (`scaffold-check.yml`) will verify no forbidden paths are present.

### From `dev` to `main` (release)

```bash
# When dev is ready for a release:
gh pr create --base main --head dev --title "release: v<x.y.z> — <milestone summary>"
# Reviewer squash-merges with a clean commit message
git tag -a v<x.y.z> -m "<release notes>"
git push origin v<x.y.z>    # triggers release workflow
```

## CI / gates

All run via `.github/workflows/ci.yml` on every PR:

| Job | What it checks |
|---|---|
| frontend | `pnpm typecheck`, `pnpm lint`, `pnpm test -- --run` |
| backend | `cargo fmt --check`, `cargo clippy --all-targets -- -D warnings`, `cargo test --all` |
| build | `pnpm tauri build --no-bundle` (verifies end-to-end build) |
| scaffold-check | Forbidden-paths diff + bot-author check |

## Commit conventions

- **Subject:** Conventional Commits (`feat(scope):`, `fix(scope):`, `chore(scope):`, `docs(scope):`, `refactor(scope):`, `test(scope):`).
- **Author:** must be a human (`User Name <user@example.com>`). The repo-local git config of `dev_kttrcdl_*` branches enforces this; CI verifies via `scaffold-check.yml`.
- **AI assistance:** disclose via `Co-Authored-By:` trailer at the bottom of the commit body, e.g.:

  ```
  Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
  ```

  Co-Authored-By is allowed (and encouraged for transparency) on all branches. The primary `Author:` line, however, must always be a human.

## Common tasks

```bash
# Run frontend tests in watch mode
pnpm test

# Format Rust
cd src-tauri && cargo fmt && cd ..

# Format frontend (currently no formatter; matches eslint)
pnpm lint --fix

# Full local CI replication (run before opening PR)
pnpm typecheck && pnpm lint && pnpm test -- --run \
  && cd src-tauri \
  && cargo fmt --check && cargo clippy --all-targets -- -D warnings && cargo test --all \
  && cd .. && pnpm tauri build --no-bundle
```

## Where to go for more

- General contributor guide: [`../CONTRIBUTING.md`](../CONTRIBUTING.md)
- Architecture overview: TBD (add in M2 when more modules exist)
- Per-milestone plans (Claude Code workflow): `docs/superpowers/plans/` on `dev_kttrcdl_Claude_Code`
- Engineering log (Claude Code workflow): `docs/dev-logs/HANDOFF.md` on `dev_kttrcdl_Claude_Code`
