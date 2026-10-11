# Features

A quick tour of what a TomYum server does. Each feature with its own page is linked.

## Clients

- **osu!stable**, connected with `-devserver <your domain>` ([stable](/clients/stable)).
- **osu!lazer**, with a ruleset that sets the server's address ([lazer](/clients/lazer)).
- **Older stable builds** from 2008 to 2015, on the same leaderboards
  ([old clients](/clients/old-clients)).
- The **tournament client** (its windows are extra sessions on one account).

## Rulesets

| Ruleset | ID | lazer short name | pp |
|---|:-:|:-:|---|
| osu! | 0 | `osu` | ppy's official calculator |
| osu!taiko | 1 | `taiko` | ppy's official calculator |
| osu!catch | 2 | `fruits` | ppy's official calculator |
| osu!mania | 3 | `mania` | ppy's official calculator |
| osu! (Relax) | 4 | `osu` + RX | [akatsuki-pp-rs](https://github.com/osuAkatsuki/akatsuki-pp-rs) |
| osu!taiko (Relax) | 5 | `taiko` + RX | akatsuki-pp-rs |
| osu!catch (Relax) | 6 | `fruits` + RX | akatsuki-pp-rs |
| osu! (Autopilot) | 8 | `osu` + AP | akatsuki-pp-rs |

IDs follow bancho.py: Relax is the mode + 4 and Autopilot the mode + 8 (osu!mania has no Relax).
Relax and Autopilot have their own leaderboards, stats and rankings, ranked by pp, and lazer plays
with those mods count towards them too. Their pp comes from the `pp-sidecar` when you route them to
it (see [pp reworks](/features/pp-reworks)). Custom lazer rulesets aren't supported yet.

## Core features

- Login and in-game registration, one account for stable, lazer and the website.
- Score submission and leaderboards (global, selected mods, friends, country), with replays.
- Chat: channels, PMs, away messages, friends-only PMs, friends shared with lazer and the website.
- BanchoBot with `!` commands, and an [IRC server](/features/irc) on port 6667 for IRC clients and
  [bots](/features/bots).
- Multiplayer: lobby, rooms, the full match lifecycle, `!mp` commands, match history on the website.
- [Spectating](/features/spectating), on stable and (through ppy's spectator server) on lazer.
- lazer: multiplayer, playlists, the daily challenge and Ranked Play.
- The website: osu-web with TomYum's changes.
- [Custom beatmaps](/features/custom-beatmaps): uploaded from the staff panel or submitted from
  either game's editor, next to the official ones.
- osu!direct, favourites, screenshots, in-game comments, star ratings with mods.
- Beatmap hype and nominations on the website, with a [BN Management site](/features/qat) if you
  want one.
- [Achievements](/features/achievements) (medals) under osu!'s own ids.
- Rank history for every mode, seasonal backgrounds from the admin panel.
- Moderation: restrictions, silences, a chat log, score removal and staff panels on the website.
- Anti-cheat hooks: hardware and client hash checks and alt detection. Replay checks can be added as
  a plugin.
- [Plugins](/operations/plugins): compiled `.dll` or loose `.cs`, with events, commands and HTTP
  routes.

## Running it

- [pp reworks](/features/pp-reworks) from the admin panel, and an updater for the pp libraries.
- Metrics for Prometheus (the `tomyum-metrics` plugin) and a watchdog that sends alerts by Discord DM
  ([monitoring](/operations/monitoring)).
- [Nightly backups](/operations/backups).
- Database migrations that run by themselves when the server starts.
- A changelog on the website, made from the repositories' history on every deploy.
- Email support tickets in the staff panel ([tickets](/features/tickets)).
- Docker Compose for production; k8s and k3s scaffolding under `deploy/`.

## Not done yet

Custom medals, online state shared between several TomYum instances (so bancho runs as one copy),
and object storage (files live on a Docker volume). The [roadmap](/reference/roadmap) has the
details.
