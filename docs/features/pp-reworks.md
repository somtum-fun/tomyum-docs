# pp reworks

TomYum works out pp with two libraries, can route each mode to one of them, and can redo every
score's pp from the admin panel when a library changes.

## The pp libraries

| | Library | Used by | Pinned in |
|---|---|---|---|
| Vanilla | ppy's `ppy.osu.Game.Rulesets.*` | TomYum (stable scores) and ppy's score processor (lazer, the website) | `src/TomYum.Performance/TomYum.Performance.csproj`, `deploy/score-processor/Dockerfile` (`PROCESSOR_REF`) |
| Relax / Autopilot | [akatsuki-pp-rs](https://github.com/osuAkatsuki/akatsuki-pp-rs) | the `pp-sidecar` (osu! Relax: Akatsuki's `osu_2019` formula) | `sidecars/pp-sidecar/Cargo.lock` |

Vanilla pp has to match between TomYum and the processor, so the newest vanilla version is the one the
processor's newest commit uses.

## Routing Relax and Autopilot to the sidecar

By default TomYum works out **every** mode in-process with ppy's calculator. To give Relax and
Autopilot akatsuki-pp-rs's pp, run the
[`pp-sidecar`](https://github.com/somtum-fun/TomYum-OSS/tree/main/sidecars/pp-sidecar) and route those
modes to it (the `Performance` settings):

```yaml
performance:
  routes:
    - { modes: [vanilla],          backend: official }
    - { modes: [relax, autopilot], backend: akatsuki }
  backends:
    official: { type: inprocess-lazer }
    akatsuki: { type: http, url: "http://pp-sidecar:9000/pp", timeoutMs: 2000, fallback: official }
```

Mode tokens are a group (`vanilla`, `relax`, `autopilot`, `all`), a short name (`rx!catch`, …) or a
number (0–11). With `fallback`, TomYum uses the official calculator while the sidecar is down; without
it, the score gets 0 pp. TomYum refuses to start if a route names a backend that isn't defined.

The production stack doesn't include the sidecar, and reads no YAML. Add the service and the routes
in a `docker-compose.override.yml` next to `docker-compose.yml`:

```yaml
services:
  pp-sidecar:
    build:
      context: ../../sidecars/pp-sidecar
    restart: unless-stopped
  server:
    environment:
      TOMYUM_PERFORMANCE__ROUTES__0__MODES__0: vanilla
      TOMYUM_PERFORMANCE__ROUTES__0__BACKEND: official
      TOMYUM_PERFORMANCE__ROUTES__1__MODES__0: relax
      TOMYUM_PERFORMANCE__ROUTES__1__MODES__1: autopilot
      TOMYUM_PERFORMANCE__ROUTES__1__BACKEND: akatsuki
      TOMYUM_PERFORMANCE__BACKENDS__akatsuki__TYPE: http
      TOMYUM_PERFORMANCE__BACKENDS__akatsuki__URL: http://pp-sidecar:9000/pp
      TOMYUM_PERFORMANCE__BACKENDS__akatsuki__TIMEOUTMS: "2000"
      TOMYUM_PERFORMANCE__BACKENDS__akatsuki__FALLBACK: official
```

Then `docker compose up -d --build pp-sidecar server`. After changing which backend a mode uses,
start a pp rework for those modes (below), so older scores get the new pp too.

## The pp updater

[`deploy/pp-updater`](https://github.com/somtum-fun/TomYum-OSS/tree/main/deploy/pp-updater) is a small
Python service on the host (systemd `tomyum-pp-updater`, as root: it drives Docker, so no container
needs Docker's socket). Every 6 hours, or on **Check now**, it compares the pins with the newest
versions; **Admin → pp rework → pp libraries** shows both. **Update** asks it to:

- **Relax/Autopilot:** `cargo update -p akatsuki-pp`, build and restart the `pp-sidecar`, check its
  `/version`, commit `Cargo.lock`, then start a rework of Relax and Autopilot.
- **Vanilla:** move the processor to its newest commit and TomYum's packages to its ppy version, check
  TomYum builds, build and restart `server` and `score-processor`, commit the pins, then start a rework
  of the vanilla modes.

A failed build puts the pins back and leaves the running containers alone; the error shows in the
panel. Commits are local: push them yourself if you keep a fork.

Install it (set `ExecStart` to your checkout's `updater.py` first):

```bash
sudo cp deploy/pp-updater/tomyum-pp-updater.service /etc/systemd/system/
sudo systemctl enable --now tomyum-pp-updater
sudo python3 deploy/pp-updater/updater.py check      # a check by hand
```

It finds the checkout from its own path; `TOMYUM_DIR`, `COMPOSE_DIR`, `RUN_AS` (the user that builds
and commits; by default the checkout's owner) and `CHECK_HOURS` change that. The Relax/Autopilot
update expects a `pp-sidecar` service, as added above.

## pp reworks

Started after an update, or by hand (**Admin → pp rework**: the modes and a reason). While one runs:

- its modes are paused: TomYum doesn't recompute their ranks or change their in-game pp, and the
  website's ranking page shows a copy of the stats from before;
- new scores in those modes wait for their pp: not a best, not in totals;
- every passed score's new pp is worked out a batch at a time (it resumes after a restart, and scores
  made meanwhile join in);
- every page shows a banner (the modes, why, how far), and the admin panel shows the progress.

Then it switches over at once: the new pp, each player's best per map, everyone's totals. Vanilla
modes then wait for ppy's processor to redo the website's scores; then ranks and in-game pp follow and
the rankings are live again. Cancelling keeps the old pp.

For a one-off recalculation from the command line, see `tools/RecalcPp` on [updating](/guide/updating#pp-libraries).
