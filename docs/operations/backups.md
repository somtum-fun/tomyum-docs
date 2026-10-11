# Backups

[`deploy/production/backup.sh`](https://github.com/somtum-fun/TomYum-OSS/blob/main/deploy/production/backup.sh)
backs up the production server. Run it every night from cron (`crontab -e`):

```
30 4 * * * ~/TomYum-OSS/deploy/production/backup.sh
```

## What it saves

- **Every database**, as one `mysqldump` (`databases.sql.gz`): the website's (`osu`, `osu_chat`,
  `osu_mp`, `osu_store`, `osu_updates`) and TomYum's (`tomyum`). A dump that stopped early fails the
  backup.
- **Files**: the game server's (`server-data`: replays, screenshots, custom beatmaps), the website's
  uploads and storage, and Redis (IRC passwords, link codes), each as a `.tar.gz`.
- **Config** to bring it back (`config.tar.gz`: `.env`, `tomyum.env`, `osu-web.env`, `Caddyfile`).

::: warning
The config archive holds all of your server's secrets. Keep the backups private.
:::

The search index isn't backed up: it's rebuilt from the database.

Each run is a folder `~/backups/<date>_<time>/` (with a `backup.log`); 7 days are kept.
`BACKUP_DIR` changes where they go.

## Off-site copies (Proton Drive)

With an [rclone](https://rclone.org) remote named `proton`, every backup is also copied to Proton
Drive (`tomyum-backups/`, 30 days kept there). rclone's Proton Drive support needs rclone 1.64 or
newer. Once, on the server:

```bash
sudo -v && curl -fsSL https://rclone.org/install.sh | sudo bash   # the current rclone
rclone config    # n (new remote) → name: proton → storage: protondrive → your Proton login (and 2FA code)
rclone lsd proton:   # check it works
```

rclone keeps the login in `~/.config/rclone/rclone.conf`. A separate Proton account just for the
server's backups keeps your own password off the machine. Without the remote, backups stay on the
machine only.

## Restoring

On a fresh machine with the stack set up as in [production](/guide/production) (checkouts and
images), from a backup folder:

```bash
cd ~/TomYum-OSS/deploy/production
tar xzf ~/backups/<run>/config.tar.gz                 # .env, tomyum.env, osu-web.env, Caddyfile
docker compose up -d db redis && sleep 20
gzip -dc ~/backups/<run>/databases.sql.gz | docker compose exec -T db sh -c 'MYSQL_PWD="$MYSQL_ROOT_PASSWORD" mysql -uroot'
for v in server-data osu-web-uploads osu-web-storage redis-data; do
  docker run --rm -v tomyum_$v:/v -v ~/backups/<run>:/in alpine sh -c "cd /v && tar xzf /in/$v.tar.gz"
done
docker compose up -d
docker compose run --rm -T artisan es:index-documents --no-interaction </dev/null   # rebuild the search indexes
docker compose run --rm -T score-indexer queue pump-all </dev/null                  # and the scores' index
```

::: warning The project must be called `tomyum`
`backup.sh` (and the restore above) find the volumes as `tomyum_<name>`. Docker Compose names a
project after its folder (`production`) unless told otherwise, so set `COMPOSE_PROJECT_NAME=tomyum`
in `.env` before the first start ([production](/guide/production#_2-fill-in-the-settings)).
`docker volume ls` shows what yours are called.
:::
