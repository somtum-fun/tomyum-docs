# lazer

osu!lazer runs on ppy's own open-source services next to the website: osu-web is its API, OAuth and
chat, ppy's spectator server does multiplayer, spectating and presence, and ppy's score processor
does lazer pp and stats. TomYum shares the accounts, chat and leaderboards with them. The production
stack runs all of these; there's nothing extra to turn on.

## Connecting a lazer client

lazer has no server setting of its own. Players use
[LazerAuthlibInjection](https://github.com/MingxuanGame/LazerAuthlibInjection), a ruleset that sets
the server's addresses.

::: danger Use a separate install
Before installing it, **sign out of any official osu! account in lazer**, and preferably use a
separate lazer install for your server. Using the injection ruleset against ppy's servers gets
accounts banned. Remove the DLL to go back.
:::

1. In lazer: Settings → "Open osu! folder" (on Windows, `%AppData%\osu!`).
2. Copy `osu.Game.Rulesets.EnhancedAuth.dll` from the
   [latest release](https://github.com/MingxuanGame/LazerAuthlibInjection/releases) into `rulesets`.
3. Restart lazer. Settings → Rulesets → set **API Url** and **Website Url** to
   `https://osu.example.com`. Leave the Spectator, Multiplayer and Metadata Urls empty (the client
   then uses `https://osu.example.com/signalr/<hub>`, which Caddy sends to the spectator server), or
   set them to `https://spectator.example.com/spectator`, `/multiplayer` and `/metadata`. Keep the
   default client ID and secret. Turn off the g0v0-server features (the `--non-g0v0-server` option).
4. Sign in with your normal account from the website.

## What the server needs (already in the production stack)

| Piece | Setting |
|---|---|
| lazer's OAuth client (id 5) | made by `artisan tomyum:setup` |
| The website's Passport keys | `artisan passport:keys` ([production](/guide/production#_3-build-and-prepare-the-database)) |
| No client build check | `CLIENT_CHECK_VERSION=false` (website), `"0"` (score processor), `"false"` (spectator) |
| pp on the website from ppy's processor | `TOMYUM_OSUWEB__SCOREPROCESSOR=true` |
| Custom maps' pp | the processor downloads `.osu` files from TomYum (`BEATMAP_DOWNLOAD_PATH`) |
| lazer replays | the spectator server writes them to the website's uploads (`REPLAYS_PATH`) |

When lazer asks about a map the website doesn't have yet, the website imports it from osu! through
TomYum before answering. Maps osu! doesn't know are remembered for an hour.

## Scores and pp

- Stable and lazer scores share one pool on the website, as on osu!. Total pp keeps each player's
  best play per map, whichever client.
- lazer scores don't show in the stable client (as on osu!).
- Relax and Autopilot lazer plays go on TomYum's Relax/Autopilot leaderboards, with their pp. The
  score processor waits up to 15 seconds for TomYum to take them in, so the results screen shows the
  play counted.
- They count like stable's Relax and Autopilot plays: their pp is worked out from the play's own mods
  (a rate mod at its own speed, Difficulty Adjust's settings) and judgements (slider ends and ticks), as
  ppy's score processor does; their accuracy is the one lazer shows; a play becomes the player's best,
  and counts in their ranked and total score, as a stable submission would; and the score is the one the
  client gave. Their leaderboards show the mods with their settings.
- The website's own leaderboards, #1s and placements count plays without Relax or Autopilot only; a
  Relax/Autopilot play's "achieved rank" activity comes from TomYum's board.
- Scores from lazer builds before 2024 (which don't send a total without mods) are processed: the total
  without mods is worked back out from the total and osu!'s multiplier for the mods.

### Ranked mods

lazer plays give pp, and count for medals, only when every mod on them is ranked. osu! decides that
in its game code. TomYum builds ppy's score processor from source
([`deploy/score-processor`](https://github.com/somtum-fun/TomYum-OSS/tree/main/deploy/score-processor))
with one change: mods staff switch on in **Admin panel → Ranked mods** count as ranked too, whatever
their settings.

- When a mod's ranked setting changes, lazer scores with that mod get their pp worked out again
  (checked every 30 seconds), and their players' totals follow.
- The lazer client still shows such a mod as unranked while playing; only the server's answer
  changes.
- Relax and Autopilot aren't offered there: they have their own leaderboards.

## Daily challenge

lazer's daily challenge is the website's own feature: at 00:05 UTC its scheduler opens a playlist
room from the next entry in `daily_challenge_queue`, and at 00:10 it works out streaks and
percentiles.

TomYum keeps that queue filled, hourly: a week ahead, each day a random ranked map for the day's
ruleset, 1 to 5 minutes long, from a set that was never a daily challenge before. Star ratings follow
osu!'s week (Thursday 3–3.5★ up to Wednesday 6–6.5★). Players may add EZ, NF, HD, HR (FI and MR in
mania), SD, PF and FL, but no rate changes.

Settings (`tomyum.env`):

```ini
TOMYUM_DAILYCHALLENGE__ENABLED=true         # false: fill daily_challenge_queue yourself
TOMYUM_DAILYCHALLENGE__DAYSAHEAD=7
TOMYUM_DAILYCHALLENGE__WEEKLY=true          # false: every day between MINSTARS and MAXSTARS
TOMYUM_DAILYCHALLENGE__MINSTARS=4
TOMYUM_DAILYCHALLENGE__MAXSTARS=6.5
TOMYUM_DAILYCHALLENGE__RULESETS=osu         # rotates by day, e.g. osu,osu,taiko,osu,osu,catch,mania
```

To open the first day's room before 00:05:

```bash
docker compose run --rm artisan daily-challenge:create-next
```

## Beatmap submission

The editor's **Submit** goes to TomYum. Leave the ruleset's "Beatmap Submission Service Url" empty:
lazer then uses `<API Url>/beatmap-submission`, which Caddy sends to TomYum. See
[custom beatmaps](/features/custom-beatmaps#lazer).

## Last.fm

Players can connect Last.fm in the website's account settings; their passed plays (stable and lazer)
are then scrobbled as the map's song, and shown as "now playing" while they play. Turn it on with a
[Last.fm API account](https://www.last.fm/api/account/create) whose callback is
`https://osu.example.com/home/account/lastfm/callback`:

```ini
TOMYUM_LASTFM__APIKEY=
TOMYUM_LASTFM__APISECRET=
```

## Not supported yet

Custom lazer rulesets (Sentakki, tau, Rush!, …).
