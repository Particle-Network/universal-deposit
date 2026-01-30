# Deposit SDK Reference

Complete API reference for the `@particle-network/deposit-sdk` package.

## Table of Contents

- [Installation](#installation)
- [Core Classes](#core-classes)
  - [DepositClient](#depositclient)
- [React Integration](#react-integration)
  - [DepositProvider](#depositprovider)
  - [useDeposit](#usedeposit)
  - [useDepositContext](#usedepositcontext)
  - [Components](#components)
- [Types](#types)
- [Events](#events)
- [Errors](#errors)
- [Constants](#constants)

---

## Installation

```bash
npm install @particle-network/deposit-sdk
```

---

## Core Classes

### DepositClient

Main entry point for the SDK. Manages the complete deposit lifecycle.

#### Constructor

```typescript
import { DepositClient } from '@particle-network/deposit-sdk';

const client = new DepositClient(config: DepositClientConfig);
```

#### DepositClientConfig

| Property | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `ownerAddress` | `string` | Yes | — | User's wallet address (sweep destination) |
| `intermediaryAddress` | `string` | Yes | — | JWT wallet address from Auth Core |
| `authCoreProvider` | `AuthCoreProvider` | No* | — | Provider for signing sweep transactions |
| `destination.address` | `string` | No | `ownerAddress` | Custom sweep destination |
| `destination.chainId` | `number` | No | `42161` | Destination chain (default: Arbitrum) |
| `supportedTokens` | `TokenType[]` | No | All tokens | Filter which tokens to watch |
| `supportedChains` | `number[]` | No | All 17 chains | Filter which chains to watch |
| `autoSweep` | `boolean` | No | `true` | Auto-sweep detected deposits |
| `minValueUSD` | `number` | No | `0.10` | Minimum USD value to trigger sweep |
| `pollingIntervalMs` | `number` | No | `8000` | Balance check interval |
| `recovery` | `RecoveryConfig` | No | — | Recovery behavior options |

*Required for sweep operations

#### Methods

##### `initialize(): Promise<void>`

Initialize the client. Must be called before other methods.

```typescript
await client.initialize();
```

##### `destroy(): void`

Cleanup and release resources.

```typescript
client.destroy();
```

##### `getDepositAddresses(): Promise<DepositAddresses>`

Get EVM and Solana deposit addresses.

```typescript
const addresses = await client.getDepositAddresses();
// { evm: '0x...', solana: '...' }
```

##### `startWatching(): void`

Start polling for balance changes.

```typescript
client.startWatching();
```

##### `stopWatching(): void`

Stop balance polling.

```typescript
client.stopWatching();
```

##### `checkBalances(): Promise<DetectedDeposit[]>`

Get current balances (respects `minValueUSD` threshold).

```typescript
const deposits = await client.checkBalances();
```

##### `sweep(depositId?: string): Promise<SweepResult[]>`

Manually trigger sweep for specific or all pending deposits.

```typescript
// Sweep all pending
const results = await client.sweep();

// Sweep specific deposit
const result = await client.sweep('deposit-id');
```

##### `getStuckFunds(): Promise<DetectedDeposit[]>`

Get ALL non-zero balances (no minimum threshold). Use for recovery.

```typescript
const stuckFunds = await client.getStuckFunds();
```

##### `recoverAllFunds(): Promise<RecoveryResult[]>`

Attempt to sweep all stuck funds to destination.

```typescript
const results = await client.recoverAllFunds();
for (const r of results) {
  console.log(`${r.token}: ${r.status}`);
}
```

##### `getStatus(): ClientStatus`

Get current client status.

```typescript
const status = client.getStatus();
// 'idle' | 'initializing' | 'ready' | 'watching' | 'sweeping' | 'error'
```

##### `getPendingDeposits(): DetectedDeposit[]`

Get list of detected but not yet swept deposits.

```typescript
const pending = client.getPendingDeposits();
```

##### `getConfig(): ResolvedConfig`

Get resolved configuration.

```typescript
const config = client.getConfig();
```

---

## React Integration

### DepositProvider

Context provider that wraps your app and manages Auth Core internally.

```tsx
import { DepositProvider } from '@particle-network/deposit-sdk/react';

function App() {
  return (
    <DepositProvider config={config}>
      <YourApp />
    </DepositProvider>
  );
}
```

#### DepositConfig

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `destination.chainId` | `number` | `42161` | Sweep destination chain |
| `supportedTokens` | `TokenType[]` | All | Tokens to support |
| `supportedChains` | `number[]` | All | Chains to support |
| `autoSweep` | `boolean` | `true` | Enable auto-sweep |
| `minValueUSD` | `number` | `0.10` | Minimum USD threshold |
| `pollingIntervalMs` | `number` | `8000` | Polling interval |

### useDeposit

Hook that auto-connects when `ownerAddress` is provided.

```tsx
import { useDeposit } from '@particle-network/deposit-sdk/react';

function Component() {
  const deposit = useDeposit({
    ownerAddress: '0x...', // Pass to auto-connect
  });

  return <div>{deposit.isReady ? 'Ready' : 'Loading'}</div>;
}
```

#### useDeposit Options

| Property | Type | Description |
|----------|------|-------------|
| `ownerAddress` | `string \| undefined` | User's wallet address. Pass to trigger connection. |

#### useDeposit Return Value

| Property | Type | Description |
|----------|------|-------------|
| `isConnecting` | `boolean` | SDK is initializing |
| `isConnected` | `boolean` | Auth Core connected |
| `isReady` | `boolean` | Client ready for operations |
| `error` | `Error \| null` | Last error |
| `disconnect` | `() => Promise<void>` | Disconnect and cleanup |

### useDepositContext

Access the full context including recovery methods.

```tsx
import { useDepositContext } from '@particle-network/deposit-sdk/react';

function Component() {
  const ctx = useDepositContext();
  // Access all properties including recovery
}
```

#### useDepositContext Return Value

| Property | Type | Description |
|----------|------|-------------|
| `isConnecting` | `boolean` | SDK is initializing |
| `isConnected` | `boolean` | Auth Core connected |
| `isReady` | `boolean` | Client ready |
| `error` | `Error \| null` | Last error |
| `ownerAddress` | `string \| null` | User's wallet |
| `intermediaryAddress` | `string \| null` | JWT wallet |
| `connect` | `(address: string) => Promise<void>` | Connect with address |
| `disconnect` | `() => Promise<void>` | Disconnect |
| `client` | `DepositClient \| null` | Underlying client |
| `status` | `ClientStatus` | Client status |
| `depositAddresses` | `DepositAddresses \| null` | Deposit addresses |
| `pendingDeposits` | `DetectedDeposit[]` | Pending deposits |
| `recentActivity` | `ActivityItem[]` | Activity history |
| `startWatching` | `() => void` | Start watching |
| `stopWatching` | `() => void` | Stop watching |
| `sweep` | `(id?: string) => Promise<SweepResult[]>` | Trigger sweep |
| `stuckFunds` | `DetectedDeposit[]` | Stuck funds list |
| `isRecovering` | `boolean` | Recovery in progress |
| `getStuckFunds` | `() => Promise<DetectedDeposit[]>` | Refresh stuck funds |
| `recoverFunds` | `() => Promise<RecoveryResult[]>` | Recover all funds |

### Components

#### DepositWidget

Complete deposit UI with token selection, QR code, and activity.

```tsx
import { DepositWidget } from '@particle-network/deposit-sdk/react';

<DepositWidget
  theme="dark"        // 'dark' | 'light'
  className="..."     // Custom CSS class
/>
```

#### DepositModal

Modal wrapper for DepositWidget.

```tsx
import { DepositModal } from '@particle-network/deposit-sdk/react';

<DepositModal
  isOpen={true}
  onClose={() => {}}
  theme="dark"
/>
```

#### RecoveryWidget

Complete recovery UI for scanning and recovering stuck funds.

```tsx
import { RecoveryWidget } from '@particle-network/deposit-sdk/react';

<RecoveryWidget
  theme="dark"        // 'dark' | 'light'
  className="..."     // Custom CSS class
  autoScan={true}     // Auto-scan on mount (default: true)
/>
```

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `client` | `DepositClient` | — | Optional client (uses context if not provided) |
| `onClose` | `() => void` | — | Close handler |
| `className` | `string` | — | Custom CSS class |
| `theme` | `'dark' \| 'light'` | `'dark'` | Color theme |
| `autoScan` | `boolean` | `true` | Auto-scan for funds on mount |

**Features:**
- Auto-scans for recoverable funds on mount
- Displays all stuck funds with token icons, chain badges, amounts, and USD values
- Per-item status tracking (pending → processing → success/error)
- "Recover All" button to sweep all stuck funds
- "Scan" button to refresh the list
- Shows recovery results summary after completion

#### RecoveryModal

Modal wrapper for RecoveryWidget.

```tsx
import { RecoveryModal } from '@particle-network/deposit-sdk/react';

<RecoveryModal
  isOpen={true}
  onClose={() => {}}
  theme="dark"
  autoScan={true}
/>
```

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `isOpen` | `boolean` | — | Modal visibility |
| `onClose` | `() => void` | — | Close handler |
| `client` | `DepositClient` | — | Optional client |
| `className` | `string` | — | Custom CSS class for modal content |
| `overlayClassName` | `string` | — | Custom CSS class for overlay |
| `theme` | `'dark' \| 'light'` | `'dark'` | Color theme |
| `autoScan` | `boolean` | `true` | Auto-scan for funds on mount |

---

## Types

### TokenType

```typescript
type TokenType = 'ETH' | 'USDC' | 'USDT' | 'BTC' | 'SOL' | 'BNB';
```

### DepositAddresses

```typescript
interface DepositAddresses {
  evm: string;      // EVM smart account address
  solana: string;   // Solana smart account address
}
```

### DetectedDeposit

```typescript
interface DetectedDeposit {
  id: string;           // Unique identifier
  token: TokenType;     // Token type
  chainId: number;      // Source chain
  amount: string;       // Raw amount (string)
  amountUSD: number;    // USD value
  rawAmount: bigint;    // Raw amount (bigint)
  detectedAt: number;   // Timestamp
}
```

### SweepResult

```typescript
interface SweepResult {
  depositId: string;      // Deposit ID
  transactionId: string;  // Transaction hash
  explorerUrl: string;    // Block explorer URL
  status: SweepStatus;    // 'success' | 'failed' | 'pending'
  error?: string;         // Error message if failed
}
```

### RecoveryResult

```typescript
interface RecoveryResult {
  token: TokenType;         // Token type
  chainId: number;          // Source chain
  amount: string;           // Raw amount
  amountUSD: number;        // USD value
  status: RecoveryStatus;   // 'success' | 'failed' | 'skipped'
  error?: string;           // Error message if failed
  txHash?: string;          // Transaction hash if success
}
```

### RecoveryConfig

```typescript
interface RecoveryConfig {
  autoRetry?: boolean;           // Enable auto-retry (default: true)
  maxRetries?: number;           // Max retry attempts (default: 3)
  retryDelayMs?: number;         // Initial retry delay (default: 60000)
  backoffMultiplier?: number;    // Backoff multiplier (default: 2)
  onRecoveryFailed?: (deposit: DetectedDeposit, error: Error) => void;
}
```

### ClientStatus

```typescript
type ClientStatus =
  | 'idle'          // Not initialized
  | 'initializing'  // Setting up
  | 'ready'         // Ready for operations
  | 'watching'      // Actively polling
  | 'sweeping'      // Sweep in progress
  | 'error';        // Error state
```

### AuthCoreProvider

```typescript
interface AuthCoreProvider {
  signMessage: (message: string) => Promise<string>;
}
```

---

## Events

Subscribe to client events:

```typescript
client.on('event-name', handler);
client.off('event-name', handler);
client.removeAllListeners();
```

### Deposit Events

| Event | Payload | Description |
|-------|---------|-------------|
| `deposit:detected` | `DetectedDeposit` | New deposit found |
| `deposit:processing` | `DetectedDeposit` | Sweep started |
| `deposit:complete` | `SweepResult` | Sweep finished |
| `deposit:error` | `Error, DetectedDeposit?` | Sweep failed |

### Recovery Events

| Event | Payload | Description |
|-------|---------|-------------|
| `recovery:started` | — | Recovery process started |
| `recovery:complete` | `RecoveryResult[]` | Recovery finished |
| `recovery:failed` | `DetectedDeposit, Error` | Single recovery failed |

### Status Events

| Event | Payload | Description |
|-------|---------|-------------|
| `status:change` | `ClientStatus` | Status changed |

---

## Errors

```typescript
import {
  DepositSDKError,       // Base class
  ConfigurationError,    // Invalid config
  AuthenticationError,   // Auth failed
  JwtError,              // JWT service error
  UniversalAccountError, // UA operations failed
  SweepError,            // Sweep failed
  NetworkError,          // Network issues
} from '@particle-network/deposit-sdk';
```

### Error Handling

```typescript
try {
  await client.initialize();
} catch (error) {
  if (error instanceof ConfigurationError) {
    // Invalid configuration
  } else if (error instanceof JwtError) {
    // JWT service unreachable
  } else if (error instanceof UniversalAccountError) {
    // UA initialization failed
  }
}
```

---

## Constants

### Supported Chains

```typescript
import { CHAIN, DEFAULT_SUPPORTED_CHAINS } from '@particle-network/deposit-sdk';

CHAIN.ETHEREUM    // 1
CHAIN.OPTIMISM    // 10
CHAIN.BNB         // 56
CHAIN.POLYGON     // 137
CHAIN.BASE        // 8453
CHAIN.ARBITRUM    // 42161
CHAIN.AVALANCHE   // 43114
CHAIN.LINEA       // 59144
CHAIN.HYPERVM     // 999
CHAIN.MANTLE      // 5000
CHAIN.MERLIN      // 4200
CHAIN.XLAYER      // 196
CHAIN.MONAD       // 143
CHAIN.SONIC       // 146
CHAIN.PLASMA      // 9745
CHAIN.BERACHAIN   // 80094
CHAIN.SOLANA      // 101
```

### Supported Tokens

```typescript
import { DEFAULT_SUPPORTED_TOKENS } from '@particle-network/deposit-sdk';

// ['ETH', 'USDC', 'USDT', 'BTC', 'SOL', 'BNB']
```

### Default Values

```typescript
import {
  DEFAULT_DESTINATION_CHAIN_ID,  // 42161 (Arbitrum)
  DEFAULT_MIN_VALUE_USD,         // 0.20
  DEFAULT_POLLING_INTERVAL_MS,   // 8000
} from '@particle-network/deposit-sdk';
```

---

## Full Example

```tsx
import {
  DepositProvider,
  useDeposit,
  DepositModal,
  RecoveryModal,
} from '@particle-network/deposit-sdk/react';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { useState } from 'react';

function App() {
  return (
    <DepositProvider config={{ autoSweep: true }}>
      <DepositPage />
    </DepositProvider>
  );
}

function DepositPage() {
  const { login, authenticated, logout } = usePrivy();
  const { wallets } = useWallets();
  const ownerAddress = wallets[0]?.address;

  const { isReady, isConnecting, error, disconnect } = useDeposit({
    ownerAddress: authenticated ? ownerAddress : undefined,
  });

  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);

  if (!authenticated) {
    return <button onClick={login}>Login</button>;
  }

  if (isConnecting) {
    return <p>Initializing SDK...</p>;
  }

  if (error) {
    return <p>Error: {error.message}</p>;
  }

  if (!isReady) {
    return <p>Loading...</p>;
  }

  return (
    <div>
      <button onClick={() => setShowDepositModal(true)}>
        Open Deposit
      </button>
      <button onClick={() => setShowRecoveryModal(true)}>
        Recover Funds
      </button>
      <button onClick={() => disconnect().then(logout)}>
        Logout
      </button>

      <DepositModal
        isOpen={showDepositModal}
        onClose={() => setShowDepositModal(false)}
        theme="dark"
      />

      <RecoveryModal
        isOpen={showRecoveryModal}
        onClose={() => setShowRecoveryModal(false)}
        theme="dark"
      />
    </div>
  );
}
```
