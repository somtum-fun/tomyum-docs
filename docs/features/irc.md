# IRC

TomYum has an IRC server like osu!'s: chat and bots from any IRC client, in the same channels and
PMs as the game, the website and lazer.

## Connecting (for players)

1. Get your IRC key from the website: account settings → *Legacy API* → *irc*
   (`/home/account/edit#legacy-api`). Deleting it there and making a new one changes it.
   (A server without website accounts gives one with `!irc` to BanchoBot instead.)
2. In your IRC client: server `irc.<domain>`, port **6667**, no TLS, nick = your username with `_`
   for spaces, server password = the IRC key.
3. `/join #osu` (or any channel). PMs to players and to BanchoBot (`!help`) work as in the game.

One session per player: while you're in the game, IRC refuses you, and logging into the game ends
your IRC session. Restricted players can't use IRC. Silences apply as in the game.

## How it works

Each IRC connection is an ordinary online session. What an IRC user says goes through the game's own
chat handlers, so channels, BanchoBot commands, silences, the chat log and the website and lazer chat
all apply. Players in the game see IRC users like anyone else.

## Making it reachable

IRC is raw TCP, which Cloudflare's proxy and tunnel don't carry. The production compose file opens
port 6667 on the machine (`IRC_PORT` in `.env` changes the host port). For players elsewhere, either:

- point a DNS-only (not proxied) record for `irc.<domain>` at the machine, forwarding the port if it's
  behind a router; or
- add `irc.<domain>` as a TCP public hostname of the tunnel (to `tcp://server:6667`), and have players
  run `cloudflared access tcp --hostname irc.<domain> --url localhost:6667` and connect their client
  to `localhost:6667`; or
- run [TomYum.Gateway](/operations/gateway) on another machine and point `irc.<domain>` there: it
  carries IRC to TomYum over HTTPS, so your main server's address isn't shown.

## Settings

In `tomyum.env`:

| Setting | Default | |
|---|---|---|
| `TOMYUM_IRC__ENABLED` | `true` | Whether the IRC server runs |
| `TOMYUM_IRC__PORT` | `6667` | The port inside the container |
| `TOMYUM_IRC__SERVERNAME` | `irc.<domain>` | The server's name in replies |

Chat bots use IRC too: see [bots](/features/bots).
