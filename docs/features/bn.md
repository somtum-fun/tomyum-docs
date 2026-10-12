# Beatmap Nominators and NAT

Ranking maps on your server works like on osu!: Beatmap Nominators (BN) nominate, the Nomination
Assessment Team (NAT) looks after the BNs and the ranking rules, and a set ranks after its time in
qualified. All of it is **built into the website**
([osu-web-tomyum](https://github.com/somtum-fun/osu-web-tomyum)) and TomYum: there is nothing extra to
install.

## Giving someone BN or NAT

Website admin panel → **Groups**, then add the player with the modes they nominate in:

| Group | Who |
|---|---|
| `bng` | Beatmap Nominators |
| `bng_limited` | Probationary BNs: they nominate on the website only |
| `nat` | Nomination Assessment Team |

The change is live straight away, in the game too. Staff can also use `!setpriv` in game
([bots](/features/bots)).

## Nominating on the website

Beatmap pages work as on osu!: BNs **nominate** a set from its discussion page, the set becomes
**qualified** once it has enough nominations, and anyone with the right can **disqualify** it or reset
the nominations with a problem. A qualified set **ranks** by itself after its qualified period.
The rules are settings in `osu-web.env`:

| Setting | Default | What |
|---|---|---|
| `BEATMAPSET_REQUIRED_NOMINATIONS` | `2` | Nominations a set needs to qualify |
| `BEATMAPSET_MINIMUM_DAYS_FOR_RANK` | `1` | Days a set stays qualified before it ranks |
| `BEATMAPSET_RANK_PER_DAY` | `0` | At most this many sets rank a day (`0`: no limit) |
| `BEATMAPSET_RANK_PER_RUN` | `0` | At most this many sets rank each time the job runs (`0`: no limit) |

Sets imported from osu! that are in the graveyard or WIP can be **opened for nominations** by a BN,
the NAT or an admin, from the set's page.

## The BN panel

Staff panel → **BN** (`/panel/bn`), for BNs, the NAT and admins:

- **Import** sets from osu! by id, link or in bulk, and follow the import jobs.
- **Upload** a custom `.osz` ([custom beatmaps](/features/custom-beatmaps)).
- **Sets**: look up any set, refresh it from osu!, change its status, set its nominators, or attach a
  Featured Artist track. Full BNs can set every status except ranked and approved; the NAT and admins
  can set all of them. Every change is in the staff log, and announced by the bot.

Related staff pages:

- **Kudosu** (`/panel/kudosu`): admins and developers can give or take kudosu by hand.
- **Beatmap packs** (admins and the NAT): see [the website](/guide/osu-web#beatmap-packs).
- **Project Loved**: players ask for maps and the Loved team decides ([Loved](/features/loved)).

## BN applications and evaluations

The website has no built-in BN application or evaluation flow: give and take BN with the groups above,
and run applications however suits your community (a forum thread, a form, Discord).

osu!'s own tool for this, [pishifat/qat](https://github.com/pishifat/qat), only talks to osu.ppy.sh. It
can be adapted to a private server (its sign-in, group ids and API address), but that's your own
project: TomYum-OSS doesn't ship or support a qat fork.
