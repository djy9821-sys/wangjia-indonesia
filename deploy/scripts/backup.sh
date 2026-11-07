#!/bin/sh
# pg_dump the main database, keep 14 days. Run inside the backup container.
USER="$1"; DB="$2"; DIR=/backups; DATE=$(date +%Y-%m-%d_%H%M)
mkdir -p "$DIR"
pg_dump -h postgres -U "$USER" -d "$DB" -Fc -f "$DIR/$DB-$DATE.dump" && echo "backup ok $DATE"
find "$DIR" -name "$DB-*.dump" -mtime +14 -delete
