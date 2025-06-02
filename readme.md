# Boilerplate App

## Running
1. build application - `npm run build`
2. start application - `npm run start`

## First Contact

### Result class
Entire project is based on `Result` class. This is the one and only class in entire project.

It's a class because it extends `Error` class in order to provide a good way of error handling and simple error throwing. 

This `Result` class will build chain of errors if you pass a `cause` when creating error using `Result`. This chain provides huge visibility in application.

### OpenApi docs
Open api documentation is generated based on network traffic from integration tests.

Documentation `should not` be committed to repository, it should be always generated on demand.

You can easily generate and open open api web documentation with one command `npm run open-api-docs`.

Openapi generation requires adjustments per project, depending on amount of tests and passed data you may need to modify way output openapi.yaml looks like.

### Testing
Tests may change env variables at runtime.

If you do condition check at file level it will permanently set env and may `lead to unexpected behaviour`. 

If condition is checked inside a function env variable will be changed according to tests.

### Testing environment
Integration tests use network connection to communicate with other services described in docker-compose.yml.

Those tests `must run inside a docker on host machine`, docker in docker approach after multiple tries were never established.

If you decide to try, increase counter below for future developers.

`154` hours spent on trying to run this kind of tests with docker in docker approach. 

### eslint
In this project for running eslint in container there is special formatter in file `eslint.formatter.mjs`.

It changes filepaths eslint shows in output in the way you can click them and will be redirected to the filed.

### nvm
This package contains .nvmrc file used by nvm (node version manager)

1. To install nvm run script below
   `curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.4/install.sh | bash`
2. To setup nvm to change version automatically to the one specified in .nvmrc put scrip below into your ~/.bashrc file

   ```
   cdnvm() {
     command cd "$@" || return $?
     nvm_path=$(nvm_find_up .nvmrc | tr -d '\n')

     # If there are no .nvmrc file, use the default nvm version
     if [[ ! $nvm_path = *[^[:space:]]* ]]; then

         declare default_version;
         default_version=$(nvm version default);

         # If there is no default version, set it to `node`
         # This will use the latest version on your machine
         if [[ $default_version == "N/A" ]]; then
             nvm alias default node;
             default_version=$(nvm version default);
         fi

         # If the current version is not the default version, set it to use the default version
         if [[ $(nvm current) != "$default_version" ]]; then
             nvm use default;
         fi

     elif [[ -s $nvm_path/.nvmrc && -r $nvm_path/.nvmrc ]]; then
         declare nvm_version
         nvm_version=$(<"$nvm_path"/.nvmrc)

         declare locally_resolved_nvm_version
         # `nvm ls` will check all locally-available versions
         # If there are multiple matching versions, take the latest one
         # Remove the `->` and `*` characters and spaces
         # `locally_resolved_nvm_version` will be `N/A` if no local versions are found
         locally_resolved_nvm_version=$(nvm ls --no-colors "$nvm_version" | tail -1 | tr -d '\->*' | tr -d '[:space:]')

         # If it is not already installed, install it
         # `nvm install` will implicitly use the newly-installed version
         if [[ "$locally_resolved_nvm_version" == "N/A" ]]; then
             nvm install "$nvm_version";
         elif [[ $(nvm current) != "$locally_resolved_nvm_version" ]]; then
             nvm use "$nvm_version";
         fi
     fi
   }

   alias cd='cdnvm'
   cdnvm "$PWD" || exit
   ```

3. Keep in mind that npm version is attached to node version
4. If you run into any issues or using shell different than bash read documentation of nvm to use resolve your issues https://github.com/nvm-sh/nvm

## Development
Before starting run command `cp .env.example .env`.

Then run migrations `npm run migration-run`, be aware without migration tests may fail.

### Testing

To verify that everything works well run commands below in this order
1. `npm run eslint` - checks code styling and look
2. `npm run types` - validates types of entire application
3. `npm run units` -- runs unit tests
4. `npm run integration` - runs integration tests
5. `npm run open-api-docs` - generates open api documentation into `./temp/openapi.yaml` and `./temp/openapi.html`

### Husky
This application uses husky to trigger tests on git hooks, to avoid running them use those flags

1. commit `-n` - e.g. `git commit -m 'feat: my fancy feature' -n`
2. push `--no-verify` - e.g. `git push --no-verify`
