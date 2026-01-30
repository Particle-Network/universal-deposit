# Deposit SDK Examples

This directory contains example implementations demonstrating different ways to use the Deposit SDK.

## Examples

### 1. `headless-usage.tsx`
**Headless SDK Usage (No Pre-built UI)**

Use the core SDK without React widgets. You control the entire UI - the SDK handles:
- JWT authentication with Particle Auth Core
- Universal Account creation
- Balance watching for deposits
- Automatic/manual sweeping

**When to use:**
- Building a custom deposit UI
- Integrating deposits into an existing flow
- Need full control over the UX

```tsx
import { DepositClient, CHAIN } from '@particle-network/deposit-sdk';

const client = new DepositClient({
  ownerAddress,
  intermediaryAddress,
  authCoreProvider: provider,
  destination: { chainId: CHAIN.BASE },
});

client.on('deposit:detected', (deposit) => { /* ... */ });
client.startWatching();
```

---

### 2. `widget-custom-address.tsx`
**Widget with Custom Destination Address**

Sweep funds to a specific address (e.g., treasury wallet) instead of the user's EOA.

**When to use:**
- Collecting funds to a team treasury
- Sending to a hot wallet for processing
- Any scenario where funds shouldn't go to the user

```tsx
import { DepositModal, CHAIN } from '@particle-network/deposit-sdk/react';

const TREASURY = "0x742d35Cc6634C0532925a3b844Bc9e7595f8dE42";

<DepositModal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  destination={{
    chainId: CHAIN.BASE,
    address: TREASURY,  // Custom address
  }}
/>
```

---

### 3. `widget-chain-only.tsx`
**Widget with Chain Selection (User's EOA)**

Let users choose their preferred destination chain while keeping their own wallet as the destination.

**When to use:**
- Giving users chain preference (lower fees, faster, etc.)
- Default behavior with chain customization
- User-centric UX

```tsx
import { DepositWidget, CHAIN } from '@particle-network/deposit-sdk/react';

const [chainId, setChainId] = useState(CHAIN.ARBITRUM);

<DepositWidget
  destination={{ chainId }}  // No address = user's EOA
/>
```

---

## Quick Reference

| Scenario | Destination Config |
|----------|-------------------|
| Default (Arbitrum, user EOA) | `{}` or omit |
| User EOA on Base | `{ chainId: CHAIN.BASE }` |
| User EOA on Polygon | `{ chainId: CHAIN.POLYGON }` |
| Treasury on Arbitrum | `{ address: "0x..." }` |
| Treasury on Base | `{ chainId: CHAIN.BASE, address: "0x..." }` |

---

## Configuration Levels

Destination can be configured at multiple levels (later overrides earlier):

1. **Provider Level** - Default for all widgets
```tsx
<DepositProvider config={{ destination: { chainId: CHAIN.BASE } }}>
```

2. **Widget Props** - Override for specific widget
```tsx
<DepositWidget destination={{ chainId: CHAIN.POLYGON }} />
```

3. **Runtime** - Change programmatically
```tsx
const { setDestination } = useDepositContext();
setDestination({ chainId: CHAIN.ETHEREUM });
```

---

## Notes

- Auth provider code (Privy, RainbowKit, etc.) is pseudocode in these examples
- Deposit SDK code is production-ready
- See `CLAUDE.md` in the SDK root for full documentation
