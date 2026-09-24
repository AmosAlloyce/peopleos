# Deploy PeopleOS on the existing Oracle server

The repository includes a Node 22 image and Docker Compose configuration for the portfolio, HR application, API, and Caddy reverse proxy. These files do not provision a server or alter existing services. Deployment needs the actual server address, SSH access, chosen hostname, and a check of what already uses ports 80 and 443.

## Details to provide for deployment

Copy the public IP from your running Oracle instance's details. Use the SSH username and private-key file you already use to connect to that instance. The key path must refer to a file on the machine where deployment commands will run; share only its absolute path, never its contents. If you do not know the username, include the instance's operating-system image so it can be checked.

In your DuckDNS account, create a subdomain, set its IP to the Oracle public IP, and save it. Share the full hostname, including `.duckdns.org`. Keep the DuckDNS account token private; it is not needed in chat.

Send this template with your own values:

```text
Oracle public IP:
SSH username:
Local private-key path:
DuckDNS hostname:
Existing sites or services on this server: (list them, or say unknown)
Optional Groq: demo mode / key configured locally
```

Live AI is optional. Create a key in your Groq account and enter it directly as `GROQ_API_KEY` in `/home/alloyce/wave/.env` for the local preview, or in the deployment directory's `.env` on the server. Do not paste it into chat. Leave it blank to use the complete deterministic demo. Restart the local API after editing the value; the server deployment steps are below.

## Capacity and prerequisites

Use Docker Engine with the Compose plugin. Build on the server's native architecture; the Node and Caddy images support the normal ARM64/AMD64 path. A small demonstration does not require local model inference or a continuously running process per agent. The Compose runtime limits are 384 MB for the app and 128 MB for Caddy; image builds need additional temporary memory and disk.

Oracle currently documents A1 Always Free resources equivalent to **2 OCPUs and 12 GB**. Verify the existing tenancy's **Limits, Quotas and Usage**, shape, memory, disk, and other workloads before changing anything; older 4 OCPU/24 GB guides are not reliable for every tenancy. Idle Always Free instances can be reclaimed. [Oracle documentation](https://docs.oracle.com/en-us/iaas/Content/FreeTier/freetier_topic-Always_Free_Resources.htm)

## 1. Preview Docker locally

Run from the project directory:

```sh
cp .env.example .env
docker compose config --quiet
docker compose up -d --build
docker compose ps
curl --fail http://127.0.0.1:3001/api/health
```

The example environment exposes Caddy at `http://localhost:8080` and the API on the host's loopback interface at port 3001. Visit `/` for the portfolio and `/app` for PeopleOS. If `.env` already exists, edit it instead of overwriting it. Use `docker compose logs --tail=80 app caddy` for startup diagnostics.

## 2. Connect the approved hostname

Create the DuckDNS subdomain you want and point it to the chosen server's public IP. Keep the DuckDNS token outside the repository. The DuckDNS dashboard can set the IP directly; their update API supports later dynamic-IP refresh. Verify any existing AAAA record as well as the A record. [DuckDNS specification](https://www.duckdns.org/spec.jsp)

