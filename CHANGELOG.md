# Changelog

All notable changes to KNOT are documented here. Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/); KNOT versioning follows [Semantic Versioning](https://semver.org).

## [Unreleased]

### Added
- Branch governance scaffold (`.scaffold/protected-paths.yml`, scaffold-check CI, prepare-pr helper).
- `mcp/` placeholder for the upcoming MCP server.
- Open-source contributor guide (`docs/CONTRIBUTING.md`).

## [0.0.1] — 2026-05-19

First public preview. macOS Apple Silicon.

### Added
- Milkdown-powered single-pane Markdown WYSIWYG editor (Crepe preset).
- Native macOS menu bar: File (New, Open, Save, Save As, Close Window), Edit (standard), View (Toggle Light/Dark, Fullscreen).
- Atomic file write via temp + rename with randomized suffix.
- Tauri commands `read_file` and `write_file` exposed to the frontend.
- Light, Dark, and System (follows OS) themes with `Cmd+Shift+L` toggle; theme cycle persists across launches.
- Zustand-backed document store with dirty-flag tracking.
- Error dialogs surfaced via `@tauri-apps/plugin-dialog` for I/O failures.
- Save As correctly preserves the previously-open file path if the dialog is cancelled.

### Build
- Bundle: ~5 MB DMG, ~11 MB `.app` (aarch64).
- Tests: 25 Vitest (TypeScript) + 7 cargo (Rust) = 32 total.
- Unsigned. Right-click → Open to bypass macOS Gatekeeper on first launch.

### Known limitations
- macOS aarch64 only. Intel Macs and other platforms not yet supported.
- No code signing or notarization (planned for v0.1.0).
- No math / diagram / syntax-highlighting renderers yet (planned for v0.0.2).
- No file tree sidebar, find/replace, or export yet (planned for later milestones).

[Unreleased]: https://github.com/KTTRCDL/knot/compare/v0.0.1...HEAD
[0.0.1]: https://github.com/KTTRCDL/knot/releases/tag/v0.0.1
