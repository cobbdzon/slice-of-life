# Slice of Life

A personal journal with media attachments for each entry, built over a week-long hackathon with friends. One diary, one entry per day, optional images/videos.

## Stack

- [Bun](https://bun.sh) — runtime
- [Hono](https://hono.dev) — server and routing, with server-side JSX templates
- [Drizzle ORM](https://orm.drizzle.team) + libSQL — SQLite database at `journal.db`
- [Sass](https://sass-lang.com) — compiled to `public/assets/css`
- JWT — short-lived cookie-based auth

## Development setup

Requires Bun ≥ 1.

```bash
bun install
```

Set up the environment. Copy the shape of `.env` — all values are required at startup:

| Variable                    | Example                 | Description                          |
| --------------------------- | ----------------------- | ------------------------------------ |
| `JWT_SECRET`                | `changeme`              | Secret for signing session cookies   |
| `NODE_ENV`                  | `development`           | `development` or `production`        |
| `UPLOAD_DIR`                | `./public/uploads/`     | Disk directory for uploaded files, trailing slash |
| `UPLOAD_URL_PREFIX`         | `/static/uploads/`      | URL prefix that serves uploaded files, trailing slash |
| `MAX_UPLOAD_FILE_SIZE`      | `5`                     | Max upload size in MB                |
| `UPLOAD_FILE_STALE_THRESHOLD` | `30`                  | Minutes before an orphaned upload is eligible for cleanup |
| `GARBAGE_COLLECT_INTERVAL`  | `60`                    | Minutes between upload cleanup runs  |

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
- Wire the app behind a reverse proxy (e.g. Caddy/Nginx) if you want TLS or a domain.
- There is no static asset bundling — `src/` is served directly alongside the generated CSS.
- `journal.db` is checked in by default; add it to `.gitignore` (and drop the committed copy) if you don't want the dev database in the repo.
