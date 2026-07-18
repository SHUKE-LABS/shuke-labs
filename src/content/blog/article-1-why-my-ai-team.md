---
title: "Why I Built my-ai-team"
description: "How a handful of dotfiles grew into an agent team: motives, early history, and the design choices that stuck."
pubDate: 2026-07-16
project: my-ai-team
lang: en
tags: [my-ai-team, agents]
zhVersion: article-1-why-my-ai-team-zh
---

I didn’t wake up one morning and decide to build an agent framework. my-ai-team grew out of a drawer in my dotfiles.

The first real seed was May 17: three agent personas—dev, plan, review—and a few tmuxinator configs. Two weeks of furious commits later I extracted the relay framework and spun my-ai-team out into its own repo. That choice—start small, extract what works—still guides the project.

The problem was simple: babysitting AI wastes human time and caps agent autonomy.

So I designed for handoff and trust. The delivery pipeline is straightforward: the planner (writes the plan), the reviewer (critiques it), the developer (implements), CI runs, and I kept final merge rights—at first. I quickly became the bottleneck. The team had to take more responsibility: agents began auto-merging responsibly or tagging changes so they stayed auditable.

Two rules guided the design:

- Raise input quality before throwing bigger models at the problem. Better prompts and clear acceptance criteria (AC) buy far more value than simply switching to an expensive model.
- Keep auditable handovers. Agents must leave a clear paper trail—issue comments, plan snapshots, and handover files—so humans can inspect without babysitting.

That drove the creation of explore agents: a discovery role that refines messy requests into Ready issues with explicit ACs. Only Ready tickets enter the automated flow.

In short: my-ai-team is built so people can step away, trust the team, then come back and inspect meaningful artifacts. The buyer is human; the product is time reclaimed.

---

*Source: original commits and conversations in ~/dotfiles and my-ai-team (May–July 2026).*
