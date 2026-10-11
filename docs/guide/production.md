# Production with Docker Compose

This is the end-to-end path to a public TomYum server with
[`deploy/production`](https://github.com/somtum-fun/TomYum-OSS/tree/main/deploy/production): TomYum,
the website, ppy's services and the databases on one machine, published through a Cloudflare Tunnel.

```
cloudflared ─► caddy:80 ─┬─► server:8080        TomYum (bancho, /web/*, osu!direct downloads)
                         ├─► osu-web:8080       the website (nginx ► octane), /api/v2 for lazer
                         └─► spectator:80       lazer multiplayer / spectating
```

Nothing listens on the host except IRC (port 6667) and, if you turn it on, TCP bancho for old clients.
MySQL, Redis and Elasticsearch stay on the compose network.

::: tip
Try the stack on your own PC first ([Try it locally](/guide/local-testing)). It's much easier to learn
the moving parts there.
:::

## 1. Get the code

`deploy/production` expects the website and the spectator server checked out **next to** TomYum:

```
~/TomYum-OSS/          this repository (deploy/production is in here)
~/osu-web/             your osu-web fork (OSU_WEB_PATH)
~/tomyum-spectator/    ppy's spectator server with TomYum's changes (SPECTATOR_PATH)
```

```bash
cd ~
git clone https://github.com/somtum-fun/TomYum-OSS.git
git clone https://github.com/somtum-fun/osu-web-tomyum.git osu-web
git clone https://github.com/sundeiii/tomyum-spectator.git
```

The website must be the TomYum fork (or your own fork of it): the staff panels, `tomyum:setup` and
the other `tomyum:*` commands live there. The spectator build writes lazer replays to the website's
uploads instead of Amazon S3. If you put the checkouts elsewhere, set `OSU_WEB_PATH` and
`SPECTATOR_PATH` in `.env` (paths are relative to `deploy/production`).

## 2. Fill in the settings

```bash
cd ~/TomYum-OSS/deploy/production
cp .env.example .env
cp tomyum.env.example tomyum.env
cp osu-web.env.example osu-web.env
```

These files hold your server's secrets. They're gitignored: never commit them, and keep them private.

| File | Read by | What goes in it |
|---|---|---|
| `.env` | `docker-compose.yml` | The domain, the tunnel token, database passwords, the shared secret, the osu! API, old-client options |
| `tomyum.env` | the game server | Extra TomYum settings (`TOMYUM_*`) |
| `osu-web.env` | the website | Extra website settings (mail, sign-ups, tickets, ranking rules) |

In `.env`, at least:

```ini
DOMAIN=example.com                 # the site is osu.example.com; players use -devserver example.com
CLOUDFLARE_TUNNEL_TOKEN=           # see step 4
DB_ROOT_PASSWORD=                  # openssl rand -hex 24
DB_PASSWORD=                       # openssl rand -hex 24
SHARED_INTEROP_SECRET=             # openssl rand -hex 32
OSU_WEB_APP_KEY=                   # step 3
```

Also add this line to `.env`, before anything is started:

```ini
COMPOSE_PROJECT_NAME=tomyum
```

Docker Compose would otherwise name the project after the folder (`production`). The scripts expect
`tomyum`: `backup.sh` finds the volumes as `tomyum_<name>`, and the pp updater uses the `tomyum_default`
network.

`tomyum.env` and `osu-web.env` work as they come. Look through them now anyway: for example
`TOMYUM_SERVER__NAME` (your server's name in BanchoBot's posts) and the `MAIL_*` settings. Every
setting is in the [configuration reference](/reference/configuration).

::: warning Sign-in codes need mail
`osu-web.env.example` sets `USER_BYPASS_VERIFICATION=true`. Without a mail server, keep it: otherwise
nobody can sign in to the website from a new device, because the emailed code never arrives.
:::

Unlike a local run, the production server reads **no** `config/tomyum.yaml`: every TomYum setting is
an environment variable, set in `tomyum.env` (or by `docker-compose.yml` from `.env`).

## 3. Build and prepare the database

Run these from `deploy/production` (with `sudo` if your user isn't in the `docker` group). The first
builds take a while.

```bash
# The website's image, then TomYum, the spectator server and the score processor
docker compose --profile build build osu-web-build
docker compose build

# The website's Laravel key: copy the output into OSU_WEB_APP_KEY in .env
docker compose run --rm artisan key:generate --show
```

Then set up the website's database. `artisan` runs one-off website commands; it starts MySQL and
Redis for you, and MySQL's first start creates the `osuweb` account everything shares
(`mysql-init.sh`).

```bash
docker compose run --rm artisan migrate --force   # the website's tables
docker compose run --rm artisan passport:keys     # OAuth keys: lazer, the API and TomYum check logins with them
docker compose run --rm artisan tomyum:setup      # groups, genres, countries, forum, download mirror, lazer's OAuth client
```

`tomyum:setup` must run before TomYum's first start: TomYum refuses to start without the website's
user groups. `passport:keys` must run before the first `up`: the server, the spectator server and
the notification server mount `oauth-public.key` from the website's storage volume.

## 4. The Cloudflare Tunnel

Cloudflare ends HTTPS; the tunnel carries every request to the stack's Caddy over plain HTTP.

1. In Cloudflare Zero Trust: **Networks → Tunnels**, create a tunnel, and copy its token from
   "Install connector" into `CLOUDFLARE_TUNNEL_TOKEN`.
2. Add a public hostname for each of the game's and website's subdomains, all with the service
   `http://caddy:80`. The list is on [Domains, DNS and Caddy](/guide/domains).

## 5. Start it

```bash
docker compose up -d
docker compose run --rm artisan tomyum:es-ensure   # creates any missing search index
docker compose ps
docker compose logs -f server
```

On a good start the server's log shows `Database schema up to date`, `Accounts stored in osu-web
database osu` and `Now listening on`. TomYum applies its own database migrations at every start.

## 6. Make yourself an admin

Register on the website (`https://osu.example.com`) or in the game, then add your account to the
website's `admin` group:

```bash
docker compose run --rm artisan tinker
>>> App\Models\User::where('username', 'YourName')->first()->addToGroup(app('groups')->byIdentifier('admin'));
```

Log in to the game again. From now on you can give other people roles from the website's admin panel,
or in-game with `!setpriv`. TomYum's staff roles are website groups:

| TomYum | Website |
|---|---|
| Administrator | `admin` group |
| Developer | `dev` group |
| Moderator | `gmt` group |
| Supporter | supporter tag |

## 7. Check it works

```bash
curl -s -o /dev/null -w '%{http_code}\n' https://osu.example.com/home/news             # the website: 200
curl -s -o /dev/null -w '%{http_code}\n' https://c.example.com/                        # bancho: 200
curl -s -o /dev/null -w '%{http_code}\n' https://osu.example.com/web/bancho_connect.php # stable's /web: 200
```

These are the same checks the [watchdog](/operations/monitoring) runs (`./watchdog.sh --status`
prints them all without sending anything). Then:

- Log in with osu!stable: `osu!.exe -devserver example.com` ([stable](/clients/stable)).
- Log in with lazer ([lazer](/clients/lazer)).
- Play a ranked map and check it shows on your website profile.

## 8. Keep it running

Containers restart by themselves (`unless-stopped`). Then:

- **Backups**: add `backup.sh` to cron ([backups](/operations/backups)).
- **Alerts**: add `watchdog.sh` to cron ([monitoring](/operations/monitoring)).
- **Updates**: `./deploy.sh` ([updating](/guide/updating)).
- **Search**: maps and players appear on their pages straight away, but in listings and search only
  once indexed. To re-index: `docker compose run --rm artisan es:index-documents --no-interaction`.

## What's in the stack

| Service | What it is |
|---|---|
| `server` | TomYum |
| `osu-web`, `php`, `job`, `scheduler`, `notification-server` | The website: nginx, PHP (Octane), its queue worker, its scheduler and its websocket server |
| `artisan`, `osu-web-build`, `volumes-init` | One-off helpers: website commands, the website image build, volume permissions |
| `score-processor` | ppy's score processor (lazer pp and stats), built with TomYum's ranked mods change |
| `score-indexer` | ppy's Elasticsearch indexer for scores |
| `spectator` | ppy's spectator server with TomYum's changes |
| `beatmap-difficulty-lookup-cache` | ppy's star rating service for the website |
| `db`, `redis`, `elasticsearch` | MySQL 8.4, Redis 7, Elasticsearch 7.17 |
| `caddy`, `cloudflared` | Routing, and the tunnel to Cloudflare |

Data lives in Docker volumes (project `tomyum`): `mysql-data`, `redis-data`, `elasticsearch-data`,
`server-data` (replays, screenshots, custom beatmaps, caches), `osu-web-uploads`, `osu-web-storage`,
`caddy-data`.

## Changing the tracked files

`docker-compose.yml` needs no editing. For changes that are only for your server (mounting
[plugins](/operations/plugins), adding the [pp sidecar](/features/pp-reworks#routing-relax-and-autopilot-to-the-sidecar),
removing a port), put them in a `docker-compose.override.yml` next to it: Docker Compose merges that
file in by itself, and `git pull` never touches it.

## Kubernetes

`deploy/k8s` and `deploy/k3s` hold scaffolding for TomYum alone (no website). Bancho keeps its online
state in one process, so it can't run as several copies yet, and Compose on one machine is the
supported path for now.
