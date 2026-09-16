# Chronomap web app

Install dependencies with `npm install`, then run `npm run dev` for a local server or `npm run build` for a production build.

The checked-in synthetic demo bundle under `public/data/synthetic/` is generated with:

```sh
uv run chronomap-data build-public tests/fixtures/valid/synthetic-package --output web/public/data/synthetic
```
