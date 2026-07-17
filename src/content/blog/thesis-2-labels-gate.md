---
title: "Why a Ticket's \"State\" Is the Gate to Delivery"
description: "Thesis #2 — how ready / blocked / assigned_to turn a ticket's state into the gate a delivery agent obeys."
pubDate: 2026-07-18
draft: true
lang: en
series: thesis
order: 2
---

> Thesis series · #2 · Ready / blocked / assigned_to
> First person, shuke. Faithful, but allowed to be fun.

## 1. Where it hurt before it existed

Last piece ended with explore crystallizing a thought-through notion into a ticket and handing it off. But what happens *after* the handoff?

At any moment my repo has dozens of issues lying in it. Some are fully thought out — a delivery agent can start immediately. Some are still under discussion, approach undecided. Some are waiting on another thing to finish first. Some are stuck on a product call only I can make.

**The problem: how does a delivery agent know which one it can touch and which one it must not?**

If that "state" lives only in my head, then I'm the bottleneck again — every time an agent wants to move a ticket it has to ask me "can I start this one?", or worse, it decides on its own, grabs a ticket I haven't finalized, and starts hacking. My whole reason for building my-ai-team was to *not* babysit, and here I'd be stuck getting @-ed all day over something as small as "which ticket can move."

## 2. What it is now

A ticket's state is built as a **four-state flow**, plus **two ways of holding a ticket back**.

**Four-state flow** (via labels):

- **backlog**: no label. An idea lying there; nobody will touch it.
- **refining**: `mat issue refining`. Someone (Planner / Adhoc / Explore) is shaping it into a spec.
- **ready**: `mat issue ready`. The quality gate passed. **This is the delivery gate — only `ready` tickets get auto-claimed for delivery.**
- **blocked**: `mat issue blocked`. Needs a product / scope decision before it can move.

**Two ways to hold back** (this is the crux of the piece, and the part I only split correctly later):

1. **Ticket blocks ticket — use GitHub's native dependency.** If A must wait for B to finish first, record a native `blocked_by` on A (`mat issue block A --by B`). It's **self-clearing**: the moment B closes, A automatically becomes claimable again — **nobody has to peel a label off by hand.**
2. **A non-ticket gate — use the `blocked` label.** A placeholder, an external dependency, a human decision waiting on me — these aren't "some issue isn't done yet," they're "something outside GitHub isn't in place yet." *That* is what the `blocked` label is for, and it needs a human to **manually** remove it.

One unified test seals both: **a ticket is claimable if and only if it has no `blocked` label and no open native blocker.**

## 3. Why it's this way (stepped on the hard way, again)

Early on, the `blocked` label was **carrying two jobs on one shoulder**: it marked both "waiting on another issue" and "waiting on an external condition." It worked, but it got awkward fast.

First I stood up the **gate**. May 31 (`#209`, "require ready before delivery claims"), I moved "can this be claimed" out of my head and into the ticket's state: delivery only claims `ready`. From that moment, a ticket with no `blocked` and up to standard *is* a definite requirement, and a delivery agent can run all the way to merge without turning back to ask me. **The gate isn't an extra check I bolt on before the PR; it's the ticket's own state.**

What really made me want to split things apart was one property of "ticket blocks ticket": **it should be able to decide itself.** A waits on B — whether B is closed or not, GitHub knows perfectly well, and it does not need me, a human, to stand watch and go peel the `blocked` label off A once B merges. But as long as it's still a label, *someone* has to peel it by hand. That job shouldn't be a human's.

So on June 29 (`#699` / `#842`, "move issue-to-issue blocking onto GitHub native dependencies"), I moved ticket-blocks-ticket wholesale onto GitHub's native `blocked_by` dependency — it's self-clearing. The `blocked` label narrowed at the same time, reserved for "non-ticket gates" only. On July 12 (`#1298`) I added the `mat issue block / unblock` ergonomics on top, wrapping away the fiddly bits — parsing an issue's internal id, cycle prevention, idempotency.

So today it's **two tracks side by side** — but not redundant. **They're two tools doing two fundamentally different jobs.**

## 4. Why this is better

The correctness of the split hides in a plain division-of-labor principle:

> **What a machine can decide, let the machine self-clear; only what a machine can't decide gets a signal that needs a human's hand.**

- "Is issue B closed or not" — **a machine can decide it**, so use the self-clearing native dependency; a human never has to step in.
- "Have I made this product call or not" — **a machine can't decide it**, so leave a `blocked` label, and **the act of peeling that label off is itself the signal that the decision has been made.** Manual, here, isn't a burden — it's the semantics.

With that, the claim logic across dozens of tickets collapses into one mechanically executable test (no `blocked` label ∧ no open native blocker), and I've stepped fully out of "which one can move." This is the same philosophy as last piece's membrane, seen from its other side: **pin the state on the object (the ticket) itself, not in a person's (my) head or at some temporary checkpoint in the process.** When the object carries enough state on its own, collaboration doesn't need a center to ask and answer.

## 5. Byproduct (dug up while writing this)

- explore's constitution has a line: "`Use blocked only for a placeholder or a genuine external dependency`" — it correctly draws the boundary of the **label**, but it **never tells the explorer to switch to native `blocked_by` when it hits "ticket blocks ticket."** plan.md spells this out in full (`blocked_by` dependency + reserve the label for non-issue gates); explore.md only writes half of it. An explorer who has just sorted out two tickets with an ordering dependency will very likely reach for the `blocked` label out of habit — stepping straight into the pit I split open on June 29. Worth a ticket to add the native-dependency path into explore's constitution (and the other ticket-opening roles') — and, as usual, while adding this line, see whether that line can be squeezed shorter.

---

*Next: The constitution as executable text — why, for every agent prompt I write, adding a line means cutting a line.*
