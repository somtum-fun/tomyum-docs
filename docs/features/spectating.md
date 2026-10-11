# Spectating

## osu!stable

One player watches another play in real time: the watched player's (the host's) gameplay frames are
relayed to every spectator, and several people can watch the same host and see each other as
"fellow spectators". Nothing needs setting up.

### How it works

When you click **Spectate** on an online player, your client sends `START_SPECTATING`. The server:

1. records you as a spectator of that host;
2. tells the host `SPECTATOR_JOINED`, the host client's cue to start streaming its frames;
3. introduces you and the other spectators to each other (`FELLOW_SPECTATOR_JOINED` both ways).

While the host plays, its client streams `SPECTATE_FRAMES`, and the server relays each bundle as it
is to every spectator. If you don't have the host's map, your client sends `CANT_SPECTATE`; everyone
is told, and your client starts watching again once the map has downloaded. The host stops streaming
when its last spectator leaves.

| You do | Client → server | Server → others |
|---|---|---|
| Start watching | `START_SPECTATING(16)` | `SPECTATOR_JOINED(13)` → host; `FELLOW_SPECTATOR_JOINED(42)` between spectators |
| Stop, or log out | `STOP_SPECTATING(17)` | `SPECTATOR_LEFT(14)` → host; `FELLOW_SPECTATOR_LEFT(43)` → the other spectators |
| Host plays | `SPECTATE_FRAMES(18)` | `SPECTATE_FRAMES(15)` → every spectator |
| Missing the map | `CANT_SPECTATE(21)` | `SPECTATOR_CANT_SPECTATE(22)` → host and spectators |

### The `#spectator` channel

While a player is watched, the server opens a `#spectator` channel for the host and everyone watching
them, the same tab osu!stable shows while spectating. Each host has its own. The host joins it when
the first spectator arrives and leaves when the last one goes; spectators join and leave as they
start and stop watching. `!` commands work there too. Nobody joins or leaves it by hand.

### Limits

- Spectating lives in the one TomYum process, like the rest of online state, so it doesn't span
  several server copies.
- Spectate state is cleaned up on logout.

## osu!lazer

lazer's spectating (and multiplayer and presence) is ppy's spectator server, the `spectator` service
of the production stack, reached at `spectator.<domain>` or `osu.<domain>/signalr/`. It saves lazer
replays to the website's uploads, where the website and TomYum read them.

## The tournament client

The tournament client's windows spectate players like a game does, each showing its own player. See
[tournaments](/features/tournaments).

## For plugins

Plugins can read spectator frames (`SpectateFrameEvent`), and can have BanchoBot spectate an
osu!stable player (`IHostSpectating`) so their frames flow without a human watching. See
[plugins](/operations/plugins).
