# Live deployment — 24 September 2026

- Portfolio: https://alloyce-amos.duckdns.org
- HR workspace: https://alloyce-amos.duckdns.org/app
- Recorded demo: https://alloyce-amos.duckdns.org/demo/peopleos-demo.mp4

The portfolio and PeopleOS run on the user's existing Oracle ARM64 server. The existing Caddy container serves the new hostname with HTTPS alongside `three-dollar-motel.duckdns.org` and `amos-alloyce-portfolio.duckdns.org`. Both existing sites returned HTTP 200 before and after the change; their routing blocks were preserved.

## Release and configuration

| Item | Location or value |
| --- | --- |
| Current release link | `/home/ubuntu/peopleos/current` |
| Release directory | `/home/ubuntu/peopleos/releases/20260924-peopleos-v1` |
| Private server environment | `/home/ubuntu/peopleos/shared/.env`, mode `600` |
| Compose configuration | `compose.yaml` plus `deploy/compose.shared.yaml`; start only `app` |
| App container | `peopleos-app-1` |
| Shared Docker network | `three-dollar-motel_default` |
| Proxy upstream | `peopleos-app:3001` |
| Host diagnostic endpoint | `http://127.0.0.1:3001/api/health` |
| SQLite volume | `peopleos_peopleos_data` |
| Existing proxy | `three-dollar-motel-caddy-1` |
| Active proxy file | `/home/ubuntu/three-dollar-motel/deploy/Caddyfile` |
| Previous proxy configuration | `/home/ubuntu/peopleos/backups/Caddyfile-before-20260924-peopleos-v1` |

The app runs as the non-root `node` user with a read-only container filesystem, a writable SQLite volume, a 384 MB memory limit and automatic restart. Observed app memory after deployment was approximately 23 MiB; this is a point-in-time observation, not a capacity estimate. No second public proxy was started.

Groq is enabled on the server using `openai/gpt-oss-20b`. A real public chat request returned `mode=live` and `provider=groq`, retaining its grounding sources. Workflows still use deterministic tools and human approval. Provider unavailability produces the labeled demo fallback.

## Operations

Connect using the existing SSH credentials, then:

```sh
cd /home/ubuntu/peopleos/current
sudo docker compose -f compose.yaml -f deploy/compose.shared.yaml ps app
sudo docker compose -f compose.yaml -f deploy/compose.shared.yaml logs --tail=80 app
curl --fail https://alloyce-amos.duckdns.org/api/health
```

After changing the private environment file, recreate only the app:

```sh
sudo docker compose -f compose.yaml -f deploy/compose.shared.yaml up -d --wait app
```

Never run `compose down` on the existing motel or portfolio projects to maintain this app. Preserve the SQLite and Caddy volumes during updates. Transfer future releases with an explicit source-file allowlist; `.gitignore` and `.dockerignore` do not protect arbitrary tar or file-copy commands.

To retire this hostname, remove only its block from the existing Caddyfile, validate, and reload Caddy before stopping the PeopleOS app. The saved original proxy file is suitable for immediate rollback only if no subsequent routing changes have occurred. The proxy bind-mounts a single file, so retain that file's inode when writing updated contents.

## Verification

`scripts/verify-live.mjs` passed against the public HTTPS endpoint: Secure/HttpOnly/SameSite cookies, separate fictional visitor sessions, 16 proposed migration corrections with no early writes, human approval, audit updates, cross-session access denial, duplicate-approval conflict, and an actual Groq response. It never logs credential or cookie values.

The public portfolio browser checks passed at 1440, 768, 390 and 320 px: responsive layout, navigation, interactive diagram, video dialog, keyboard focus, and reduced motion, with no runtime errors or overflow. The public media check confirmed video decoding, playback, seeking, all ten caption cues and HTTP byte-range responses. It explicitly requests playback to handle browsers that block audible autoplay. Microphone recognition accuracy still depends on the visitor's device and browser.

The earlier local acceptance and Docker restart evidence remains in [VERIFICATION.md](VERIFICATION.md). The public demo still contains fictional data only and is not connected to Workday or any production HR system.
