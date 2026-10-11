# Try it locally

This runs the whole stack on one machine: **osu-web** (the website), **TomYum** (the game server) on
osu-web's MySQL and Redis, **Caddy** in front with HTTPS, and your **osu!stable** client pointed at
it. It's written for Windows (Docker Desktop + WSL); on Linux or macOS skip the WSL parts.

Everything uses the domain `localtest.me`: it and every subdomain of it resolve to `127.0.0.1` in
public DNS, so there's nothing to add to your hosts file.

```
osu! client / browser ──https──> Caddy ──> localhost:8080  TomYum.Server  ─┐
                                       └─> localhost:8180  osu-web nginx   ├─ osu-web's MySQL, Redis,
                                                                           ┘  Elasticsearch (Docker)
```

::: tip
This is a development setup. For a public server, follow [Production with Docker Compose](/guide/production)
instead.
:::

## 0. Prerequisites

- **Docker Desktop** with the WSL 2 backend, and "WSL integration" turned on for your Ubuntu distro
  (Settings → Resources → WSL integration). Give Docker at least **6 GB RAM**.
- **WSL Ubuntu** (`wsl --install -d Ubuntu` in an admin PowerShell). Run the `bash` commands below
  inside it, and keep both repositories inside WSL (e.g. `~/src`), not under `C:\`: it's much faster.
- **Caddy** for Windows: `caddy.exe` from <https://caddyserver.com/download>.
- **Git** (inside WSL: `sudo apt install git`).
- Optional, only for TomYum's automated tests: the **.NET 10 SDK**.

## 1. osu-web

Clone the website into a folder called `osu-web` (TomYum's compose overlay looks for its network
under that name):

```bash
mkdir -p ~/src && cd ~/src
git clone https://github.com/somtum-fun/osu-web-tomyum.git osu-web
cd osu-web
NGINX_PORT=8180 bin/docker_dev.sh -d     # the first run builds images and installs deps: it takes a while
```

`bin/docker_dev.sh` prepares the checkout (copies `.env`, makes `APP_KEY` and the Passport OAuth
keys, installs PHP and JS dependencies) and starts osu-web's compose stack. The first run creates
`.env`. Open it and set, adding lines that aren't there:

```ini
NGINX_PORT=8180                        # keep osu-web off 8080 (TomYum uses it)
APP_URL=https://osu.localtest.me
BANCHO_BOT_USER_ID=3                   # TomYum's BanchoBot
SHARED_INTEROP_SECRET=pick-a-long-random-string   # TomYum uses the same value
TRUSTED_PROXIES=PRIVATE_SUBNETS        # trust Caddy/nginx so the site knows it's on https
REGISTRATION_MODE_WEB=true             # allow sign-up on the website (off by default)
USER_BYPASS_VERIFICATION=true          # local only: no emailed login code
USER_ACHIEVEMENT_ICON_PREFIX=https://assets.ppy.sh/medals/client/   # where medal icons are
```

If `APP_KEY` ends in `=`, put it in quotes (`APP_KEY="base64:…="`): Laravel won't read the file
otherwise.

Then:

```bash
docker compose up -d && docker compose restart      # pick up the new .env
docker compose logs -f migrator                     # wait until it exits (database migrated)
docker compose run --rm php artisan tomyum:setup    # groups, genres, countries, forum, download mirror
docker compose restart php
```

`tomyum:setup` creates what the development seeders leave out: the user groups with their badges
(TomYum won't start without them), genres and languages (beatmap pages need them), countries, the
forum that holds profile "me!" pages, and TomYum as the beatmap download mirror. It's safe to run
again. The `scheduler` service keeps rankings like Top Plays up to date.

Check `http://localhost:8180` shows the website's front page.

::: warning Don't run `php artisan cache:clear`
osu-web's cache lives in the same Redis as the score indexer's settings. Clearing it stops
`score-indexer`, and new scores stop reaching profiles and leaderboards. To pick up config or group
changes, `docker compose restart php` instead. If it happened anyway: `docker compose up -d score-indexer`.
:::

## 2. TomYum

```bash
cd ~/src
git clone https://github.com/somtum-fun/TomYum-OSS.git
cd TomYum-OSS
cp config/.env.example config/.env
```

In `config/.env` set:

```ini
TOMYUM_SERVER__DOMAIN=localtest.me
TOMYUM_OSUWEB__INTEROPSECRET=pick-a-long-random-string   # same as osu-web's SHARED_INTEROP_SECRET
TOMYUM_OSU__APIKEY=                    # recommended, see below; empty uses a keyless mirror
```

An osu! API key (from your osu! account settings, "Legacy API") gives object counts, genre and
language on beatmap pages, and bulk imports by date. The database, Redis and osu-web settings in that
file are overridden by the compose overlay.

Start the server on osu-web's network, **not** with this repository's own `mysql` and `redis`:

```bash
docker compose -f deploy/docker/docker-compose.yml -f deploy/docker/docker-compose.osu-web.yml \
  up -d --build server
docker compose -f deploy/docker/docker-compose.yml -f deploy/docker/docker-compose.osu-web.yml logs -f server
```

