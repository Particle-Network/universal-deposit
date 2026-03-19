# Operations Runbook

**Last Updated:** 2026-03-19

## Architecture Overview

```
User EOA (Privy, etc.) --> Intermediary Wallet (JWT) --> Universal Account
       |                          |                           |
       | sweep destination        | owns & signs             | deposit addresses
       v                          v                           v
  Receives funds             Auth Core Provider         EVM + Solana
  (configurable)                                       Smart Accounts
```

## Deployment

### Building for Production

```bash
npm run build
```

Output in `dist/`:

| File | Format | Description |
|------|--------|-------------|
| `dist/index.js` | CJS | Core SDK (CommonJS) |
| `dist/index.mjs` | ESM | Core SDK (ES Modules) |
| `dist/react.js` / `react.mjs` | CJS/ESM | React integration |
| `dist/react/auth-core.js` / `auth-core.mjs` | CJS/ESM | Auth Core re-exports |
| `dist/styles.css` | CSS | Pre-built Tailwind CSS for widgets |
| `dist/*.d.ts` | Types | TypeScript declarations |

### Pre-Publish Checklist

```bash
npm run typecheck     # Must pass (ignore ox node_modules errors)
npm run test          # All unit tests green
npm run build         # Clean build
```

### Publishing

```bash
npm publish --access public
```

Only the `dist/` directory is published (configured via `"files": ["dist"]` in `package.json`).

### Version Bumping

```bash
npm version patch   # Bug fixes (0.1.0 -> 0.1.1)
npm version minor   # New features (0.1.0 -> 0.2.0)
npm version major   # Breaking changes (0.1.0 -> 1.0.0)
```

## Monitoring

### Key Events to Monitor

| Event | Description | Action |
|-------|-------------|--------|
| `deposit:detected` | New deposit found | Log for analytics |
| `deposit:processing` | Sweep in progress | Monitor for stuck states |
| `deposit:complete` | Sweep successful | Verify destination received funds |
| `deposit:error` | Error occurred | Alert and investigate |
| `status:change` | Client status changed | Track state transitions |
| `recovery:complete` | Recovery finished | Verify funds recovered |
| `refund:complete` | Refund succeeded | Verify refund reached sender |
| `refund:failed` | Refund failed | Investigate and potentially retry manually |

### Health Indicators

1. **JWT Service**: Verify `https://deposit-auth-worker.deposit-kit.workers.dev/health` returns 200
2. **JWKS Endpoint**: `https://deposit-auth-worker.deposit-kit.workers.dev/.well-known/jwks.json` must be reachable
3. **Balance Watcher**: Polling should occur every 3s (default `DEFAULT_POLLING_INTERVAL_MS`)
4. **Sweep Success Rate**: Track `deposit:complete` vs `deposit:error` ratio

### Enabling Debug Logging

Pass `logger: console` in the client config to enable verbose logging:

```typescript
// Headless
const client = new DepositClient({
  // ... config
  logger: console,
});

// React
<DepositProvider config={{ logger: console, destination: { chainId: CHAIN.BASE } }}>
```

Default behavior is silent (noop logger). Log output includes prefixed messages from each service: `[IntermediaryService]`, `[UAManager]`, `[BalanceWatcher]`, `[Sweeper]`, `[RefundService]`.

## Common Issues

### Issue: JWT Fetch Fails

**Symptoms**: `JwtError: Failed to connect to JWT service`
**Cause**: Network issues or JWT worker down
**Resolution**:
1. Check JWT worker health endpoint
2. Verify network connectivity
3. Check for rate limiting (429 errors)

### Issue: JWT Verification Fails

**Symptoms**: `JwtError: JWT verification failed: ...`
**Cause**: The token returned by the JWT worker failed client-side signature verification
**Resolution**:
1. Confirm the JWKS endpoint is reachable: `https://deposit-auth-worker.deposit-kit.workers.dev/.well-known/jwks.json`
2. If the worker recently rotated keys, the JWKS cache may be stale -- the SDK refreshes it automatically on a `kid` miss; a hard client reload clears it
3. If you see `JWT has expired`, the token TTL is shorter than the round-trip to the signing endpoint -- check for clock skew on the client device
4. `JWT signature verification failed` indicates a genuinely tampered token -- treat as a security event

### Issue: Session Mixing Between Users

