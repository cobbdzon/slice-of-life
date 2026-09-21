#!/bin/sh
set -eu

mkdir -p "${UPLOAD_DIR:-/app/public/uploads/}"

DB_PATH="${DATABASE_URL:-file:/app/journal.db}"
DB_PATH="${DB_PATH#file:}"
if [ ! -f "$DB_PATH" ]; then
  echo "Initializing database schema at $DB_PATH"
  bunx drizzle-kit push
fi

exec "$@"
