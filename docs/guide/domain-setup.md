# Setting up your domain

A step-by-step walk through giving your server a domain on Cloudflare, from a fresh domain to the
game connecting. [Domains, DNS and Caddy](/guide/domains) is the reference for what each host does;
this page is the order to do things in.

Everything below uses `example.com`. Replace it with your own domain everywhere.

::: tip Which way in?
There are two ways to get traffic from Cloudflare to your machine. Pick one before you start:

- **A. Cloudflare Tunnel** (what the tracked compose file ships with): no open web ports on the
  machine; `cloudflared` carries the requests out to Cloudflare. Easiest, and the machine's address
  stays hidden.
- **B. Proxied DNS records + an Origin Certificate**: the machine has ports 80 and 443 open, and a
  Caddy on the host ends HTTPS with a certificate from Cloudflare. Use this if you'd rather not run
  the tunnel, or need plain HTTP for [old clients](/clients/old-clients) on every game host.

Steps 1, 2, 5, 6 and 7 are the same for both.
:::

## 1. Get a domain and add it to Cloudflare

1. Buy a domain from any registrar. Free domains (`.tk`, `.ml`, `.ga`, `.cf`, `.gq`) are a bad idea:
   Cloudflare limits what you can do with them, and they get taken back.
2. Sign up at [dash.cloudflare.com](https://dash.cloudflare.com/sign-up) and **Add a domain**. Enter
   the bare domain (`example.com`, not `osu.example.com`). The **Free** plan is enough.
3. Cloudflare shows two nameservers. At your registrar, replace the domain's nameservers with those
   two, then press **Check nameservers**. It can take from minutes to a day; Cloudflare emails you when
   the domain is active.

## 2. Set `DOMAIN`

In `deploy/production/.env`:

```ini
DOMAIN=example.com
```

The stack's Caddy, TomYum and the website all build their hosts from it (`osu.example.com`,
`c.example.com`, …). Players will start osu!stable with `-devserver example.com`.

## 3A. With the Cloudflare Tunnel

1. In Cloudflare **Zero Trust → Networks → Tunnels**, create a tunnel (type *Cloudflared*). Copy its
   token from "Install connector" into `CLOUDFLARE_TUNNEL_TOKEN` in `.env`. Don't run the install
   command it shows: the compose file's `cloudflared` service is the connector.