Allow inbound TCP 80 and 443 in the applicable Oracle network security group/security list and host firewall. Restrict SSH to the intended administration path. UDP 443 is optional for HTTP/3. Caddy can request and renew a certificate when DNS and inbound validation work. [Caddy automatic HTTPS](https://caddyserver.com/docs/automatic-https)

If an existing reverse proxy owns those ports, integrate the new hostname into that proxy using a reachable PeopleOS upstream as described below; start only `app` with this Compose file. Do not replace the existing site's proxy configuration blindly.

### Deploying alongside existing sites

For the authorized shared host, add `alloyce-amos.duckdns.org` while preserving `three-dollar-motel.duckdns.org` and `amos-alloyce-portfolio.duckdns.org`. First identify the existing reverse proxy, its configuration and reload mechanism, the Docker networks it uses, and an unused loopback port for PeopleOS. Record a working response from each existing hostname before the change.

Use a separate PeopleOS directory and the `peopleos` Compose project. Set `APP_PORT` to the verified available port and `PUBLIC_ORIGIN=https://alloyce-amos.duckdns.org`. Start only the application:

```sh
docker compose config --quiet
docker compose up -d --build app
```

Keep the existing proxy as the owner of ports 80/443. Add only a new hostname route after backing up its configuration, validate the complete configuration, and reload it using its existing mechanism. A proxy running directly on the host can reach `127.0.0.1:APP_PORT`. A containerized proxy has its own loopback interface: use an explicitly shared Docker network and a unique PeopleOS service alias, or its existing host-access arrangement. Do not assume the bundled `app:3001` upstream resolves inside a different Compose project.

Verify the new hostname and both existing hostnames after the reload, including HTTPS and their expected content. If the new route fails, revert that route and stop only the PeopleOS application as needed; leave the other applications and their volumes running.

Local `groq.txt`, private keys, and key backups are excluded from Git and the Docker build context. A custom `tar`, `scp`, or `rsync` transfer does not automatically honor those exclusions: exclude them explicitly and inspect archive filenames before upload. Transfer the Groq value separately into the server's restricted `.env` without printing it. Keep the SSH private key on the deployment machine; it does not belong on the application server or in a release archive.

## 3. Configure and launch

Transfer the repository to a new project directory on the approved server, excluding `.env`, keys, `.git` if unnecessary, `node_modules`, and local outputs. Set these values in the server's `.env`:

```dotenv
SITE_ADDRESS=your-chosen-name.duckdns.org
PUBLIC_ORIGIN=https://your-chosen-name.duckdns.org
HTTP_PORT=80
HTTPS_PORT=443
APP_PORT=3001
GROQ_API_KEY=
GROQ_MODEL=openai/gpt-oss-20b
N8N_API_TOKEN=
```

For a server where PeopleOS owns the reverse proxy, run the following. On the shared host, use the application-only command above instead of starting the bundled Caddy service.

```sh
chmod 600 .env
docker compose config --quiet
docker compose up -d --build
docker compose ps
curl --fail https://your-chosen-name.duckdns.org/api/health
```

Use the real hostname in place of the example. Avoid printing `docker compose config` without `--quiet` when provider secrets are configured: resolved environment values can appear in its output. The app port is bound to loopback; public requests pass through the configured proxy. Compose sets `TRUST_PROXY=1` for the single Caddy hop so client IP/protocol forwarding works. Keep the app port private; review that setting if the proxy topology changes.

## 4. Optional Groq responses

The demo runs without a key. To enable model-written explanations, put `GROQ_API_KEY` in the server's `.env`, confirm `GROQ_MODEL` is available to that account, and recreate the app with `docker compose up -d app`. Set provider-side usage limits for a public demo. The API sends aggregate demo context and fictional handbook content, and labels successful live responses or deterministic fallback.

Current default: `openai/gpt-oss-20b`. Groq's catalogue and account limits can change; check them before enabling live traffic. The server's key must never appear in a browser variable, workflow export, video, or public repository. [Groq models](https://console.groq.com/docs/models), [Groq usage limits](https://console.groq.com/docs/rate-limits)

## 5. Launch checks

Open the HTTPS portfolio, play the embedded demo, and enter the app. Run migration, inspect the staged fixes, approve, and confirm the issue count and audit change. Verify that a second browser/private session starts fresh. Check mobile navigation and that an app deep link can reload. Voice requires a supported browser and user microphone permission; text remains available.

## State, operations, and rollback

Visitor workspaces have a two-hour inactivity expiry. Compose sets `DATA_DIR=/app/data` and mounts `peopleos_data` there, enabling SQLite persistence for unexpired demo sessions. The image creates that directory with the non-root app user's ownership before the new named volume is initialized. Memory-only development is available by leaving `DATA_DIR` unset. Caddy certificate/account data persists in separate named volumes. This release is a single-process public demonstration, not an enterprise HR database.

Keep a copy of the previous release directory or tag/image before an update. After building a new image and passing launch checks, retain the previous image for rollback. Reverting the source/image and recreating `app` restores prior code; check persisted-state compatibility before a downgrade. Preserve the app and Caddy volumes during ordinary updates. For a consistent backup, stop the app before copying its data volume, or use a SQLite-aware backup process. Pin tested base-image digests for a long-lived release and refresh them deliberately.

The n8n export in `public/workflows/` can run on an existing n8n instance. It does not require n8n to be installed on this server. For an external instance, use the deployed HTTPS URL; for containers on a shared network, use the application service address.

Before using real employee data, replace the demo session mechanism with real authentication and authorization, add durable transactional storage and protected audit retention, and validate country-specific policies and integrations. See [architecture](ARCHITECTURE.md) for the explicit boundary.
