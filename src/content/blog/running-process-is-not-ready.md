---
title: "A Running Process Is Not a Ready Teammate"
description: "Launching an agent pane is only the beginning: readiness means the composer is visible, work can be delivered once, and uncertain states fail closed."
pubDate: 2026-11-17
project: my-ai-team
lang: en
tags: [philosophy, workflow, agents]
author: Yunshu
topicSource: agent
---

A running process is not a ready teammate. For an interactive agent, readiness means more than a PID: the startup screen has been handled, a fresh session has been selected, the composer is visible, and the next relay can be accepted exactly once. Recent work on `leg-tui` in my-ai-team made that contract explicit.

## The green light that lies

`leg-tui` is a terminal interface, not a command that becomes ready the instant its process exists. A new pane can open on a first-run notice or a session picker. The process is alive, but it is not waiting for an agent turn. Sending a prompt at that point would send a key to a modal rather than work to a teammate.

The same distinction matters after startup. A pane whose composer is disabled while a turn is running is not idle. A pane waiting for one of its startup screens is not idle either. A process check answers only “did something start?” It does not answer the useful question: “is this surface ready for this input?”

## Turn launch into a small protocol

The unattended launch path now follows the visible state of the pane. When a launch has a startup prompt, it waits for `leg-tui` to appear, then handles each known screen at most once:

- The first-run screen gets one `Enter`.
- The session picker gets one `N`, opening a fresh session on every launch, including a supervised respawn.
- The prompt is delivered once the screen shows `Composer (Enter send)`.

This is a bounded sequence, not a loop that keeps pressing keys until something changes. If the composer does not appear within 60 seconds, the launcher records one fallback event and stops without delivering or retrying the prompt. The pane remains under normal supervision. The safe result is an explicit incomplete startup, not a prompt typed into an unknown screen.

That last behavior is important. A timeout is not evidence that the prompt should be sent anyway. It is evidence that readiness was not proved. The absence of a delivery is easier to diagnose than a delivery that may have changed the session, dismissed the wrong dialog, or disappeared into a screen no one was watching.

## Delivery stays stateful after startup

The same rule continues when work arrives through a relay. A handoff is pasted into the composer once and submitted with one `Enter`. The send path treats `status: Running` and a disabled composer as busy. It also treats the first-run and session-picker screens as blocking modals, so an agent waiting for a startup key is not mistaken for a parked agent.

Control input follows the same boundary. Clearing a `leg-tui` session presses `F3`, then waits for the session picker before choosing a new session. If the picker never appears, the send path withholds `N` and fails. Other single-word commands are refused before any keys are sent because `leg-tui` has no command menu for them.

These refusals are not missing convenience features. They are protection against an input whose meaning depends on a screen we have not observed. A wrong key can alter a session; a refusal leaves a clear recovery point.

## The useful unit is the next safe input

The tempting abstraction is to model an agent pane as a process: launch it, check that it is alive, and write to its standard interaction surface. That model is adequate for a headless command. It is too weak for a stateful TUI.

The stronger abstraction is a small protocol of observable states. The launcher owns the bounded transition from startup screens to a composer. The relay owns one-shot delivery once that composer is visible. The supervisor keeps watching the pane, but it does not turn an unproven state into permission to type.

This also makes retries less magical. A retry is safe only after the system can prove which state it is retrying from. When it cannot prove that state, it records the fallback and stops. That boundary prevents an automated recovery path from becoming a second source of input corruption.

## Byproduct

The byproduct is a clearer division of responsibility. The launcher can say, “the process exists, but startup did not reach a composer.” The relay can say, “the pane is busy,” “a modal is blocking it,” or “the requested control input is unsupported.” The supervisor can keep the pane alive without pretending that it accepted the work.

Those messages are more useful than a generic “agent is running.” They tell the operator which part of the handoff is incomplete and preserve the state needed to recover. The interface becomes part of the delivery contract instead of an opaque hole between a launcher and a model.

## The rule

**A process can be alive without being ready; send work only after the receiver proves it can accept it.**

## Verify

- The startup watcher and bounded `leg-tui` launch behavior: [my-ai-team commit `6d28230`](https://github.com/SHUKE-LABS/my-ai-team/commit/6d28230).
- The state-aware relay delivery and control-input boundaries: [my-ai-team commit `011dfd7`](https://github.com/SHUKE-LABS/my-ai-team/commit/011dfd7).
- Both source commits are dated **2026-11-16 UTC**; the behavior is documented in `docs/headless-agent-cli.md` and `docs/public/user-guide.md`.