**Symptoms**: User A receives funds meant for User B
**Cause**: Session cache not cleared on disconnect
**Resolution**: Fixed in v0.1.0 with per-user session Maps
**Prevention**: Always call `disconnect()` before connecting new user

### Issue: Sweep Fails Repeatedly

**Symptoms**: `SweepError` with gas estimation failures
**Cause**: Insufficient gas or network congestion
**Resolution**:
1. SDK probes at $0.01 to extract gas fee, then calculates optimal amount
2. If optimal fails, it retries at 90% of optimal
3. If both fail, check destination chain for congestion
4. Look for `[Sweeper] Step 2: Fee extraction result:` in logs for fee details (requires `logger: console`)
5. If gas fee exceeds deposit value, the deposit is too small to sweep

### Issue: Deposits Not Detected

**Symptoms**: Funds visible on chain but no `deposit:detected` event
**Cause**: Token/chain not in supported list, or below `minValueUSD`
**Resolution**:
1. Verify token is in `supportedTokens` config
2. Verify chain is in `supportedChains` config
3. Check deposit value meets `minValueUSD` threshold (default: $0.50)
4. Confirm `startWatching()` was called (or `autoSweep` is enabled)

### Issue: Memory Growing Over Time

**Symptoms**: Increasing memory usage in long sessions
**Cause**: `processingKeys` accumulation (fixed in v0.1.0)
**Resolution**: SDK now auto-clears stale keys after 5 minutes

### Issue: Widget Styles Missing

**Symptoms**: DepositWidget/DepositModal renders without styling
**Cause**: CSS import missing
**Resolution**: Import the pre-built stylesheet:

```css
@import "@particle-network/universal-deposit/styles.css";
```

Or in JS/TS:

```typescript
import '@particle-network/universal-deposit/styles.css';
```

Tailwind v4 users can use `@source` directives instead (see README).

### Issue: Typecheck Errors from node_modules

**Symptoms**: TypeScript errors originating from `node_modules/ox`
**Cause**: Known pre-existing errors in the `ox` dependency
**Resolution**: These are safe to ignore. They do not affect the build.

## Rollback Procedures

### Rolling Back SDK Version

In the consuming application:

1. Revert `package.json` dependency version
2. Run `npm install`
3. Rebuild and redeploy consuming application

### Emergency: Disable Auto-Sweep

```typescript
const client = new DepositClient({
  // ... config
  autoSweep: false,
});
```

Manual sweep when ready:

```typescript
await client.sweep();
// Or sweep a specific deposit
await client.sweep('deposit-id');
```

### Emergency: Stop Balance Watching

```typescript
client.stopWatching();
```

In React:

```tsx
const { stopWatching } = useDepositContext();
stopWatching();
```

### Emergency: Recover Stuck Funds

If funds are stuck in the intermediary Universal Account:

```typescript
const stuckFunds = await client.getStuckFunds();
const results = await client.recoverAllFunds();
```

Or use the RecoveryModal component:

```tsx
<RecoveryModal isOpen={true} onClose={() => {}} />
```

## Configuration Reference

| Option | Default | Description |
|--------|---------|-------------|
| `destination.chainId` | -- (required) | Target chain for sweeps (use `CHAIN` constant) |
| `destination.address` | `ownerAddress` | Custom destination address |
| `autoSweep` | `true` | Auto-sweep on deposit detection |
| `minValueUSD` | `0.50` | Minimum USD value to trigger events |
| `pollingIntervalMs` | `3000` | Balance check interval (ms) |
| `supportedTokens` | `['ETH','USDC','USDT','BTC','SOL','BNB']` | Tokens to watch |
| `supportedChains` | All 17 chains | Chains to monitor |
| `refund.enabled` | `false` | Auto-refund on sweep failure (experimental) |
| `refund.delayMs` | `5000` | Delay before refund attempt |
| `refund.maxAttempts` | `2` | Max refund retry attempts |
| `refund.refundToSender` | `true` | Refund to original sender if detectable |
| `uaProjectId` | SDK built-in | Custom Particle project ID for UA operations |
| `logger` | noop (silent) | Logger instance (pass `console` for debug output) |

## Support Contacts

- GitHub Issues: https://github.com/particle-network/deposit-sdk/issues
- Particle Network Discord: #universal-accounts channel
