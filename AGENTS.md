# React Native Elements

React Native SDK for secure data collection on mobile (iOS + Android).

## Build & Test

```bash
yarn install
yarn build                              # bob build + prepare.js (creates dist/)
yarn test                               # Jest unit tests
yarn lint                               # ESLint
npx jest --testPathPattern="<pattern>"  # Targeted test
```

Always verify fixes with targeted tests before considering done.

## Project Structure

- `src/` — Library source (TypeScript)
- `tests/` — Unit tests (Jest + @testing-library/react-native)
- `demo/` — Screen components used by the root demo app (`App.tsx`)
- `dist/` — Build output (published to npm)
- `prepare.js` — Post-build script that creates `dist/package.json` (strips devDeps, rewrites paths)

## Gotchas

- **`yarn` not `npm`**: Package manager is yarn. Uses `yarn.lock`.
- **react-native-builder-bob**: Build tool (`bob build`), outputs to `dist/{commonjs,module,typescript}`. Configured in `package.json` under `"react-native-builder-bob"`.
- **`prepare.js` is critical**: Runs after `bob build` to create the publishable `dist/package.json`. It strips devDependencies and rewrites `main`/`module`/`types` paths. Breaking this breaks npm publish.
- **Publishing from `dist/`**: `cd dist && npm publish` — the dist directory is a self-contained package.
- **Version bumped by CI**: `package.json` version in source reflects the last published release. CI bumps it via `make update-version` before publish.
- **Release triggered by GitHub Release**: Not on push to master — release workflow fires on `release: [released]`, plus `workflow_dispatch` for maintenance branches.
- **Peer deps**: `react` and `react-native` are peer dependencies. Tests use specific pinned versions in devDeps.
- **Resolution overrides**: Several `resolutions` in package.json for transitive dependency issues — check before upgrading deps.

## Release

Published as `@basis-theory/react-native-elements` via npm OIDC trusted publishing. Trusted publishing is bound to `.github/workflows/release.yml` and the `PROD` environment, so every publish path lives in that one workflow file.

**Mainline (current major).** Create a GitHub Release. CI runs `make update-version`, updates `CHANGELOG.md`, `make build`, publishes to the `latest` dist-tag, and commits the version bump to `master`.

**Maintenance lines (e.g. 3.x).** Run the Release workflow with `workflow_dispatch` from a `release/<major>.x` branch, passing `version` and `npm_dist_tag` (e.g. `3.1.0` / `v3-lts`). It publishes under that dist-tag so `latest` keeps pointing at the current major, commits the bump to the maintenance branch, and creates a non-latest GitHub Release and tag. `dry_run` runs everything through `npm publish --dry-run` and skips the push. Dispatch only runs on `release/<major>.x` branches, only for that major, and only for a version that exists on neither npm nor a git tag.

Consumers of a maintenance line install by range or dist-tag: `yarn add @basis-theory/react-native-elements@^3.1.0` or `@v3-lts`.

## Docs

- [React Native Elements SDK](https://developers.basistheory.com/docs/sdks/mobile/react-native/)
