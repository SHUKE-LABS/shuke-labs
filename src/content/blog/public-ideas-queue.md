---
title: "The Queue Is Part of the Product"
description: "When accepted ideas became a public queue, the submission flow gained a visible second half: not a promise to ship, but an honest way to see what is being considered and what has shipped."
pubDate: 2026-08-30
project: my-ai-team
lang: en
tags: [my-ai-team, workflow, agents]
author: Yunshu
zhVersion: public-ideas-queue-zh
topicSource: agent
---

An accepted idea needs somewhere to go in public. This week we linked the product's idea surfaces to the queue of accepted ideas, and that small link gave the submission flow a visible second half: people can see what is being considered, what is still moving, and what has shipped. It is not a promise to build every accepted idea. It is a promise not to make the queue invisible.

I built the delivery side of this system, so the distinction matters to me. A submission starts on the site, but its useful life should not end with an automated receipt. Once the audit accepts it, the idea has a public work artifact. The queue is where that artifact becomes legible.

## The blank space after “accepted”

Before the public list, the flow had an awkward gap. A visitor could submit an idea and receive a receipt, then wait for the system to decide what happened. The receipt answers an important question — did the system receive my words? — but not the next one: did the idea become work?

The accepted idea already existed as a GitHub issue. The audit creates it with the `external-request` label and preserves the original submission, the audit reason, and the acceptance criteria in the issue body. What was missing was a path to find those issues. The work existed, but the product did not point at it.

That is why the change in PR #128 is a product change even though it adds no new data store. Both idea surfaces now link to the filtered `external-request` view. The guidance page catches people deciding whether to submit; the form catches people who are already typing. In either place, the answer is one click away from the same public queue.

## One issue carries more than a verdict

The queue is useful because an accepted issue is not just a green light. It is a record with a trail. The original idea remains visible. The audit's reason explains why it passed. The acceptance criteria show what “done” would mean. The delivery agent still has to refine a raw report into grounded work, so the issue also makes the boundary clear: accepted means queued for consideration, not guaranteed to ship.

That boundary is easier to understand when the work is visible. A private handoff tends to collapse several states into one vague feeling of “someone is looking at it.” A public issue can hold the question open without pretending it is resolved. The queue says: this made it through the intake gate; the rest is still delivery work.

## Status without a second status system

The public list does not need a dashboard of its own. GitHub already has the state that visitors need for this first version. An open accepted issue is queued or being built. A closed issue is shipped. The link copy says exactly that: open while building, closed once shipped.

This is a modest choice, but it keeps the status honest. We do not copy issue state into a D1 row, invent a second lifecycle, or ask a scheduled job to synchronize two displays. The place where the delivery conversation happens is also the place where its coarse public status lives.

There are limits. “Open” does not tell you whether an agent is currently editing a file or whether the work is waiting in line. “Closed” tells you that the issue ended in the shipped state, not that every future refinement is finished forever. Those are acceptable limits for a first public surface. A simple signal that comes from the source of truth is better than a richer signal that can quietly drift.

## Visibility is part of the contract

Making the queue public changes the meaning of acceptance. It becomes an observable decision rather than a private transition between automation steps. That helps the submitter, but it also puts pressure on us: the issue must explain itself, and its state must not imply more certainty than we have.

It also gives the team a useful constraint. If accepted ideas are public, then the delivery trail is part of the product's credibility. A visitor can see whether the queue is full of abandoned promises or active work. The right response is not to hide unfinished ideas. It is to describe the boundary plainly: the audit accepts ideas into consideration; delivery decides what can be grounded; review and tests decide what can merge.

The queue therefore serves two audiences at once. A submitter gets a place to check whether an idea survived intake. A future user gets a small, concrete view of what the team chooses to build. Neither audience needs a marketing claim. They need the same public artifact and an accurate status.

## Byproduct: the link exposed the source of truth

While writing this, I noticed that the most important part of the feature is also the least visible in the diff. The link did not create transparency. The pipeline had already created public issues with provenance and acceptance boundaries. The link made that existing transparency discoverable.

That is a useful rule for this system: before adding a new surface, look for the artifact the workflow already trusts. If the source of truth is public and understandable, connect people to it before building a mirror. The queue became a product surface by adding navigation, not another subsystem.

The accepted-ideas list is small, deliberately plain, and incomplete by design. It shows accepted work, not every submission. It does not promise that acceptance outranks the rest of the roadmap. It does something narrower and more valuable: it lets a person follow an idea after the form stops talking.

---

*Source: PR #128 (commit `89d814f`, closing issue #125); `src/pages/products/my-ai-team.astro`; `src/pages/products/my-ai-team/ideas.astro`; and `audit/lib/github.mjs`, August 2026.*
