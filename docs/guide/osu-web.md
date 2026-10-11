# The website (osu-web)

TomYum serves the game (bancho, `/web/*.php`, score submission). The website (profiles, rankings,
beatmap listings, forums, staff panels, and the `/api/v2` and OAuth lazer logs in with) is
[osu-web](https://github.com/ppy/osu-web), ppy's Laravel site, with TomYum's changes in
[osu-web-tomyum](https://github.com/somtum-fun/osu-web-tomyum).

The two share one MySQL server and one Redis. The production stack builds the website from your
checkout (`OSU_WEB_PATH`) with osu-web's own `Dockerfile.deployment`.

## What's shared

- **Accounts.** TomYum keeps its players in the website's `phpbb_users` (`TOMYUM_DATABASE__OSUWEBNAME=osu`,
  set by the production compose file). An account made on the website logs into the game, and an
  in-game sign-up shows up on the website. Both store passwords as `bcrypt(md5(password))`, so they
  check each other's.
- **BanchoBot** is user 3 on both (`BANCHO_BOT_USER_ID=3`). TomYum creates its account at startup, in
  the `bot` group.
- **Beatmaps, scores and stats are mirrored.** Every map played, every vanilla score and the player's
  per-mode stats are copied to the website. TomYum's own tables stay the source of truth the game
  reads.
- **Chat.** The website's chat and in-game chat are linked.
- **Friends** live on the website and are shared with stable and lazer.

## How plays look on the website

- **pp on the website comes from ppy's score processor**, for stable and lazer plays alike
  (`TOMYUM_OSUWEB__SCOREPROCESSOR=true`). Total pp combines both clients, as on osu!.
- **Stable scores are stored as "legacy" scores** with the Classic mod, as imported stable scores are
  on osu!.
- **Relax and Autopilot** have their own profiles and rankings on the website (a Vanilla/RX/AP
  switch), with TomYum's pp.
- **Global rank** is worked out after every play, leaving out restricted and banned accounts.
- **New scores** are queued for the website's score indexer, so leaderboards and profiles update by
  themselves while the `score-indexer` service runs.
- **Maps and new players** are reachable by URL at once (`/beatmapsets/<id>`, `/users/<id>`), but
  appear in listings and search only after indexing (see [production](/guide/production#_8-keep-it-running)).

## InterOp

TomYum and the website talk through osu-web's InterOp API, signed with a shared secret:

| Website | TomYum | |
|---|---|---|
| `SHARED_INTEROP_SECRET` | `TOMYUM_OSUWEB__INTEROPSECRET` | The same long random string (production sets both from `SHARED_INTEROP_SECRET` in `.env`) |
| | `TOMYUM_OSUWEB__INTEROPURL` | How TomYum reaches the website (`http://osu-web:8080` in production) |

InterOp records medal unlocks with their "unlocked the … medal" activity entry and notification, puts
in-game sign-ups into the website's search, and announces new and updated beatmap sets. Without it
(or when a call fails), medals are written straight to the website's tables, without the activity
entry. The website's staff panels reach TomYum through TomYum's admin API (`TOMYUM_ADMIN_URL`),
signed with the same secret.

::: tip
osu-web checks the signature against the URL it sees, so `TOMYUM_OSUWEB__INTEROPURL` must reach it
without a proxy that rewrites the host or port.
:::

## Medals

The website starts with an empty medal catalog, and profiles only show catalogued medals. At startup
TomYum writes osu!'s medal list into it (read from osu.ppy.sh; TomYum's own list when it can't).
See [achievements](/features/achievements).

## Beatmap packs

Staff make the website's beatmap packs on the website (Staff panel → Beatmap packs).
`TOMYUM_DATABASE__OSUWEBIMPORTPACKS=true` brings back osu!'s packs from the osu! API's pack tags when
sets are imported.

A pack's download is either a link pasted on the panel or `/d/packs/{tag}` on `osu.`: TomYum zips the
pack's `.osz` files the first time it's asked, keeps the zip (in `data/packs`) until the pack's sets
change, and answers 503 "being put together" meanwhile. One pack builds at a time, and a zip may be
up to 4 GiB (`TOMYUM_PACKS__MAXBYTES`).

## The staff panel

Everything staff do is on the website: user menu → **Staff panel** (`/panel`).

- **BN panel**: import and manage beatmap sets, rank and love them, upload custom sets.
- **GMT panel**: restrict and silence players, reports, chat logs, score removal.
- **Admin panel**: accounts, groups, supporter, badges, seasonal backgrounds, ranked mods, pp reworks,
  [bots](/features/bots), [tickets](/features/tickets) and more.

## Ranking rules

Nominations, qualification and ranking happen on the website, with osu!'s rules; the game follows
each step. These `osu-web.env` settings change the numbers (the defaults are lighter than osu!'s):

| Setting | Default | osu!'s |
|---|---|---|
| `BEATMAPSET_REQUIRED_HYPE` | `1` | 5 |
| `BEATMAPSET_REQUIRED_NOMINATIONS` | `2` | |
| `BEATMAPSET_MINIMUM_DAYS_FOR_RANK` | `1` | 7 |
| `BEATMAPSET_RANK_PER_DAY` | `0` (no limit) | 8 |
| `BEATMAPSET_RANK_PER_RUN` | `0` (no limit) | 2 |

When a difficulty becomes ranked or approved, its scores are deleted, in every mode, here and on the
website. `TOMYUM_RANKING__CLEARSCORESONRANK=false` keeps them (they get pp instead).

## Licence and branding

osu-web is **AGPL-3.0**. If you run a modified osu-web that other people use over the network, you
must offer them its source. TomYum is a separate program that only shares a database, so it stays
MIT. osu-web ships ppy's name and artwork: **rebrand it before running it publicly**.
