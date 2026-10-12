# Project structure

What lives where in [TomYum-OSS](https://github.com/somtum-fun/TomYum-OSS). The game server is one
ASP.NET Core process (`TomYum.Server`); the other projects are libraries it uses, or small extra
services you only need in special setups.

```
.
├── src/
│   ├── TomYum.Server/            the game server (the process that runs)
│   │   ├── Program.cs              wiring: settings, services, routes, background jobs
│   │   ├── Bancho/                 osu!stable's bancho: logins, sessions, chat, BanchoBot and its
│   │   │   │                       commands, matches, TCP bancho for old builds, sign-up from the game
│   │   │   └── Packets/            one handler per client packet (chat, spectating, multiplayer, …)
│   │   ├── Beatmaps/               stable's /web/* endpoints: score submission, leaderboards,
│   │   │                           osu!direct, downloads, replays, custom beatmap uploads, the osu! API
│   │   ├── OsuWeb/                 keeping the website in step: stats, ranks, medals, presence, jobs
│   │   ├── Admin/                  the admin API the website's staff panels call (signed requests),
│   │   │                           moderation, imports, pp reworks, maintenance mode
│   │   ├── Achievements/           medals: the catalogue, judging plays, pack medals
│   │   ├── Anticheat/              client flags, challenges, old-client proofs
│   │   ├── Irc/                    the IRC server (port 6667)
│   │   ├── Gateway/                the link TomYum.Gateway relays TCP bancho and IRC through
│   │   ├── LastFm/                 last.fm scrobbling
│   │   └── Plugins/                the plugin host: events, commands, HTTP routes, data access
│   ├── TomYum.Bancho/            the bancho protocol: packet reader and writer, login parsing, the
│   │                             layouts of older builds, mods, privileges
│   ├── TomYum.Domain/            entities, enums and repository interfaces
│   ├── TomYum.Persistence/       MySQL through EF Core: TomYum's own tables and migrations, and the
│   │   └── OsuWeb/                 website's tables (accounts, scores, stats live in osu-web's database)
│   ├── TomYum.Caching/           Redis: the score queues ppy's processor and indexer read
│   ├── TomYum.Performance/       pp: ppy's calculator, the pp sidecar for Relax/Autopilot, the .osu cache
│   ├── TomYum.Irc/               IRC line parsing
│   ├── TomYum.Plugins.Abstractions/   the plugin API (what a plugin compiles against)
│   ├── TomYum.Plugins.Loader/    loading plugins: .dll files and loose C# source
│   └── TomYum.Storage/           object storage design (not used yet)
├── services/
│   ├── TomYum.Gateway/           TCP bancho and IRC on another machine, relayed to the server
│   └── …                         other early service stubs (not used by the stack)
├── sidecars/pp-sidecar/          Rust service: Relax/Autopilot pp with akatsuki-pp-rs
├── plugins/                      example plugins and the metrics plugin
├── tools/
│   ├── ImportBanchoPy/           move a bancho.py server's data over
│   ├── RecalcPp/                 recompute pp for every score
│   └── MigrateToOsuWeb/          one-off move of old TomYum accounts into the website
├── tests/                        xUnit tests, one project per library
├── deploy/
│   ├── production/               the Docker Compose stack, its Caddyfile and scripts
│   │                             (deploy.sh, backup.sh, watchdog.sh, changelog.sh)
│   ├── caddy/                    Caddyfiles for local testing
│   └── k8s/, k3s/                scaffolding (TomYum alone; not the supported path yet)
├── config/                       tomyum.yaml.example: settings for a local run
└── docs/                         feature pages for contributors, and the roadmap
```

## How a request finds its code

| The client asks for | Host | Code |
|---|---|---|
| Logging in, staying online (stable) | `c.` | `Bancho/BanchoEndpoints.cs` → `BanchoLoginHandler.cs`, then `Packets/BanchoPacketDispatcher.cs` |
| Submitting a score (stable) | `osu.` `/web/osu-submit-modular-selector.php` | `Beatmaps/ScoreSubmissionEndpoint.cs` |
| A leaderboard (stable) | `osu.` `/web/osu-osz2-getscores.php` | `Beatmaps/WebEndpoints.cs` |
| osu!direct | `osu.` `/web/osu-search.php`, `/d/<id>` | `Beatmaps/DirectEndpoints.cs` |
| Uploading a beatmap from the editor | `osu.` `/web/osu-osz2-bmsubmit-*` | `Beatmaps/SubmissionEndpoints.cs`, `BeatmapSubmissions.cs` |
| A staff action on the website | (internal) `/_admin/*` | `Admin/*Endpoints.cs`, checked by `AdminAuthFilter.cs` |
| Anything lazer | `osu.` `/api/v2`, `spectator.` | the website (osu-web) and ppy's spectator server, not TomYum |

## Where the data is

- **Accounts, scores, stats, medals, beatmaps:** the website's database (osu-web's tables). TomYum
  reads and writes them through `TomYum.Persistence/OsuWeb`.
- **TomYum's own tables** (client hashes, custom beatmaps, imports, match history, …): the `tomyum`
  database, created by EF Core migrations at start-up (`TomYum.Persistence/Migrations`).
- **Online state** (who's online, channels, matches, spectators): in the server's memory
  (`PlayerRegistry`, `ChannelRegistry`, `MatchRegistry`). That's why bancho runs as one copy.
- **Files** (replays, screenshots, custom sets, caches): the `server-data` volume, `/app/data`.
