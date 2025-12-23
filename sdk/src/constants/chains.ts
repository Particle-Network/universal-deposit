/**
 * Chain configuration constants
 */

export const CHAIN = {
  ETHEREUM: 1,
  ARBITRUM: 42161,
  BASE: 8453,
  POLYGON: 137,
  BNB: 56,
  SOLANA: 101,
} as const;

export type ChainId = (typeof CHAIN)[keyof typeof CHAIN];

export const CHAIN_META: Record<number, { name: string; addressType: 'evm' | 'solana' }> = {
  [CHAIN.ETHEREUM]: { name: 'Ethereum', addressType: 'evm' },
  [CHAIN.ARBITRUM]: { name: 'Arbitrum', addressType: 'evm' },
  [CHAIN.BASE]: { name: 'Base', addressType: 'evm' },
  [CHAIN.POLYGON]: { name: 'Polygon', addressType: 'evm' },
  [CHAIN.BNB]: { name: 'BNB Chain', addressType: 'evm' },
  [CHAIN.SOLANA]: { name: 'Solana', addressType: 'solana' },
};

export const DEFAULT_SUPPORTED_CHAINS = [
  CHAIN.ETHEREUM,
  CHAIN.ARBITRUM,
  CHAIN.BASE,
  CHAIN.POLYGON,
  CHAIN.BNB,
  CHAIN.SOLANA,
];

export const PRIMARY_ASSETS_BY_CHAIN: Record<number, string[]> = {
  [CHAIN.SOLANA]: ['USDC', 'USDT', 'SOL'],
  [CHAIN.ETHEREUM]: ['USDC', 'USDT', 'ETH', 'BTC'],
  [CHAIN.BASE]: ['USDC', 'ETH', 'BTC'],
  [CHAIN.BNB]: ['USDC', 'USDT', 'ETH', 'BTC', 'BNB'],
  [CHAIN.POLYGON]: ['USDC', 'USDT', 'ETH', 'BTC'],
  [CHAIN.ARBITRUM]: ['USDC', 'USDT', 'ETH', 'BTC'],
};
