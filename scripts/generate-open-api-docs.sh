export OPEN_API_PATH=${OPEN_API_PATH:-./temp/$(date +%FT%T%Z)} 
npm run build
APP_LOG_LEVEL=crit npm run integration 
ts-node ./dist/shared/lib/open-api-docs-generator.lib.script.js 
./node_modules/.bin/redocly build-docs ./temp/openapi.yaml --output=./temp/openapi.html --template=./src/shared/lib/open-api-docs-generator.lib.redoc.hbs