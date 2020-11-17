# GitHub Action for Deployer

```yaml
  - name: Deploy
    uses: deployphp/action@master
    with:
      private-key: ${{ secrets.PRIVATE_KEY }}
      known-hosts: ${{ secrets.KNOWN_HOSTS }}
      dep: deploy prod -v
```

## Inputs

- `private-key` - Required. A private key to accessing servers.
- `known-hosts` - Optional. Host fingerprints. If omitted `StrictHostKeyChecking=no` will be used.
- `dep` - Required. Arguments to pass to Deployer command.

## Deployer version

First, the action will check for Deployer bin at those paths:
- `vendor/bin/dep`
- `bin/dep`
- `deployer.phar`

If bin not found, phar version will be downloaded. 

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
      dep: deploy prod -v
```
