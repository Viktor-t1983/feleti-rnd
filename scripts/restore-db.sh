#!/bin/bash

# FELETI Database Restore Script

set -e

if [ -z "$1" ]; then
  echo "Usage: ./restore-db.sh <backup_file>"
  echo "Example: ./restore-db.sh /backups/feleti_backup_20260220_120000.sql.gz"
  exit 1
fi

BACKUP_FILE="$1"
DB_NAME="${POSTGRES_DB:-feleti_rnd}"
DB_USER="${POSTGRES_USER:-feleti}"
DB_HOST="${DB_HOST:-postgres}"

if [ ! -f "$BACKUP_FILE" ]; then
  echo "❌ Backup file not found: $BACKUP_FILE"
  exit 1
fi

echo "⚠️  WARNING: This will OVERWRITE the current database!"
echo "Database: $DB_NAME"
echo "Backup: $BACKUP_FILE"
read -p "Continue? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
  echo "Cancelled."
  exit 0
fi

echo "🔄 Restoring from: $BACKUP_FILE"

# Restore
PGPASSWORD="${POSTGRES_PASSWORD}" pg_restore \
  -h "$DB_HOST" \
  -U "$DB_USER" \
  -d "$DB_NAME" \
  --clean \
  --if-exists \
  "$BACKUP_FILE"

echo "✅ Restore complete!"
