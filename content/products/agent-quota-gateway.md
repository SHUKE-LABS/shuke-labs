---
title: "Agent Quota Gateway"
description: "One agent burnout shouldn't stop the pipeline."
tagline: "Auto-rotate accounts. Keep shipping."
product: true
weight: 2
icon_emoji: "🔄"
github: "https://github.com/shukebeta/agent-quota-gateway"
---

A lightweight proxy that sits between your Claude Code sessions and the Anthropic API. It owns your credentials, auto-rotates between accounts when one hits its quota limit, and exposes a single local endpoint your tools point at.

## The problem

A 5-hour quota window runs out mid-session. Your agent stalls with a 429. You manually swap credentials or wait. If you run multiple accounts, you repeat this across every burnout.

Agent Quota Gateway handles the rotation transparently.

## How it works

You declare named **pools** — groups of interchangeable accounts. Your tools point at the gateway and send a pool name instead of a real token. The gateway picks a backend, swaps in the real credential, and forwards the request. On a 429, it switches to the next healthy account and tells your client to retry — no session lost.

```bash
# Build
go build -o agent-quota-gateway ./cmd/agent-quota-gateway

# Two accounts in one pool
AQG_POOL_AUTO_BACKEND_A=sk-ant-oat... \
AQG_POOL_AUTO_BACKEND_B=sk-ant-oat... \
  ./agent-quota-gateway

# Point Claude Code at it
ANTHROPIC_BASE_URL=http://127.0.0.1:8080 \
ANTHROPIC_AUTH_TOKEN=auto \
claude
```

## Key features

- **Auto-rotation** — switches accounts on a real 429, transparent to the client
- **Sticky routing** — stays on one account per pool to preserve prompt cache
- **Pool health API** — inspect quota and member status at `/_gateway/quota` and `/_gateway/pool`
- **Multi-vendor** — native Claude subscriptions, API keys, and compatible vendors (Z.ai, MiniMaxi, Volcengine Ark)
- **Priority pools** — declare a preference order; the gateway drains your preferred account first
- **Shared mode** — optional Tailscale binding lets multiple machines share one gateway instance
- **Zero probing** — no synthetic test requests; quota state is read from real response headers

## Install

Requires Go. No Docker image — `go build` is the deliverable.

```bash
git clone https://github.com/shukebeta/agent-quota-gateway
cd agent-quota-gateway
go build -o agent-quota-gateway ./cmd/agent-quota-gateway
```
