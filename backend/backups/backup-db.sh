#!/usr/bin/env bash
set -e

# Where to store backups
BACKUP_DIR="/root/dopehkai/backend/backups"
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"

mkdir -p "$BACKUP_DIR"

echo "[$(date -Is)] Starting backup..."

# 1) MongoDB dump (local)
mongodump \
  --uri="mongodb://localhost:27017/dopehkai" \
  --archive="$BACKUP_DIR/mongo-$TIMESTAMP.archive.gz" \
  --gzip

# 2) (Optional) backup old JSON DB if it still exists
if [ -f "/root/dopehkai/backend/data/database.json" ]; then
  cp "/root/dopehkai/backend/data/database.json" "$BACKUP_DIR/database-$TIMESTAMP.json"
fi

echo "[$(date -Is)] Backup finished."
