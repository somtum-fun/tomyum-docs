# Moving from bancho.py

TomYum ships an importer for bancho.py servers: `tools/ImportBanchoPy` in the TomYum repository. It
reads a copy of the old database and files and writes them into TomYum and the website, so players
keep their **accounts, ids, passwords, scores, replays, medals and friends**. It knows
[bancho.py](https://github.com/osuAkatsuki/bancho.py), [bancho.py-ex](https://github.com/osu-NoLimits/bancho.py-ex),
[kawata.py](https://github.com/kawatapw/kawata.py) and forks of them, and tells them apart by their
tables (`--flavor` overrides).

::: tip Passwords stay
bancho.py, TomYum and osu-web all store `bcrypt(md5(password))`, so the hashes are copied as they are.
Nobody resets a password.
:::

## What moves

| From bancho.py | To | Notes |
|---|---|---|
| `users` | website accounts, same ids | country, join date, last visit, supporter time that is still running; restricted players stay restricted, with the old reason; previous names (forks that keep `old_name`) stay searchable |
| `users.priv` | website groups | NOMINATOR → BN, NAT → NAT, MODERATOR → GMT, ADMINISTRATOR → admin, DEVELOPER → dev, ALUMNI → alumni, TOURNEY_MANAGER → tournament committee, HELPER → support; verified players skip the ban-evasion check; whitelisted players are whitelisted. kawata.py's finer bits are folded into the nearest group |
| `relationships` | friends and blocks | |
| `maps` played or staff-frozen | TomYum's maps, then the website's | frozen statuses (ranked, loved, pending) stay frozen; nothing is cleared |
| `scores`, same ids | TomYum's scores; vanilla copies on the website | relax (`+4`) and autopilot (`+8`) stay in TomYum; pp is recalculated with TomYum's calculators afterwards |
| `.data/osr/` | TomYum's replays | same file name and format |
| `.data/osu/` | TomYum's `.osu` cache | so the pp rework doesn't download every map again |
| `stats` | play count, ranked and total score | pp, accuracy and ranks come back from the recalculation |
| `user_achievements` | medals | matched by slug (bancho.py's `file`); a server's own medals through `php artisan tomyum:custom-medals-import` |
| `client_hashes` | known devices | each player's machines are trusted, so nobody verifies a PC they already played on |
| `logs` | the staff log | actions prefixed `bpy.` |
| `favourites`, `ratings` | favourites and ratings | for sets the website has |
| private sets (`server = 'private'`) | TomYum custom sets | uploaded again through the running server: they get ids in TomYum's custom range and their scores follow |
| clans, avatars, banners, userpages | teams, avatars, covers, userpages | `php artisan tomyum:import-bpy-media` on the website |
| forks only: `user_connections`, `ranking_history`, `beatmap_nominations` | Discord links, the rank graph, nomination history | imported when the tables exist |
| forks only: `maps.is_dan` | osu!dan courses and clears (the `tomyum.dan` plugin) | `--dan`: one course per dan difficulty, each player's best qualifying pass as their clear |

::: tip Inactivity
A server that drops inactive players from its rankings (osu!somtum: no score for 180 days) sets
`TOMYUM_RANKING__INACTIVEDAYS` for TomYum and `TOMYUM_RANKING_INACTIVE_DAYS` for the website to the same
number; 0 (the default) keeps everyone ranked. Stats stay; the player is back the moment they play.
:::

Not imported: offline mail, in-game login IPs, donation records, screenshots, API keys, and open
map requests (the website has no request queue; players hype a set again).

## Before you start

1. **Install the new server and leave it empty**: the website migrated and seeded
   (`php artisan tomyum:setup`), TomYum started **once** so it creates BanchoBot and its tables, then
   **stopped**. Stopped, because its Discord bot would announce every imported score and player.
2. **Decide BanchoBot's id.** bancho.py's bot is user 1 and gets no account (lazer shows no avatar for
   id 1). TomYum's BanchoBot is **3** by default. On most bancho.py servers id 3 is the owner, so either
   start TomYum with `TOMYUM_BANCHO__BOTUSERID=2` (and the website with `BANCHO_BOT_USER_ID=2`, the
   spectator server too) **before its first start**, so the bot takes 2 and the owner keeps 3, or move
   that player with `--remap 3=<free id>`.
3. **Copy the old data**: a `mysqldump` of bancho.py's database, its `.data/` folder (at least `osr/`
   and `osz/`) and its avatar and banner folders (bancho.py: `.data/avatars`; gukarkka's site:
   `www/avatars`, `www/assets/banners`, `www/assets/clans`).
4. Load the dump into the new server's MySQL as a database of its own, say `bpy_import`.

## Running the importer

With the production compose stack, publish the tool once and run it in a one-off `server`
container: that has the runtime, the settings, the network and the replay volume.

```sh
cd TomYum
dotnet publish tools/ImportBanchoPy -c Release -o /srv/bpy-import/tool

cd deploy/production
zcat /srv/bpy-import/dump.sql.gz | docker compose exec -T db sh -c \
  'MYSQL_PWD="$MYSQL_ROOT_PASSWORD" mysql -uroot -e "CREATE DATABASE IF NOT EXISTS bpy_import" && MYSQL_PWD="$MYSQL_ROOT_PASSWORD" mysql -uroot bpy_import'
docker compose stop server

run() { docker compose run --rm --no-deps --entrypoint dotnet \
    -v /srv/bpy-import/tool:/tool:ro -v /srv/bpy-import/data:/import/data:ro -v /srv/bpy-import/out:/app/import-out \
    server /tool/ImportBanchoPy.dll --source bpy_import --data /import/data "$@"; }

run              # the plan: counts, and anything that blocks
run --apply      # the import; about a minute per 50,000 scores
docker compose start server
run --custom-sets --server-url http://server:8080   # only if the plan listed private sets; then restart server
run --rework --server-url http://server:8080        # always: a pp rework of every mode (see below)
run --dan --server-url http://server:8080           # forks with osu!dan maps: courses and clears for the dan plugin
```

The **plan** changes nothing. It counts what would move and stops on what has to be fixed first: a
player holding BanchoBot's id, two names that differ only in case, an email on two accounts. Names
outside the website's rules (3-15 bytes, letters, digits, `_ - [ ]` and spaces) are imported as they
are and listed in `import-out/refused-names.csv`.

Each step (`users`, `groups`, `moderation`, `connections`, `friends`, `beatmaps`, `scores`, `replays`,
`stats`, `achievements`, `rank_history`, `favourites`, `hashes`, `staff_log`, `nominations`, `mirror`)
is recorded in `tomyum.bpy_import_steps`, so a run that stopped halfway continues where it was, and
`--step <name>` runs one again.

### Files and website-only things

On the website, with the old folders mounted into the container:

```sh
docker compose run --rm -v /srv/bpy-import:/import:ro artisan tomyum:import-bpy-media --database=bpy_import \
    --avatars=/import/www/avatars --banners=/import/www/assets/banners --clans=/import/www/assets/clans \
    --userpages=/import/data/user/about_me --teams
# the server's own medals, if it had any:
docker compose run --rm -v /srv/bpy-import:/import:ro artisan tomyum:custom-medals-import --database=bpy_import \
    --icons=/import/www/assets/medals --by=<staff user id>
```

Clans become teams (the owner leads, members join, the clan avatar is the flag), avatars and banners
go through the website's image processing (banners are cropped to 4:1), and userpages become the
players' pages.

### pp, ranks and search

**Always end an import with a pp rework.** The old server's pp came from another calculator, so
`--rework` starts a TomYum [pp rework](/features/pp-reworks) of every mode on the running server:
every passed score is worked out again, then bests, totals, the website's copies and ranks follow,
and the rankings are paused until it is done (the admin panel shows the progress). pp moves a
little; say so when you announce the move. Then the search index:

```sh
cd deploy/production
docker compose run --rm artisan es:index-scores:set-schema --schema scores_1   # a fresh website only
docker compose exec score-indexer score-indexer index alias scores_1          # idem
docker compose run --rm artisan es:index-documents                            # players, beatmaps, teams
docker compose run --rm artisan es:index-scores:queue --all -n                # the scores
```

## Afterwards

Check with a staff account: logging in on the website, in stable and in lazer with an old password;
the owner's and BanchoBot's profiles; a ranked map's leaderboard and a replay download; a relax
leaderboard; staff-frozen statuses on the website and in osu!direct; medals; friends; a restricted
player off the rankings; a known PC logging in without verifying.

Keep the old server in maintenance mode for a couple of weeks and the final dump for good. The import
only adds rows to an empty server: to start over, wipe the new one and run it again. Never patch a bad
import by hand.

## Moving an older TomYum server to the website

If you ran TomYum **without** the website and want to switch to website accounts,
[`tools/MigrateToOsuWeb`](https://github.com/somtum-fun/TomYum-OSS/blob/main/tools/MigrateToOsuWeb/README.md)
does it, **before** the server first runs with `TOMYUM_DATABASE__OSUWEBNAME` set. A fresh server
doesn't need it.

It:

1. turns every TomYum player into a website account with the same name, email, password, country,
   join date and staff rights (or links them to an existing website account with the same name **and**
   email);
2. moves TomYum's scores, stats and medals to the website's user ids, in one transaction;
3. copies beatmaps, vanilla scores, per-mode stats and ranks to the website, and queues the scores
   for the website's score indexer.

Stop TomYum and **back up both databases** first. Then, from the repository root:

```bash
export TOMYUM_DATABASE__OSUWEBNAME=osu      # plus the usual TOMYUM_DATABASE__* settings

dotnet run --project tools/MigrateToOsuWeb                    # dry run: shows the plan, changes nothing
dotnet run --project tools/MigrateToOsuWeb -- --apply         # do it
```

Then set `TOMYUM_DATABASE__OSUWEBNAME` for the server too and start it.

| Action | Meaning |
|---|---|
| `Create` | A new website account for this player. |
| `Link` | The website already has this player (same name and email); their data joins that account. |
| `Drop` | Not moved; their scores, stats and medals are deleted. The Development seed user is always dropped. `(no account)` rows are ids with data but no account. |
| `Conflict` | The name or the email belongs to a *different* website account. Rename one side and run again. |

It refuses to apply while there are conflicts, and while there are `(no account)` ids unless you add
`--drop-unmapped` (which deletes that data).

::: warning Order matters
If the server already recorded plays with website accounts, TomYum's tables mix old and new ids and
can't be sorted out: the tool notices and refuses. Restore the backup from before the switch and run
it on that. The tool is safe to run again if it stops halfway.
:::

Relax and Autopilot scores stay in TomYum's tables (with their user ids renumbered).
