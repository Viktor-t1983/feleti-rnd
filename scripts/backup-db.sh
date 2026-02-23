#!/bin/bash

# FELETI Database Backup Script
# Создаёт backup PostgreSQL и сохраняет локально

set -e

# Конфигурация
BACKUP_DIR="${BACKUP_DIR:-/backups}"
RETENTION_DAYS="${RETENTION_DAYS:-7}"
DB_NAME="${POSTGRES_DB:-feleti_rnd}"
DB_USER="${POSTGRES_USER:-feleti}"
DB_HOST="${DB_HOST:-postgres}"

# Timestamp
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="feleti_backup_${TIMESTAMP}.sql.gz"

echo "🔄 Starting backup: $BACKUP_FILE"

# Создаём директорию если не существует
mkdir -p "$BACKUP_DIR"

# Backup с compression
if PGPASSWORD="${POSTGRES_PASSWORD}" pg_dump \
  -h "$DB_HOST" \
  -U "$DB_USER" \
  -d "$DB_NAME" \
  --format=custom \
  --compress=9 \
  --file="${BACKUP_DIR}/${BACKUP_FILE}"; then
  echo "✅ Backup created: ${BACKUP_DIR}/${BACKUP_FILE}"
else
  echo "❌ Backup failed"
  exit 1
fi

# Размер файла
du -h "${BACKUP_DIR}/${BACKUP_FILE}"

# Очистка старых backup (старше RETENTION_DAYS)
echo "🧹 Cleaning old backups (older than $RETENTION_DAYS days)..."
find "$BACKUP_DIR" -name "feleti_backup_*.sql.gz" -mtime +$RETENTION_DAYS -delete 2>/dev/null || true

# Список оставшихся backups
echo "📦 Available backups:"
ls -lh "$BACKUP_DIR"/feleti_backup_*.sql.gz 2>/dev/null || echo "No backups found"

echo "✅ Backup complete!"
