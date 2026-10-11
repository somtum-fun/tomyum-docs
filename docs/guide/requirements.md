# Requirements

## For a production server

| What | Why |
|---|---|
| A Linux machine (VM or dedicated) | Everything runs in Docker. somtum.fun ran on a 4 vCPU / 8 GB VM, where TomYum itself used about 280 MB and under 3% CPU; MySQL and Elasticsearch need more than bancho does. |
| Docker with **Docker Compose 2.26 or newer** | The production compose file mounts single files out of volumes (volume subpaths), which needs 2.26+. |
| Disk space | Images are rebuilt on every deploy. `deploy.sh` keeps Docker's build cache to 20 GB; budget for that plus the databases, replays and uploads. |
| A domain | The game uses many subdomains of it (`c.`, `osu.`, `a.`, …). See [Domains, DNS and Caddy](/guide/domains). |
| A Cloudflare account (as shipped) | The production stack is published through a Cloudflare Tunnel, so the machine needs no open web ports. |
| Git checkouts | TomYum-OSS, your osu-web fork and the spectator server, side by side (see [production](/guide/production)). |

The compose file brings its own MySQL 8.4, Redis 7 and Elasticsearch 7.17 (given a 1 GB heap), so
you don't install those yourself.

### Optional

- An **osu! API v1 key** (`OSU_API_KEY`): object counts, genre and language on beatmap pages, bulk
  imports by date. Without one, TomYum uses a keyless mirror.
- An **osu! API v2 OAuth app** (`OSU_CLIENT_ID`, `OSU_CLIENT_SECRET`): beatmap descriptions and
  nominators on the website.
- A **mail server** (SMTP) for the website: password resets, login codes, [tickets](/features/tickets).
- A **Discord bot token** for the [watchdog](/operations/monitoring)'s alerts.

## For trying it locally

[Try it locally](/guide/local-testing) runs the whole stack on one PC:

- Docker Desktop (with WSL 2 on Windows), given at least **6 GB RAM** (Elasticsearch alone wants 1 GB).
- [Caddy](https://caddyserver.com/download) for HTTPS on your machine.
- Git.
- Optional: the **.NET 10 SDK**, to build TomYum yourself or run its tests.

## For working on TomYum itself

- .NET SDK 10.0 (pinned in `global.json`).
- MySQL (8.4 in the compose files) and Redis.

```bash
git clone https://github.com/somtum-fun/TomYum-OSS.git
cd TomYum-OSS
dotnet restore TomYum.sln
dotnet build TomYum.sln     # warnings are errors
dotnet test TomYum.sln
```

The database tests are skipped unless `TOMYUM_TEST_MYSQL` (and `TOMYUM_TEST_REDIS`) point at a
throwaway MySQL and Redis; [Try it locally](/guide/local-testing#running-tomyum-s-tests) shows how.
