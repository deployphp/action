# GitHub Action for Deployer

```yaml
  - name: Deploy
    uses: deployphp/action@1
    with:
      private-key: ${{ secrets.PRIVATE_KEY }}
      dep: deploy all
```

## Inputs

See [action.yaml](action.yaml).

## Deployer version

First, the action will check for Deployer binary at those paths:
- `vendor/bin/dep`
- `deployer.phar`

If the binary not found, phar version will be downloaded from 
[deployer.org](https://deployer.org/download).

## Example

```yaml
deploy:
  name: Deploy to prod
  runs-on: ubuntu-latest
  steps:
  - uses: actions/checkout@v1
  - name: Setup PHP
    uses: shivammathur/setup-php@master
    with:
      php-version: 7.4
  - name: Deploy
    uses: deployphp/action@master
    with:
      private-key: ${{ secrets.PRIVATE_KEY }}
      known-hosts: ${{ secrets.KNOWN_HOSTS }}
      ssh-config: ${{ secrets.SSH_CONFIG }}
      dep: deploy prod -v
```
