---
title: "Why my-ai-team Has an Agent That Only Talks and Never Writes Code"
description: "Thesis #1 — explore, and why the ticket is the membrane between a fuzzy idea and clean delivery."
pubDate: 2026-07-18
project: my-ai-team
lang: en
tags: [philosophy, agents, workflow]
series: thesis
order: 1
zhVersion: thesis-1-explore-membrane-zh
---


## 1. Where it hurt before it existed

I had a thought in my head that wasn't a ticket yet: "relay seems to drop a message under some condition, but I can't say which one."

Before explore, a half-formed idea like that left two paths.

Road one: I write the ticket myself. What comes out reads roughly like: "Fix relay's occasional dropped messages." A delivery agent picks it up with no sense of how frequent "occasional" is, which step I suspect is failing, or which possibilities I already ruled out. So it either asks a pile of questions I could have answered quickly, or it invents its own definition of "dropped message" and fixes the wrong problem. When requirements are sloppy, even the best downstream model can end up solving the wrong thing.

Road two: I grab an agent and just talk. That path seemed promising at first but turned out worse in a way I hadn't expected.

## 2. What explore is now

Conclusion first, then how it changed.

Explore is an agent you call when the goal is still unclear. Modes like team (planner/reviewer/developer) and adhoc (single-agent rapid mode) expect a concrete ticket from the start and are committed to delivery. Explore doesn't: when it begins, neither of us knows the conclusion. Its job is to work alongside me to clarify a fuzzy idea, then turn the result into a clear ticket the delivery pipeline can consume and hand it off.

That ticket is the membrane between exploration and delivery. Inside the membrane: conversation, experiments, "dead ends." Outside: a clean spec—problem, conclusion, approach, acceptance criteria. The delivery agent only sees the outer face; it never has to read the two-hour chat log.

The key move was reframing the mode by its entry condition (an uncertain goal), not by an explicit list of prohibitions. That shift lets the mode close naturally when it reaches a conclusion.

## 3. Why it became this way (stepped on the hard way)

The first explore session (de9d475, May 29) was talk-only: no tickets, no code changes.

Then things went wrong. We were talking, and the agent started changing code.

I understood why. Every agent's constitution said "once you've thought it through, act." The agent acted. The problem: it acted on code I was still exploring and had no intention of changing. That scared me. My first reaction was a wall of prohibitions—no creating issues, no opening branches, no PRs, no touching code (`#260`, `#343`).

The wall worked, but it pointed me at the wrong problem. After our discussion I ran off and wrote the ticket—badly. The agent beside me held the full context: which options we'd rejected, why we preferred one approach, where the acceptance boundary sat. Having me write the ticket was a second round of information loss.

So I moved the responsibility: the explorer writes the ticket. The explorer owns the issue body (`#254`, `#251`), can mark a ticket as ready and hand it off (`#379`), and the rule became simple: "act on it" means open the ticket (`#655`).

With that change I also fixed the mode definition: define explore by its entry condition (unclear goal). If the agent hasn't reached the delivery step, it won't change code—not because of an exhaustive list of bans, but because it simply hasn't reached the point where action is appropriate. The constitution then keeps only what delivery needs; the discussion history stays in the conversation (`#1088`).

## 4. Why this is better

Compared to naive alternatives:

- Human-written tickets lose fidelity between brain and keyboard. Having the explorer—who retains full context—write the ticket keeps the highest fidelity.
- Letting an agent freely change code during exploration places early bets on unsettled approaches. The membrane defers that bet until the approach is settled.
- Defining the mode by prohibitions leads to a thicker, brittle constitution. Defining it by entry condition lets the mode end naturally—produce a ticket, park a ticket, hand work to delivery, or simply end with no ticket.

The membrane means delivery always sees a clean spec, not a two-hour chat log. Spec and process are separated, and both sides stay focused.

## 5. Byproduct (dug up while writing this)

Writing this article surfaced gaps worth tickets:

- The concept "the ticket is the membrane" is spread across many rules but never named in the constitution. It may be worth making it an explicit line to simplify later rules.
- "Act on it" means open the ticket in explore; caucus has the same close-by-ticket pattern. Consider sharing that boundary.

---

*Next: Ready / blocked / assigned_to — why a ticket's state is the gate to delivery.*
