# Roadmap

TomYum is at `0.3.0-dev`: used in production for stable, lazer and the website, but not yet
`1.0.0`. This page sums up what's done and what's left; the full checklist is
[docs/ROADMAP.md](https://github.com/somtum-fun/TomYum-OSS/blob/main/docs/ROADMAP.md).

## Versions

| Version | Date | What came |
|---|---|---|
| `0.1.0-dev` | 2026-07-07 | The feature wave opens: `.osu` cache, pp sidecar, database migrations |
| `0.2.0-dev` | 2026-10-01 | lazer and the website as accounts and scores, moderation and the staff panels, anti-cheat, Discord bot, IRC, bot accounts, BN/NAT tools, maintenance mode, support tickets |
| `0.3.0-dev` | 2026-10-03 | Old clients (2013–2015 through Titanic! Hook, TCP bancho for older builds), Relax/Autopilot with Akatsuki pp, pp reworks and pp library updates from the admin panel, the watchdog, metrics as a plugin, tickets from any IMAP mailbox, the server's own name in the bot's posts |

## Before 1.0

The goal for `1.0.0`: TomYum runs anyone's server without somtum.fun's choices baked in.

- [ ] Server-specific behaviour (welcome texts, Discord channels and wording, store, maintenance texts,
      ticket categories, the Relax/Autopilot pp source, custom medals) behind plugins or settings.
- [ ] No server-specific names or addresses in code, docs or defaults.
- [ ] Clean-up: dead code and leftovers (the unused `Storage` stubs until they're implemented).
- [ ] Docs for operators and contributors, a changelog per version, a licence review. (This site is
      part of that.)
- [ ] A security review: admin API signing, InterOp, uploads, OAuth.
- [ ] Then `1.0.0` without `-dev`, and SemVer from there.

## Done

- Plugin host: compiled and loose-source plugins, events, commands, HTTP routes, trusted data access.
- Moderation and anti-cheat hooks: restrictions, silences, hardware hashes, alt detection,
  shared-machine alerts, IP-to-country fallback.
- Stable spectating with the `#spectator` channel; the tournament client.
- Custom beatmaps: uploads, editor submission from both clients, graveyard, local serving.
- lazer, through osu-web and ppy's own services: login, scores, multiplayer, spectating, the daily
  challenge, Ranked Play, beatmap submission, Relax on lazer, ranked mods.
- The website on the same accounts, with scores, stats, medals and match history mirrored.
- BN and NAT tools: nominations on the website, the BN Management site, Project Loved.
- Bot accounts, IRC, achievements under osu!'s ids.
- Old clients back to 2008 (best tested 2013–2015), TCP bancho and TomYum.Gateway.
- Operations: the watchdog, nightly backups, `deploy.sh`, Prometheus metrics.

## Not done yet

- **Custom medals.**
- **Running bancho on several machines.** Online state (players, channels, matches, spectating) lives
  in one process, so bancho runs as one copy. The plan, in order: scale up; split MySQL, Redis and
  Elasticsearch out; replicas of what's stateless; then online state in Redis. Kubernetes waits until
  after that.
- **Object storage** (S3, R2, Spaces, B2): only the design exists. Files live on the `server-data`
  volume.
- **Old clients**: more builds tested one by one, a real pre-2014 build through the gateway, and
  anti-cheat and verification for old builds. Paused for now: the priorities are the latest lazer,
  stable 2023+ and anti-cheat.
- **The Session plugin**'s feature endpoints (it only has the login core).
- **The Discord bot and circleguard** replay checks were moved out of the core, to come back as
  plugins.
- Guest difficulties uploaded on their own from lazer, and custom lazer rulesets.
