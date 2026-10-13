#!/usr/bin/env bash
# Build and upload the site to the VPS (docs/09). Needs the SSH host alias `sunsetsequence`
# (or DEPLOY_HOST). No rsync on Windows, so the files travel as a tar stream over SSH and the
# new folder replaces the old one in one move: visitors never see a half-uploaded site.
# Usage: npm run deploy            (site + media)
#        npm run deploy -- --site  (site only)
set -euo pipefail
HOST=${DEPLOY_HOST:-sunsetsequence}
ROOT=/srv/sunsetsequence
cd "$(dirname "$0")/.."

npm run build

echo "== uploading site to $HOST"
tar -C dist -czf - . | ssh "$HOST" "set -e
  rm -rf $ROOT/site.new && mkdir -p $ROOT/site.new
  tar -xzf - -C $ROOT/site.new
  rm -rf $ROOT/site.old
  if [ -d $ROOT/site ]; then mv $ROOT/site $ROOT/site.old; fi
  mv $ROOT/site.new $ROOT/site
  echo \"site: \$(find $ROOT/site -type f | wc -l) files\""

if [ "${1:-}" != "--site" ] && [ -d media ]; then
  echo "== uploading media"
  tar -C media -czf - . | ssh "$HOST" "set -e; mkdir -p $ROOT/media; tar -xzf - -C $ROOT/media; echo \"media: \$(find $ROOT/media -type f | wc -l) files\""
fi
echo "== deployed"
