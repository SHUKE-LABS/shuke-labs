---
title: "Rewind"
description: "Your AI did something clever yesterday. You can't find it in the terminal."
tagline: "Now you can."
product: true
weight: 4
icon_emoji: "⏪"
github: "https://github.com/shukebeta/ccode_viewer"
download: "https://github.com/shukebeta/ccode_viewer/releases"
---

Navigate and explore your AI coding sessions. Browse, copy, and revisit your Claude Code & Copilot conversation history. Clean markdown copy, infinite scroll, and real-time session monitoring — everything the terminal can't give you.

**Supported session sources:**
- Claude Code sessions from `~/.claude/projects`
- GitHub Copilot CLI sessions from `~/.copilot/session-state`
- VS Code Copilot Chat sessions

**Features:**
- Two-column layout (user messages → assistant responses)
- Real-time updates via file watching
- Markdown rendering with syntax highlighting
- Fork sessions into new `claude --resume`-compatible JSONL files

Available as:
- Windows EXE (single-file portable launcher)
- Tauri desktop app (Linux, Windows, macOS)
- Web server + viewer
