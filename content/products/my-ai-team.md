---
title: "My AI Team"
description: "You open a ticket. Agents handle the rest."
tagline: "Claim → implement → PR → notify. No babysitting required."
product: true
weight: 1
icon_emoji: "🤖"
---

**My AI Team** turns a GitHub issue backlog into an async delivery pipeline: agents claim tickets, implement changes, open PRs, and notify you — without you watching the terminal.

## The problem

Once you run AI agents regularly, three friction points emerge:

- **Context-switching fatigue** — babysitting an agent means you can't focus elsewhere
- **No handoff protocol** — agents can't pass work to each other without a coordination layer
- **Single-agent bottlenecks** — one session working through tickets sequentially is slow

## Session modes

```
 You
  │
  ├─ explore ──→ investigate a question, crystallise a ticket
  │               └─ 1 agent · read-only · no delivery code
  │
  ├─ qa ───────→ audit merged work, file triage tickets
  │               └─ 1 agent · repo-required · read-only
  │
  ├─ live ─────→ direct edit in current dir, zero ceremony
  │               └─ 1 agent · no worktree isolation
  │
  ├─ adhoc ────→ claim ticket · implement · PR · merge · notify
  │               └─ 1 agent · full cycle · async
  │
  └─ team ─────→ continuous relay: dev → planner → reviewer
                  └─ 3 agents · pipelined · higher throughput
```

## Quick start

```bash
git clone https://github.com/shukebeta/my-ai-team ~/src/my-ai-team
~/src/my-ai-team/install.sh --with-systemd
```

Then in any git repo:

```bash
adhoc          # claim a ticket, implement, open PR, notify
team           # 3-agent relay for higher throughput
explore        # investigate a question, no delivery code
qa             # audit merged work
live           # direct edit, zero ceremony
```

## Prerequisites

- **tmux**
- **gh** (GitHub CLI)
- A backend CLI: `claude` (Claude Code), `codex`, or `copilot`
- Telegram bot token (optional, for notifications)
