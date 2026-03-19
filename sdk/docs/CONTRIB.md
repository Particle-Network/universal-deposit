# Contributing Guide

**Last Updated:** 2026-03-19

## Prerequisites

- Node.js v18+ (tested on v23.11.0)
- npm (ships with Node.js)

## Installation

```bash
npm install
```

No `.env.example` or environment variables are required. The SDK uses baked-in Particle credentials (`DEFAULT_PROJECT_ID`, `DEFAULT_CLIENT_KEY`, `DEFAULT_APP_ID`) for development and production.

## Available Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `build` | `npm run build` | Build ESM + CJS + types to `dist/` via tsup, then compile Tailwind CSS (`src/react/styles.css` -> `dist/styles.css`) with minification |
| `dev` | `npm run dev` | Run tsup in watch mode for incremental rebuilds during development |
| `typecheck` | `npm run typecheck` | Run `tsc --noEmit` to check types without emitting output. Note: ignore pre-existing errors from `node_modules/ox` |
| `test` | `npm run test` | Run all unit tests once with vitest (`vitest run`) |
| `test:watch` | `npm run test:watch` | Run vitest in interactive watch mode |
| `test:integration` | `npm run test:integration` | Run integration tests in `src/__tests__/integration/` (makes real API calls to the JWT worker) |

### Build Details

The `build` script runs two steps:

1. **tsup** -- Bundles TypeScript into ESM (`.mjs`) and CJS (`.js`) with declarations (`.d.ts`). Configured in `tsup.config.ts` with three entry points:
   - `src/index.ts` -> Core SDK
   - `src/react/index.ts` -> React integration
   - `src/react/auth-core.ts` -> Auth Core re-exports
2. **tailwindcss** -- Compiles `src/react/styles.css` into `dist/styles.css` (minified). Consumers import this for widget styling.

## Development Workflow

### 1. Start development mode

```bash
npm run dev
```

This runs tsup in watch mode. Changes to `src/` are rebuilt automatically. Note that Tailwind CSS is not watched -- run `npm run build` to regenerate `dist/styles.css` after CSS changes.

### 2. Run tests while developing

```bash
npm run test:watch
```

### 3. Before committing

```bash
npm run typecheck
npm run test
npm run build
```

All three must pass. The build step validates that both the TypeScript bundle and Tailwind CSS compile correctly.

### 4. Linking for local testing

To test with the demo app (`../deposit-demo/`):

```bash
# In sdk/
npm run build
npm link

# In deposit-demo/
npm link @particle-network/universal-deposit
```

## Testing

### Test Structure

```
src/__tests__/
  BalanceWatcher.test.ts
  IntermediaryService.test.ts
  Sweeper.test.ts
  RefundService.test.ts
  Recovery.test.ts
  AutoRefund.test.ts
  TransactionCache.test.ts
  TransactionHistory.test.ts
  audit-fixes.test.ts
  fee-math.test.ts
  token-utils.test.ts
  tokens.test.ts
  integration/
    jwt-worker.integration.test.ts
    ua-manager.integration.test.ts
```

### Unit Tests

Unit tests mock `fetch` and all external dependencies. No network access required.

```bash
npm run test
```

Standard mock pattern:

```typescript
global.fetch = vi.fn().mockResolvedValue({
  ok: true,
  json: () => Promise.resolve({ jwt: 'mock-jwt' }),
});
```

### Integration Tests

Integration tests hit the real JWT worker and UA SDK. They require network access.

```bash
npm run test:integration
```

These tests are excluded from the default `npm run test` command.

### Vitest Configuration

Configured in `vitest.config.ts`. Excludes `node_modules/` and `dist/` from test discovery. No special setup files.

## Package Exports

The SDK ships four export paths:

| Export Path | Entry Point | Description |
|-------------|-------------|-------------|
| `@particle-network/universal-deposit` | `src/index.ts` | Core client, types, errors, constants |
| `@particle-network/universal-deposit/react` | `src/react/index.ts` | React provider, hooks, UI components |
| `@particle-network/universal-deposit/react/auth-core` | `src/react/auth-core.ts` | Direct Auth Core re-exports |
| `@particle-network/universal-deposit/styles.css` | `dist/styles.css` | Pre-built Tailwind CSS for widgets |

## Code Style

- TypeScript strict mode (`strict: true` in `tsconfig.json`)
- Immutable patterns -- create new objects, never mutate
- Small, focused files (under 400 lines typical, 800 max)
- Comprehensive error handling with typed error hierarchy
- No `console.log` statements (use the `Logger` interface)

## Peer Dependencies

React 19 is an optional peer dependency. The core SDK (`@particle-network/universal-deposit`) works without React. The `/react` and `/react/auth-core` subpaths require React 19.

## Pull Request Process

1. Create feature branch from `main`
2. Write tests first (TDD)
3. Implement changes
4. Run full check: `npm run typecheck && npm run test && npm run build`
5. Update documentation if API surface changed (see `docs/SDK-REFERENCE.md`)
6. Submit PR with clear description
