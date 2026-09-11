# Backend deployment

The production backend is hosted on `202.61.244.120` and is available at:

```text
https://tabsync.nkson.com
```

Nginx terminates HTTPS and proxies requests to Bun on `127.0.0.1:3000`. PM2 runs the Bun process as the unprivileged `tabsync` user. SQLite data is stored outside the release directory at `/var/lib/tabsync/tabsync.sqlite`.

## Server layout

- Current release: `/opt/tabsync/current`
- Persistent data: `/var/lib/tabsync`
- PM2 application: `tabsync`
- PM2 system service: `pm2-tabsync.service`
- Nginx site: `/etc/nginx/sites-available/tabsync.nkson.com`
- TLS certificate: `/etc/letsencrypt/live/tabsync.nkson.com`

## Initial server setup

Install Nginx, Certbot, Node.js/npm, and Bun. Install PM2 globally with npm:

```sh
apt-get update
apt-get install -y nginx certbot python3-certbot-nginx ca-certificates curl unzip nodejs npm
curl -fsSL https://bun.sh/install | bash
install -m 0755 /root/.bun/bin/bun /usr/local/bin/bun
npm install --global pm2
```

Create the service account and persistent database directory:

```sh
useradd --system --home-dir /var/lib/tabsync --shell /usr/sbin/nologin tabsync
install -d -o tabsync -g tabsync -m 0750 /var/lib/tabsync
```

Deploy the repository so that `backend/` and `web/` remain siblings under a versioned directory in `/opt/tabsync/releases/`, then point `/opt/tabsync/current` to that release. Run `bun install --frozen-lockfile` and `bun test` from the deployed `backend/` directory before switching processes.

## PM2 process

The checked-in [`deploy/ecosystem.config.cjs`](deploy/ecosystem.config.cjs) contains the production process configuration. Start it as the `tabsync` user and persist the PM2 process list:

```sh
runuser -u tabsync -- env HOME=/var/lib/tabsync pm2 start /opt/tabsync/current/backend/deploy/ecosystem.config.cjs
runuser -u tabsync -- env HOME=/var/lib/tabsync pm2 save
install -m 0644 deploy/pm2-tabsync.service /etc/systemd/system/pm2-tabsync.service
systemctl daemon-reload
systemctl enable --now pm2-tabsync
```

The old application-specific systemd unit is not used and should not exist:

```sh
systemctl disable --now tabsync 2>/dev/null || true
rm -f /etc/systemd/system/tabsync.service
systemctl daemon-reload
```

Useful operational commands:

```sh
runuser -u tabsync -- env HOME=/var/lib/tabsync pm2 status
runuser -u tabsync -- env HOME=/var/lib/tabsync pm2 logs tabsync
runuser -u tabsync -- env HOME=/var/lib/tabsync pm2 restart tabsync --update-env
```

## Nginx and HTTPS

Install [`deploy/nginx.conf`](deploy/nginx.conf) as the Nginx site, enable it, and verify the configuration:

```sh
install -m 0644 deploy/nginx.conf /etc/nginx/sites-available/tabsync.nkson.com
ln -sfn /etc/nginx/sites-available/tabsync.nkson.com /etc/nginx/sites-enabled/tabsync.nkson.com
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx
```

Issue the certificate and enable the HTTP-to-HTTPS redirect:

```sh
certbot --nginx --non-interactive --agree-tos --register-unsafely-without-email --redirect --cert-name tabsync.nkson.com -d tabsync.nkson.com
certbot renew --dry-run --no-random-sleep-on-renew
```

`certbot.timer` handles automatic renewal. Add an account email with `certbot register --update-registration --email you@example.com` if expiry notifications are desired.

## Deploying an update

1. Run `bun test` locally.
2. Upload `backend/` and `web/` into a new versioned directory under `/opt/tabsync/releases/`.
3. Run `bun install --frozen-lockfile` and `bun test` on the server.
4. Update the `/opt/tabsync/current` symlink.
5. Run `runuser -u tabsync -- env HOME=/var/lib/tabsync pm2 restart tabsync --update-env`.
6. Verify the endpoints below before removing an older release.

## Verification

```sh
curl --fail https://tabsync.nkson.com/health
curl --fail --head https://tabsync.nkson.com/
curl --head http://tabsync.nkson.com/health
runuser -u tabsync -- env HOME=/var/lib/tabsync pm2 status
systemctl status nginx certbot.timer pm2-tabsync --no-pager
```

Expected results are `{"status":"ok"}`, a `200` response from the HTTPS web root, and a redirect from HTTP to HTTPS.

## Creating an account

Accounts can be created from either HTTPS web interface or through the API:

```sh
curl --fail https://tabsync.nkson.com/api/v1/auth/register \
  -H 'Content-Type: application/json' \
  --data '{"username":"USERNAME","password":"A-STRONG-PASSWORD"}'
```

The response contains a bearer token. Keep passwords and bearer tokens out of this deployment document and server logs.
