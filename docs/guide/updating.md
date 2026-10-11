# Updating

`deploy/production/deploy.sh` updates a running server in one go. Run it from anywhere:

```bash
~/TomYum-OSS/deploy/production/deploy.sh
```

## What it does

1. Pulls TomYum (`git pull` in the checkout), then runs the pulled version of itself, so new steps
   always run.
2. Pauses the [watchdog](/operations/monitoring)'s alerts for up to 10 minutes.
3. Pulls the website (`OSU_WEB_PATH` from `.env`, by default `../../../osu-web`), and
   `../../../lazer-circleguard` if that folder exists.
4. Builds the website image (`docker compose --profile build build osu-web-build`) and the rest
   (`docker compose build`). Unchanged parts come from Docker's build cache.
5. Runs the website's migrations before anything restarts (`artisan migrate --force`): TomYum reads
   some of the website's tables.
6. `docker compose up -d`: restarts what changed.
7. Creates any missing search index (`artisan tomyum:es-ensure`).
8. Trims Docker's build cache to the most recently used 20 GB.
9. Adds the new commits to the website's changelog (`changelog.sh`).
10. Turns the alerts back on after a minute's grace.

TomYum's own database migrations run by themselves when the server starts.

::: warning changelog.sh is set up for somtum.fun
`changelog.sh` imports commits into the website's changelog with somtum.fun's repository names, its
authors and a fixed start date. Edit those lines for your server, or take the `./changelog.sh` line
out of `deploy.sh` (in your own copy) if you don't want a changelog.
:::

The spectator server isn't pulled by `deploy.sh`. To update it, `git pull` in its checkout
(`SPECTATOR_PATH`), then `docker compose build spectator && docker compose up -d spectator`.

## Updating by hand

The same steps, for one part at a time (from `deploy/production`):

```bash
# TomYum only
git -C ../.. pull
docker compose build server && docker compose up -d server

# The website only
git -C ../../../osu-web pull
docker compose --profile build build osu-web-build
docker compose run --rm artisan migrate --force
docker compose up -d
```

## pp libraries

When ppy's pp code or akatsuki-pp-rs changes, the pp updater can update them from the admin panel
and start a pp rework. See [pp reworks](/features/pp-reworks).

`tools/RecalcPp` works out pp again for TomYum's stored best scores, for example after changing the
pp calculator a mode uses:

```bash
dotnet run --project tools/RecalcPp -- --dry-run   # calculate, save nothing
dotnet run --project tools/RecalcPp                # save
dotnet run --project tools/RecalcPp -- --mode 0    # osu! only
```

It reads the same `TOMYUM_*` settings as the server (`config/.env`, `config/tomyum.yaml`), so point
them at your database first.

## Before a big update

- Take a backup: `./backup.sh` ([backups](/operations/backups)).
- Read the commits since your last update. TomYum is `0.x-dev`: there are no stable releases or
  upgrade notes yet.
