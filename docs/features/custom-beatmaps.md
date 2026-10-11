# Custom beatmaps

Beatmap sets that exist only on your server, next to osu!'s. They use ids from **10,000,000** for
sets and difficulties, so they never collide with osu!'s (the website's id columns stop at
16,777,215). They can be uploaded from the staff panel or submitted from either game's editor, and
are downloaded, played and ranked like any other set.

## Uploading from the BN panel

BN panel → **Upload a custom beatmap set**: choose an `.osz` exported from the osu! editor, up to
100 MB.

- **New set**: leave "Update custom set" empty. The set and each difficulty get the next free ids.
- **Update**: give the custom set's link or id. Difficulties keep their id (and their scores) when
  their name is the same. New ones get new ids, and ones left out are removed from the website. A
  ranked, qualified or loved set can't be updated: set it back to pending first.

What happens to an upload:

1. Every `.osu` in the archive is read. All difficulties need the same artist and title, and
   different names.
2. The ids are written into each file (`BeatmapID`, `BeatmapSetID`), so the client and the website
   agree on them.
3. The set is stored with the rewritten files (in TomYum's `data/beatmaps`, on the `server-data`
   volume): the archive for downloads, the background, and the audio as the preview. The `.osu`
   files go into the `.osu` cache, so pp works.
4. Star rating and max combo are worked out from the files. The maps are saved as **pending** and
   copied to the website.
5. On the website, the mapper owns the set (the account named in the files' `Creator`, else the
   uploader). It gets a cover and is indexed for the listing. As on osu!, "… has submitted a new
   beatmap" goes into activity and the mapper's followers are notified.
6. The upload is written to the staff log (`beatmapset.upload`) and shows under "Recent uploads".

Refused: files that aren't `.osz`, sets with no difficulties, and difficulties already on the server.

The browser sends the file straight to TomYum (with a ticket the website signs with
`SHARED_INTEROP_SECRET`), so PHP's upload limits don't apply. Caddy allows 110 MB on `osu.`;
Cloudflare's own limit is 100 MB.

## Submitting from the game

Mappers submit their own sets from the editor, as on osu!, with osu!'s rules:

- Only the set's owner can change it, and nobody can once it's ranked, qualified or loved.
- Not while restricted or silenced.
- 1 to 128 difficulties.
- A limited number of sets in progress: 4, plus one per ranked set (up to 8). Supporters get 8, up to
  20. Administrators have no limit. Sets untouched for four weeks don't count.

TomYum keeps the files exactly as the client sent them, because the client knows its maps by their
checksums.

### stable

Editor → **Submit**. Nothing to set up: the client sends it to the server it's connected to
(`/web/osu-osz2-bmsubmit-getid.php`, `-upload.php`, `-post.php`). The description becomes the set's
description post on the website.

### lazer

Editor → **Submit**. Leave the ruleset's "Beatmap Submission Service Url" empty: lazer then uses
`<API Url>/beatmap-submission`, which Caddy sends to TomYum. TomYum checks lazer's login against the
website's Passport key (`oauth-public.key`, mounted by the production compose file) and lazer's
client id (5).

Not supported yet: guest difficulties uploaded on their own. The owner includes them in the set
instead.

## Where custom sets are served

| What | Where |
|---|---|
| Download (`.osz`) | `/d/{setId}` (osu!direct, and the website's download button) |
| osu!direct search | custom sets first on the first page, matched on artist, title, creator and difficulty |
| In-game status and leaderboards | from TomYum's own beatmaps when osu! doesn't know the checksum |
| Thumbnails, preview | `b.<domain>/thumb/{id}.jpg`, `{id}l.jpg`, `/preview/{id}.mp3` |
| Website covers and audio preview | `/uploads/default/beatmaps/{id}/…` on `osu.` (Caddy sends ids of 8+ digits to TomYum) |

Covers and thumbnails are cut from the background the first time they're asked for, and kept.

## Ranking, graveyard, dropped difficulties

- Ranking works like any other set: the BN panel's sets page, the nomination process on the website,
  or `!map` in-game.
- Custom sets still WIP or pending and untouched for four weeks go to the graveyard (checked daily);
  an update brings them back, with osu!'s "revived from eternal slumber" activity entry.
- A difficulty left out of a new version stops being playable and is removed from the website. Its
  scores stay in the database.
