# Custom rulesets

Custom osu!lazer rulesets from [rulesets.info](https://rulesets.info) (sentakki, tau, Rush!, ...) can have
their own leaderboards and rankings, **by score** (there's no pp for them). Staff choose which ones count.

## How it works

1. **Staff turn a ruleset on** in the website's admin panel, **Custom rulesets** (admins). The page lists
   rulesets.info's rulesets. Turning one on **pins** its release as it is now: a GitHub "latest" link is
   resolved to the release it points at, and the DLL's address, SHA-256 and size are kept
   (`tomyum_custom_rulesets`). Each gets the ruleset id its scores are stored with: 10 and up (sentakki,
   tau, Rush!, hishigata and soyokaze keep the ids 10-14 other servers use).
2. **Players install it** from the client's settings (TumThai: **Settings > General > Custom rulesets**),
   which downloads exactly the pinned file, or put the DLL in the client's `rulesets` folder themselves.
   `GET /api/v2/tomyum/rulesets` (signed in) lists the rulesets turned on, with their files.
3. **A play submits only on the pinned file.** The client sends the ruleset's id and its DLL's SHA-256 with the
   score token (`ruleset_hash`); anything else is refused with "update it in Settings". Plays are on osu!
   maps (custom rulesets convert them). The score is the website's own (`scores.ruleset_id` 10 and up): its
   mods are kept as the client sent them, a play with an automation mod (Autoplay, Cinema, Relax,
   Autopilot) isn't ranked, and the usual play-length check applies.
4. **Leaderboards**: `GET /beatmaps/{id}/scores?mode=<slug>` gives each player's best by score (global,
   country, friends, team), for lazer and for the beatmap page, which has an **Other rulesets…** dropdown on
   osu! maps.
5. **Rankings**: `/rankings/rulesets/{slug}` ranks players by ranked score (their best on each ranked map,
   added up), worldwide or in one country. The rankings' mode selector has a **…** menu for them.

6. **Profiles**: the profile's ruleset bar has a **…** menu for them; each shows the player's rank, ranked
   score and plays in that ruleset, with Vanilla / Relax / Autopilot boards.
7. **Mods**: `GET /_admin/custom-rulesets/mods?url={the pinned DLL}&sha256={its hash}` lists the mods a player
   can pick in the ruleset (`[{acronym, name, type}]`), for the boards' mod filters and whether the ruleset has
   Relax/Autopilot boards. TomYum loads the pinned DLL on its own (osu!'s libraries are the server's) and keeps
   the answer by its hash.

## In the API

The website's osu! API (v2) takes a ruleset's slug where it takes a ruleset name: `GET /users/{user}/{slug}` and
`/me/{slug}` (that ruleset's statistics, plus `custom_ruleset`), `GET /users/{user}/scores/{type}?mode={slug}`,
`GET /beatmaps/{id}/scores?mode={slug}` and `GET /rankings/{slug}/score`, each with `variant` (`vanilla`,
`relax`, `autopilot`). A custom ruleset's score has `ruleset_id` 10 and up and `custom_ruleset`
(`{id, slug, name}`); in the old score format its `mode` stays `osu`. The website's `/docs` page (section
Ruleset, Custom rulesets) has the details.

When the author releases a new version, **Pin again** moves to it and players update from the client's
settings. Turning a ruleset off stops new plays submitting; its scores stay.

## For plugins

`IRulesetRegistry` lists the rulesets turned on and names any ruleset. `ScoreProcessedEvent` comes for their
scores too, with `RulesetId` 10 and up. ppy's score processor leaves them alone ("Unsupported ruleset"), and
TomYum's own first places and rank #1 announcements stay with osu!'s four rulesets.

## Not (yet) supported

osu!(stable) can't play them (its mode is one byte, 0-3), and there's no multiplayer, spectating, replays or
pp for them.
