# Achievements

TomYum awards osu!'s **medals** for stable plays, under osu!'s own medal ids and rules. They're the
same medals the website shows and ppy's score processor awards for lazer plays. When a stable play
earns one, the client pops it up, and it's recorded on the account and the website.

## Which medals, and who awards them

| Medals | Stable plays | lazer plays |
|---|---|---|
| Skill (pass / full combo, per ruleset and star tier), mod introduction | TomYum | ppy's score processor |
| Combo (500 / 750 / 1000 / 2000) | TomYum | (stable only, as on osu!) |
| Beatmap packs, challenge packs, spotlights, Project Loved | TomYum | TomYum |
| Statistics, rank milestones, daily challenge | the processor | the processor |

The rules are osu!'s:

- **Skill medals** judge the map's star rating in the ruleset played, with the play's mods. Only
  ranked or approved maps; no difficulty reduction (EZ, NF, HT, SO), automation (RX, AP) or unranked
  mods; in mania no key or co-op mods. osu! has 9★ and 10★ tiers too.
- **Combo medals**: every milestone the play reached.
- **Mod introduction**: the play used exactly that mod (Nightcore and Perfect include the mod they
  build on).
- **Pack medals**: every set of the pack passed. A pack only counts once the server has **all** of
  osu!'s pack, since a set the server doesn't have can't be passed.

No medals for Relax or Autopilot plays, failed plays, maps without a leaderboard, or restricted
players.

## The website's catalog

At startup TomYum writes osu!'s full medal list into the website (`osu_achievements`), read from
osu.ppy.sh. Offline, it writes its own medals instead and tries again at the next start. Local
beatmap packs are numbered from 20000, so ppy's processor never mistakes one for an osu! pack.

Unlocks go to the website through InterOp, which adds the "unlocked the … medal" activity entry and
notification ([the website](/guide/osu-web#interop)).

## Medal icons

`assets.<domain>/medals/client/{file}.png` serves the icons: fetched from ppy's CDN on first use and
cached under `data/assets/medals/client/` (`TOMYUM_ASSETS__CACHEPATH`, default `data/assets`). Both
the stable client and the website load them from there (`USER_ACHIEVEMENT_ICON_PREFIX`, set by the
production compose file).

## Storage

TomYum's own unlocks are in its `user_achievements` table; the website's in `osu_user_achievements`.

Custom medals aren't in TomYum-OSS yet (somtum.fun's TomYum has them).
