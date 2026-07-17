---
title: "Why my-ai-team Has an Agent That Only Talks and Never Writes Code"
description: "Thesis #1 — explore, and why the ticket is the membrane between a fuzzy idea and clean delivery."
pubDate: 2026-07-18
draft: true
lang: en
series: thesis
order: 1
---

> Thesis series · #1 · explore, and "the ticket is the membrane"
> First person, shuke. Faithful, but allowed to be fun.

## 1. Where it hurt before it existed

I have a thought in my head. It isn't a ticket yet — it's "I keep feeling relay drops a message under some condition, but I can't say which condition."

Before explore, a half-formed thought like that left me two roads.

**Road one: I write the ticket myself.** What comes out reads roughly like: *"Fix relay's occasional dropped messages."* A delivery agent picks it up and has no idea how occasional "occasional" is, no idea whether I suspect the delivery step or the routing step, no idea which possibilities I already ruled out yesterday. So it either asks me a pile of questions I could have answered in one breath, or it quietly invents its own definition of "dropped message" and fixes something I was never worried about. **Garbage in, garbage out — when the requirement end is sloppy, the strongest model downstream is just precisely solving the wrong problem.**

**Road two: I grab an agent and just talk.** This road is worse, and it's worse in a way I didn't see coming.

## 2. What explore is now

Conclusion first, then how it got here.

explore is an agent you **enter from a topic whose goal is still uncertain**. team and adhoc clutch a definite ticket from the first sentence and carry a delivery obligation; explore doesn't — when it walks in, neither of us knows the conclusion yet. Its job is to **think a fuzzy notion through, shoulder to shoulder with me**, and then **crystallize the conclusion into a ticket the delivery end never has to re-derive**, and hand it off.

That ticket is the **membrane** between exploration and delivery. Inside the membrane is conversation, trial and error, "this road's a dead end, back up." Outside is a clean spec: problem, conclusion, approach, acceptance boundary. The delivery agent only ever touches the outer face; it never has to read the two hours we spent talking.

The key move: **I define this mode by what condition you enter from, not by what it's forbidden to do.** That turn of phrasing is the linchpin of the whole thing — here's why it's written that way.

## 3. Why it's this way (this whole section was stepped on the hard way)

The first explore (`de9d475`, May 29) was innocent: a talk-only agent, no tickets, no touching code.

Then it went wrong. **We were talking, and it started changing code.**

I completely understand why it did. Every agent's constitution says "once you've thought it through, act — don't ask endlessly." It thought it through, so it acted. Except it acted on code I was still exploring and had no intention of changing yet. **That scared me.** My first reaction was to build a wall: I added a string of prohibitions to its constitution — no creating issues, no opening branches, no PRs, no touching code (`#260`, `#343` — that highlighted role boundary is where it came from).

The wall went up. It worked. **But I quickly realized it was wrong — not wrong about whether to stop it changing code, wrong about where I'd put my attention.**

Because here's what happened next: we talked the problem through, I ran off eagerly to write the ticket — **and I wrote it badly.** Same old disease from section one. Only this time there was an agent sitting right beside me who had just walked through every detail with me and held the entire context and every key fact.

That's when it clicked: **the one who should write this ticket isn't me at all — it's her.**

She holds more complete information than I do — she remembers which possibilities we ruled out, why we chose this approach over that one, exactly where the acceptance boundary sits. Me writing the ticket is a second round of information loss; her writing it is the shortest path. So the constitution's center of gravity shifted wholesale: from "forbid her to touch code" to "**she is the one who opens this ticket**" — the explorer directly owns and maintains the issue body (`#254`, `#251`), can mark a ticket she raised as ready and hand it off (`#379`), and eventually a nailed-down line: "**'act on it' means open the ticket**" (`#655`).

That was also when I went back and fixed the definition of the mode itself: **don't define a mode by what it's forbidden to do; define it by the condition you enter from.** Once explore is defined as "entered from an uncertain goal," that wall of prohibitions dissolves on its own — it doesn't write delivery code not because prohibitions block it one by one, but because it simply hasn't reached the delivery step yet. The constitution basically settled here (`#1088`: the body keeps only what delivery needs; the discussion history stays in the conversation).

## 4. Why this is better

Set it against the two most naive approaches:

- **Have the human write the ticket**: information loses fidelity once, between the human's brain and the keyboard, and the delivery end gets a second-hand requirement. **Having the explorer — who holds the full context — write the ticket is the highest-fidelity path.**
- **Let the agent freely change code**: every "let me just tweak this" during exploration is placing an early bet on an approach that isn't settled. **The membrane defers the bet until after the approach is settled.**
- **Define the mode by prohibitions**: every new scenario needs a new prohibition, the constitution gets thicker, and there's always a scenario that slips the net. **Define it by entry condition, and the mode closes out naturally — it can end without a ticket, park a ticket, hand work to delivery — none of it needs a special case.** A pure discussion that produced no ticket is also a normal ending, not a failure.

One layer deeper: the membrane means **the delivery agent always faces a clean spec, not a two-hour chat log**. It doesn't have to guess what we were agonizing over; it reads only the conclusion. Spec and process are separated, and both sides stay clean.

## 5. Byproduct (dug up while writing this)

By our own rule, writing an article is itself an audit — when you find something not good enough, you open a ticket on the spot:

- explore's constitution was "add a line, cut a line" over and over between June 1 and July 4 (`#260` → `#449` → `#1088`), and the wording converged well; but the concept of the "membrane" itself was **never explicitly named in the constitution** — it lives implicit across a pile of rules. Worth a ticket to evaluate whether making "the ticket is the membrane" a programmatic opening line lets several of the later rules shed a few lines each. (However many words you add, cut that many elsewhere.)
- "'act on it' means open the ticket" (`#655`) is written only in explore, yet caucus has the same "talk it through → produce a resolution ticket" closing move. Worth checking whether that boundary should be shared with caucus too.

---

*Next: Ready / blocked / assigned_to — why a ticket's "state" is the gate to delivery.*
