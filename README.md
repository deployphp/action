# GitHub Action for Deployer

```yaml
  - name: Deploy
    uses: deployphp/action@v1
    with:
      dep: deploy
      private-key: ${{ secrets.PRIVATE_KEY }}
```

## Inputs

```yaml
  - name: Deploy
    uses: deployphp/action@v1
    with:
      # The deployer task to run. For example:
      # `deploy all`.
      # Required.
      dep: deploy

      # The path to the PHP binary to use.
      # Optional.
      php-binary: "php"

      # Specifies a sub directory within the repository to deploy
      # Optional
      sub-directory: "..."

      # Config options for the Deployer. Same as the `-o` flag in the CLI.
      # Optional.
      options:
        keep_releases: 7

      # Private key for connecting to remote hosts. To generate private key:
      # `ssh-keygen -o -t rsa -C 'action@deployer.org'`.
      # Optional.
      private-key: ${{ secrets.PRIVATE_KEY }}

      # Content of `~/.ssh/known_hosts` file. The public SSH keys for a
      # host may be obtained using the utility `ssh-keyscan`. 
      # For example: `ssh-keyscan deployer.org`.
      # If known-hosts omitted, `StrictHostKeyChecking no` will be added to
      # `ssh_config`.
      # Optional.
      known-hosts: |
        ...

      # The SSH configuration. Content of `~/.ssh/config` file.
      # Optional.
      ssh-config: |
        ...

      # Option to skip over the SSH setup/configuration.
      # Self-hosted runners don't need the SSH configuration or the SSH agent 
      # to be started.
      # Optional.
      skip-ssh-setup: false        

      # Deployer version to download from deployer.org.
      # First, the action will check for Deployer binary at those paths:
      # - `vendor/bin/deployer.phar`
      # - `vendor/bin/dep`
      # - `deployer.phar`
      # If the binary not found, phar version will be downloaded from
      # deployer.org.
      # Optional.
      deployer-version: "7.0.0"

      # You can specify path to your local Deployer binary in the repo.
      # Optional.
      deployer-binary: "bin/dep"

      # You can choose to disable ANSI output.
      # Optional. Defaults to true.
      ansi: false

      # You can specify the output verbosity level.
      # Optional. Defaults to -v.
      verbosity: -vvv

      # The branch to deploy. Adds --branch=value to the deploy command.
      # Optional.
      branch: "main"
```

## Example

```yaml
name: deploy

on: push

# It is important to specify "concurrency" for the workflow,
# to prevent concurrency between different deploys.
concurrency: production_environment

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v2

      - name: Setup PHP
        uses: shivammathur/setup-php@v2
        with:
          php-version: '8.1'

      - name: Install dependencies
        run: composer install

      - name: Deploy
        uses: deployphp/action@v1
        with:
          dep: deploy
          private-key: ${{ secrets.PRIVATE_KEY }}
```
