#!/bin/sh
set -e
cd /opt/render/project/src/apps/api || exit 1
exec node dist/node-server.mjs
