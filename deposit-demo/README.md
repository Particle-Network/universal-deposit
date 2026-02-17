# Deposit SDK Demo

Next.js 14 demo app for the [Particle Network Deposit SDK](../sdk/docs/SDK-REFERENCE.md) with Privy auth.

## Quick Start

```bash
# Build the SDK first
cd ../sdk && npm run build

# Configure environment
cd ../deposit-demo
cp .env.sample .env
# Fill in your credentials (see Environment Variables below)

# Run the demo
npm install && npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

Copy `.env.sample` to `.env` and fill in the values:

| Variable | Description | Dashboard |
|----------|-------------|-----------|
| `NEXT_PUBLIC_PRIVY_APP_ID` | Privy application ID | [dashboard.privy.io](https://dashboard.privy.io) |
| `NEXT_PUBLIC_PARTICLE_PROJECT_ID` | Particle project ID | [dashboard.particle.network](https://dashboard.particle.network) |
| `NEXT_PUBLIC_PARTICLE_CLIENT_KEY` | Particle client key | [dashboard.particle.network](https://dashboard.particle.network) |
| `NEXT_PUBLIC_PARTICLE_APP_ID` | Particle app UUID | [dashboard.particle.network](https://dashboard.particle.network) |

## How It Works

1. User logs in via Privy (email, wallet, or social)
2. SDK auto-initializes (JWT fetch, Auth Core connection, Universal Account setup)
3. Widget displays EVM + Solana deposit addresses
4. SDK watches for incoming deposits and auto-sweeps to the user's wallet

## Integration

The demo uses two SDK components — `DepositProvider` and `useDeposit`:

```tsx
// providers.tsx — wrap your app
<PrivyProvider>
  <DepositProvider config={{ destination: { chainId: CHAIN.BASE } }}>
    <App />
  </DepositProvider>
</PrivyProvider>
```

```tsx
// DepositDemo.tsx — use the hook + modal
const { isReady } = useDeposit({ ownerAddress: walletAddress });

<DepositModal isOpen={open} onClose={() => setOpen(false)} />
```

Toggle between **Modal** and **Inline** display modes in the demo UI.

## Project Structure

```
app/
├── components/DepositDemo.tsx   # Main demo component
├── providers.tsx                # Privy + DepositProvider setup
├── layout.tsx                   # Root layout
├── page.tsx                     # Home page
└── globals.css                  # Tailwind styles
```

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `Cannot convert a BigInt value` | Use Next.js 14, not 15+ (Turbopack/WalletConnect issue) |
| Deposits not detected | Check deposit address matches UA, value > $0.50, chain is supported |
| AA24 signature error | `intermediaryAddress` mismatch — ensure it matches Auth Core address |

See the full [SDK Reference](../sdk/docs/SDK-REFERENCE.md) for API details, supported chains/tokens, and advanced usage.
