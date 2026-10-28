# What is TomYum?

TomYum is an open-source private server for the rhythm game osu!, written in C# on .NET 10. One
TomYum server takes the osu!stable client, the osu!lazer client and many older stable builds, all on
the same accounts and leaderboards.

This site is about **TomYum-OSS**, the open source version, and is written for people who want to run
their own server with it.

::: info somtum.fun runs a modified TomYum
[somtum.fun](https://somtum.fun) runs its own, modified version of TomYum-OSS, with changes and plugins
that are only for somtum.fun (such as its Discord bot and anti-cheat). New features often reach
somtum.fun first and TomYum-OSS later. So something you see on somtum.fun may not be in TomYum-OSS yet, or
may never be. These docs only describe what's in TomYum-OSS.
:::

::: warning Not affiliated with ppy
TomYum is a fan project. It isn't affiliated with or endorsed by ppy Pty Ltd, and "osu!" is ppy's
trademark. Run your server under your own name and branding.
:::

## How it fits together

TomYum isn't one program on its own. A full server is a small stack, run with Docker Compose:

| Part | What it does |
|---|---|
| **TomYum** (`server`) | The game server: bancho for stable, `/web/*.php`, score submission, osu!direct, IRC, custom beatmaps, the admin API the website's staff panels use. |
| **osu-web** | The website: profiles, rankings, beatmap pages, forums, and the `/api/v2` and OAuth that lazer logs in with. It's ppy's Laravel site with TomYum's changes ([osu-web-tomyum](https://github.com/somtum-fun/osu-web-tomyum)). |
| **ppy's services** | The score processor (lazer pp and stats), the spectator server (lazer multiplayer, spectating and presence), the score indexer and the notification server. |
| **MySQL, Redis, Elasticsearch** | Storage, shared by everything above. |
| **Caddy** | Splits requests between TomYum, osu-web and the spectator server by host name. |

TomYum and the website share **one account system**: an account made on the website logs into the
game, and an in-game sign-up shows up on the website. Every vanilla score is copied to the website,
so profiles, rankings and beatmap leaderboards fill up as people play.

## Status

TomYum is at version `0.7.0` (`0.5.0` was its first stable release). The
[roadmap](/reference/roadmap) lists what's left before `1.0.0`: scaling, object storage, and taking the
remaining somtum.fun-specific choices out of the code.

## Where to go next

- See what it can do: [Features](/guide/features).
- Check you have what it needs: [Requirements](/guide/requirements).
- Try it on your own machine first: [Try it locally](/guide/local-testing).
- Put it online: [Production with Docker Compose](/guide/production).

## Thanks

TomYum is heavily inspired by [bancho.py](https://github.com/osuAkatsuki/bancho.py), and learned from
[BanchoNET](https://github.com/NovemoG/BanchoNET), [Sunrise](https://github.com/SunriseCommunity/Sunrise),
[g0v0-server](https://github.com/GooGuTeam/g0v0-server), [rosu-pp](https://github.com/MaxOhn/rosu-pp),
and ppy's own open-source [osu!](https://github.com/ppy/osu) and
[osu-server-spectator](https://github.com/ppy/osu-server-spectator).

TomYum is MIT licensed ([LICENSE](https://github.com/somtum-fun/TomYum-OSS/blob/main/LICENSE)).
