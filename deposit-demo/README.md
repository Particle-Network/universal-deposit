# Deposit SDK Demo

A Next.js demo application showcasing the Particle Network Deposit SDK with Privy authentication and automatic deposit sweeping.

## What It Does

This demo demonstrates a complete deposit flow:

1. **User Authentication** — Login with Privy (email, wallet, or social)
2. **Intermediary Wallet Creation** — Automatically creates a JWT-based intermediary wallet via Particle Auth Core
3. **Universal Account Setup** — Initializes a Universal Account linked to the intermediary wallet
4. **Deposit Address Display** — Shows the EVM/Solana deposit addresses where users can send funds
5. **Automatic Deposit Detection** — Monitors the Universal Account for incoming deposits
6. **Auto-Sweep to EOA** — Automatically sweeps detected deposits to the user's connected wallet on Arbitrum

## How It Works

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Privy Login    │     │  Particle Auth  │     │  Universal      │
│  (User's EOA)   │ ──▶ │  Core (JWT)     │ ──▶ │  Account        │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                       │                        │
        │ destination           │ signs sweeps           │ deposit addresses
        ▼                       ▼                        ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Receives swept │     │  Intermediary   │     │  EVM + Solana   │
│  funds (Arb)    │     │  Wallet         │     │  Smart Accounts │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

### Authentication Flow

1. User logs in with Privy → gets `connectkitEoa` (user's wallet address)
2. Demo fetches JWT from Cloudflare Worker using the user's address as userId
3. Particle Auth Core connects with the JWT → gets `jwtEoa` (intermediary address) and `authCoreProvider`
4. Deposit SDK initializes with both addresses:
   - `ownerAddress`: User's Privy wallet (sweep destination)
   - `intermediaryAddress`: JWT wallet (UA owner, signs transactions)
   - `authCoreProvider`: Signs sweep transactions

### Deposit Detection & Sweep

1. `BalanceWatcher` polls the Universal Account for balance changes every 8 seconds
2. When a deposit is detected (>$0.50 USD), it emits a `deposit:detected` event
3. `Sweeper` builds a transfer transaction to move funds to Arbitrum
4. `authCoreProvider.signMessage()` signs the transaction with the intermediary wallet
5. Funds are swept to the user's connected wallet on Arbitrum

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
- **Particle Auth Core**: Project credentials configured in `providers.tsx`
- **JWT Worker**: `https://deposit-auth-worker.deposit-kit.workers.dev/v1/jwt`

## Project Structure

```
deposit-demo/
├── app/
│   ├── components/
│   │   └── DepositDemo.tsx    # Main demo component with auth flow
│   ├── providers.tsx          # Privy + Particle Auth Core providers
│   ├── layout.tsx             # Root layout with providers
│   ├── page.tsx               # Home page
│   └── globals.css            # Tailwind styles
├── package.json
├── next.config.mjs            # Next.js config with webpack fallbacks
└── README.md
```

## Key Components

### `DepositDemo.tsx`

The main component that orchestrates:
- Privy login/logout
- JWT fetching and Particle Auth Core connection
- DepositClient initialization with `intermediaryAddress` and `authCoreProvider`
- DepositWidget/DepositModal rendering

### `providers.tsx`

Wraps the app with:
- `PrivyProvider` for user authentication
- `AuthCoreContextProvider` for Particle Auth Core (intermediary wallet)

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
