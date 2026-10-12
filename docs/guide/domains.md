# Domains, DNS and Caddy

The osu! clients split their traffic across many subdomains of one domain, and TomYum routes by
subdomain. With the domain `example.com`, players start stable with `-devserver example.com` and the
website is `osu.example.com`.

## The subdomains

The production [Caddyfile](https://github.com/somtum-fun/TomYum-OSS/blob/main/deploy/production/Caddyfile)
answers these. Each needs a DNS record and, behind the Cloudflare Tunnel, a public hostname with the
service `http://caddy:80`.

| Host | Goes to | What for |
|---|---|---|
| `osu.` | osu-web, and TomYum for the game's paths | The website and `/api/v2`; stable's `/web/*`, `/d/*`, in-game sign-up, screenshots, beatmap submission |
| `c.`, `ce.`, `c4.`, `cho.` | TomYum | Bancho (stable's login and polling) |
| `c1.` – `c6.` | TomYum | osu!'s other bancho hosts, used by some builds |
| `a.` | osu-web's uploads | Avatars (`a.example.com/<user id>`) |
| `b.` | TomYum | Beatmap thumbnails and audio previews |
| `assets.` | TomYum | Medal icons and profile badges (cached from ppy's CDN, plus your own) |
| `s.` | TomYum | Old builds' static host (medal images, thumbnails, avatars) |
| `spectator.` | the spectator server | lazer's multiplayer, spectating and presence |
| `api.` | TomYum | bancho.py's v1 API, when a plugin provides it |

Optional, and **not** through the tunnel (raw TCP, so DNS only, not proxied):

| Host | Port | What for |
|---|---|---|
| `irc.` | 6667 | [IRC](/features/irc) |
| `server.` | 13380-13384 | TCP bancho for builds up to b20130802.1 ([old clients](/clients/old-clients), [gateway](/operations/gateway)) |

You can add more subdomains of your own (a status page, a BN tool); the tracked Caddyfile doesn't
answer them.

## How `osu.` is split

| Request | Goes to |
|---|---|
| `/web/*`, `/d/*`, `/beatmap-submission/*`, `/ss/*`, `/difficulty-rating`, `/release/*`, `/rating/*`, `/bpy-api/*` | TomYum |
| `POST /users` from the stable client (`User-Agent: osu!`, not asking for JSON) | TomYum (in-game registration) |
| `/signalr/*` | the spectator server (lazer's hubs when it derives them from the API URL) |
| `/uploads/default/beatmaps/<8+ digit id>/…` | TomYum (custom sets' covers and preview) |
| other `/uploads/default/beatmaps/<id>/covers/…` | redirected to `assets.ppy.sh` |
| `/_lio/*` | refused (404): the website's InterOp API is for the compose network only |
| everything else | osu-web |

Request bodies on `osu.` may be up to 110 MB, for beatmap set uploads (Cloudflare's own limit is
100 MB). On the game hosts the limit is 20 MB.

## Cloudflare settings

- **Real addresses.** Caddy trusts the tunnel and reads the player's address from `Cf-Connecting-Ip`,
  and TomYum takes the country from `CF-IPCountry` (with a local database as a fallback).
- **Old clients need plain HTTP.** Builds before late 2015 talk plain HTTP and don't follow
  redirects. The Caddyfile serves the game's hosts on `http://`; Cloudflare must not redirect them
  either: turn off "Always Use HTTPS", or add a rule exempting the game's hosts.
- **TCP can't go through the tunnel.** IRC and TCP bancho need their own DNS-only records, an open
  port, or [TomYum.Gateway](/operations/gateway) on another machine.

## Without Cloudflare

The tracked compose file assumes the tunnel: its Caddy has automatic HTTPS off and isn't published on
the host. To run without the tunnel you need something in front that ends HTTPS for all the hosts
above and passes the requests to the stack's Caddy, for example by publishing the `caddy` service's
port 80 to `127.0.0.1` in a `docker-compose.override.yml` and putting a TLS-terminating proxy on the
host. Keep the `http://` hosts reachable without a redirect if you want old clients.

[`deploy/caddy/Caddyfile`](https://github.com/somtum-fun/TomYum-OSS/blob/main/deploy/caddy/Caddyfile)
is an older, simpler edge example (TomYum and osu-web on `localhost`, Caddy getting its own
certificates). It doesn't cover lazer or old clients; use the production Caddyfile as the reference
for routes.

## Locally

[`deploy/caddy/Caddyfile.local`](https://github.com/somtum-fun/TomYum-OSS/blob/main/deploy/caddy/Caddyfile.local)
serves the same hosts for `localtest.me` with Caddy's own certificate authority. See
[Try it locally](/guide/local-testing).
