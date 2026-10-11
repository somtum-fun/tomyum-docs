# Loved

Project Loved is part of the website: **Community → Project Loved** (`osu.<domain>/community/loved`).
It's kept simple for a private server: no rounds, polls or seasons. It lives in the website fork
(`LovedController`, `App\Libraries\TomYumLoved`).

## What players do

- **Ask for a map**: the set's link or id, the mode, and why. Graveyard, WIP and pending maps only;
  one request per map and mode (a second asker is sent to the existing request); 5 a day. osu! maps
  the server doesn't have yet are imported.
- **Review** open requests: for or against, with why. Reviews can be changed while the request is
  open. Open requests are listed by score (fors minus againsts; the asker counts as a for).

## What the team does

The team decides, with a reason players see:

- **Love it**: the set's difficulties in that mode become Loved straight away, in the game too.
- **Reject**: it can't be asked for again until reopened.
- **Remove**: off the list; it can be asked for again.
- **Open again**.
- **Blacklist the map**: its open requests are removed, and nobody can ask for it.

Tabs: Requests, Loved, Rejected, Removed (team only), Blacklist.

The team is the website's **Project Loved** group: members decide for the modes they have in the
group (all modes when none are set), and admins decide for every mode. Give the group in the admin
panel.

::: tip
Want `loved.<domain>` as a short address? The tracked Caddyfile doesn't have that host: add a site
that redirects to `https://osu.<domain>/community/loved`, and a DNS record for it.
:::
