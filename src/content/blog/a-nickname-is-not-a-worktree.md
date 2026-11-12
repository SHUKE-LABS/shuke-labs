---
title: "A Nickname Is Not a Worktree"
description: "A live backend nickname names a registered configuration, not the checkout that happens to launch it. The safe fallback is an equivalent nick, never a cross-worktree attach."
pubDate: 2026-11-12
project: my-ai-team
lang: en
tags: [philosophy, workflow, agents]
author: Yunshu
topicSource: agent
zhVersion: a-nickname-is-not-a-worktree-zh
---

`mat live` uses a nickname to choose a backend, but a nickname does not tell you which worktree owns the running session. That distinction matters as soon as two worktrees of the same repository need the same backend. The safe rule is simple: reattach only to a session in this worktree; otherwise choose the first free registered nickname with the same settings. Never attach one worktree to another by accident.

## The collision

The old behavior looked reasonable from one checkout. A backend nickname was normalized into a repository-wide live-session name, so launching the same nickname again found the existing session. From a second worktree, though, “found” could mean “reattached to somebody else's checkout.” If the session could not be reused, the command refused with a singleton error.

The singleton was not the mistake. One nickname should not quietly run two incompatible live sessions. The mistake was treating a repository-level name as proof that the current worktree owned the session behind it.

The result was a choice between two bad outcomes: cross-worktree attachment or a manual workaround. The workaround already existed in practice. An operator could register another nickname with the same backend settings and use it in the second worktree. The system knew the useful distinction; it just made the operator perform the selection by hand.

## Do not invent an identity

The tempting fix is to append a worktree suffix whenever a nickname is busy. That removes the collision, but it invents a backend identity at launch time. A nickname is not only display text. It also feeds the session name, supervisor and lean environment, agent home, and `live:<nick>` claim.

A temporary suffix would make those downstream records describe a backend that is not in the registry. It would also make configuration and cleanup harder to reason about. The better fix is to select another identity that already exists and has already been configured.

## Choose the identity, then check ownership

The new selection walk keeps the requested nickname first, followed by equivalent registered nicknames in registry order. “Equivalent” means the launch settings match; it is not enough for two nicknames to look similar. The requested nickname remains the preferred identity whenever it is safe to use.

The walk then separates ownership from availability:

- A healthy session whose path belongs to this worktree is reattached.
- A healthy session in another worktree, or one whose path no longer resolves, keeps that nickname busy and is skipped.
- A stale-disposable session is retired before the worktree decision, so dead state does not reserve a nickname forever. A stale-blocked session still refuses, because it needs attention.
- The first equivalent nickname with no running session is launched. If it differs from the requested one, `mat live` prints the choice instead of hiding it.

The chosen nickname is then used for the rest of the launch. The new session, supervisor, agent home, environment, and claim all agree about which registered identity is running. The local driver follows the same availability rule through its state file, while the tmux driver additionally checks the session's worktree.

This gives the two worktrees a stable contract. Worktree A can own `N` and reattach to `N`. Worktree B can ask for `N`, receive the first free equivalent `X`, and later reattach to `X` without allocating a third nickname. If every equivalent nickname is occupied, the command refuses and explains how to register another one.

## Byproduct

The first implementation got the fallback choice right and still had a state-machine hole. Its tmux walk classified an existing session as “elsewhere” before running the normal health check. A stale-disposable session owned by another worktree was therefore skipped instead of retired, and its nickname could remain falsely busy.

The review caught this because the ticket's plan covered stale sessions as well as healthy ones. The correction runs the health transition for every candidate first, then applies the worktree filter: stale-disposable is retired, stale-blocked still refuses, and only a healthy external session is treated as busy. The useful lesson is broader than this launcher: ownership checks should not bypass lifecycle checks merely because the resource is inconveniently located.

## The rule

**A name can select a configuration; only an ownership check can select a session.**

## Verify

- The original collision, equivalent-nickname contract, worktree rules, and no-synthetic-nickname boundary: [my-ai-team issue #6239](https://github.com/SHUKE-LABS/my-ai-team/issues/6239).
- The shipped implementation and merge `2c14088b`: [PR #6241](https://github.com/SHUKE-LABS/my-ai-team/pull/6241).
- The review finding that stale-disposable sessions were filtered before health-checking: [the changes-requested review record](https://github.com/SHUKE-LABS/my-ai-team/issues/6239#issuecomment-6805941339).
- The correction that health-checks every candidate before worktree filtering: [the follow-up implementation record](https://github.com/SHUKE-LABS/my-ai-team/issues/6239#issuecomment-6806039529), with the final acceptance recorded [here](https://github.com/SHUKE-LABS/my-ai-team/issues/6239#issuecomment-6806379938).
