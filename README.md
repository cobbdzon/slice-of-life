# Slice of Life

A personal journal with media attachments for each entry,
built over a week-long hackathon with friends.
One diary, one entry per day, optional images/videos.

## Stack

- [Bun](https://bun.sh) — runtime
- [Hono](https://hono.dev) — server and routing with server-side JSX templates
- [Drizzle ORM](https://orm.drizzle.team) + libSQL
  — SQLite database at `journal.db`
- [Sass](https://sass-lang.com) — compiled to `public/assets/css`
- JWT — short-lived cookie-based auth

## Development setup

Requires Bun ≥ 1.

```bash
bun install
```

Set up the environment. Copy the shape of `.env` —
all values are required at startup:

| Variable | Example | Description |
| --- | --- | --- |
| `JWT_SECRET` | `changeme` | Session cookie secret |
| `NODE_ENV` | `development` | `development`/`production` |
| `UPLOAD_DIR` | `./public/uploads/` | Uploads dir, trailing `/` |
| `UPLOAD_URL_PREFIX` | `/static/uploads/` | URL prefix, trailing `/` |
| `MAX_UPLOAD_FILE_SIZE` | `5` | Max upload size, MB |
| `UPLOAD_FILE_STALE_THRESHOLD` | `30` | Stale upload age, min |
| `GARBAGE_COLLECT_INTERVAL` | `60` | Cleanup interval, min |

Create the database schema:

```bash
bun run push
```

Run the dev servers (two processes):

```bash
bun run dev      # app, watches and restarts on changes
bun run sass     # styles, recompiles on changes
```

The app serves on `http://localhost:3000`.

## Production setup

Compile the SCSS once (without the watch flag):

```bash
bunx sass src/styles:public/assets/css
```

Then start the server:

```bash
NODE_ENV=production bun run start
```

Notes:

- `public/uploads/` must exist and be writable by the app user.
- Wire the app behind a reverse proxy (e.g. Caddy/Nginx)
  if you want TLS or a domain — see
  [Nginx reverse proxy](#nginx-reverse-proxy) for a ready-to-use server block.
- There is no static asset bundling — `src/` is served directly
  alongside the generated CSS.
- `journal.db` is checked in by default; add it to `.gitignore`
  (and drop the committed copy) if you don't want the dev database
  in the repo.

## Docker

The compose file reads `JWT_SECRET` and the upload settings from your shell
environment or the repo `.env`. Set a strong secret before starting:

```bash
JWT_SECRET=$(openssl rand -hex 32)   # put this in .env
docker compose up -d --build
```

The app binds to `127.0.0.1:3000` on the host, ready to sit behind the
[Nginx reverse proxy](#nginx-reverse-proxy). Two named volumes persist state:

| Volume | Mount | Contents |
| --- | --- | --- |
| `uploads` | `/app/public/uploads` | Uploaded media |
| `db` | `/data` | SQLite database (`journal.db`) |

On first start the entrypoint creates the schema with `drizzle-kit push`.
After changing `src/db/schema.ts`, apply it to a running stack:

```bash
docker compose run --rm app bun run push
```

Overridable env vars: `DATABASE_URL` (default `file:/data/journal.db`),
`PORT` (3000), `UPLOAD_DIR`, `UPLOAD_URL_PREFIX`, `MAX_UPLOAD_FILE_SIZE`,
`UPLOAD_FILE_STALE_THRESHOLD`, `GARBAGE_COLLECT_INTERVAL`, `LOG_LEVEL`.
Keep `MAX_UPLOAD_FILE_SIZE` below the reverse proxy's
`client_max_body_size` (`8m` in the sample config).

Without Compose:

```bash
docker build -t slice-of-life .
docker run -d --name slice-of-life -p 127.0.0.1:3000:3000 \
  -e JWT_SECRET=... \
  -v slice-of-life-uploads:/app/public/uploads \
  -v slice-of-life-db:/data \
  slice-of-life
```

## Nginx reverse proxy

The app speaks plain HTTP and expects TLS to be terminated in front of it.
Run it with `NODE_ENV=production` so the auth cookie is issued with the
`secure` flag, and keep `client_max_body_size` just above
`MAX_UPLOAD_FILE_SIZE` (default 5 MB — the sample below allows 8 MB to
leave room for multipart overhead).

Unlike a Nextcloud-style deployment this service needs **no WebSocket or
long-poll proxying**, and request bodies are small and fully buffered, so
the `proxy_buffering off` / `client_max_body_size 0` settings do **not**
apply here.

Replace `journal.example.com`, the certificate paths, and the upstream
address/port with your own values.

```nginx
# --- HSTS (http context) --------------------------------------------------
map $scheme $hsts_header {
    https "max-age=63072000; includeSubDomains; preload";
}

# --- Rate-limit zones (http context) --------------------------------------
limit_req_zone $binary_remote_addr zone=auth_limit:10m   rate=20r/m;
limit_req_zone $binary_remote_addr zone=upload_limit:10m rate=30r/m;

upstream slice_of_life {
    server 127.0.0.1:3000;
    keepalive 16;
}

# --- HTTP: ACME + redirect to HTTPS ---------------------------------------
server {
    listen 80;
    listen [::]:80;
    server_name journal.example.com;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 301 https://$host$request_uri;
    }
}

# --- HTTPS ----------------------------------------------------------------
server {
    listen 443 ssl;
    listen [::]:443 ssl;
    http2 on;
    server_name journal.example.com;

    # TLS
    ssl_certificate     /etc/letsencrypt/live/journal.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/journal.example.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 1d;
    ssl_session_tickets off;

    # Security headers
    add_header Strict-Transport-Security $hsts_header always;
    add_header X-Content-Type-Options    "nosniff" always;
    add_header X-Frame-Options           "SAMEORIGIN" always;
    add_header Referrer-Policy           "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy        "geolocation=(), microphone=(), camera=()" always;

    # Compression (Hono replies with HTML/JSON/CSS through the proxy)
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/javascript application/json image/svg+xml;

    # Must be >= MAX_UPLOAD_FILE_SIZE (env) + multipart overhead
    client_max_body_size 8m;

    # Proxy defaults
    proxy_http_version 1.1;
    proxy_set_header Host              $host;
    proxy_set_header X-Real-IP         $remote_addr;
    proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-Host  $host;
    proxy_set_header Connection        "";

    # Never expose dotfiles
    location ~ /\.(?!well-known) {
        deny all;
    }

    # Compiled CSS/JS/images — cacheable
    location /static/assets/ {
        proxy_pass http://slice_of_life;
        expires 30d;
        access_log off;
    }

    # Uploaded media — UUID filenames, safe to cache hard
    location /static/uploads/ {
        proxy_pass http://slice_of_life;
        expires 30d;
        add_header X-Content-Type-Options "nosniff" always;
    }

    # Auth: throttle credential stuffing (app has no built-in limiter)
    location = /login {
        limit_req zone=auth_limit burst=5 nodelay;
        limit_req_status 429;
        proxy_pass http://slice_of_life;
    }

    location = /register {
        limit_req zone=auth_limit burst=5 nodelay;
        limit_req_status 429;
        proxy_pass http://slice_of_life;
    }

    # Uploads: throttle abuse
    location = /api/upload {
        limit_req zone=upload_limit burst=10 nodelay;
        limit_req_status 429;
        proxy_pass http://slice_of_life;
    }

    location / {
        proxy_pass http://slice_of_life;
    }
}
```

If you'd rather reuse your existing `conf.d/include/*.conf` snippets
(`ssl-ciphers`, `http-security`, `proxy`, etc.), drop the matching blocks
above and include those instead — just omit `websockets.conf`, which this
app does not use.
