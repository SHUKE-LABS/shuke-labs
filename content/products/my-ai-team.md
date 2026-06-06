---
title: "my-ai-team"
description: "Structured AI agent sessions in your terminal. Turn a GitHub issue backlog into an async delivery pipeline."
product: true
icon_emoji: "🤖"
github: "https://github.com/shukebeta/my-ai-team"
download: "https://github.com/shukebeta/my-ai-team#install"
---

Structured AI agent sessions in your terminal. `my-ai-team` turns a GitHub issue backlog into an async delivery pipeline: agents claim tickets, implement changes, open PRs, and notify you — without you watching the terminal.

**Session modes:**
- **adhoc** — claim ticket · implement · PR · merge · notify
- **team** — continuous relay: dev → planner → reviewer (3 agents pipelined)
- **explore** — investigate a question, crystallise a ticket
- **qa** — manual-wake audit of merged work
- **live** — direct edit in current dir, zero ceremony

Solves three friction points:
- Context-switching fatigue — each agent session is isolated
- No handoff protocol — agents pass work through GitHub issues and labels
- Single-agent bottlenecks — multiple backend slots work in parallel

Requires: tmux, a backend CLI (Claude Code, codex, copilot), and gh.
