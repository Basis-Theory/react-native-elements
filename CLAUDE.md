# React Native Elements

React Native SDK for Basis Theory Elements — provides React Native components for secure data collection on mobile.

## Development Workflow

```bash
yarn install
yarn build            # Build the package (uses bob + prepare script)
```

## Testing

```bash
yarn lint             # ESLint
yarn lint:fix         # Auto-fix
yarn test             # Unit tests (Jest)
npx jest --testPathPattern="<pattern>"   # Targeted test
```

## Feedback Loops

Run `npx jest --testPathPattern="<pattern>"` for targeted test feedback.

When a failing test is discovered, always verify it passes using the appropriate feedback loop before considering the fix complete.

## Standards & Conventions

- TypeScript, React Native, Jest for testing
- `yarn` for package management
- Uses `react-native-builder-bob` for building

## Links

- [React Native Elements docs](https://developers.basistheory.com/docs/sdks/mobile/react-native/)
