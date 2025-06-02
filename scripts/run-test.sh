#!/bin/bash

set -e

COMMAND="./node_modules/.bin/vitest --coverage=false --run --config=\"$CONFIG_PATH\" --dir=\"$DIRECTORY\" $npm_config_file"

if [ -n "$npm_config_name" ]; then
  COMMAND="$COMMAND -t \"$npm_config_name\""
fi

COMMAND="$COMMAND $npm_config_args"
EMPTYING_DATABASE_ALLOWED=true COMMAND="$COMMAND" ./scripts/run-app.sh
