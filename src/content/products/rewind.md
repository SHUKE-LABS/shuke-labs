---
title: "Rewind"
description: "Your AI did something clever yesterday. You can't find it in the terminal."
tagline: "Now you can."
weight: 3
group: "dev"
commercial: true
icon_emoji: "⏪"
---

**Rewind** turns your local AI session files into a browsable, scrollable interface — two-column layout, real-time updates, clean markdown copy. Everything the terminal can't give you.

## Supported sessions

- Claude Code (`~/.claude/projects`)
- GitHub Copilot CLI (`~/.copilot/session-state`)
- VS Code Copilot Chat

## Features

- Two-column layout: your messages on the left, assistant responses on the right
- Real-time updates as your session runs (file watching via SSE)
- Markdown rendering with syntax highlighting
- Fork any session into a new `claude --resume`-compatible JSONL file
- Infinite scroll through long sessions
- Special rendering for tools: TodoWrite, ExitPlanMode, thinking blocks
