# KNOT

> **KNOT** is **N**ot **O**nly **T**ypora — an open-source, vibe-coded Markdown editor for macOS.

KNOT is a native-feeling Markdown editor for macOS, inspired by Typora's single-pane live WYSIWYG experience. Built on Tauri 2 + Milkdown.

## Status

Pre-alpha. M1 (Foundation) is the first milestone — it ships a working editor with file open/save and light/dark themes.

## Develop

Prerequisites: Node 20+, pnpm 9.15+, Rust 1.77+, Xcode Command Line Tools.

```bash
pnpm install
pnpm tauri dev
```

## Build

```bash
pnpm tauri build
```

The `.dmg` lands in `src-tauri/target/release/bundle/dmg/`.

## Documentation

- [Design spec](./docs/superpowers/specs/2026-05-19-knot-design.md)
- [M1 implementation plan](./docs/superpowers/plans/2026-05-19-knot-m1-foundation.md)
- [Engineering handoff log](./docs/dev-logs/HANDOFF.md)

## License

[MIT](./LICENSE)
