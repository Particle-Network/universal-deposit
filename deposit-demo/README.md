# Deposit SDK Demo

A Next.js demo application showcasing the Particle Network Deposit SDK with Privy authentication and automatic deposit sweeping.

## What It Does

This demo demonstrates a complete deposit flow:

1. **User Authentication** — Login with Privy (email, wallet, or social)
2. **Automatic SDK Initialization** — The SDK handles JWT fetching and Auth Core connection internally
3. **Deposit Address Display** — Shows the EVM/Solana deposit addresses where users can send funds
4. **Automatic Deposit Detection** — Monitors the Universal Account for incoming deposits
5. **Auto-Sweep to EOA** — Automatically sweeps detected deposits to the user's connected wallet on Arbitrum

## How It Works

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Privy Login    │     │  Deposit SDK    │     │  Universal      │
│  (User's EOA)   │ ──▶ │  (handles JWT)  │ ──▶ │  Account        │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                       │                        │
        │ destination           │ auto-sweep             │ deposit addresses
        ▼                       ▼                        ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Receives swept │     │  Intermediary   │     │  EVM + Solana   │
│  funds (Arb)    │     │  Wallet (JWT)   │     │  Smart Accounts │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

### Simplified Integration

The SDK now handles all the complexity internally. You just need to:

1. Wrap your app with `DepositProvider`
2. Use the `useDeposit` hook with the user's wallet address
3. Render the `DepositModal` component

```tsx
// That's all you need!
const { isReady, isConnecting } = useDeposit({
  ownerAddress: authenticated ? walletAddress : undefined,
});
```

The SDK automatically:
- Fetches a JWT from the hosted worker
- Connects to Particle Auth Core
- Initializes the Universal Account
- Starts watching for deposits
- Auto-sweeps to the user's wallet on Arbitrum

## Getting Started

### Prerequisites

- Node.js 18+
- The SDK must be built first: `cd ../sdk && npm run build`

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the demo.

### Environment

The demo uses baked-in credentials for:
- **Privy**: App ID configured in `providers.tsx`
- **Deposit SDK**: Particle credentials and JWT worker URL bundled in SDK

## Project Structure

```
deposit-demo/
├── app/
│   ├── components/
│   │   └── DepositDemo.tsx    # Main demo component (simplified!)
│   ├── providers.tsx          # Privy + DepositProvider
│   ├── layout.tsx             # Root layout with providers
│   ├── page.tsx               # Home page
│   └── globals.css            # Tailwind styles
├── package.json
├── next.config.mjs            # Next.js config with webpack fallbacks
└── README.md
```

## Key Components

### `DepositDemo.tsx`

A simplified demo component that shows the minimal integration:

```tsx
import { useDeposit, DepositModal } from '@particle-network/deposit-sdk/react';

export function DepositDemo() {
  const { login, authenticated } = usePrivy();
  const { wallets } = useWallets();
  const ownerAddress = wallets[0]?.address;

  // This is all you need! SDK handles JWT + Auth Core internally
  const { isConnecting, isReady, error, disconnect } = useDeposit({
    ownerAddress: authenticated ? ownerAddress : undefined,
  });

  // ... render UI based on state
}
```

### `providers.tsx`

Wraps the app with:
- `PrivyProvider` for user authentication
- `DepositProvider` from the SDK (handles Auth Core internally)

## Supported Chains

The SDK supports deposits on 17 chains:
- Ethereum, Optimism, BNB Chain, Polygon, Base, Arbitrum, Avalanche, Linea
- HyperEVM, Mantle, Merlin, X Layer, Monad, Sonic, Plasma, Berachain
- Solana

## Supported Tokens

- ETH, USDC, USDT, BTC, SOL, BNB

## Troubleshooting

### BigInt Error
If you see `Cannot convert a BigInt value to a number`, ensure you're using Next.js 14 (not 15+) due to Turbopack compatibility issues with WalletConnect.

### Deposits Not Detected
Check the console for `[BalanceWatcher]` logs. Ensure:
- The deposit is to the correct UA address (shown in widget)
- The deposit value is >$0.50 USD
- The chain is in the supported chains list

### AA24 Signature Error
This means the signature doesn't match the UA owner. Ensure `intermediaryAddress` matches the address from `useEthereum().address`.

## License

MIT
