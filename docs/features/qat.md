# BN Management (qat)

[pishifat/qat](https://github.com/pishifat/qat) is the site osu!'s Beatmap Nominators and NAT use for
BN applications, evaluations, reports, vetoes and qualified-map checks. It can run next to TomYum as
`bn.<domain>`, with players signing in with their account on your server.

::: warning Optional, and not in the stack
Upstream qat talks to osu.ppy.sh only, so it needs a **fork** that makes the server address and group
ids configurable. Neither that fork nor its compose service is part of TomYum-OSS: you add them
yourself (for example in a `docker-compose.override.yml`). This page records how it's wired up.
:::

## How it's deployed

| Piece | What |
|---|---|
| `qat` | The qat fork, built from its checkout, on port 3101 |
| `qat-mongo` | MongoDB 7: qat's own data (users, applications, evaluations, events) |
| Settings | `deploy/production/qat-config.json` (holds secrets; gitignored), mounted as `/app/config.json`; Discord webhooks in `qat-webhooks.json` (gitignored too) |
| Sign-in | An OAuth client "BN Management (QAT)" on the website, with the redirect `https://bn.<domain>/api/callback` |
| HTTPS | `bn.<domain>` → qat's port 3101, websockets included |

## Roles

qat reads a player's groups from `/api/v2/me` when they sign in. `groups` in `qat-config.json` maps
your server's group ids (they differ from osu!'s, and `7` is everyone's default group):

| qat role | Website group (id) |
|---|---|
| NAT | `nat` (11) |
| BN | `bng` (4), `bng_limited` (5) |
| "gmt" (GMT and developers) | `gmt` (9), `dev` (8) |

Give someone BN or NAT on the website (admin panel → groups, with their modes for BN); they get it in
qat the next time they sign in. `admin` in the config lists qat's own site admins.

## The fork's options

- `natAreLeaders`: every NAT member is a NAT leader in qat.
- `modesFromServer`: NAT and BN modes come from the website's group modes at sign-in.
- `serverInterOp` (`url` `http://osu-web:8080`, `secret` = your `SHARED_INTEROP_SECRET`): a BN change
  made in qat (application passed, evaluation, removal, resignation) sets the player's `bng` or
  `bng_limited` group on the website.
- `eventFeed`: polls your server's `/api/v2/beatmapsets/events` every 5 minutes for nominations,
  qualifications, disqualifications and ranks (the first poll goes back 30 days).
- `applyRequirements`: what a BN application needs, e.g. `{"kudosu": 0, "connections": true}`: no
  kudosu, and Discord and an osu! account linked in account settings → Connections, with no osu!
  restriction seen in the last 12 months.
- `enableAutomation` (off by default): qat's scheduled jobs, most posting to Discord webhooks.
- `enableMessages` (off by default): in-game messages from a [bot account](/features/bots) (an OAuth
  client with `delegate` and `chat.write`, and `botUserId`).

## Account connections

The website's Connections page links accounts that qat checks:

- **osu! account**: uses the same osu! OAuth app as TomYum (`OSU_LINK_CLIENT_ID` and
  `OSU_LINK_CLIENT_SECRET` in `osu-web.env`). Its callback on osu.ppy.sh must be
  `https://osu.<domain>/home/account/connections/osu_bancho/callback`.
- **Discord**: needs its own Discord application (`DISCORD_OAUTH_CLIENT_ID`,
  `DISCORD_OAUTH_CLIENT_SECRET`), callback `https://osu.<domain>/home/account/connections/discord/callback`.
  A Discord link is also written to TomYum's `discord_links`, so a Discord plugin can use it.

To rebuild qat after changing the fork: `docker compose build qat && docker compose up -d qat`.
