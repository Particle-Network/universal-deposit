# Deposit SDK

> A companion SDK for Universal Accounts that solves the "empty smart account" problem by providing deposit flows and auto-sweep functionality.

## Overview

Universal Accounts are smart accounts — they start empty. Users need a way to fund them before they can use chain abstraction features. The Deposit SDK provides:

- **Deposit addresses** — EVM + Solana smart account addresses for receiving funds
- **Auto-sweep** — Automatically move deposited funds to a configurable destination
- **EOA detection** — Detect tokens in user's connected wallet for one-click deposits
- **Pre-built UI** — Optional modal/widget components (coming in Phase 6)
- **Headless mode** — Full programmatic control for custom UIs

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  User's EOA     │     │  Intermediary   │     │  Universal      │
│  (Any Provider) │ ──▶ │  Wallet (JWT)   │ ──▶ │  Account        │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                               │                        │
                               │ owns                   │ deposit addresses
                               ▼                        ▼
                        ┌─────────────────┐     ┌─────────────────┐
                        │  Signs UA       │     │  EVM + Solana   │
                        │  transactions   │     │  Smart Accounts │
                        └─────────────────┘     └─────────────────┘
```

### Key Concepts

1. **Intermediary Wallet**: A JWT-based embedded wallet that owns the Universal Account. Created automatically by the SDK using a hosted JWT service.

2. **JWT Service**: A Cloudflare Worker (`deposit-auth-worker.deposit-kit.workers.dev`) that issues JWTs for intermediary wallet creation. Credentials are baked into the SDK - developers don't configure this.

3. **Universal Account**: The smart account that provides deposit addresses and chain abstraction features.

4. **Provider-Agnostic**: Works with any wallet provider (Privy, RainbowKit, Particle Connect, Dynamic, etc.) - only requires `ownerAddress` and `signer`.

## Current Status

### ✅ Completed (Phases 1-2)

- **Phase 1**: Core SDK architecture, types, event system, error handling
- **Phase 2**: IntermediaryService with JWT authentication and session caching

### 🚧 In Progress

- **Phase 3**: UAManager for Universal Account operations
- **Phase 4**: Balance watching & auto-sweep
- **Phase 5**: EOA detection & deposit
- **Phase 6**: UI components
- **Phase 7**: Testing & documentation
- **Phase 8**: npm publishing

## Installation

```bash
npm install @particle-network/deposit-sdk
```

## Usage

### Basic Example

```typescript
import { DepositClient } from '@particle-network/deposit-sdk';

// Create client (works with any wallet provider)
const client = new DepositClient({
  ownerAddress: '0x...', // User's wallet address
  signer: {
    signMessage: (msg) => wallet.signMessage(msg),
  },
});

// Initialize (creates intermediary wallet and UA)
await client.initialize();

// Get deposit addresses
const { evm, solana } = await client.getDepositAddresses();

// Listen for deposits
client.on('deposit:detected', (deposit) => {
  console.log('Deposit detected:', deposit);
});

client.on('deposit:complete', (result) => {
  console.log('Swept to:', result.explorerUrl);
});

// Start watching for deposits
client.startWatching();
```

### With Different Wallet Providers

#### Privy

```typescript
import { useWallets } from '@privy-io/react-auth';

const { wallets } = useWallets();
const wallet = wallets[0];

const client = new DepositClient({
  ownerAddress: wallet.address,
  signer: {
    signMessage: async (msg) => {
      const provider = await wallet.getEthereumProvider();
      return provider.request({
        method: 'personal_sign',
        params: [msg, wallet.address],
      });
    },
  },
});
```

#### RainbowKit / wagmi

```typescript
import { useAccount, useSignMessage } from 'wagmi';

const { address } = useAccount();
const { signMessageAsync } = useSignMessage();

const client = new DepositClient({
  ownerAddress: address,
  signer: { signMessage: signMessageAsync },
});
```

#### Particle Connect

```typescript
import { useWallets, useAccount } from '@particle-network/connectkit';

const [primaryWallet] = useWallets();
const { address } = useAccount();
const walletClient = primaryWallet?.getWalletClient();

const client = new DepositClient({
  ownerAddress: address,
  signer: {
    signMessage: (msg) => walletClient.signMessage({
      account: address,
      message: { raw: msg },
    }),
  },
});
```

### Configuration Options

```typescript
const client = new DepositClient({
  // Required
  ownerAddress: '0x...',
  signer: { signMessage: ... },

  // Optional
  destination: {
    address: '0x...', // Defaults to ownerAddress
    chainId: 42161,   // Defaults to Arbitrum
  },
  supportedTokens: ['ETH', 'USDC', 'USDT'], // Defaults to all
  supportedChains: [1, 42161, 8453],        // Defaults to all
  autoSweep: true,                          // Default: true
  minValueUSD: 0.5,                         // Default: 0.5
  pollingIntervalMs: 8000,                  // Default: 8000
});
```

## Project Structure

```
sdk/
├── src/
│   ├── core/
│   │   ├── DepositClient.ts      # Main SDK entry point
│   │   ├── EventEmitter.ts       # Typed event system
│   │   ├── errors.ts             # Custom error classes
│   │   ├── types.ts              # TypeScript interfaces
│   │   └── index.ts
│   │
│   ├── intermediary/
│   │   ├── IntermediaryService.ts # JWT authentication & session management
│   │   └── index.ts
│   │
│   ├── universal-account/         # [Phase 3] UA operations
│   │   └── UAManager.ts
│   │
│   ├── sweep/                     # [Phase 4] Balance watching & sweeping
│   │   ├── BalanceWatcher.ts
│   │   ├── Sweeper.ts
│   │   └── strategies.ts
│   │
│   ├── eoa/                       # [Phase 5] EOA detection
│   │   ├── EOADetector.ts
│   │   └── EOADepositor.ts
│   │
│   ├── constants/
│   │   ├── chains.ts             # Chain configurations
│   │   ├── tokens.ts             # Token addresses
│   │   └── index.ts              # Default values
│   │
│   ├── __tests__/
│   │   ├── integration/          # Integration tests (real API calls)
│   │   │   └── jwt-worker.integration.test.ts
│   │   └── *.test.ts             # Unit tests (mocked)
│   │
│   └── index.ts                  # Public exports
│
├── dist/                         # Built output (ESM + CJS)
├── package.json
├── tsconfig.json
├── tsup.config.ts                # Build configuration
├── vitest.config.ts              # Test configuration
└── README.md
```

## Development

### Build

```bash
npm run build
```

Outputs:
- `dist/index.js` - CommonJS
- `dist/index.mjs` - ES Module
- `dist/index.d.ts` - TypeScript declarations

### Testing

```bash
# Run unit tests (mocked)
npm run test

