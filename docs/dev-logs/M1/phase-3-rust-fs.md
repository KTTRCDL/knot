# M1 Phase 3 — Rust fs commands

**Status:** DONE

## What landed

Three commits on `main` (not pushed):

| SHA       | Subject                                                                |
|-----------|------------------------------------------------------------------------|
| `9ef430e` | feat(tauri): add dialog + fs plugins                                   |
| `dc1c2a7` | feat(tauri/fs): atomic read_file + write_file with tests               |
| `565e899` | feat(tauri): register fs commands + grant dialog/fs capabilities       |

## Surface area

- `src-tauri/src/commands/fs.rs` — `read_file` / `write_file` Tauri
  commands. Writes go through `<path>.knot-tmp` + `fs::rename`, so a
  crash mid-write leaves the original intact.
- `src-tauri/src/commands/mod.rs` — module wiring.
- `src-tauri/src/lib.rs` — registers `commands::fs::read_file` and
  `commands::fs::write_file` in `generate_handler!`, and inits the
  `tauri-plugin-dialog` + `tauri-plugin-fs` plugins.
- `src-tauri/capabilities/default.json` — adds `dialog:default` and
  `fs:default` to the `main` window permissions.
- `src-tauri/Cargo.toml` — adds tokio (`fs`, `rt-multi-thread`,
  `macros`) runtime dep and a `[dev-dependencies]` section with
  `tempfile` and tokio with `test-util`.

## Tests

`cargo test --all` -> 4 passed / 0 failed, all in
`commands::fs::tests`:

```
test commands::fs::tests::read_missing_file_errors ... ok
test commands::fs::tests::read_returns_file_contents ... ok
test commands::fs::tests::write_creates_file_with_content ... ok
test commands::fs::tests::write_is_atomic_via_temp_rename ... ok
```

## Gates run

- `cargo build` -> green
- `cargo fmt --check` -> green (one rustfmt pass needed during
  Task 3.2 to reflow `read_file` / `write_file`; behavior unchanged)
- `cargo clippy --all-targets -- -D warnings` -> green (only after
  Task 3.3 registers the commands; in Task 3.2 alone, clippy
  intentionally flags the unused commands as dead_code)
- `cargo test --all` -> 4/4 green
- `pnpm tauri build --no-bundle` -> release binary built; capability
  JSON validated by the build pipeline

## Notes / gotchas

- The plan asked clippy to pass after Task 3.2, but the new
  commands are unused until the `invoke_handler!` registration in
  Task 3.3. Resolved by running the full sanity sweep at the end of
  Task 3.3 rather than mid-phase; each commit still builds + tests
  cleanly on its own.
- Used `tauri-plugin-dialog 2.7.1` and `tauri-plugin-fs 2.5.1` (the
  versions `cargo add` resolved against tauri 2.11.x). Default fs
  plugin features are used; scope is left at the `fs:default`
  permission for now — Phase 4 can tighten this once we know which
  paths the UI actually needs.
- `greet` is kept in `lib.rs` for now per the task's guidance.

## What's next

- Phase 4: TS wrapper around `invoke('read_file' | 'write_file')`
  plus the open/save dialog flows that pair with these commands.
