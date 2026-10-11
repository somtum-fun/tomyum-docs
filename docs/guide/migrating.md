# Moving from bancho.py

There's **no importer for a bancho.py database** yet. TomYum was built after bancho.py and keeps
several of its conventions, so some things carry over in spirit, but moving a bancho.py server means
writing your own copy of its players and scores for now.

## What lines up

- **Passwords.** bancho.py and TomYum (and osu-web) all store `bcrypt(md5_hex(password))`, so existing
  password hashes can be kept: nobody has to reset.
- **Mode ids.** Relax is the mode + 4 and Autopilot the mode + 8, as in bancho.py.
- **Safe names.** TomYum's safe name is bancho.py's: lower case, spaces as underscores.
- **Restrictions.** Restricted works like bancho.py's: the player still logs in, but is hidden from
  others and off the leaderboards.
- **bancho.py's v1 API.** Tools and bots that use it can keep working with a plugin that serves it on
  `api.<domain>` and `osu.<domain>/bpy-api/` (the production Caddyfile already routes both to
  TomYum). That plugin isn't part of TomYum-OSS.

## What doesn't

- **Medal ids.** TomYum used bancho.py's medal numbers until 2026-09-28 and now uses osu!'s own ids
  ([achievements](/features/achievements)).
- **Where accounts live.** With the website, accounts are in osu-web's `phpbb_users`, not in a
  `users` table of TomYum's own.

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

The plan lists one action per player:

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
