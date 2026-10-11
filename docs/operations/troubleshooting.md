# Troubleshooting

Known pitfalls, each as the problem and the fix. Commands run from `deploy/production` unless they say
otherwise (locally, from the osu-web or TomYum-OSS folder).

## Starting up

### TomYum exits with "osu-web group 'default' does not exist"

The website's user groups aren't there yet. Run `tomyum:setup`, then start the server again:

```bash
docker compose run --rm artisan tomyum:setup
```

### The server, spectator or notification server won't start: a mount of `oauth-public.key` fails

They mount the website's Passport public key from its storage volume, which only exists once the keys
are made:

```bash
docker compose run --rm artisan passport:keys
docker compose up -d
```

### Docker Compose complains about `subpath`

The production compose file needs Docker Compose **2.26 or newer** (volume subpaths). Update Docker.

### TomYum refuses to start: "Performance route backend … is not a defined backend"

A `Performance` route or fallback names a backend that isn't under `Performance:Backends` (a typo,
or a missing `TYPE`/`URL`). Fix the name; see [pp reworks](/features/pp-reworks#routing-relax-and-autopilot-to-the-sidecar).

### Laravel won't read osu-web's `.env` (local)

If `APP_KEY` ends in `=`, put it in quotes: `APP_KEY="base64:…="`.

### "address already in use" on 8080, 3306 or 6379 (local)

osu-web isn't on `NGINX_PORT=8180`, or TomYum-OSS's own `mysql` and `redis` are running next to
osu-web's. Stop them:

```bash
docker compose -f deploy/docker/docker-compose.yml stop mysql redis
```

### "network osu-web_default not found" (local)

osu-web isn't running, or its folder isn't called `osu-web`. Set `OSU_WEB_NETWORK=<folder>_default`.

### A local server uses the wrong database or Redis host

Running `scripts/dev-server.sh` or `dotnet run` on your machine also reads `config/.env` and
`config/tomyum.yaml`, and both examples point at the Docker host names `mysql` and `redis`. Use
`127.0.0.1` there, or leave the files out.

## Scores, search and the website

### New scores don't appear on profiles or leaderboards

The `score-indexer` service stopped, usually after someone ran `php artisan cache:clear`:

```bash
docker compose up -d score-indexer
```

::: danger Don't run `php artisan cache:clear`
The website's cache is in the same Redis as the score indexer's settings, its sessions and TomYum's
own state. Clearing it stops the score indexer. To pick up config or group changes, restart the
website (`docker compose restart php`) instead.
:::

### New maps or players don't show in listings and search

They're reachable by URL straight away, but listings and search read Elasticsearch. Re-index:

```bash
docker compose run --rm artisan es:index-documents --no-interaction
```

### A beatmap page errors or shows no genre

Genres and languages come from `tomyum:setup`. Run it (it's safe to run again).

### Medals show, but no "unlocked the … medal" activity entry

InterOp isn't working. The server's log says `InterOp not configured`, or shows `403 invalid_signature`
when the secrets differ. In production both sides take `SHARED_INTEROP_SECRET` from `.env`; locally,
`TOMYUM_OSUWEB__INTEROPSECRET` must equal osu-web's `SHARED_INTEROP_SECRET`. The InterOp URL must
reach the website without a proxy rewriting the host or port.

### Website links are `http://`, or notifications don't connect

The website doesn't trust the proxies in front of it. Keep `TRUSTED_PROXIES=PRIVATE_SUBNETS` in
`osu-web.env` (not `*`, which is ignored).

### Nobody can sign in to the website from a new device

The website emails a code, and without a mail server it never arrives. Set the `MAIL_*` settings, or
keep `USER_BYPASS_VERIFICATION=true` in `osu-web.env`.

### Relax/Autopilot pp looks like vanilla pp

Every mode uses ppy's calculator until you route Relax and Autopilot to the `pp-sidecar`. See
[pp reworks](/features/pp-reworks#routing-relax-and-autopilot-to-the-sidecar), then run a pp rework for
those modes.

## Clients

### osu! says it can't connect (local)

Check `https://c.localtest.me` loads in a browser without a certificate warning. If not, run
`caddy trust` as administrator and restart osu!.

### Old builds can't connect, or hang

- Cloudflare is redirecting them to HTTPS: turn off "Always Use HTTPS", or exempt the game's hosts.
- "No such host is known" at startup: set `HookTcpConnections=False` in `Titanic!.cfg`, or add a DNS
  record for `server.<domain>`.
- .NET refuses to load `osu!.exe` ("loadFromRemoteSources"): unblock the folder with `Unblock-File`.
- Every download ends up in `Songs\Failed`: start the game with `Titanic.fallback.exe`, not
  `Titanic.exe`.
- Refused logins: device verification is on. Leave `TOMYUM_CLIENTVERIFICATION__ENABLED` off for
  original old builds.

See [old clients](/clients/old-clients).

### Beatmap set uploads fail near 100 MB

Cloudflare refuses request bodies over 100 MB, whatever Caddy allows. Keep `.osz` files under that.

## Running it

### The disk fills up

Docker's build cache grows with every deploy. `deploy.sh` trims it to 20 GB; between deploys:

```bash
docker builder prune -af --max-used-space 20GB
```

### `backup.sh` can't find the volumes

It expects the compose project to be called `tomyum` (`tomyum_server-data`, …). Set
`COMPOSE_PROJECT_NAME=tomyum` in `.env`. Changing it on a running server makes Compose create new,
empty volumes, so check `docker volume ls` first.

### Watchdog alerts don't arrive

Run `./watchdog.sh --test`. The bot needs a token (`WATCHDOG_DISCORD_TOKEN` in `.env`), the admin
must share a server with it and allow DMs, and `WATCHDOG_DISCORD_USER` must be **your** Discord id.
See [monitoring](/operations/monitoring).

### The changelog step imports the wrong repositories

`changelog.sh` (run by `deploy.sh`) is set up for somtum.fun's repositories and authors. Edit it, or
stop calling it. See [updating](/guide/updating).
