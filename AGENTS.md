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
- **Release triggered by GitHub Release**: Not on push to master — release workflow fires on `release: [released]` event.
- **Peer deps**: `react` and `react-native` are peer dependencies. Tests use specific pinned versions in devDeps.
- **Resolution overrides**: Several `resolutions` in package.json for transitive dependency issues — check before upgrading deps.

## Release

Triggered by creating a GitHub Release. CI runs `make update-version`, `make build`, then `cd dist && npm publish`. Published as `@basis-theory/react-native-elements`.

## Docs

- [React Native Elements SDK](https://developers.basistheory.com/docs/sdks/mobile/react-native/)
