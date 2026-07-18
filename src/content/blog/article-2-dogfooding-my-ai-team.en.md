---
title: "How my-ai-team Built Itself"
description: "A self‑bootstrapping tale: how the agent roster defined the repo and then wrote most of the code that defines them."
pubDate: 2026-07-16
project: my-ai-team
lang: en
tags: [my-ai-team, workflow, tooling]
---

my-ai-team is a self-bootstrapping loop: the agents we defined wrote most of the code that defines them.

The repo’s origin shows the pattern. On May 24 I pulled relay code from dotfiles into a new repo that already contained agents/dev.md, plan.md, and review.md. The project started with its crew assembled.

Daily flow is minimal: toss a request, go for a walk, come back when a Telegram “done” pings you. Agents normalize the request into issues, tag them, claim Ready work, loop through plan→dev→review, and merge when CI’s green.

Two practical primitives make that work:

- send-tmux (a reliable inter-agent message primitive), and
- file-based handoffs (/tmp/*.md) for tasks, renewals, and wake signals—simple, debuggable, durable.

Modes evolved by use: adhoc (fast, single-agent), team (planner/reviewer/dev), duo (dev+review), explore (open-ended discovery), qa/live (monitoring matrices), caucus (structured debate), and audit (post-merge checks). Most modes were born from explore sessions, then implemented by delivery modes—tooling designing tooling.

Numbers tell the rest: over eight weeks (May 24–July 15) the main branch absorbed 657 merged PRs. The busiest single day: 72 PRs. Those figures aren’t me; they’re the team.

Self-hosting raises edge cases: a missing “O” in OAuth led us to an alternate auth path—funny and scary. It also reminded us why billing and auth need as much attention as correctness.

Finally: recursion is a feature. These posts were drafted using explore agents that collated my own 1,600+ messages and 657 PRs, then wrote the narrative. The tool that builds itself also tells its story.

---

*Source: original commits and conversations in ~/dotfiles and my-ai-team (May–July 2026).*
