/**
 * Chain configuration constants
 */

export const CHAIN = {
  ETHEREUM: 1,
  OPTIMISM: 10,
  BNB: 56,
  POLYGON: 137,
  BASE: 8453,
  ARBITRUM: 42161,
  AVALANCHE: 43114,
  LINEA: 59144,
  HYPERVM: 999,
  MANTLE: 5000,
  MERLIN: 4200,
  XLAYER: 196,
  MONAD: 143,
  SONIC: 146,
  PLASMA: 9745,
  BERACHAIN: 80094,
  SOLANA: 101,
} as const;

export type ChainId = (typeof CHAIN)[keyof typeof CHAIN];

export const CHAIN_META: Record<number, { name: string; addressType: 'evm' | 'solana' }> = {
  [CHAIN.ETHEREUM]: { name: 'Ethereum', addressType: 'evm' },
  [CHAIN.OPTIMISM]: { name: 'Optimism', addressType: 'evm' },
  [CHAIN.BNB]: { name: 'BNB Chain', addressType: 'evm' },
  [CHAIN.POLYGON]: { name: 'Polygon', addressType: 'evm' },
  [CHAIN.BASE]: { name: 'Base', addressType: 'evm' },
  [CHAIN.ARBITRUM]: { name: 'Arbitrum', addressType: 'evm' },
  [CHAIN.AVALANCHE]: { name: 'Avalanche', addressType: 'evm' },
  [CHAIN.LINEA]: { name: 'Linea', addressType: 'evm' },
  [CHAIN.HYPERVM]: { name: 'HyperEVM', addressType: 'evm' },
  [CHAIN.MANTLE]: { name: 'Mantle', addressType: 'evm' },
  [CHAIN.MERLIN]: { name: 'Merlin', addressType: 'evm' },
  [CHAIN.XLAYER]: { name: 'X Layer', addressType: 'evm' },
  [CHAIN.MONAD]: { name: 'Monad', addressType: 'evm' },
  [CHAIN.SONIC]: { name: 'Sonic', addressType: 'evm' },
  [CHAIN.PLASMA]: { name: 'Plasma', addressType: 'evm' },
  [CHAIN.BERACHAIN]: { name: 'Berachain', addressType: 'evm' },
  [CHAIN.SOLANA]: { name: 'Solana', addressType: 'solana' },
};

export const DEFAULT_SUPPORTED_CHAINS = [
  CHAIN.ETHEREUM,
  CHAIN.OPTIMISM,
  CHAIN.BNB,
  CHAIN.POLYGON,
  CHAIN.BASE,
  CHAIN.ARBITRUM,
  CHAIN.AVALANCHE,
  CHAIN.LINEA,
  CHAIN.HYPERVM,
  CHAIN.MANTLE,
  CHAIN.MERLIN,
  CHAIN.XLAYER,
  CHAIN.MONAD,
  CHAIN.SONIC,
  CHAIN.PLASMA,
  CHAIN.BERACHAIN,
  CHAIN.SOLANA,
];

export const PRIMARY_ASSETS_BY_CHAIN: Record<number, string[]> = {
  [CHAIN.SOLANA]: ['USDC', 'USDT', 'SOL'],
  [CHAIN.ETHEREUM]: ['USDC', 'USDT', 'ETH', 'BTC'],
  [CHAIN.OPTIMISM]: ['USDC', 'USDT', 'ETH', 'BTC'],
  [CHAIN.BNB]: ['USDC', 'USDT', 'ETH', 'BTC', 'BNB'],
  [CHAIN.POLYGON]: ['USDC', 'USDT', 'ETH', 'BTC'],
  [CHAIN.BASE]: ['USDC', 'ETH', 'BTC'],
  [CHAIN.ARBITRUM]: ['USDC', 'USDT', 'ETH', 'BTC'],
  [CHAIN.AVALANCHE]: ['USDC', 'USDT', 'ETH', 'BTC'],
  [CHAIN.LINEA]: ['USDC', 'USDT', 'ETH', 'BTC'],
  [CHAIN.HYPERVM]: ['USDT'],
  [CHAIN.MANTLE]: ['USDT'],
  [CHAIN.XLAYER]: ['USDC', 'USDT'],
  [CHAIN.MONAD]: ['USDC'],
  [CHAIN.SONIC]: ['USDC'],
  [CHAIN.PLASMA]: ['USDT'],
  [CHAIN.BERACHAIN]: ['USDC'],
};
