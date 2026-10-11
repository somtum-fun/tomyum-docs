# Tickets

Email to your server's support addresses becomes tickets in the staff panel (**Tickets**,
`/panel/tickets`). It's a feature of the website fork (`App\Libraries\TomYumTickets`).

| Address | Category | Who handles it |
|---|---|---|
| `support@` | General support | SPT (Support Team) |
| `accounts@` | Account support | GMT |
| `appeal-review@` | Appeal review | GMT |
| `abuse@` | Abuse report | admins, developers |
| `privacy@` | Privacy request | admins, developers |
| `dmca@` | DMCA request | admins, developers |
| `tournaments@` | Tournaments | TC (Tournament Committee) |

Admins and developers see every category. SPT and TC are website groups (give them in the admin
panel); GMT is the existing one. `accounts@` is also the address the website shows for account
problems.

## Setting it up

1. Set up the website's outgoing mail (`MAIL_*` in `osu-web.env`; see the
   [configuration reference](/reference/configuration#mail)).
2. Make the seven addresses aliases of one mailbox, on your mail domain. By default that's the site's
   domain without `osu.` (`TICKETS_MAIL_DOMAIN` changes it). Mail to an address that isn't an alias
   bounces.
3. Turn on reading the mailbox over IMAP in `osu-web.env`:

```ini
TICKETS_IMAP_HOST=imap.example.com
# TICKETS_IMAP_PORT=993             # TLS
# TICKETS_IMAP_FOLDER=INBOX
# TICKETS_IMAP_USERNAME=            # by default the SMTP login (MAIL_USERNAME / MAIL_PASSWORD)
# TICKETS_IMAP_PASSWORD=
```

Then `docker compose up -d` from `deploy/production`, which restarts the website's services with it.

- The panel gets the **whole email**: the plain-text part (or the HTML one as text), without
  attachments and without the earlier messages a reply quotes.
- The folder is opened read-only: nothing is marked read or moved, so the mailbox can still be used in
  webmail. The first run only notes the newest message; mail from then on becomes tickets.
- Without `TICKETS_IMAP_HOST`, the fork falls back to reading a Zoho Mail account through NoCodeAPI
  (`NOCODEAPI_MAIL_URL`), which only gives the first ~250 characters of each email. IMAP is the better
  choice.

## Fetching

Every minute the website's scheduler runs `php artisan tomyum:tickets-fetch`. An email to a ticket
address becomes a ticket with an automatic reply, or joins the ticket its subject names
(`[Ticket #N]`, from the same sender; a closed ticket reopens). Mail from before the system started,
the server's own addresses, bounces and automatic replies are skipped. `TICKETS_ENABLED=false` stops
the fetching.

## Replying

Replies go from the ticket's address (or `MAIL_ADDRESS` if the mail server refuses that; the ticket's
address is then the reply-to) with `[Ticket #N]` in the subject, so answers thread back. Staff can
add staff-only notes, take a ticket or add other handlers, move it to another category, close it with
a reason, and reopen it.
