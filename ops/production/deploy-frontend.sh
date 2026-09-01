#!/usr/bin/env bash

set -euo pipefail

bundle_directory="${1:?The verified static bundle directory is required.}"
revision="${2:?The immutable Git revision is required.}"

if ! [[ "$revision" =~ ^[0-9a-f]{40}$ ]]; then
  echo 'Pull-it frontend revision must be a full lowercase Git SHA.' >&2
  exit 1
fi

if [ ! -f "$bundle_directory/index.html" ]; then
  echo 'Pull-it frontend bundle does not contain index.html.' >&2
  exit 1
fi

ops/production/verify-frontend-bundle.sh "$bundle_directory"

frontend_root='/opt/pullit/frontend'
releases_directory="$frontend_root/releases"
release_directory="$releases_directory/$revision"
staging_directory=''

cleanup() {
  if [ -n "$staging_directory" ] && [ -d "$staging_directory" ]; then
    rm -rf "$staging_directory"
  fi
}
trap cleanup EXIT

install -d -m 750 "$releases_directory"

if [ ! -d "$release_directory" ]; then
  staging_directory="$(mktemp -d "$releases_directory/.staging.XXXXXXXX")"
  cp -a "$bundle_directory/." "$staging_directory/"
  test -f "$staging_directory/index.html"
  find "$staging_directory" -type d -exec chmod 755 {} +
  find "$staging_directory" -type f -exec chmod 644 {} +
  mv "$staging_directory" "$release_directory"
  staging_directory=''
fi

next_link="$frontend_root/.current-next"
ln -s "$release_directory" "$next_link"
mv -Tf "$next_link" "$frontend_root/current"

docker compose -p pullit-frontend -f ops/production/docker-compose.frontend.yml config --quiet
docker compose -p pullit-frontend -f ops/production/docker-compose.frontend.yml up -d
curl --fail --silent --show-error --retry 5 --retry-delay 2 http://127.0.0.1:18081/pull-it/ >/dev/null
