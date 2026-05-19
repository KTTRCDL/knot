# `knot-mcp` — MCP Server for KNOT (Placeholder)

This directory will host an [MCP (Model Context Protocol)](https://modelcontextprotocol.io/) server that exposes KNOT's Markdown processing capabilities to other AI tools (Claude Code, Codex, etc.).

## Status

**Placeholder.** Implementation lands as milestone **MX** after M2 (Renderers).

## Planned tool surface

- `knot.parse_markdown(content)` — parse Markdown to an AST
- `knot.render_to_html(markdown)` — render Markdown to HTML
- `knot.render_to_pdf(markdown, output_path)` — export to PDF (after M5)
- `knot.format_markdown(content)` — prettify Markdown
- `knot.list_documents(folder)` — list `.md` files in a directory
- `knot.read_document(path)` — read a Markdown file
- `knot.write_document(path, content)` — atomic write (after `--allow-write` flag)
- `knot.search_documents(folder, query)` — full-text search
- `knot.extract_metadata(content)` — parse YAML front-matter

## Planned install

```bash
# Rust binary (canonical)
cargo install knot-mcp

# Or via npm (wraps the Rust binary)
npm install -g @knot/mcp-server
```

Then register with your AI tool of choice:

```bash
# Example: Claude Code
claude mcp add knot -- knot-mcp --root ~/Documents/Notes --allow-write ~/Documents/Notes
```

## Security model (planned)

- Read-only by default.
- `--allow-write <folder>` scopes writes to a specific directory.
- `--root <folder>` constrains all path arguments to a single tree.
- `--max-file-size <bytes>` prevents runaway memory.
- All paths are canonicalized and rejected if outside the configured root.

## Why a separate crate?

`knot-mcp` is intended to be installed independently from the KNOT desktop app — end users may want to script Markdown workflows via Claude without running the editor. By keeping it as a separate crate that shares logic with `src-tauri/`, both targets stay in sync.

---

*See `docs/superpowers/specs/` (on the `dev_kttrcdl_Claude_Code` branch) for the eventual design spec, once MX is planned.*
