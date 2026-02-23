#!/bin/bash

# Setup cron job for automatic backups

CRON_SCHEDULE="${CRON_SCHEDULE:-0 2 * * *}"  # 2 AM daily по умолчанию

echo "Setting up backup cron job..."
echo "Schedule: $CRON_SCHEDULE"

# Создаём директорию для backups
mkdir -p /backups

# Создаём cron entry
(crontab -l 2>/dev/null; echo "$CRON_SCHEDULE cd /app && ./scripts/backup-db.sh >> /var/log/backup.log 2>&1") | crontab -

echo "✅ Cron job configured"
crontab -l
