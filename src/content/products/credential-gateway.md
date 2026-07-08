---
title: "Credential Gateway"
description: "No .env files. Ever."
tagline: "Credentials live outside your worktree, injected at runtime."
weight: 4
group: "dev"
icon_emoji: "🔐"
github: "https://github.com/SHUKE-LABS/credential-gateway"
free: true
---

**Credential Gateway** sits between your app and upstream services, holding all credentials in a single root-owned config file outside every worktree. Your app connects to localhost with no credentials; the gateway injects them before forwarding.

```
app / agent
  ├─ HTTP       → localhost:8080/openai/…    → api.openai.com   (Authorization injected)
  ├─ MySQL      → localhost:3307 (no passwd) → real MySQL       (credentials injected at handshake)
  ├─ Redis      → localhost:6380 (no auth)   → real Redis       (AUTH injected)
  ├─ PostgreSQL → localhost:5433 (no passwd) → real PostgreSQL  (MD5 / SCRAM-SHA-256 injected)
  └─ Oracle     → localhost:1522 (no passwd) → real Oracle DB   (TNS/TTC auth injected)
```

## The problem

`.env` files and secrets managers don't solve three things:

- **Credentials leak into worktrees** — `.env` files get committed, shared, or left behind in old branches
- **Per-project setup overhead** — every new worktree or teammate needs the same credentials wired up again
- **Rotating a key means touching every project** — rotate once in `config.yaml`, nothing else changes

One config file. One process. All projects on the machine share it.

## Config

```yaml
# HTTP — injects arbitrary headers
http:
  - name: openai
    listen: "127.0.0.1:8080"
    upstream: "https://api.openai.com"
    headers:
      Authorization: "Bearer sk-…"

# MySQL — injects credentials at handshake
mysql:
  - listen: "127.0.0.1:3307"
    upstream: "real-db-host:3306"
    user: dbuser
    password: "…"
    database: mydb

# Redis — sends AUTH before piping client traffic
redis:
  - listen: "127.0.0.1:6380"
    upstream: "real-redis-host:6379"
    password: "…"

# PostgreSQL — MD5 and SCRAM-SHA-256 auth
postgres:
  - listen: "127.0.0.1:5433"
    upstream: "real-pg-host:5432"
    user: dbuser
    password: "…"
    database: mydb

# Oracle — TNS wire protocol with TTC O3LOG/O3AUTH injection
oracle:
  - listen: "127.0.0.1:1522"
    upstream: "real-oracle-host:1521"
    user: appuser
    password: "…"
    service: ORCLPDB1
```

All five proxy types are optional — include only what you need. Multiple entries per section are supported.

## Install

Requires Go 1.22+. No heavy dependencies.

```bash
git clone https://github.com/SHUKE-LABS/credential-gateway
cd credential-gateway
go build -o credential-gateway .

mkdir -p ~/.config/credential-gateway
cp config.example.yaml ~/.config/credential-gateway/config.yaml
$EDITOR ~/.config/credential-gateway/config.yaml
chmod 0600 ~/.config/credential-gateway/config.yaml
./credential-gateway
```

The gateway refuses to start if the config file is group- or world-readable. Credentials are never logged.
