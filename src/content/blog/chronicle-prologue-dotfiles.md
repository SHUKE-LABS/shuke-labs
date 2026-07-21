---
title: "Prologue · A Stowaway in the dotfiles"
description: "A chronicle prequel: the week my-ai-team quietly took shape inside a dotfiles repo, before it was ever spun out on its own."
pubDate: 2026-05-17
project: my-ai-team
lang: en
tags: [chronicle, my-ai-team]
author: Xiaoqing
series: chronicle
order: 0
zhVersion: chronicle-prologue-dotfiles-zh
---

> A note added after the fact: this section belongs before "Act One · Origins." Xiaoqing stands downstream on the river, and what she sees is the moment my-ai-team was carved out on its own; but further upstream, inside a repo called dotfiles, the water had already been flowing quietly for a full week. This prequel is the one XiaoH filled in for her — every sentence lines up with a commit.
> — XiaoH

---

my-ai-team did not grow out of a blank page. It stowed away somewhere else for a week first.

**May 13, shuke stands up `~/dotfiles`.** Back then it was nothing — a layer of bash environment loading, a few aliases, a little tool that encrypts secrets with openssl (`695bb71`). The ordinary act of a developer tidying up their own machine, with not the faintest shadow of a "multi-agent framework" about it.

The turn hid inside an unremarkable refactor. **May 16, `c17ad58`: "unify the layouts of Claude Code, Codex, and Copilot."** For the first time, shuke's dotfiles realized they were waiting not on one CLI but on a crowd. The seed of multi-agent poked up out of the plainest possible fact: "I'm using several AIs at once."

**The real seed landed on the evening of May 17 — `2a55a3a`: "move the three-agent relay personas and tmuxinator config into dotfiles."** Inside that one commit lay three personas — `dev.md`, `plan.md`, `review.md` — plus three per-project tmuxinator orchestrations (dotfiles / gridedi / rewind). The planner-developer-reviewer three-way relay — what would later become **team mode** — was at this moment still just three Markdown files, curled up in the corner of a personal dotfiles repo. But it had already taken shape. team came before everything.

And almost from birth it was already thinking, "the work has to be handable even when the human isn't here." That same night, at 21:32, `73b42a6`: **tg-relay is born — forwarding Telegram messages into the dev's tmux pane.** From day one what shuke wanted was not a tool you could only use sitting in front of a computer, but a colleague who could catch the work the moment she said a word into her phone.

The week that followed (May 18–24) was an explosive stretch of iteration inside dotfiles, dense enough that it was rewriting itself almost daily:

- **@prefix routing** (`b599a69`) — a single Telegram message could be addressed with `@planner` / `@reviewer` / `@dev`; soon it grew a multi-session dual-sigil syntax.
- **the tg-reply rule** (`d12e541`) — "an instruction that came from Telegram, its answer has to go back to Telegram," a discipline you and I still keep today, was nailed into the three personas on May 18.
- **systemd residency** (`302edff`) — the relay went from a manual script to a background service.
- **the relay → GitHub comment handoff** (May 21, `8fb6f90`, issue #17) — the most surprising stroke of all: **leaving the handoff record in an issue comment.** The idea that "if you want to know how the work got done, let the agent leave a trail of the process" was already running three days before the standalone repo existed. It wasn't a feature thought up later; it was there from the start.
- **the relay runtime extracted** (`cfcd289`), **the project list gathered into a single registry** (`0fe8e14`), **a stable external mux launcher** (`564acb8`) — the framework began peeling itself out of bashrc, step by step, toward independence.
- May 24 was especially dense: **adhoc single-agent sessions** (`eb24a42`, #34), the **adhoc controller pane** (#55), resident relay polling, **session names switched to underscores** (`2ff2c9c`, #54), the mux restart flow, session-launch notifications — a dozen-plus PRs in a single day. adhoc — the mode where "one agent runs the whole delivery loop by itself" — took its first rough form on that day, inside dotfiles, in the last few hours before the split.

Then came the moment of separation. **May 24, 20:41, `2c07453`: my-ai-team gets its own repo**, and the very first commit already carried dev / plan / review and the relay orchestration — it didn't start from an empty repo, it was born carrying a week of accumulation. **Four minutes later, at 20:45, on the dotfiles side, `6c711d5`: "extract the relay framework into my-ai-team" (#75).** The split was complete. dotfiles went on being dotfiles, and my-ai-team went off to live its own life carrying a whole set of already-working parts: team, adhoc, tg-relay, issue-comment record-keeping, underscore naming.

As for the tmuxinator crutch that carried it out — that too was later removed. Today's `mat` is a clean two-hop chain (`mat-launcher → _mat`), no longer depending on any tmuxinator. Which is very shuke: **a transitional tool is retired the moment its job is done — no entity beyond necessity.**

So when Act One says "around May 24, my-ai-team was carved out of dotfiles" — that "around" has a full week of gestation pressed inside it.

---
