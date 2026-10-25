# Roadmap

TomYum is at `0.6.0`; `0.5.0` was its first stable release. `0.6.0` to `1.0.0` bring small fixes,
scaling and a core generic enough for anyone's server. This page sums up what's done and what's left;
the checklist is [docs/ROADMAP.md](https://github.com/somtum-fun/TomYum-OSS/blob/main/docs/ROADMAP.md).

## Versions

| Version | Date | What came |
|---|---|---|
| `0.1.0-dev` | 2026-07-07 | `.osu` cache, pp sidecar, database migrations, the plugin host |
| `0.2.0-dev` | 2026-10-01 | lazer and the website as accounts and scores, moderation and the staff panels, anti-cheat hooks, IRC, bot accounts, BN/NAT tools, maintenance mode, support tickets |
| `0.3.0-dev` | 2026-10-03 | Old clients, Relax/Autopilot with Akatsuki pp, pp reworks and pp library updates from the admin panel, the watchdog, metrics as a plugin, tickets from any IMAP mailbox |
| `0.5.0` | 2026-10-12 | First stable release: old clients finished (2008 to 2015), stable sessions fixed, ranking rules (days in qualified, an inactivity rule), a bancho.py importer, a security review of the whole server and its fixes |
| `0.6.0` | 2026-10-25 | A bigger plugin API (command options, commands as a user, accounts, chat, replays, beatmaps, pp, a state store, a scheduler, feed events for scores, medals, registrations, status changes, reports, chat and server errors, a player message on vetoes); [custom lazer rulesets](/features/custom-rulesets) from rulesets.info ranked by score; lazer scores must fit their map (judgements, combo, play time) |
| `0.5.5` | 2026-10-14 | Security fixes: only staff, the Tournament Committee and a room's own players can follow a match from the tournament client, and its watchers never get the room's password; wrong passwords from one address no longer lock the player out elsewhere; `#announce` is staff-only; `X-Real-IP` and `CF-IPCountry` are only believed from your own proxy; the website's blocks and "friends only" apply to in-game private messages |

## 0.6.0 to 1.0

The goal for `1.0.0`: TomYum runs anyone's server without somtum.fun's choices baked in.

- [ ] Small fixes from production.
- [ ] Scaling, stage by stage: a bigger machine, then the databases on their own, copies of what's
      stateless, and bancho on several machines (online state in Redis); Kubernetes after that.
- [ ] Object storage (S3, R2, Spaces, B2) for replays, maps and screenshots.
- [ ] Server-specific behaviour (welcome texts, store, maintenance texts, ticket categories, the
      Relax/Autopilot pp source, custom medals) behind plugins or settings; no server-specific names or
      addresses in code, docs or defaults.
- [ ] Docs for operators and contributors, a changelog per version, a licence review. (This site is
      part of that.)
- [ ] Then `1.0.0`, and SemVer from there.

## Done

- Plugin host: compiled and loose-source plugins, events, commands, HTTP routes, trusted data access.
- Moderation and anti-cheat hooks: restrictions, silences, hardware hashes, alt detection,
  shared-machine alerts, IP-to-country fallback.
- Stable spectating with the `#spectator` channel; the tournament client.
- Custom beatmaps: uploads, editor submission from both clients, graveyard, local serving.
- lazer, through osu-web and ppy's own services: login, scores, multiplayer, spectating, the daily
  challenge, Ranked Play, beatmap submission, Relax on lazer, ranked mods.
- The website on the same accounts, with scores, stats, medals and match history mirrored.
- BN and NAT tools: nominations and the BN panel on the website, Project Loved.
- Bot accounts, IRC, achievements under osu!'s ids.
- Old clients back to 2008 (every build to 2015), TCP bancho and TomYum.Gateway.
- Operations: the watchdog, nightly backups, `deploy.sh`, Prometheus metrics.
- The Discord bot and circleguard's replay checks moved out of the core into plugins (`tomyum.discord`,
  `tomyum.circleguard`). Those two are somtum.fun's and not published; the plugin API they use is.

## Not done yet

- **Custom medals.** somtum.fun's TomYum has them (players ask, a Medal Team approves); they aren't in
  TomYum-OSS yet.
- **Running bancho on several machines.** Online state (players, channels, matches, spectating) lives
  in one process, so bancho runs as one copy. The plan, in order: scale up; split MySQL, Redis and
  Elasticsearch out; replicas of what's stateless; then online state in Redis. Kubernetes waits until
  after that.
- **Object storage** (S3, R2, Spaces, B2): only the design exists. Files live on the `server-data`
  volume.
- Guest difficulties uploaded on their own from lazer, and custom lazer rulesets.