2. On the tunnel's **Public hostnames** tab, add one hostname per row of the table in
   [step 4](#_4-the-hosts), except the DNS-only ones, each with **Service** `HTTP` and URL `caddy:80`.
   Cloudflare creates the DNS records for you.

That's it for the tunnel: skip to [step 5](#_5-cloudflare-settings).

## 3B. With proxied records and an Origin Certificate

1. **DNS records.** Add an `A` record (and `AAAA` if the machine has IPv6) for each host in
   [step 4](#_4-the-hosts), pointing at the machine's public address, with the proxy **on** (orange
   cloud) except where the table says DNS only. To add them all at once, generate a zone file and use
   **DNS → Records → Import and Export → Import**:

   ```bash
   DOMAIN=example.com IP=203.0.113.10
   for h in osu c ce c4 cho c1 c2 c3 c5 c6 a b s assets spectator api; do
     echo "$h.$DOMAIN. 1 IN A $IP"
   done > tomyum-dns.txt
   echo "irc.$DOMAIN. 1 IN A $IP" >> tomyum-dns.txt      # DNS only: untick "proxied" after the import
   ```

   Tick **Proxy imported DNS records** when importing, then turn the proxy **off** for `irc.` (and
   `server.` if you add it).
2. **SSL mode.** **SSL/TLS → Overview**: set the encryption mode to **Full (strict)**.
3. **Origin Certificate.** **SSL/TLS → Origin Server → Create Certificate**. Keep the default
   hostnames (`*.example.com`, `example.com`), RSA, 15 years. Save the two boxes on the machine:

   ```bash
   sudo mkdir -p /etc/caddy/certs
   sudo nano /etc/caddy/certs/example.com.pem   # paste "Origin Certificate"
   sudo nano /etc/caddy/certs/example.com.key   # paste "Private Key"
   sudo chown -R caddy:caddy /etc/caddy/certs && sudo chmod 600 /etc/caddy/certs/example.com.key
   ```

   Only Cloudflare trusts this certificate, so the records must stay proxied.
4. **Publish the stack's Caddy on the host only**, in `deploy/production/docker-compose.override.yml`
   (untracked, merged in by Docker Compose):

   ```yaml
   services:
     cloudflared:
       profiles: [disabled]   # no tunnel
     caddy:
       ports:
         - "127.0.0.1:8880:80"
   ```
5. **Caddy on the host** ([install it](https://caddyserver.com/docs/install#debian-ubuntu-raspbian)),
   `/etc/caddy/Caddyfile`. It only ends HTTPS; the stack's Caddy does the routing:

   ```caddyfile
   (tls_origin) {
   	tls /etc/caddy/certs/example.com.pem /etc/caddy/certs/example.com.key
   }

   c.example.com, c1.example.com, c2.example.com, c3.example.com, c4.example.com, c5.example.com,
   c6.example.com, ce.example.com, cho.example.com, osu.example.com, a.example.com, b.example.com,
   s.example.com, assets.example.com, spectator.example.com, api.example.com {
   	import tls_origin
   	request_body {
   		max_size 110MB
   	}
   	reverse_proxy 127.0.0.1:8880
   }

   # Old clients talk plain HTTP and don't follow redirects. Leave this out if you don't want them.
   http://c.example.com, http://c1.example.com, http://c2.example.com, http://c3.example.com,
   http://c4.example.com, http://c5.example.com, http://c6.example.com, http://ce.example.com,
   http://cho.example.com, http://a.example.com, http://b.example.com, http://s.example.com,
   http://osu.example.com {
   	@website {
   		host osu.example.com
   		not path /web/* /release/* /d/* /ss/* /difficulty-rating /forum/download.php /images/* /mp3/preview/* /mt/* /a/* /rating/*
   	}
   	redir @website https://{host}{uri} permanent
   	reverse_proxy 127.0.0.1:8880
   }
   ```

   Then `sudo systemctl reload caddy`.
6. **Only let Cloudflare in.** The stack trusts the `Cf-Connecting-Ip` header for the player's
   address. (TomYum itself only believes `X-Real-IP` and `CF-IPCountry` from a loopback or
   private-network address, the stack's Caddy; anything reaching it directly is taken at its
   connection's address.) Anyone who finds the machine's real address could connect to it directly and send a fake
   one (to dodge IP bans or rate limits), so allow ports 80 and 443 from
   [Cloudflare's addresses](https://www.cloudflare.com/ips/) only, for example with `ufw`:

   ```bash
   for ip in $(curl -s https://www.cloudflare.com/ips-v4) $(curl -s https://www.cloudflare.com/ips-v6); do
     sudo ufw allow proto tcp from "$ip" to any port 80,443
   done
   sudo ufw allow 22/tcp && sudo ufw allow 6667/tcp && sudo ufw enable
   ```

   Cloudflare's list changes rarely; re-run this when it does.

## 4. The hosts

| Host | Proxy | Needed for |
|---|---|---|
| `osu.` | proxied | The website, lazer's API, stable's `/web/*` |
| `c.`, `ce.`, `c4.`, `cho.` | proxied | Bancho: stable logging in and staying online |
| `c1.` – `c3.`, `c5.`, `c6.` | proxied | Bancho hosts some builds use |
| `a.` | proxied | Avatars |
| `b.` | proxied | Beatmap thumbnails and audio previews |
| `s.` | proxied | Old builds' static files |
| `assets.` | proxied | Medal icons, badges, menu banners |
| `spectator.` | proxied | lazer's multiplayer, spectating and online list |
| `api.` | proxied | Only with a plugin that serves an API there |
| `irc.` | **DNS only** | [IRC](/features/irc) on port 6667 |
| `server.` | **DNS only** | TCP bancho for builds up to 2013 ([old clients](/clients/old-clients)) |

Anything else you run (a status page, your own tools) gets its own host the same way.

## 5. Cloudflare settings

- **Visitor location.** **Network → IP Geolocation**: on. Cloudflare then sends `CF-IPCountry`, which
  TomYum uses for the player's country flag (a local database is the fallback).
- **WebSockets.** **Network → WebSockets**: on (it is by default). lazer's `spectator.` host needs it.
- **Old clients and HTTPS.** Builds from before late 2015 use plain HTTP and don't follow redirects.
  If you want them, leave **SSL/TLS → Edge Certificates → Always Use HTTPS** off (the default for a new
  domain). The website still moves visitors to HTTPS: the Caddyfile only answers plain HTTP for the
  game's paths.
- **Upload size.** Cloudflare's Free plan accepts request bodies up to **100 MB**, so that is the
  biggest beatmap set anyone can upload.
- **Caching.** Leave the default caching level. Don't add "Cache Everything" rules on `osu.` or `c.`:
  the website and bancho answers are per player.

## 6. Check the names resolve

Give DNS a few minutes, then from any PC:

```bash
dig +short osu.example.com      # Cloudflare's addresses (proxied) …
dig +short irc.example.com      # … your machine's address (DNS only)
curl -sI https://osu.example.com | head -1     # HTTP/2 200 once the stack runs
curl -s https://c.example.com/ | head -c 200   # bancho's page
```

A `526` from Cloudflare means the origin certificate isn't served (route B); a `502`/`1033` means
Cloudflare can't reach the stack (Caddy or the tunnel isn't running).

## 7. Connect

- **osu!stable:** a shortcut to `osu!.exe` with `-devserver example.com` at the end of its target.
- **lazer:** a build pointed at your hosts ([lazer](/clients/lazer)).
- **Website:** `https://osu.example.com`.

Then carry on with [Production with Docker Compose](/guide/production) (or, if the stack already runs,
[make yourself an admin](/guide/production#_6-make-yourself-an-admin)).

## Without Cloudflare

Any DNS host works for route B if you get the certificate elsewhere. The game needs about twenty
hosts, so use a **wildcard** certificate (`*.example.com`), which Let's Encrypt only issues through a
DNS challenge: either Caddy built with your DNS provider's
[module](https://caddyserver.com/docs/modules/) (`tls { dns <provider> … }`), or certbot:

```bash
sudo certbot certonly --manual --preferred-challenges=dns -d 'example.com' -d '*.example.com'
```

(`--manual` certificates don't renew by themselves; a DNS plugin for certbot does.) Point the
`tls` line of step 3B's Caddyfile at the files certbot wrote. Without Cloudflare there is no
`CF-IPCountry`: TomYum falls back to its local country database. The stack's Caddy then reads the
player's address from `X-Forwarded-For`, which the host's Caddy sets; since nothing strips a
`Cf-Connecting-Ip` a player sends themselves, remove it on the host:

```caddyfile
reverse_proxy 127.0.0.1:8880 {
	header_up -Cf-Connecting-Ip
}
```
