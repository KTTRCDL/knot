# KNOT

> **KNOT** is **N**ot **O**nly **T**ypora — an open-source, native Markdown editor for macOS.

KNOT is a small, fast, native-feeling Markdown editor for macOS, inspired by Typora's single-pane live WYSIWYG experience. Built on [Tauri 2](https://tauri.app) + [Milkdown](https://milkdown.dev).

## Install

Download the latest `.dmg` from the [releases page](https://github.com/KTTRCDL/knot/releases) and drag KNOT into `/Applications`.

> macOS may show "KNOT can't be opened because it is from an unidentified developer" on first launch — right-click the app → **Open** → **Open**. This is expected for the v0.x preview releases; code signing + notarization arrives in v0.1.0.

## Features (current — v0.0.1)

- Single-pane live Markdown WYSIWYG editor
- Native macOS menu bar with **File** (New / Open / Save / Save As) and **View** (Toggle Light/Dark) menus
- Atomic file writes — your edits never end up half-saved
- Light / Dark / System theme (cycles with **Cmd+Shift+L**)
- ~5 MB DMG, ~11 MB app, Apple Silicon native

## Roadmap

| Milestone | Adds |
|---|---|
| M2 | Math (KaTeX), diagrams (Mermaid), syntax highlighting (Shiki), GFM tables, task lists, footnotes |
| M3 | Source-mode toggle, find/replace, focus mode, typewriter mode, image paste |
| M4 | File tree sidebar, outline panel, recent files, auto-save, external-edit watcher, drop-in CSS themes |
| M5 | PDF + HTML export, code signing + notarization (v0.1.0) |
| MX | `knot-mcp` server for AI integrations — see [`mcp/`](./mcp/) |

## Build from source

```bash
git clone https://github.com/KTTRCDL/knot.git
cd knot
git checkout dev
pnpm install
pnpm tauri dev      # dev server
pnpm tauri build    # production .dmg
```

Prerequisites: Node 20+, pnpm 9.15+, Rust stable, Xcode Command Line Tools.

## Contributing

PRs welcome. See [`docs/CONTRIBUTING.md`](./docs/CONTRIBUTING.md) for the workflow.

## License

[MIT](./LICENSE)
