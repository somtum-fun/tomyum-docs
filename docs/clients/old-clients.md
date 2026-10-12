# Old clients

TomYum speaks the protocols of osu!stable builds back to 2008 (b337), and their scores go on the
**same leaderboards** as today's stable. Old-client support is finished: the 2008–2013 builds that talk
raw TCP have been played with login, score submission, spectating and the rest working, and late 2013 to
2015 builds use HTTP bancho as today's client does.

::: tip Today's beatmaps on old builds
Old builds can't read every part of today's `.osu` files (newer sections, osu!mania before 2012, and
so on). Players who want today's maps to load properly can use the
[somtum-fun/hook](https://github.com/somtum-fun/hook) fork of Titanic! Hook instead: it rewrites only
what that build can't read as each map loads, and adds Relax/Autopilot fixes for old builds. It's set up
the same way as below.
:::

## For players: Titanic! Hook

Builds before 2016 have no `-devserver` option. Players connect them with
[Titanic! Hook](https://github.com/osuTitanic/hook), a loader from the osuTitanic project that
redirects the game's `ppy.sh` addresses to your server in memory, without changing any game files.

1. Get a build from [Osekai Snapshots](https://osekai.net/snapshots/) (for example `b20140624`) and
   unpack it into its own folder. TomYum servers host no osu! files.
2. From the [Hook releases](https://github.com/osuTitanic/hook/releases), put
   **`Titanic.fallback.exe`** next to `osu!.exe`. Builds before late 2015 run on .NET 2.0 and need this
   .NET 2.0 loader: under `Titanic.exe` (.NET 4) the game runs, but every downloaded beatmap fails to
   import (they all end up in `Songs\Failed`).
3. Windows marks downloaded files, and .NET then refuses to load `osu!.exe` ("loadFromRemoteSources").
   Unblock the whole folder once, in PowerShell:
   ```powershell
   Get-ChildItem -Recurse "C:\path\to\b20140624" | Unblock-File
   ```
4. Create `Titanic!.cfg` in the same folder **before the first start** (otherwise the first start
   connects to Titanic's own server):
   ```ini
   Version=2
   ServerName=example.com
   HookTcpConnections=False
   ```
   Hook fills in the rest. `EnableConsole=True` and `LogToFile=True` show what it does.
   `HookTcpConnections=False` stops Hook looking up `server.example.com` at startup, which fails with
   "No such host is known" when there's no such record. HTTP-era builds don't need it.
5. Start the game with `Titanic.fallback.exe` and log in with a normal account.

Sign out of any official osu! account in that client first: its login is sent to your server instead.

## Supported builds

| Build | Status |
|---|---|
| `b20140624` | Tested: login, chat, online users, osu!direct (search, download, import, thumbnails), leaderboards, score submission (pp, medals, ranking screen), being spectated by today's client. Multiplayer and spectating work too. |
| Late 2013 – 2015 | Works like the above (HTTP bancho, protocol 18/19): login, chat, score submission, spectating, multiplayer. |
| `b20130823.3`, `b20130915.4` | HTTP bancho with the 2013 layouts. |
| Up to `b20130802.1` | Bancho over **raw TCP** (below), with a client patched to use `server.<domain>`. Tested: login, chat, score submission, spectating. |
| `b1122` (2011) | Tested: login, avatars, leaderboards, score submission, rating on the results screen. Titanic! Hook redirects only its TCP connection, not its web requests, so it needs a client rebuilt with your server's domain. Its osu!direct lists only the sets your server has. |
| b337 – b20130802.1 (2008 – 2013) | Played and working: login, chat, PMs, channels, friends, statuses, the online list, score submission, spectating, multiplayer and song select's beatmap info. Each protocol era is also covered by tests (`OldBanchoTests`). |

## TCP bancho (builds up to b20130802.1)

Builds before HTTP bancho talk to bancho over a raw TCP socket. Cloudflare's proxy and tunnel only
carry HTTP(S), so this needs a port on a public address. TomYum has it built in (`Bancho:Tcp`,
ports 13380-13384): the same login and packets as HTTP bancho on an open connection, queued packets
pushed as they come, and a ping after 10 seconds of quiet (old builds reconnect when bancho says
nothing for a while).

On one server, in `deploy/production/.env`:

```ini
TCP_BANCHO=true
TCP_BANCHO_BIND=0.0.0.0   # otherwise the ports are only on 127.0.0.1
```

Then `docker compose up -d`, open TCP 13380-13384, and point a DNS-only (not proxied) record for
`server.<domain>` at the machine. To keep your main server's address hidden, run
[TomYum.Gateway](/operations/gateway) on another box instead.

## What the server does for them

- **Plain HTTP.** Builds before late 2015 talk plain HTTP and don't follow redirects to HTTPS. Caddy
  answers the game's hosts (`osu.` for `/web/*` and `/release/*`, `c.`, `c1.`–`c6.`, `ce.`, `a.`,
  `b.`, `s.`) on `http://` without redirecting, and **Cloudflare must not redirect them either**
  ("Always Use HTTPS" off, or a rule exempting those hosts).
- **Per-build packets.** The login's version is kept on the session. Packets a build doesn't know are
  left out, and builds before b20140528 get multiplayer rooms with 8 slots instead of 16. Older eras
  get their own packet ids and layouts.
- **Chat.** An old build is told at login that it's in `#osu` and `#announce`: it shows their tabs
  but never asks to join them.
- **Downloads and thumbnails.** .NET 2.0 has no TLS 1.2, so these clients can't follow redirects to
  HTTPS mirrors; TomYum fetches the file and passes it on. Sets repacked in 2014 are fixed on the way
  so old osu!'s zip reader accepts them.
- **Leaderboards** in the format each build asks for, including 2008–2012's own endpoints
  (`osu-getscores2.php` … `osu-getscores6.php`).
- **Score submission** with the old keys and replies (`osu-submit-modular.php`, and `osu-submit.php` /
  `osu-submit-new.php` for b337–b904).
- **Fair shared leaderboards.** Score v1 and the mod multipliers haven't changed since 2013, so old
  scores count as they are, with three exceptions: mod bit 4 was NoVideo before 2014 and isn't taken
  as TouchDevice; Co-op is refused; and a taiko or catch pass whose judgements don't add up to the
  map's max combo (the old client converted it differently) is kept but off the leaderboard, with no pp.
- **Medal images** on `s.<domain>`, sized for the old clients.
- **Update checks** answer "no update", or the client waits on "Receiving data..." for good.
- **Diagnostics.** The server log names each packet type the first time it goes to or comes from an
  old build's session, and what an old build's frames looked like.

## Device verification

With `TOMYUM_CLIENTVERIFICATION__ENABLED=true`, a new device must be confirmed on the website before
it logs in. Bancho asks with login reply -8, which only b20151228 and later understand: every earlier
build reads an unknown refusal as a successful login, so TomYum never sends them -8. What those
builds get instead is `TOMYUM_CLIENTVERIFICATION__OLDCLIENTS`:

- `Unverified` (the default): they log in without the check. The device is recorded unverified, so a
  newer client on it is still asked.
- `Refuse`: they're refused **only when the device needs verifying** (a verified device, or an
  account's first, still gets in). The message links the website's verify page and
  `TOMYUM_CLIENTVERIFICATION__DOWNLOADSURL` (default `https://osu.<domain>/home/download`).

TomYum ships no patched clients, so to let original old builds connect, **leave device verification
off** (the default). With it on, `Refuse` turns every other old build away, and even `Unverified`
leaves their devices unconfirmed.

A patched old client can verify like today's: it adds `tomyum-verify` as a last field of its login
line (`version|utc|city|hashes|0|tomyum-verify`), is then sent -8 in its own packet ids, opens
`osu.<domain>/p/verify?u=<name>&ch=<hashes>` and retries until the device is confirmed. Making such
patched builds is up to your own client patcher; it isn't part of TomYum.

## Testing locally

[`deploy/caddy/Caddyfile.local`](https://github.com/somtum-fun/TomYum-OSS/blob/main/deploy/caddy/Caddyfile.local)
serves the plain-HTTP hosts for `localtest.me`; Hook's `ServerName` is then `localtest.me`. osu! runs
once per PC, so a second player needs another PC.

The full per-era protocol notes are in
[docs/old-clients.md](https://github.com/somtum-fun/TomYum-OSS/blob/main/docs/old-clients.md).
