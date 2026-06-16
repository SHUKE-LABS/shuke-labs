---
title: "Rewind"
description: "Your AI did something clever yesterday. You can't find it in the terminal."
tagline: "Now you can."
product: true
weight: 3
icon_emoji: "⏪"
---

**Rewind** turns your local AI session files into a browsable, scrollable interface — two-column layout, real-time updates, clean markdown copy. Everything the terminal can't give you.

## Supported sessions

- Claude Code (`~/.claude/projects`)
- GitHub Copilot CLI (`~/.copilot/session-state`)
- VS Code Copilot Chat

## Download

| Platform | Package |
|---|---|
| Windows | Single-file EXE — no install required |
| Linux | AppImage or .deb |
| macOS | .dmg or .app.zip |

Get the latest release from [GitHub → Releases](https://github.com/shukebeta/ccode_viewer/releases).

The Windows EXE extracts itself on first launch and opens a native desktop window with the viewer inside. Closing the window stops the bundled server.

## Self-host / develop

```bash
npm run install:all
npm run dev
# → http://localhost:6174
```

## Features

- Two-column layout: your messages on the left, assistant responses on the right
- Real-time updates as your session runs (file watching via SSE)
- Markdown rendering with syntax highlighting
- Fork any session into a new `claude --resume`-compatible JSONL file
- Infinite scroll through long sessions
- Special rendering for tools: TodoWrite, ExitPlanMode, thinking blocks
