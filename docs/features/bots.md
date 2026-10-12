# Bots

Chat bots work the way they do on osu!: an account in the **Chat Bots** group (`bot`) that talks over
[IRC](/features/irc), in the same channels and private messages as the game, the website and lazer.

## Making one

Admins and developers: **Staff panel → Bots → Make a bot** (`/panel/bots`). Give it a name, an owner
(a player's name or id; you by default), optionally a website password (random when empty) and what
it does. The panel shows the bot's first IRC password and, when it made one, its website password,
once.

The bot gets:

- the `bot` group as its main group, so the website shows it as a bot;
- a placeholder email `bot<id>@bots.invalid` (nobody reads a bot's mail);
- its owner's country;
- a row in `tomyum_bot_accounts` (owner, who made it, description);
- an IRC key, which is its IRC password.

## What a bot can do

| | |
|---|---|
| IRC (`irc.<domain>:6667`, nick = its name with `_` for spaces, password = its IRC key) | yes |
| Sign in to the website (join a team, post in the forum) | yes; new sessions are confirmed with a code sent to its **owner's** email |
| Log in to osu!stable | no: refused with "Bot accounts can't log in to the game. Connect over IRC instead." |
| Log in to lazer | no |
| Submit scores | no |

## Managing one

The owner (user menu → **My bots**), admins and developers open the bot's page (`/panel/bots/{id}`)
to:

- see, reset or set the IRC password (8–50 characters, no spaces);
- rename it (no monthly limit; the old name is kept in its history);
- upload or remove its avatar and profile banner;
- edit its me! page;
- set its website password;
- change what it does. Admins and developers can also change the owner.

Every change is in the staff log (`bot.*`). BanchoBot is the server's own and isn't managed here.

## Bots and OAuth

The website lets an OAuth client owned by a bot account act as it (`delegate` scope, client
credentials), as osu! does for chat bots. That's how a tool of your own (a BN
application site, a tournament bot) can send in-game messages.
