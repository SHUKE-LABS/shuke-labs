---
title: "Why I Built my-ai-team"
description: "How a handful of dotfiles grew into an agent team: motives, early history, and the design choices that stuck."
pubDate: 2026-07-16
project: my-ai-team
lang: en
tags: [my-ai-team, agents]
---

I didn’t wake up one morning and decide to build an agent framework. my-ai-team grew out of a drawer in my dotfiles.

The first real seed was May 17: three agent personas (dev, plan, review) and a few tmuxinator configs. Two weeks of furious commits later I extracted the relay framework and created my-ai-team as its own repo. That choice—start small, extract what works—still guides the project.

The problem I wanted to solve was simple: babysitting AI is wasteful. Running models and staring at terminals limits both human output and agent autonomy. Babysitting is a double loss.

So I designed for handoff and trust. The delivery pipeline looks like this: planner writes a plan, reviewer critiques it, developer implements, CI runs, and I keep final merge rights—at first. Quickly I became the bottleneck. The team had to take more responsibility: agents auto-merge responsibly or tag changes so they’re auditable.

Two design rules followed:

- Raise input quality before throwing bigger models at the problem. Better prompts and clearer acceptance criteria (AC) yield far more value than spinning up the most expensive model for everything.
- Keep auditable handovers. Agents must leave a clear paper trail—issue comments, plan snapshots, and handover files—so humans can inspect without babysitting.

That led to explore agents: a lightweight role that refines messy requests into Ready issues with explicit ACs. Only Ready tickets enter the automated flow.

In short: my-ai-team is designed so people can step away, trust the team, then come back and inspect meaningful artifacts. The buyer is human; the product is time reclaimed.

---

*Source: original commits and conversations in ~/dotfiles and my-ai-team (May–July 2026).*
