# stable

Today's osu!stable client connects to a TomYum server with its `-devserver` option. Nothing needs
patching.

## Connecting

Make a shortcut to `osu!.exe` with the target:

```
"C:\...\osu!\osu!.exe" -devserver example.com
```

The client then talks to `c.example.com` (bancho), `osu.example.com` (`/web/*`), `a.example.com`
(avatars), `b.example.com`, `assets.example.com` and so on, over HTTPS. All of them must be set up
([Domains, DNS and Caddy](/guide/domains)).

Players can register from the client, or on the website: it's one account either way.

::: tip
Sign out of an official osu! account in that client first: its login would be sent to your server.
:::

## What works

- Login, in-game registration, chat, PMs, friends (shared with lazer and the website).
- Score submission and leaderboards: global, selected mods, friends and country, with replays.
- Relax and Autopilot on their own leaderboards.
- Multiplayer, with `!mp` commands and match history on the website.
- [Spectating](/features/spectating), and the tournament client.
- osu!direct (search, downloads, this server's [custom beatmaps](/features/custom-beatmaps)),
  favourites, screenshots, in-game comments, map ratings, star ratings with mods.
- Beatmap submission from the editor.
- [Medals](/features/achievements).

## BanchoBot commands

`!help` lists the commands a player can use. Some of them:

| Command | Who | What |
|---|---|---|
| `!help` | everyone | the command list |
| `!roll [max]` | everyone | a random number |
| `!version` | everyone | the server's version |
| `!report <player> <reason>` | everyone | report a player to staff |
| `!irc` | everyone | an IRC password, without website accounts ([IRC](/features/irc)) |
| `!mp <start\|abort\|countdown\|host\|kick\|invite>` | in a room | multiplayer room commands |
| `!map <rank\|love\|qualify\|unrank\|reset> [set\|map]` | BNs | change the status of the map from `/np` |
| `!setpriv <user> <role>` | staff | give a staff role |
| `!restrict`, `!unrestrict <user> <reason>` | staff | restrict a player, or lift it |
| `!silence <user> <10m\|1h\|1d\|1w> <reason>`, `!unsilence` | staff | silence a player, or lift it |
| `!alert <message>`, `!alertu <user> <message>` | staff | a notification to everyone, or one player |
| `!alts <user>`, `!verify <user>` | staff | accounts sharing a device; verify an account by hand |

`/np` to BanchoBot answers with the map, its status and pp at 95–100%.
[Plugins](/operations/plugins) can add their own commands.

## Device verification

TomYum can do what osu! does: a login from a **new device** is refused until the player confirms it
on the website (`osu.example.com/p/verify`). An account's first device is trusted. It's off by
default; turn it on in `tomyum.env`:

```ini
TOMYUM_CLIENTVERIFICATION__ENABLED=true
```

Only builds from b20151228 on can be asked to verify. Older builds follow
`TOMYUM_CLIENTVERIFICATION__OLDCLIENTS` (`Unverified`, the default, lets them in without the check).
If you want original old builds on your server, leave verification off: see
[old clients](/clients/old-clients#device-verification).

## The tournament client

osu!'s tournament client logs in once per window, all with the same account. Those windows are extra
sessions: they don't replace the player's own game, aren't listed as players, and get no channels,
PMs or login announcement. A window follows a match's state and its `#multiplayer` chat, and
spectates players like a game does, so each window shows its own player.

The tournament client starts its windows by itself, **without** `-devserver`, so they connect to
osu!'s servers unless the player's network sends them to yours. See
[tournaments](/features/tournaments#osu-stable) for how players set that up.

## Bots

Bot accounts can't log in to the game: they're refused with a message telling them to use IRC. See
[bots](/features/bots).
