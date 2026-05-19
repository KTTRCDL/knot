# Contributing to KNOT

Thanks for your interest in KNOT — an open-source, native Markdown editor for macOS.

## Quick start

1. **Code lives on the `dev` branch.** `main` is product-only and updated only via PR from `dev`. Fork or check out `dev` to start.
2. **Build prerequisites:** Node 20+, pnpm 9.15+, Rust stable, Xcode Command Line Tools.
3. **Install + run:**
   ```bash
   git clone https://github.com/KTTRCDL/knot.git
   cd knot
   git checkout dev
   pnpm install
   pnpm tauri dev
   ```
4. **Tests:**
   ```bash
   pnpm test -- --run            # frontend
   cd src-tauri && cargo test    # backend
   ```

## Branch model

```
main            ← release branch (squash-merged from dev)
└─ dev          ← integration branch (all PRs land here first)
   ├─ dev_<name>_<workflow>  ← personal working branches
   └─ feature/<name>          ← short-lived feature branches
```

- All PRs to `main` come from `dev`. PRs are squash-merged with a clean commit message.
- PRs to `dev` come from feature/personal branches.
- Personal branches named `dev_<your-handle>_<workflow>` (e.g., `dev_alice_human` or `dev_alice_Claude_Code`) signal the development tool used; CI enforces what files are allowed where via `.scaffold/protected-paths.yml`.

See `docs/dev/README.md` (on the `dev` branch) for the full developer guide.

## Pull request checklist

Before opening a PR to `dev`:

- [ ] Tests added or updated (and passing locally)
- [ ] `pnpm typecheck && pnpm lint && pnpm test -- --run` clean
- [ ] `cd src-tauri && cargo fmt --check && cargo clippy --all-targets -- -D warnings && cargo test --all` clean
- [ ] `pnpm tauri build --no-bundle` succeeds (or note why it can't be tested locally)
- [ ] If you developed on a `dev_<name>_<workflow>` branch with workflow-specific files (`.claude/`, `.claudeteam/`, etc.), run `./scripts/prepare-pr.sh dev` first to strip them
- [ ] Conventional Commits style for the commit subject (`feat(scope):`, `fix(scope):`, `chore(scope):`, etc.)
- [ ] `Author:` is your real identity. AI assistants (Claude, Codex, etc.) may appear as `Co-Authored-By:` trailers

## Reporting issues

- **Bugs:** open an issue with reproduction steps, your macOS version, and the KNOT version (visible in the menu bar → KNOT → About).
- **Feature requests:** open an issue describing the use case.
- **Security:** for sensitive issues, email the maintainer rather than opening a public issue.

## License

By contributing, you agree your contributions are licensed under the [MIT License](../LICENSE).
