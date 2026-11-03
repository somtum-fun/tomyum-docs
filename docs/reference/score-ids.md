# Score ids

TomYum keeps scores in two places, numbered separately:

- **Vanilla scores** (no Relax or Autopilot) are the website's own (osu-web's `scores` table), with
  the website's ids, like on osu!.
- **Relax and Autopilot scores** are TomYum's (its `scores` table, modes 4-6 and 8), with TomYum's ids.

Both count up from 1, so the same number is usually two different plays. Every place that takes a score
id tells the two apart with a prefix in the path or an offset added to TomYum's id. **A bare number
always means a vanilla score**: a tool that strips the prefix or offset off a Relax play's id will find
someone else's vanilla score, with no error.

## On the website and API v2

| Play | Page | API v2 | Id in API v2's JSON |
|---|---|---|---|
| Vanilla | `/scores/{id}` | `/api/v2/scores/{id}` | `{id}` |
| Relax / Autopilot (stable) | `/scores/rx/{id}` (Autopilot too) | `/api/v2/scores/rx/{id}` or `/api/v2/scores/{id + 1000000000000}` | `id + 1000000000000` |
| Relax / Autopilot (lazer) | `/scores/rx/{id}` | `/api/v2/scores/{website id}` | the website's id (lazer matches its replay by it) |

`/scores/ap/{id}` is the same as `/scores/rx/{id}`. Replays: add `/download` to any of these.
The offset is `TomYumModeScores::ID_OFFSET` in osu-web.

Lists already give ids that work for lookups. A player's Relax/Autopilot lists come from
`/api/v2/users/{user}/scores/{type}` with `mode=osurx`, `taikorx`, `fruitsrx` or `osuap` (what lazer
sends), or with the ruleset as `mode` and the same name as `variant`. A beatmap's Relax/Autopilot
leaderboard is `/api/v2/beatmaps/{id}/scores` with `mode=osurx` (and so on), or with `variant=rx` or
`variant=ap` next to the ruleset.

## In bancho.py's v1 API

With the [tomyum-bpy-api](https://github.com/somtum-fun/tomyum-bpy-api) plugin, scores look like
bancho.py's: vanilla scores keep the website's id, and Relax/Autopilot scores get TomYum's id plus
**10000000000** (its `modeScoreIdOffset` setting; mode 4-8 in the score). `/get_score_info` and
`/get_replay` also take the website's form (`id + 1000000000000`), so an id copied from API v2 works
there too. API v2 doesn't take the bancho.py form.

| Relax play with TomYum id `62184` | Website / API v2 | bancho.py v1 API |
|---|---|---|
| `62184` | vanilla score 62184 | vanilla score 62184 |
| `rx/62184` | the Relax play | — |
| `10000062184` | not found | the Relax play |
| `1000000062184` | the Relax play | the Relax play |
