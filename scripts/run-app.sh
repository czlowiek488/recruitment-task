#!/bin/bash
set -e
npm_config_env=${npm_config_env:-docker}
echo "script#run-app > running - APP_ENV=$npm_config_env"
echo "script#run-app > running - COMMAND='$COMMAND'"
if [ "$npm_config_env" = "local" ]; then
  APP_ENV=$npm_config_env sh -c "$COMMAND"
else 
  APP_ENV=$npm_config_env npm run run-in-docker --command="$COMMAND"
fi
