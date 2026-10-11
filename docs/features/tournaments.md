# Tournaments

Tournaments are played in multiplayer, like on osu!. This page is about the **tournament client**: the
version of the game that shows every player of a match side by side, for streams.

## What TomYum does

osu!(stable)'s tournament client (its version ends in `tourney`) logs in once for each window, all with
the same account. TomYum treats those windows as extra sessions:

- They don't replace the player's own game, and aren't listed as online players.
- They get no channels, private messages or login announcement.
- Each window follows a match (its state and its `#multiplayer` chat) and spectates one player, like a
  game spectating does.
- Closing a window only ends that window's session.

Nothing needs turning on. The code is in
[`TournamentHandlers.cs`](https://github.com/somtum-fun/TomYum-OSS/blob/main/src/TomYum.Server/Bancho/Packets/TournamentHandlers.cs)
and the login handler.

## lazer {id=lazer}

lazer's tournament client is the game started with `--tournament` (`osu!.exe --tournament` on Windows).
It reads its server from the same place as the game, so a lazer build pointed at your server (see
[lazer](/clients/lazer)) works as a tournament client too, with nothing else to set up.

## osu!(stable) {id=osu-stable}

osu!(stable)'s tournament client starts its windows by itself, with `-spectateclient <n>` and **without**
the `-devserver` the player launched it with. Those windows connect to osu!'s servers, not yours.

Until there's a client-side fix, players send them to your server from their own PC with a proxy that
rewrites osu!'s hosts. With [Fiddler Classic](https://www.telerik.com/fiddler/fiddler-classic):

1. **Tools → Options → HTTPS**: tick *Capture HTTPS CONNECTs* and *Decrypt HTTPS traffic*, and trust
   Fiddler's certificate when Windows asks.
2. **Rules → Customize Rules**, and in `OnBeforeRequest` add (with your domain in place of
   `example.com`):

```js
if (oSession.RequestMethod != "CONNECT") {
    var h = oSession.hostname.ToLower();
    if (h == "ppy.sh" || h.EndsWith(".ppy.sh")) {
        // c.ppy.sh -> c.example.com, osu.ppy.sh -> osu.example.com, ...
        var newHost = h.Substring(0, h.Length - 6) + "example.com";
        oSession.utilCreateResponseAndBypassServer();
        oSession.oResponse.headers.HTTPResponseCode = 307;
        oSession.oResponse.headers.HTTPResponseStatus = "307 Temporary Redirect";
        oSession.oResponse["Location"] = "https://" + newHost + oSession.PathAndQuery;
        oSession.oResponse["Cache-Control"] = "no-cache";
    }
}
```

3. With Fiddler capturing, start `osu!.exe` (with `tournament.cfg` in its folder) **without**
   `-devserver`, and log in with an account on your server.

Every subdomain osu! uses (`c`, `osu`, `a`, `b`, …) must exist on your domain, as for a normal client:
see [domains](/guide/domains).

::: warning Tell your players
While the rule is on, everything on their PC that goes to ppy.sh goes to your server, including osu!'s
website in their browser, and Fiddler's certificate lets it read their HTTPS traffic. They should only
run it for the tournament, close Fiddler afterwards, and remove the certificate
(**Tools → Options → HTTPS → Actions → Reset All Certificates**) when they're done with it.
:::

::: danger Discord
Fiddler passes all of the PC's HTTPS traffic through itself, Discord's too. Tell players not to join
servers or do anything big on Discord (account settings, email, password, purchases) while Fiddler is open:
Discord may take it for a hacked account and ban it. Voice chat and normal messages are fine.
:::

::: tip
somtum.fun's player guide for this is on its wiki:
[Tournament client](https://osu.blueskychan.dev/wiki/Tournaments/Tournament_client). Feel free to adapt it
for your players.
:::
