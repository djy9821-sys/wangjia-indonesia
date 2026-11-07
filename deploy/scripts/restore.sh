#!/bin/sh
# Restore the main database from a dump made by backup.sh.
#   docker compose -f deploy/docker-compose.yml --env-file deploy/.env run --rm \
#     -v wangjia_backups:/backups backup sh /restore.sh <user> <db> /backups/<file>.dump
# Stops nothing by itself: scale the backend down first so no writes land mid-restore:
#   docker compose -f deploy/docker-compose.yml --env-file deploy/.env stop backend
# and start it again afterwards (it re-runs migrations, which is harmless).
set -eu
USER="$1"; DB="$2"; FILE="$3"
[ -f "$FILE" ] || { echo "dump not found: $FILE"; exit 1; }
echo "Restoring $FILE into $DB (existing data will be replaced)…"
# Terminate other sessions, recreate the database, restore with ownership stripped.
psql -h postgres -U "$USER" -d postgres -v ON_ERROR_STOP=1 -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname='$DB' AND pid <> pg_backend_pid();"
psql -h postgres -U "$USER" -d postgres -v ON_ERROR_STOP=1 -c "DROP DATABASE IF EXISTS \"$DB\";" -c "CREATE DATABASE \"$DB\";"
pg_restore -h postgres -U "$USER" -d "$DB" --no-owner --no-privileges --exit-on-error "$FILE"
echo "restore ok: $(psql -h postgres -U "$USER" -d "$DB" -tAc 'select count(*) from "order"') orders"
