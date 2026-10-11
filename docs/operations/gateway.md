# Gateway

Old osu! builds (up to b20130802.1) talk to bancho over a raw TCP socket, and IRC is raw TCP too.
Cloudflare only proxies HTTP(S), so anything taking raw TCP shows its real address to the world, and
an attack on those ports hits the whole server.

**TomYum.Gateway** ([`services/TomYum.Gateway`](https://github.com/somtum-fun/TomYum-OSS/tree/main/services/TomYum.Gateway))
moves those ports to another machine. It accepts the connections and carries each one's bytes to the
main server over a WebSocket through Cloudflare (HTTPS):

- **Bancho over TCP** (`server.<domain>`, port 13381) → `/_gateway/bancho` on the main server, where
  it's a TCP bancho session like one on the server's own ports.
- **IRC** (`irc.<domain>`, port 6667) → `/_gateway/irc`, an ordinary [IRC](/features/irc) session.

## Two ways to host TCP

| | One server | Gateway on its own box |
|---|---|---|
| What runs | TomYum's own TCP bancho and IRC | `deploy/gateway` there; TomYum's TCP bancho and IRC listeners off |
| DNS (DNS only, not proxied) | `server.<domain>` and `irc.<domain>` → the server | `server.<domain>` and `irc.<domain>` → the gateway box |
| If those ports are attacked | the whole server is hit | only old clients and IRC go down; the main server's address is never shown |

### One server

In `deploy/production/.env`:

```ini
TCP_BANCHO=true
TCP_BANCHO_BIND=0.0.0.0   # the ports are only on 127.0.0.1 otherwise
```

Then `docker compose up -d`, and open TCP 13380-13384 (and 6667 for IRC).

### Gateway on its own box

The gateway and the main server share a secret, `GATEWAY_KEY`. With it, the gateway passes on each
player's address (`X-TomYum-Gateway-Ip`), and the main server uses that for login IPs, countries and
limits instead of the gateway's own (and ignores Cloudflare's `CF-IPCountry`, which would be the
gateway's country). Without the key, that header is dropped and `/_gateway/*` answers 404.

1. On the main server, set `GATEWAY_KEY` in `deploy/production/.env` (`openssl rand -hex 32`), leave
   `TCP_BANCHO=false`, and `docker compose up -d server`. To hand IRC to the gateway too, set
   `TOMYUM_IRC__ENABLED=false` in `tomyum.env`, and remove the `6667` port from the `server` service.
2. On the gateway box, with a TomYum-OSS checkout:

   ```bash
   cd deploy/gateway
   cp gateway.env.example gateway.env    # set the domain and the same key
   docker compose up -d --build
   ```

3. DNS (not proxied): `server.<domain>` and `irc.<domain>` → the gateway box. Open TCP 13381 and 6667
   there. Nothing else is exposed: `/health` is on `127.0.0.1:8081`.
4. Through Cloudflare, all old-client traffic now comes from the gateway box's one address: add a WAF
   skip rule (rate limiting, bot fight mode) for that address on `c.<domain>`.

## Settings

In `gateway.env`, as `TOMYUM_GATEWAY__<name>`:

| Setting | Default | |
|---|---|---|
| `DOMAIN` | (required) | The main server's domain |
| `KEY` | (required, secret) | The shared secret: `GATEWAY_KEY` on the main server |
| `UPSTREAM` | `https://c.<domain>` | Where the main server is, e.g. over a private network |
| `MAXCONNECTIONSPERIP` | `8` | Connections at once from one address, per service |
| `BANCHO__ENABLED` / `BANCHO__PORTS__0` | `true` / `13381` | More ports: `BANCHO__PORTS__1=13382`, … |
| `IRC__ENABLED` / `IRC__PORT` | `false` / `6667` | IRC (`gateway.env.example` turns it on) |

The host ports can be changed in the gateway's `.env` with `GATEWAY_BANCHO_PORT`, `GATEWAY_IRC_PORT`
and `GATEWAY_HEALTH_PORT`.

::: tip
The client side still needs builds that connect to `server.<domain>`. Titanic! Hook's
`HookTcpConnections` and patched clients are covered on [old clients](/clients/old-clients).
:::
