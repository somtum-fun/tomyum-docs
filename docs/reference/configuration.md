# Configuration

The settings people actually set, grouped by file. 🔒 marks a **secret**: keep it out of git, logs
and screenshots.

## How TomYum reads settings

TomYum's settings are layered, lowest priority first:

```
appsettings.json → appsettings.<Environment>.json → tomyum.yaml → TOMYUM_* environment variables
```

The files live in `config/`; the server also loads `config/.env` into its environment when it exists.
An environment variable is the setting's path with `__` between the parts and a `TOMYUM_` prefix:
`Irc:Port` is `TOMYUM_IRC__PORT`, list items are numbered (`TOMYUM_PLUGINS__TRUSTED__0`).

::: tip In production, everything is an environment variable
The production image has no `config/` folder, so the server reads only environment variables: those
`docker-compose.yml` sets from `.env`, and those in `tomyum.env`. Examples for local runs:
[`config/.env.example`](https://github.com/somtum-fun/TomYum-OSS/blob/main/config/.env.example) and
[`config/tomyum.yaml.example`](https://github.com/somtum-fun/TomYum-OSS/blob/main/config/tomyum.yaml.example).
:::

## `.env` (production compose)

[`deploy/production/.env.example`](https://github.com/somtum-fun/TomYum-OSS/blob/main/deploy/production/.env.example),
copied to `.env`. `docker-compose.yml` reads it and passes the values on.

| Name | What it does | Default / example |
|---|---|---|
| `DOMAIN` | Your domain: the site is `osu.<DOMAIN>`, the game connects with `-devserver <DOMAIN>` | `example.com` |
| `CLOUDFLARE_TUNNEL_TOKEN` 🔒 | The Cloudflare Tunnel's connector token | |
| `DB_ROOT_PASSWORD` 🔒 | MySQL's root password | `openssl rand -hex 24` |
| `DB_PASSWORD` 🔒 | The `osuweb` account TomYum, the website and ppy's services share | `openssl rand -hex 24` |
| `SHARED_INTEROP_SECRET` 🔒 | Signs requests between TomYum, the website and ppy's services | `openssl rand -hex 32` |
| `OSU_WEB_APP_KEY` 🔒 | The website's Laravel key | `docker compose run --rm artisan key:generate --show` |
| `OSU_WEB_PATH` | Your osu-web fork's checkout, relative to `deploy/production` | `../../../osu-web` |
| `SPECTATOR_PATH` | The spectator server's checkout | `../../../tomyum-spectator` |
| `OSU_API_KEY` 🔒 | osu! API v1 key (optional, recommended) | empty: a keyless mirror |
| `OSU_CLIENT_ID` | osu! API v2 OAuth app (beatmap descriptions, nominators) | empty |
| `OSU_CLIENT_SECRET` 🔒 | Its secret | empty |
| `DEVELOPMENT_BANNER` | The website's red "development instance" banner | `false` |
| `TCP_BANCHO` | TCP bancho for builds up to b20130802.1 (ports 13380-13384) | `false` |
| `TCP_BANCHO_BIND` | Where the TCP bancho ports listen; `0.0.0.0` opens them to everyone | `127.0.0.1` |
| `GATEWAY_KEY` 🔒 | The secret shared with [TomYum.Gateway](/operations/gateway); empty turns the link off | empty |
| `IRC_PORT` | The host port for IRC | `6667` |
| `WATCHDOG_DISCORD_TOKEN` 🔒 | A Discord bot token for the [watchdog](/operations/monitoring)'s DMs | |
| `COMPOSE_PROJECT_NAME` | Docker Compose's project name; the scripts expect `tomyum` | (add it: `tomyum`) |

`docker-compose.yml` already sets these for TomYum, so don't set them in `tomyum.env`:
`TOMYUM_SERVER__DOMAIN`, `TOMYUM_DATABASE__*`, `TOMYUM_REDIS__CONFIGURATION`, `TOMYUM_OSUWEB__INTEROPURL`,
`TOMYUM_OSUWEB__INTEROPSECRET`, `TOMYUM_OSUWEB__SCOREPROCESSOR`, `TOMYUM_OSU__APIKEY`,
`TOMYUM_OSU__CLIENTID`, `TOMYUM_OSU__CLIENTSECRET`, `TOMYUM_GATEWAY__KEY`,
`TOMYUM_BANCHO__TCP__ENABLED`, `TOMYUM_REPLAYS__LAZERPATH`.

## `tomyum.env` (the game server)

[`deploy/production/tomyum.env.example`](https://github.com/somtum-fun/TomYum-OSS/blob/main/deploy/production/tomyum.env.example),
copied to `tomyum.env`. Everything here is optional.

### Server

| Name | What it does | Default |
|---|---|---|
| `TOMYUM_SERVER__NAME` | Your server's name in BanchoBot's posts, `!version` and the restart notice | `TomYum` |
| `TOMYUM_SERVER__DOMAIN` | The domain (set by compose from `DOMAIN`) | |

### Gameplay and ranking

| Name | What it does | Default |
|---|---|---|
| `TOMYUM_RANKING__CLEARSCORESONRANK` | Delete a difficulty's scores when it becomes ranked or approved; `false` keeps them | `true` |
| `TOMYUM_RANKING__INACTIVEDAYS` | A player with no score in a mode for this many days leaves that mode's rankings until the next score (stats stay); the website's `TOMYUM_RANKING_INACTIVE_DAYS` must match. `0` keeps everyone ranked | `0` |
| `TOMYUM_BANCHO__BOTUSERID` | BanchoBot's user id (the website's `BANCHO_BOT_USER_ID` must match); a server imported from bancho.py may put the bot at `2` so the owner keeps `3` | `3` |
| `TOMYUM_CLIENTVERIFICATION__ENABLED` | New devices must be confirmed on the website ([stable](/clients/stable#device-verification)) | `false` |
| `TOMYUM_CLIENTVERIFICATION__OLDCLIENTS` | Builds before b20151228: `Unverified` or `Refuse` | `Unverified` |
| `TOMYUM_CLIENTVERIFICATION__DOWNLOADSURL` | Where refused old clients are sent | `https://osu.<domain>/home/download` |

### lazer and the website

| Name | What it does | Default |
|---|---|---|
| `TOMYUM_DAILYCHALLENGE__ENABLED` | Keep lazer's daily challenge queue filled | `true` |
| `TOMYUM_DAILYCHALLENGE__DAYSAHEAD` | Days kept queued | `7` |
| `TOMYUM_DAILYCHALLENGE__WEEKLY` | Star ratings by weekday, as osu! (Thursday 3–3.5★ to Wednesday 6–6.5★) | `true` |
| `TOMYUM_DAILYCHALLENGE__MINSTARS`, `__MAXSTARS` | The star range when `WEEKLY` is `false` | `4`, `6.5` |
| `TOMYUM_DAILYCHALLENGE__RULESETS` | Rulesets, one per day in turn | `osu` |
| `TOMYUM_LASTFM__APIKEY` | Last.fm scrobbling ([lazer](/clients/lazer#last-fm)) | empty: off |
| `TOMYUM_LASTFM__APISECRET` 🔒 | Its secret | empty |
| `TOMYUM_DATABASE__OSUWEBIMPORTPACKS` | Make osu!'s beatmap packs on the website from imports | `false` |
| `TOMYUM_DATABASE__OSUWEBINDEXPREFIX` | The website's `ES_INDEX_PREFIX`, if it sets one | empty |
| `TOMYUM_OSUWEB__OAUTHPUBLICKEYPATH` | The website's Passport public key (lazer beatmap submission) | `oauth-public.key` |
| `TOMYUM_OSUWEB__LAZERCLIENTID` | lazer's OAuth client id | `5` |

### IRC and TCP

| Name | What it does | Default |
|---|---|---|
| `TOMYUM_IRC__ENABLED` | The [IRC](/features/irc) server | `true` |
| `TOMYUM_IRC__PORT` | Its port inside the container | `6667` |
| `TOMYUM_IRC__SERVERNAME` | Its name in replies | `irc.<domain>` |
| `TOMYUM_BANCHO__TCP__PORTS__0` … | TCP bancho's ports | `13380`–`13384` |
| `TOMYUM_BANCHO__TCP__PROXYPROTOCOL` | Connections start with a PROXY protocol header (a relay such as frp) | `false` |

### Files

All relative to the container's `/app`, so on the `server-data` volume by default.

| Name | What it does | Default |
|---|---|---|
| `TOMYUM_REPLAYS__PATH` | Stable replays | `data/replays` |
| `TOMYUM_SCREENSHOTS__PATH` | Uploaded screenshots | `data/screenshots` |
| `TOMYUM_BEATMAPS__PATH` | Custom beatmap sets | `data/beatmaps` |
| `TOMYUM_PACKS__PATH` | Built beatmap pack zips | `data/packs` |
| `TOMYUM_PACKS__MAXBYTES` | The largest a pack zip may be | `4294967296` (4 GiB) |
| `TOMYUM_ASSETS__CACHEPATH` | Medal icons and other cached assets | `data/assets` |
| `TOMYUM_PERFORMANCE__OSUCACHEDIRECTORY` | Downloaded `.osu` files | `data/osu-cache` |
| `TOMYUM_GEOIP__PATH` | DB-IP's country database (for players Cloudflare can't place) | `data/geoip` |
| `TOMYUM_GEOIP__DOWNLOAD` | Download and refresh it monthly | `true` |
| `TOMYUM_PREVIEWS__FFMPEG` | The ffmpeg that cuts custom sets' audio previews | `ffmpeg` |

### Beatmap sources

| Name | What it does | Default |
|---|---|---|
| `TOMYUM_OSU__REQUESTSPERMINUTE` | The whole server's osu! API budget | `50` |
| `TOMYUM_MIRROR__ENABLED` | Ask a beatmap mirror before osu!'s API | `true` |
| `TOMYUM_MIRROR__URL` | That mirror (osu!'s v2 answers, catboy.best's API) | `https://catboy.best/` |
| `TOMYUM_MIRROR__REQUESTSPERMINUTE` | Requests a minute to it | `120` |
| `TOMYUM_MIRROR__USERAGENT` | How the server introduces itself | names your website |
| `TOMYUM_DIRECT__MIRRORBASEURL` | osu!direct's mirror (mino-compatible search API) | `https://osu.direct` |
| `TOMYUM_DIRECT__SEARCHPATH` | Its search path | `/api/search` |
| `TOMYUM_DIRECT__SETPATH` | Its set lookup path | `/api/s/{0}` |
| `TOMYUM_DIRECT__DOWNLOADPATH` | Its `.osz` download path | `/api/d/{0}` |
| `TOMYUM_DIRECT__THUMBNAILBASEURL` | Where `b.` sends osu!'s thumbnails | `https://b.ppy.sh` |

### pp

The `Performance` settings route modes to pp backends. See
[pp reworks](/features/pp-reworks#routing-relax-and-autopilot-to-the-sidecar).

| Name | What it does | Default |
|---|---|---|
| `TOMYUM_PERFORMANCE__DEFAULT` | Backend for modes no route matches | `official` |
| `TOMYUM_PERFORMANCE__ROUTES__<n>__MODES__<m>` | Modes a route matches (`vanilla`, `relax`, `autopilot`, `all`, a short name or a number) | none |
| `TOMYUM_PERFORMANCE__ROUTES__<n>__BACKEND` | The backend for that route | |
| `TOMYUM_PERFORMANCE__BACKENDS__<name>__TYPE` | `inprocess-lazer` or `http` | `inprocess-lazer` |
| `TOMYUM_PERFORMANCE__BACKENDS__<name>__URL` | An `http` backend's address | |
| `TOMYUM_PERFORMANCE__BACKENDS__<name>__TIMEOUTMS` | Its timeout | `3000` |
| `TOMYUM_PERFORMANCE__BACKENDS__<name>__FALLBACK` | Backend to use when it fails (else 0 pp) | none |
| `TOMYUM_PERFORMANCE__VANILLAPP` | Variants worth what the same play without Relax/Autopilot is worth (`relax`, `autopilot`, separated by commas or spaces): a 727pp play is 727pp on those boards too, instead of a relax formula. The variant still picks the route. | none |

### Plugins

| Name | What it does | Default |
|---|---|---|
| `TOMYUM_PLUGINS__DIRECTORY` | Where plugins load from | `plugins` |
| `TOMYUM_PLUGINS__ALLOWLOOSESOURCE` | Compile loose `.cs` plugins | `true` |
| `TOMYUM_PLUGINS__TRUSTED__<n>` | Plugin ids with raw database access | none |
| `TOMYUM_PLUGINS__<id>__<setting>` 🔒 when it's a token | A plugin's own settings | |

### Anti-cheat

| Name | What it does | Default |
|---|---|---|
| `TOMYUM_ANTICHEAT__DEVMODE` | Skip anti-cheat checks (development only) | `false` |
| `TOMYUM_ANTICHEAT__OLDCLIENTS__SECRET` 🔒 | The secret patched old builds' proofs are made from; empty turns the check off | empty |
| `TOMYUM_ANTICHEAT__OLDCLIENTS__REQUIRE` | Refuse old builds that fail the check (otherwise only logged) | `false` |

## `osu-web.env` (the website)

[`deploy/production/osu-web.env.example`](https://github.com/somtum-fun/TomYum-OSS/blob/main/deploy/production/osu-web.env.example),
copied to `osu-web.env`. These are osu-web's own settings plus the fork's.

### Basics

| Name | What it does | Example value |
|---|---|---|
| `APP_ENV`, `APP_DEBUG`, `APP_LOG_LEVEL`, `LOG_CHANNEL` | Production mode, logging to stderr | `production`, `false`, `warning`, `stderr` |
| `DB_DATABASE` | The website's database | `osu` |
| `CACHE_DRIVER`, `SESSION_DRIVER`, `BROADCAST_DRIVER`, `QUEUE_DRIVER` | All on Redis | `redis` |
| `TRUSTED_PROXIES` | Trust Caddy and the tunnel's forwarded headers (not `*`, which is ignored) | `PRIVATE_SUBNETS` |
| `BANCHO_BOT_USER_ID` | BanchoBot's user id | `3` |
| `TOMYUM_MANAGES_RANKING` | TomYum manages ranking | `true` |
| `TOMYUM_RANKING_INACTIVE_DAYS` | The rankings' inactivity rule, the same number as TomYum's `TOMYUM_RANKING__INACTIVEDAYS` | `0` |
| `CLIENT_CHECK_VERSION` | Check lazer builds (players use the stock client) | `false` |
| `REGISTRATION_MODE_WEB` | Allow sign-ups on the website (in-game sign-up always works) | `true` |
| `USER_BYPASS_VERIFICATION` | Skip emailed login codes; keep `true` without a mail server | `true` |
| `TOMYUM_SERVER_NAME` | The website's name for your server | |

### Mail

Without these, mail is only written to the log.

| Name | What it does | Example |
|---|---|---|
| `MAIL_DRIVER` | | `smtp` |
| `MAIL_HOST`, `MAIL_PORT`, `MAIL_ENCRYPTION` | Your SMTP server | `smtp.example.com`, `587`, `tls` |
| `MAIL_USERNAME` | The SMTP login | `noreply@example.com` |
| `MAIL_PASSWORD` 🔒 | Its password or token | |
| `MAIL_ADDRESS`, `MAIL_SENDER` | The From address and name | `noreply@example.com` |

### Tickets

See [tickets](/features/tickets).

| Name | What it does | Default |
|---|---|---|
| `TICKETS_IMAP_HOST` | Turns on reading the support mailbox over IMAP | empty |
| `TICKETS_IMAP_PORT`, `TICKETS_IMAP_FOLDER` | | `993`, `INBOX` |
| `TICKETS_IMAP_USERNAME`, `TICKETS_IMAP_PASSWORD` 🔒 | The mailbox login | the SMTP login |
| `TICKETS_MAIL_DOMAIN` | The ticket addresses' domain | the site's, without `osu.` |
| `TICKETS_ENABLED` | `false` stops fetching | |

### Beatmap ranking

| Name | What it does | Default |
|---|---|---|
| `BEATMAPSET_REQUIRED_HYPE` | Hype before BNs can nominate | `1` |
| `BEATMAPSET_REQUIRED_NOMINATIONS` | Nominations to qualify | `2` |
| `BEATMAPSET_MINIMUM_DAYS_FOR_RANK` | Days in qualified before ranking | `1` |
| `BEATMAPSET_RANK_PER_DAY`, `BEATMAPSET_RANK_PER_RUN` | How many sets rank a day and per run (`0`: no limit) | `0`, `0` |

### Account connections

The website's Connections page (account settings), for linking an osu! account or Discord.

| Name | What it does |
|---|---|
| `OSU_LINK_CLIENT_ID`, `OSU_LINK_CLIENT_SECRET` 🔒 | osu! OAuth app for linking an osu! account |
| `DISCORD_OAUTH_CLIENT_ID`, `DISCORD_OAUTH_CLIENT_SECRET` 🔒 | Discord application for linking Discord |

### Set by `docker-compose.yml`

Values in `osu-web.env` don't override these: `APP_URL`, `APP_KEY`, `SESSION_DOMAIN`, `DB_HOST`,
`DB_USERNAME`, `DB_PASSWORD`, `REDIS_HOST`, `NOTIFICATION_REDIS_HOST`, `ES_HOST`, `ES_SOLO_SCORES_HOST`,
`BEATMAPS_DIFFICULTY_CACHE_SERVER_URL`, `SHARED_INTEROP_SECRET`, `TOMYUM_ADMIN_URL`, `OSU_API_KEY`,
`USER_ACHIEVEMENT_ICON_PREFIX`, `USER_BADGE_IMAGE_PREFIX`, `UPDATE_STREAMS`, `IS_DEVELOPMENT_DEPLOY`.
Change them in `.env` (where they come from it) or in a `docker-compose.override.yml`.

## `gateway.env`

For [TomYum.Gateway](/operations/gateway#settings) on its own machine.

## Not in use yet

`config/tomyum.yaml.example` also has a `storage` section (R2, S3, OVH, Azure, local). Object storage
isn't implemented yet, and TomYum doesn't read those settings: files go to the `server-data` volume.
