# Monitoring

Three tools come with TomYum: the **watchdog** (alerts by Discord DM), the **metrics plugin** (numbers
for Prometheus), and **misses.sh** (what clients asked for and didn't get).

## The watchdog

[`deploy/production/watchdog.sh`](https://github.com/somtum-fun/TomYum-OSS/blob/main/deploy/production/watchdog.sh)
checks the server every minute and DMs an admin on Discord when something goes wrong, then again when
it's fine. It runs on the host, outside the containers, so it still works when the game server is
down. When the whole machine is down it can't report anything: that needs an outside monitor.

### Setting it up

1. It sends DMs with a Discord bot's token: `WATCHDOG_DISCORD_TOKEN=` in `deploy/production/.env`
   (or `TOMYUM_DISCORD__TOKEN` in `tomyum.env`, if a Discord bot plugin already uses one). The admin
   must share a server with the bot and allow DMs from it.
2. Set **your** Discord user id with `WATCHDOG_DISCORD_USER`.
3. Add it to cron (`crontab -e`):

```
* * * * * WATCHDOG_DISCORD_USER=<your Discord user id> ~/TomYum-OSS/deploy/production/watchdog.sh
```

::: warning
`WATCHDOG_DISCORD_USER` has a built-in default: the user id of somtum.fun's admin. Always set your
own, or your alerts go to someone else (or nowhere).
:::

`./watchdog.sh --test` sends a test DM. `./watchdog.sh --status` prints every check's reading without
sending anything. While `deploy.sh` runs, the checks are paused.

Each DM starts with the server's domain, so one admin can follow several servers.

### What it checks

| Check | Alerts when | After |
|---|---|---|
| Website, bancho, stable's `/web`, lazer's servers | the public address doesn't answer as expected (through Cloudflare and the tunnel) | 2 checks |
| Disk | `/` is 85% full or more; the alert gives Docker's build cache size, the usual culprit | 3 checks |
| Memory | less than 10% of memory is available; names the three containers using the most | 3 checks |
| CPU | the 5-minute load average is over 2 per CPU; names the three busiest containers | 5 checks |
| Containers | a service isn't running, or its health check fails (one-off services left out) | 2 checks |
| Crashes | Docker restarted a container by itself; the DM has its last log lines | at once |
| Slow requests | 10 or more requests over 3 seconds in the last five minutes (Caddy's request log); names the slowest addresses | 2 checks |

Connections that stay open on purpose are left out of the slow requests: websockets, downloads and
uploads.

### Limits

Set them in the crontab line, e.g. `WATCHDOG_DISK_PERCENT=90 ~/TomYum-OSS/deploy/production/watchdog.sh`:

| Variable | Default | Meaning |
|---|---|---|
| `WATCHDOG_DISK_PERCENT` | `85` | disk use (%) that alerts |
| `WATCHDOG_MEMORY_PERCENT` | `10` | available memory (%) below which it alerts |
| `WATCHDOG_LOAD_FACTOR` | `2` | 5-minute load average per CPU above which it alerts |
| `WATCHDOG_SLOW_SECONDS` | `3` | a request this long counts as slow |
| `WATCHDOG_SLOW_COUNT` | `10` | slow requests in five minutes that alert |
| `WATCHDOG_DISCORD_USER` | (see above) | the Discord user id that gets the DMs |
| `WATCHDOG_DIR` | `~/.tomyum-watchdog` | where it keeps what it saw last |

### Disk space

Docker's build cache is what fills the disk: every deploy builds images again. `deploy.sh` keeps the
most recently used 20 GB of it. When the disk alert comes between deploys, run the same by hand:

```bash
docker builder prune -af --max-used-space 20GB
```

## Prometheus metrics

The [`tomyum-metrics`](https://github.com/somtum-fun/TomYum-OSS/tree/main/plugins/tomyum-metrics)
plugin serves `GET /metrics` in Prometheus' text format:

| Metric | Type | Labels |
|---|---|---|
| `tomyum_online_players` | gauge | `client` = `stable`, `lazer`, `irc` |
| `tomyum_scores_submitted_total` | counter | `client` = `stable`, `lazer` |
| `tomyum_logins_total` | counter | `client` = `stable`, `result` = `ok`, `failed`, `held` |
| `tomyum_registered_users` | gauge | |
| `tomyum_multiplayer_matches` | gauge | |
| `tomyum_build_info` | gauge | `version` |
| `process_*`, `dotnet_*` | | CPU, memory, GC and thread pool of the server |

Install it like any [plugin](/operations/plugins#installing-one-in-production). For the lazer score
count and registered players it needs trusted database access:

```ini
TOMYUM_PLUGINS__TRUSTED__0=tomyum.metrics
```

The plugin answers only requests whose `Host` is in its `hosts` setting (by default
`127.0.0.1:8091`, `localhost:8091`, `server:8080` and `localhost:8080`), and 404 on the public names.
A Prometheus on the compose network can scrape `http://server:8080/metrics`. To scrape from the host,
publish the server's port on localhost only, e.g. `"127.0.0.1:8091:8080"` under the `server` service's
`ports` in your `docker-compose.override.yml`, and keep it off public addresses.

```bash
curl -s http://127.0.0.1:8091/metrics | grep '^tomyum_'
```

## Requests that failed

[`deploy/production/misses.sh`](https://github.com/somtum-fun/TomYum-OSS/blob/main/deploy/production/misses.sh)
reads Caddy's request log (website, API and lazer hosts; bancho hosts aren't logged) and lists failed
requests (400, 404, 405, 5xx) by status, host and path, with numbers folded to `N`. Handy for finding
what a client expects that the server doesn't have yet.

```bash
cd ~/TomYum-OSS/deploy/production
./misses.sh        # the top 40
./misses.sh 100
```

## Logs

```bash
docker compose logs -f server       # TomYum
docker compose logs -f php job      # the website
docker compose ps                   # what's running and healthy
```
