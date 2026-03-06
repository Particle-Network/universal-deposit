/**
 * Shared token utilities used by DepositClient, BalanceWatcher, and others.
 */

const KNOWN_TOKENS = ['eth', 'usdc', 'usdt', 'btc', 'sol', 'bnb'] as const;

/**
 * Normalize a token type string to lowercase if it's a known token.
 * Returns null for unknown or missing token types.
 */
export function normalizeTokenType(tokenType: string | undefined): string | null {
  if (!tokenType) return null;
  const normalized = tokenType.toLowerCase();
  if ((KNOWN_TOKENS as readonly string[]).includes(normalized)) {
    return normalized;
  }
  return null;
}

/**
 * Safely parse a value to BigInt. Returns 0n for invalid/missing input.
 */
export function parseBigInt(value: string | number | bigint | undefined): bigint {
  if (value === undefined || value === null) return 0n;
  try {
    if (typeof value === 'bigint') return value;
    if (typeof value === 'number') return BigInt(Math.floor(value));
    return BigInt(value);
  } catch {
    return 0n;
  }
}