The log should show `Database schema up to date`, `Accounts stored in osu-web database osu` and
`Now listening on`. `curl localhost:8080/health` should answer `{"status":"ok",...}`.

Optional: add `pp-sidecar` to the `up` command for Relax/Autopilot pp. It's a separate build, and
TomYum only uses it once you route those modes to it (see [pp reworks](/features/pp-reworks#routing-relax-and-autopilot-to-the-sidecar)).

Because the compose file runs TomYum in `Development`, it creates a test account
**`TomYum` / `faker123`**. Handy for a first login; never run `Development` on a public server.

## 3. Caddy (HTTPS)

Copy [`deploy/caddy/Caddyfile.local`](https://github.com/somtum-fun/TomYum-OSS/blob/main/deploy/caddy/Caddyfile.local)
somewhere on Windows (from WSL it's at `\\wsl$\Ubuntu\home\<you>\src\TomYum-OSS\deploy\caddy\Caddyfile.local`),
then in PowerShell:

```powershell
.\caddy.exe trust                                 # once, as administrator: trust Caddy's local CA
.\caddy.exe run --config .\Caddyfile.local
```

Docker Desktop publishes the containers' ports on Windows' `localhost`, which is where Caddy sends
traffic. Open <https://osu.localtest.me>: it should be the website with a valid certificate.

## 4. The osu! client

Make a shortcut to your `osu!.exe` with the target:

```
"C:\...\osu!\osu!.exe" -devserver localtest.me
```

The client then talks to `c.localtest.me`, `osu.localtest.me`, `assets.localtest.me`, … over
HTTPS, which is why Caddy and `caddy trust` are needed. For lazer, see [lazer](/clients/lazer).

## 5. What to check

| Test | How | Where to look |
|---|---|---|
| Website account → game | Register on <https://osu.localtest.me>, log in with it in osu! | You're online; BanchoBot is in the user list |
| Game account → website | Register in the osu! client | `https://osu.localtest.me/users/<id>` shows the profile |
| Staff | Make yourself admin (below), log in to osu! again, then `!help` | Staff commands listed |
| Score | Play a **ranked** map to the end | Profile → Ranks, the map's leaderboard on the site, pp and global rank |
| Medals | Pass a ranked map with HD (or get a 500 combo) | In-game popup; Profile → Medals; "unlocked the … medal" under Recent activity |
| Logs | `docker compose ... logs -f server` | Any `osu-web sync failed` / `medal sync failed` warning |

Make yourself admin (from the osu-web folder):

```bash
docker compose run --rm php artisan tinker
>>> App\Models\User::where('username', 'YourName')->first()->addToGroup(app('groups')->byIdentifier('admin'));
```

After that, everything else is in the **Staff panel** (user menu → Staff panel, or `/panel`): the BN
panel imports and manages beatmap sets, the GMT panel restricts and silences players, shows reports
and chat logs and removes scores, and the admin panel edits accounts, groups and supporter.

**Search and listings** (beatmap listing, user search) read Elasticsearch. Maps TomYum imports are
indexed as they're added; to re-index everything, from the osu-web folder:

```bash
docker compose run --rm php artisan es:index-documents --types=beatmapsets,users --inplace
```

**Chat**: the website's chat and in-game chat are linked (#osu, #english, #lobby, #help, #announce
and private messages).

## Running TomYum's tests

These need the .NET 10 SDK and a throwaway MySQL and Redis. osu-web's stack already uses ports 3306
and 6379, so stop it first (`docker compose stop` in the osu-web folder), then from TomYum-OSS:

```bash
docker compose -f deploy/docker/docker-compose.yml up -d mysql redis
export TOMYUM_TEST_MYSQL="Server=127.0.0.1;User=root;Password=dev-root;"
export TOMYUM_TEST_REDIS="127.0.0.1:6379"
dotnet test TomYum.sln
docker compose -f deploy/docker/docker-compose.yml stop mysql redis
```

Without the two variables the database tests are skipped, not failed.

## Running TomYum without osu-web

For work on the game server alone, TomYum can run on its own MySQL and Redis, or with no database at
all (in memory):

```bash
docker compose -f deploy/docker/docker-compose.yml up -d mysql redis
scripts/dev-server.sh            # DB=off scripts/dev-server.sh runs without a database
```

`scripts/dev-server.sh` runs `dotnet run` in `Development` with the compose file's database password,
on `http://127.0.0.1:5000` (`PORT=` changes it). `config/appsettings.Development.json` already points
at MySQL and Redis on `127.0.0.1`.

::: warning
The server also reads `config/.env` and `config/tomyum.yaml` when they exist, and both examples use
the Docker host names `mysql` and `redis`. Running on your machine (not in Docker), either leave
those files out or change the hosts to `127.0.0.1`.
:::

Without osu-web there's no website, no lazer and no staff panels.

## Starting over

```bash
# osu-web folder: removes its database, Redis and Elasticsearch data
docker compose down -v
# TomYum-OSS folder
docker compose -f deploy/docker/docker-compose.yml -f deploy/docker/docker-compose.osu-web.yml down
```

Then repeat from step 1's `bin/docker_dev.sh`. Problems along the way: see
[Troubleshooting](/operations/troubleshooting).
