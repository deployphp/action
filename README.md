# action
GitHub Action for Deployer


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
    uses: deployphp/action@v1
    with:
      private-key: ${{ secrets.PRIVATE_KEY }}
      known-hosts: ${{ secrets.KNOWN_HOSTS }}
      dep: deploy prod -v
```
