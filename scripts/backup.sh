#!/bin/sh

set -eu

: "${POSTGRES_DB:=kalenda}"
: "${POSTGRES_USER:=kalenda}"
: "${POSTGRES_PASSWORD:?POSTGRES_PASSWORD is required}"
: "${BACKUP_INTERVAL_SECONDS:=86400}"
: "${BACKUP_RETENTION_DAYS:=30}"

backup_dir=/backups
data_dir=/data
timestamp=
work_dir=

cleanup() {
  if [ -n "${work_dir}" ] && [ -d "${work_dir}" ]; then
    rm -rf "${work_dir}"
  fi
}

trap cleanup EXIT INT TERM

mkdir -p "${backup_dir}"
export PGPASSWORD="${POSTGRES_PASSWORD}"

while :; do
  timestamp=$(date -u '+%Y%m%dT%H%M%SZ')
  work_dir="${backup_dir}/.kalenda-${timestamp}"
  mkdir "${work_dir}"

  pg_dump \
    --clean \
    --if-exists \
    --format=custom \
    --file="${work_dir}/database.dump" \
    --host=postgres \
    --username="${POSTGRES_USER}" \
    "${POSTGRES_DB}"

  tar \
    --create \
    --file="${work_dir}/data.tar" \
    --directory="${data_dir}" \
    .

  tar \
    --create \
    --gzip \
    --file="${backup_dir}/kalenda-${timestamp}.tar.gz" \
    --directory="${work_dir}" \
    database.dump \
    data.tar

  rm -rf "${work_dir}"
  work_dir=

  find "${backup_dir}" \
    -type f \
    -name 'kalenda-*.tar.gz' \
    -mtime "+${BACKUP_RETENTION_DAYS}" \
    -delete

  sleep "${BACKUP_INTERVAL_SECONDS}"
done
