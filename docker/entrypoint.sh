#!/bin/sh
set -eu

# env.ts stats UPLOAD_DIR at startup; uploads are written here.
mkdir -p "${UPLOAD_DIR:-/app/public/uploads/}"

# Create the schema on a fresh volume, then skip.
DB_PATH="${DATABASE_URL:-file:/app/journal.db}"
DB_PATH="${DB_PATH#file:}"
if [ ! -f "$DB_PATH" ]; then
  echo "Initializing database schema at $DB_PATH"
  bunx drizzle-kit push
fi

exec "$@"
