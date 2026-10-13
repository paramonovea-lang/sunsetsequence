# 09 · Deployment on the VPS

The site is static files + media, served by Caddy with automatic HTTPS on the owner's VPS
(Ubuntu 22.04 LTS — the host only offers 20.04 for reinstalls; DNS at the registrar). Nothing music-related runs on the server: Strudel runs in
the visitor's browser, releases are audio files (currently WAVs rendered in Strudel).

## Ubuntu 22.04: before April 2027

Free security updates for 22.04 end in **April 2027**. Before then either upgrade in place
(`sudo do-release-upgrade`, ~30 min, one reboot; re-run `deploy/server-setup.sh` after) or attach free
Ubuntu Pro (`sudo pro attach <token>`, personal use, updates until 2032). Owner decides.

## Hard limits

- Only configure the **site VPS**. Any other server, domain or DNS record is out of scope: never change it.
- The site's domain is **sunsetsequence.com**. Only its `@` and `www` records belong to the site, and the owner changes DNS.
- Ask the owner before changing DNS, buying anything, publishing (removing the launch password), or opening ports beyond 22/80/443.
- Don't change how the owner logs in (SSH settings for `root`) without asking. fail2ban limits guessing.

## Access

- User `claude` logs in with the key `~/.ssh/sunsetsequence_claude` on the owner's PC; SSH alias `sunsetsequence` in `~/.ssh/config`.
- Created by the owner as root:
  ```bash
  adduser --disabled-password --gecos "" claude
  install -d -m 700 -o claude -g claude /home/claude/.ssh
  echo 'ssh-ed25519 … claude@sunsetsequence' > /home/claude/.ssh/authorized_keys
  chown claude:claude /home/claude/.ssh/authorized_keys && chmod 600 /home/claude/.ssh/authorized_keys
  echo 'claude ALL=(ALL) NOPASSWD:ALL' > /etc/sudoers.d/90-claude && chmod 440 /etc/sudoers.d/90-claude
  ```
- **Narrowed on 13 Oct 2026** (after the launch): `deploy/sudoers-claude` is installed as `/etc/sudoers.d/90-claude`.
  `claude` may only reload and check Caddy, write `/etc/caddy/Caddyfile` and `/etc/caddy/auth.caddy` (with
  `sudo tee`), validate as `caddy`, and read `ufw`/`fail2ban` status. Deploys need no sudo. Anything else
  (updates, reboots, `server-setup.sh`) is done by the owner as root, or the owner widens sudo for a while.
- Updating the Caddyfile under the narrowed rules:
  `cat deploy/Caddyfile | ssh sunsetsequence 'sudo tee /etc/caddy/Caddyfile >/dev/null && sudo -u caddy caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile && sudo systemctl reload caddy'`

## Server setup (once)

```bash
ssh sunsetsequence 'sudo bash -s' < deploy/server-setup.sh
```

`deploy/server-setup.sh`: updates, automatic security updates, firewall (22/80/443), fail2ban for SSH,
Caddy from its official repository, `/srv/sunsetsequence/{site,media}` owned by `claude`, an empty
`/etc/caddy/auth.caddy`. Safe to run again.

## Caddy

`deploy/Caddyfile` → `/etc/caddy/Caddyfile`, then `sudo -u caddy caddy validate --config /etc/caddy/Caddyfile` and
`sudo systemctl reload caddy`. Validate as the `caddy` user: run as root, it creates the log file owned
by root and the reload then fails (happened on 12 Oct 2026).

- **One security policy for all pages** (`deploy/headers.json`, checked against the Caddyfile by
  `src/lib/deploy-config.test.ts`, and sent by `scripts/serve.mjs` so the browser tests run under it).
  The original plan had a strict policy on most pages and a relaxed one on lessons, but the site
  navigates without reloads, so the first page's policy stays for the whole visit; Strudel needs
  `'unsafe-eval'`, blob workers and https samples, and Astro inlines small scripts (`'unsafe-inline'`).
- `/_astro/*` and `/covers/*` are cached for a year (file names change when content changes);
  `/media/*` for a day.
- 404s show `404.html`; the error handler only catches 404, so the password prompt (401) still works.
- HSTS `includeSubDomains` applies to sunsetsequence.com subdomains (there are none).

## Launch password

Until the owner approves the launch, `/etc/caddy/auth.caddy` (root:caddy, 640) holds the user `preview`;
the password is in a text file on the owner's PC, never in git or chat:

```
basic_auth {
	<user> <bcrypt hash from: caddy hash-password>
}
```

**Launch** (done 13 Oct 2026): the file was emptied and Caddy reloaded; the preview version is kept as
`/etc/caddy/auth.caddy.preview-backup-2026-10-13`. To protect the site again, the owner copies it back and reloads Caddy.

## Deploy

```bash
npm run deploy            # build, upload site + media
npm run deploy -- --site  # site only
```

`scripts/deploy.sh` builds, streams `dist/` as a tar archive over SSH into `site.new`, then swaps it for
`site` in one move (the old version stays as `site.old` until the next deploy). There is no rsync on the
owner's Windows PC, so tar over SSH is used. `media/` is added on top (never deleted remotely). Everything in `media/` is public at a predictable
URL (`/media/audio/sq-00n.wav`) as soon as it is uploaded, so put a release's audio there only when the
release is ready, and delete withdrawn files on the server by hand.

## Media

- `media/audio/sq-00n.wav` (rendered in Strudel; peaks via `node scripts/wav-peaks.mjs`), or a 320 kbps
  `.mp3` with peaks from `npm run peaks` (audiowaveform); `media/peaks/*.json`; `media/stems/*.zip`.
- Kept out of git. Alternative if bandwidth costs matter (Q5): host audio on a CDN and set `PUBLIC_MEDIA_BASE`.

## DNS (owner)

- `@` A → the VPS IPv4, `@` AAAA → the VPS IPv6, `www` A/AAAA (or CNAME to `sunsetsequence.com.`).
- Caddy gets certificates automatically once DNS points here and ports 80/443 are open.
- Check: `https://sunsetsequence.com` asks for the launch password, `www` redirects, a track plays, a lesson Run plays.

## Backups

The repo is the backup for the site; back up `media/` to a second location (owner's PC or object storage).
