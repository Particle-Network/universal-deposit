/**
 * Token address configuration per chain
 */

import { CHAIN } from './chains';

export const TOKEN_ADDRESSES: Record<number, Record<string, string>> = {
  [CHAIN.ETHEREUM]: {
    usdc: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    usdt: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
  },
  [CHAIN.ARBITRUM]: {
    usdc: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', // Native
    usdc_e: '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8', // Bridged
    usdt: '0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9',
  },
  [CHAIN.BASE]: {
    usdc: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    usdt: '0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2',
  },
  [CHAIN.POLYGON]: {
    usdc: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359',
    usdt: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
  },
  [CHAIN.BNB]: {
    usdc: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
    usdt: '0x55d398326f99059fF775485246999027B3197955',
  },
  [CHAIN.SOLANA]: {
    usdc: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    usdt: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
    sol: '11111111111111111111111111111111',
  },
};

export const TOKEN_DECIMALS: Record<string, number> = {
  ETH: 18,
  USDC: 6,
  USDT: 6,
  BTC: 8,
  SOL: 9,
  BNB: 18,
};

export const DEFAULT_SUPPORTED_TOKENS = ['ETH', 'USDC', 'USDT', 'BTC', 'SOL', 'BNB'] as const;
