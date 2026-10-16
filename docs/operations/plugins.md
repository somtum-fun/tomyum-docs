# Plugins

TomYum loads plugins at startup from a `plugins/` directory. A plugin hooks into the server through
one interface, `IPluginContext`, and can add `!` commands, react to events, serve HTTP and look at
live state. A plugin that fails to start is logged and skipped; it never takes the server down.

The quickest start for writing one is the template repository,
[somtum-fun/tomyum-plugin-template](https://github.com/somtum-fun/tomyum-plugin-template).

## Two shapes

| Shape | You ship | How it loads |
|---|---|---|
| **Compiled** | a built `.dll` in `plugins/` (or a subfolder) | loaded into its own unloadable `AssemblyLoadContext` |
| **Loose source** | a folder with `plugin.json` and `.cs` files | compiled at startup with Roslyn, then loaded the same way |

Compiled is better for real plugins (tooling, tests); loose source is handy for small changes with no
build step. Loose source needs `Plugins:AllowLooseSource` (on by default).

A loose-source folder's `plugin.json`:

```json
{
  "id": "example.hello",
  "name": "Hello",
  "version": "0.1.0",
  "authors": "You",
  "description": "Says hello.",
  "entryPoint": "HelloPlugin"
}
```

Examples of both shapes are in [`plugins/examples`](https://github.com/somtum-fun/TomYum-OSS/tree/main/plugins/examples).

## Example plugins

Real plugins that run on somtum.fun, all loose source and good to read before writing your own:

| Plugin | What it shows |
|---|---|
| [tomyum-plugin-template](https://github.com/somtum-fun/tomyum-plugin-template) | The starting point: a compiled and a loose-source plugin, with a `!` command, an event and a setting. |
| [tomyum-bpy-api](https://github.com/somtum-fun/tomyum-bpy-api) | bancho.py's public v1 API on TomYum's data, so tools made for bancho.py keep working: HTTP routes on their own host, and read-only queries through trusted database access. |
| [tomyum-votes-plugins](https://github.com/somtum-fun/tomyum-votes-plugins) | Votes from osu-server-list.com: a callback URL with a key, its own table, osu!direct time as a reward (`ClientPerksEvent`), a BanchoBot message and a `!vote` command. |

Questions about writing one: [#discussion](/guide/community) on the Discord server.

## Installing one in production

The production image has no plugins in it, and the tracked compose file mounts none. Mount each
plugin's folder at `/app/plugins/<name>` in a `docker-compose.override.yml` next to
`docker-compose.yml`, for example the metrics plugin that ships with TomYum:

```yaml
services:
  server:
    volumes:
      - ../../plugins/tomyum-metrics:/app/plugins/tomyum-metrics:ro
```

Then `docker compose up -d server`. The log shows `plugin loaded: <id> …` and
`plugin host: N plugin(s) active from /app/plugins`. In-game, `!plugins` lists what's loaded. After
changing a plugin, restart the server (`docker compose restart server`).

## Settings

Each plugin's settings live under `Plugins:<plugin id>`. In production, as environment variables in
`tomyum.env`:

| Setting | Default | |
|---|---|---|
| `TOMYUM_PLUGINS__DIRECTORY` | `plugins` | Where plugins are loaded from |
| `TOMYUM_PLUGINS__ALLOWLOOSESOURCE` | `true` | Whether loose `.cs` folders are compiled |
| `TOMYUM_PLUGINS__TRUSTED__0`, `__1`, … | none | Plugin ids given raw database access |
| `TOMYUM_PLUGINS__<plugin id>__<setting>` | | A plugin's own setting, e.g. `TOMYUM_PLUGINS__tomyum.metrics__hosts` |

The same in `config/tomyum.yaml` (local runs):

```yaml
plugins:
  directory: plugins
  allowLooseSource: true
  trusted:
    - tomyum.metrics            # only trusted plugins get IPluginContext.Data
  "tomyum.metrics":
    hosts: "server:8080,localhost:8080"
```

::: warning Trusted means trusted
A trusted plugin gets a raw database connection with no guard rails. Only list plugins you trust to
own their own tables.
:::

## Plugins in TomYum-OSS

| Folder | Id | What |
|---|---|---|
| `plugins/tomyum-metrics` | `tomyum.metrics` | Prometheus metrics at `/metrics` ([monitoring](/operations/monitoring#prometheus-metrics)) |
| `plugins/examples` | | A compiled and a loose-source example |

## Writing one

Every plugin implements `IPlugin`:

```csharp
public interface IPlugin
{
    PluginManifest Manifest { get; }                                     // id, name, version, authors, description
    Task InitializeAsync(IPluginContext context, CancellationToken ct);  // register everything here
    Task ShutdownAsync(CancellationToken ct);                            // dispose everything here
}
```

The `Id` in the manifest is the plugin's identity **and** its settings key: keep it stable and unique
(e.g. `tomyum.dan`). Dispose in `ShutdownAsync` exactly what you registered in `InitializeAsync`.

| `IPluginContext` member | Use it for |
|---|---|
| `Config` | The plugin's settings (`Plugins:<id>`): `Get<T>(key, default)` or `Bind<TOptions>()` |
| `Logger` | `Info` / `Warn` / `Error`, tagged with the plugin id |
| `Commands` | `Register(name, description, handler)`: a `!` command (built-in names can't be taken) |
| `Events` | `Subscribe<TEvent>(handler)`: react to server events |
| `Http` | `Map(method, pattern, handler, requireAuth, subdomain)`: serve HTTP, optionally on its own subdomain |
| `GetHostService<T>()` | `IHostPlayerView` (who's online, doing what), `IHostOnlineCounts` (players by client, open rooms), `IHostMessenger` (a BanchoBot message or notification to a stable player), `IHostSpectating` (BanchoBot spectates a stable player; `BotName` is the bot's name from `Bancho:BotName`) |
| `Data` | A raw `DbConnection`, only for trusted plugins; otherwise `null` |

Events:

- `PlayerLoginEvent`, `PlayerLoginRefusedEvent` (a stable login refused; `Held` for maintenance or a
  device to verify)
- `ChatMessageEvent`
- `ActionChangedEvent` (a player's status, with map, mods and client build)
- `SpectateFrameEvent` (a spectated player's frame bundle)
- `ScoreSubmittingEvent`, **vetoable**: call `Veto(reason)` to reject the score
- `ScoreSubmittedEvent` (a stable score was stored, failed plays too; not for lazer)

```csharp
public Task InitializeAsync(IPluginContext context, CancellationToken ct = default)
{
    var greeting = context.Config.Get("greeting", "hello");

    _command = context.Commands.Register("myplugin", "example", (invocation, ct) =>
    {
        var online = context.GetHostService<IHostPlayerView>()?.OnlineCount ?? 0;
        return Task.FromResult<string?>($"{greeting}! {online} online.");
    });

    return Task.CompletedTask;
}
```

Rules of the road:

- Reference **only** `TomYum.Plugins.Abstractions`. Referencing the server breaks isolation and
  unloading.
- Keep event handlers cheap: some run on the score and status hot path.
- Ask the operator for trusted database access only if you really own tables.

More: [docs/plugins.md](https://github.com/somtum-fun/TomYum-OSS/blob/main/docs/plugins.md).
