---
title: "How my-ai-team Built Itself"
description: "A self‑bootstrapping tale: how the agent roster defined the repo and then wrote most of the code that defines them."
pubDate: 2026-07-16
project: my-ai-team
lang: en
tags: [my-ai-team, workflow, tooling]
---

my-ai-team is a self-bootstrapping loop: the agents we defined wrote most of the code that defines them.

The repo’s origin shows the pattern. On May 24 I pulled relay code from dotfiles into a new repo that already contained agent role files. The project started with its crew assembled.

Daily flow is minimal: toss a request, go for a walk, come back when a Telegram "done" pings you. Agents normalize the request into issues, tag them, claim Ready work, run plan→dev→review cycles, and merge when CI is green.

Two practical primitives make that work:

- send-tmux — a small utility that sends keystrokes or messages between panes so agents can signal one another.
- file-based handoffs (/tmp/*.md) for tasks, renewals, and wake signals—simple, debuggable, durable.

Modes evolved by use: adhoc (single-agent rapid mode), team (planner/reviewer/developer split), duo (dev+review), explore (open-ended discovery), qa/live (monitoring matrices), caucus (structured debate), and audit (post-merge checks). Most modes were prototyped in explore sessions and then implemented by the delivery modes—tooling designing tooling.

Numbers tell the rest: over eight weeks (May 24–July 15) the main branch absorbed 657 merged PRs. The busiest single day: 72 PRs. Those figures aren’t me; they’re the team.

Self-hosting has edge cases. Once we left out an "O" in an OAuth config and traffic quietly flowed over an alternate auth path—funny and scary. It reminded us why billing and auth deserve the same attention as correctness.

Recursion is a feature. These posts were drafted using explore agents that collated my own 1,600+ messages and 657 PRs, then wrote the narrative. The tool that builds itself also tells its story.

---

*Source: original commits and conversations in ~/dotfiles and my-ai-team (May–July 2026).*
