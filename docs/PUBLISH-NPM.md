# Publishing to npm

## One-time setup

1. Create an account at [npmjs.com/signup](https://www.npmjs.com/signup).
2. Check that the package name is available:
   ```bash
   npm view pakpay-js
   ```
   A `404` response means the name is free.
3. Log in from your terminal:
   ```bash
   npm login
   ```

## Pre-publish check

```bash
npm run check:publish
```

Runs lint, unit tests, build, and `npm pack --dry-run`. See [MARKET-READINESS.md](./MARKET-READINESS.md).

## Publish

```bash
npm run check:publish
npm publish --access public
```

After publishing, anyone can install:

```bash
npm install pakpay-js
```

## Releasing a new version

1. Update the `version` field in `package.json` (e.g. `1.1.2`).
2. Run `npm run check:publish`.
3. Run `npm publish`.

## Important

- Never commit secrets. Use environment variables only.
- Set `author` and `repository` in `package.json` to your real name and GitHub URL.
- For scoped packages (`@yourname/pakpay-js`), use `npm publish --access public`.
