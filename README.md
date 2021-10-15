# GitHub Action for Deployer

```yaml
  - name: Deploy
    uses: deployphp/action@v1
    with:
      private-key: ${{ secrets.PRIVATE_KEY }}
      dep: deploy
```

## Inputs

See [action.yaml](action.yaml).

## Example

```yaml
jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v2

      - name: Setup PHP
        uses: shivammathur/setup-php@v2
        with:
          php-version: '8.0'

      - name: Deploy
        uses: deployphp/action@v1
        with:
          private-key: ${{ secrets.PRIVATE_KEY }}
          dep: deploy
```