# Run integration tests (real JWT worker)
npm run test:integration

# Watch mode
npm run test:watch
```

### Type Checking

```bash
npm run typecheck
```

## Core Components

### DepositClient

Main entry point for the SDK. Manages lifecycle, configuration, and coordinates all services.

**Key Methods:**
- `initialize()` - Creates intermediary wallet and UA
- `getDepositAddresses()` - Returns EVM + Solana addresses
- `startWatching()` / `stopWatching()` - Control balance monitoring
- `sweep()` - Manual sweep trigger
- `destroy()` - Cleanup

**Events:**
- `deposit:detected` - New deposit found
- `deposit:processing` - Sweep in progress
- `deposit:complete` - Sweep successful
- `deposit:error` - Error occurred
- `status:change` - Client status changed

### IntermediaryService

Manages JWT authentication with the hosted JWT service. Handles session caching, expiry, and refresh.

**Features:**
- Automatic JWT fetching from Cloudflare Worker
- Session caching (avoids redundant requests)
- 60-second expiry buffer
- Concurrent request deduplication
- Proper error handling (JwtError, AuthenticationError)

**Internal Use Only** - Not exposed in public API.

### Constants

**JWT Service:**
- URL: `https://deposit-auth-worker.deposit-kit.workers.dev`
- Credentials: Baked into SDK (not configurable)

**Chains:**
- Ethereum (1)
- Arbitrum (42161) - Default destination
- Base (8453)
- Polygon (137)
- BNB Chain (56)
- Solana (101)

**Tokens:**
- ETH, USDC, USDT, BTC, SOL, BNB

## Testing

### Unit Tests

Located in `src/__tests__/*.test.ts`. Use mocked fetch and dependencies.

Example:
```typescript
import { IntermediaryService } from '../intermediary';

describe('IntermediaryService', () => {
  it('should cache session', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ jwt: 'mock-jwt', ... }),
    });

    const service = new IntermediaryService(config);
    await service.getSession('0xtest');
    await service.getSession('0xtest');

    expect(fetch).toHaveBeenCalledTimes(1); // Cached
  });
});
```

### Integration Tests

Located in `src/__tests__/integration/*.integration.test.ts`. Call real APIs.

Example:
```typescript
describe('JWT Worker Integration', () => {
  it('should fetch JWT from deployed worker', async () => {
    const service = new IntermediaryService({
      projectId: TEST_PROJECT_ID,
      clientKey: TEST_CLIENT_KEY,
      appId: TEST_APP_ID,
      jwtServiceUrl: DEFAULT_JWT_SERVICE_URL,
    });

    const session = await service.getSession('0x...');
    
    expect(session.jwt).toBeTruthy();
    expect(session.expiresAt).toBeGreaterThan(Date.now() / 1000);
  });
});
```

## Error Handling

The SDK provides typed error classes:

```typescript
import {
  DepositSDKError,
  ConfigurationError,
  AuthenticationError,
  JwtError,
  UniversalAccountError,
  SweepError,
  NetworkError,
} from '@particle-network/deposit-sdk';

try {
  await client.initialize();
} catch (error) {
  if (error instanceof ConfigurationError) {
    console.error('Invalid config:', error.message);
  } else if (error instanceof JwtError) {
    console.error('JWT service error:', error.message);
  } else if (error instanceof AuthenticationError) {
    console.error('Auth failed:', error.message);
  }
}
```

## Event System

The SDK uses a typed event emitter:

```typescript
// Type-safe event listeners
client.on('deposit:detected', (deposit: DetectedDeposit) => {
  console.log(`${deposit.token} detected on chain ${deposit.chainId}`);
});

client.on('deposit:complete', (result: SweepResult) => {
  console.log(`Swept: ${result.transactionId}`);
});

client.on('status:change', (status: ClientStatus) => {
  console.log(`Status: ${status}`);
});

// Remove listeners
client.off('deposit:detected', handler);
client.removeAllListeners();
```

## Roadmap

- [x] **Phase 1**: Core architecture, types, events
- [x] **Phase 2**: JWT service integration
- [ ] **Phase 3**: Universal Account management
- [ ] **Phase 4**: Balance watching & auto-sweep
- [ ] **Phase 5**: EOA detection & deposit
- [ ] **Phase 6**: UI components (React)
- [ ] **Phase 7**: Testing & documentation
- [ ] **Phase 8**: npm publishing

## Contributing

This SDK is under active development. Current focus is on Phase 3 (UAManager).

## License

MIT
