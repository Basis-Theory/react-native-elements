# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the Basis Theory React Native SDK. It provides secure text input elements for collecting sensitive data (card numbers, CVCs, expiration dates) in React Native applications, with tokenization capabilities through the Basis Theory API.

## Build and Development Commands

### Building
```bash
yarn build          # Build the library using react-native-builder-bob
make build          # Same as above, runs scripts/build.sh
```

The build process:
1. Runs `react-native-builder-bob` to compile TypeScript to CommonJS, ES modules, and type definitions
2. Executes `prepare.js` which creates the `dist/` directory with modified package.json, README, and LICENSE

### Testing
```bash
yarn test           # Run all tests with Jest
make verify         # Run lint and tests
```

Test configuration:
- Uses Jest with React Native preset
- Coverage thresholds: 80% for statements, branches, lines, and functions
- Tests located in `tests/` directory mirroring `src/` structure

### Linting
```bash
yarn lint           # Run ESLint (quiet mode)
yarn lint:fix       # Run ESLint with auto-fix
```

### Running the Demo App
```bash
yarn start          # Start Metro bundler
yarn android        # Run on Android
yarn ios            # Run on iOS
```

### Release
```bash
yarn release        # Run semantic-release
make release        # Same as above
```

Uses semantic-release with:
- Automatic version bumping based on conventional commits
- Publishes to npm from `dist/` directory
- Updates CHANGELOG.md and package.json
- Creates GitHub releases

## Architecture

### Core Hook Pattern
The SDK is built around the `useBasisTheory` hook which initializes a Basis Theory client and provides four main modules:
- **tokens**: Create, retrieve, update, delete tokens and tokenize data
- **sessions**: Session management
- **proxy**: Proxy requests
- **tokenIntents**: Token intent management

### Element Components
Secure input components that handle sensitive data without exposing raw values:

- `CardNumberElement`: Validates card numbers, detects brand, provides BIN and last 4 digits
- `CardExpirationDateElement`: Handles expiration dates with month/year validation
- `CardVerificationCodeElement`: CVC input with dynamic validation based on card type
- `TextElement`: Generic secure text input

Each element component follows this pattern:
1. Component file (`*.tsx`) - React component with props interface
2. Hook file (`*.hook.ts`) - Element-specific logic and event handling
3. Shared hooks in `src/components/shared/`:
   - `useBtRef.ts`: Creates element references for tokenization
   - `useElementEvent.ts`: Manages element lifecycle events (onChange, onFocus, onBlur)
   - `useMask.ts`: Input masking functionality
   - `useUserEventHandlers.ts`: Handles user-provided event callbacks
   - `useCardMetadata.ts`: Card brand detection and metadata
   - `useBrandSelector.ts`: Handles card brand selection for co-badged cards

### BTRef Pattern
Elements expose a `BTRef` interface (not raw values) that includes:
- `id`: Unique element identifier
- `format()`: Returns formatted placeholder value
- `clear()`, `focus()`, `blur()`: Element controls
- `setValue()`: For revealing tokenized data

The `BTRef` is used in tokenization calls instead of raw strings to ensure sensitive data never enters JavaScript memory.

### Data Flow for Tokenization
1. User inputs data into element components
2. Elements maintain internal state and validation
3. `BTRef` objects are passed to `bt.tokens.create()` or `bt.tokens.tokenize()`
4. `replaceElementRefs()` utility (in `src/utils/dataManipulationUtils.ts`) swaps BTRef objects with actual element IDs
5. Basis Theory JS SDK handles secure submission

### Module Structure
- `src/modules/tokens.ts`: Token CRUD operations with BTRef support
- `src/modules/sessions.ts`: Session management wrapper
- `src/modules/proxy.ts`: Proxy request wrapper
- `src/modules/tokenIntents.ts`: Token intent management

### Validation
- `src/utils/validation.ts`: Element validation logic using `card-validator` library
- Global `_elementErrors` tracks validation state across all elements
- Token operations throw errors if any element has validation errors

### State Management
`src/ElementValues.ts` contains the global state management:
- `_elementState`: Unified store for element values, raw values, and metadata
- `_elementErrors`: Validation error tracking (blocks API calls when non-empty)
- `_elementValues`, `_elementRawValues`, `_elementMetadata`: Proxy objects providing backward-compatible access to the unified store

### Context Provider
`BasisTheoryProvider` allows sharing a single `useBasisTheory` instance across components, useful for apps with multiple screens needing access to the same client.

## Key Dependencies

- `card-validator`: Card number and metadata validation
- `react-native-mask-input`: Input masking
- `ramda`: Functional utilities for data manipulation
- `react-native-builder-bob`: Builds library with CommonJS, ES module, and TypeScript outputs
- `@noble/ciphers`, `@noble/curves`, `@noble/hashes`: Cryptographic operations for token encryption

## TypeScript Configuration

Targets ESNext with strict type checking enabled. The build outputs three formats:
- `dist/commonjs/`: CommonJS modules
- `dist/module/`: ES modules
- `dist/typescript/`: Type definitions

## Important Notes

- Elements validate on change but validation state is tracked globally
- The SDK never exposes raw sensitive data values in JavaScript
- All element refs must be passed through tokenization functions to ensure security
- The `prepare.js` script modifies package.json for distribution (removes devDependencies, adjusts paths)
- The SDK supports both standard and NG API endpoints for production and development
- Environment selection via `environment` option: `'test'` for UAT, or default for production
