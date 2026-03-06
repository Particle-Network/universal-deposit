/**
 * Tests for audit fix items: placeholder addresses, dust threshold,
 * hasValidSweepTargets, isPlaceholderAddress, delta USD calculation.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  isAboveDustThreshold,
  isPlaceholderAddress,
  hasValidSweepTargets,
  ZERO_ADDRESS,
  TOKEN_ADDRESSES,
} from '../constants/tokens';
import { CHAIN } from '../constants/chains';
import { BalanceWatcher } from '../sweep/BalanceWatcher';
import type { UAManager } from '../universal-account';

describe('isPlaceholderAddress', () => {
  it('should return true for zero address', () => {
    expect(isPlaceholderAddress(ZERO_ADDRESS)).toBe(true);
    expect(isPlaceholderAddress('0x0000000000000000000000000000000000000000')).toBe(true);
  });

  it('should return false for real addresses', () => {
    expect(isPlaceholderAddress('0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48')).toBe(false);
  });
});

describe('hasValidSweepTargets', () => {
  it('should return true for chains with real token addresses', () => {
    expect(hasValidSweepTargets(CHAIN.ETHEREUM)).toBe(true);
    expect(hasValidSweepTargets(CHAIN.BASE)).toBe(true);
    expect(hasValidSweepTargets(CHAIN.ARBITRUM)).toBe(true);
    expect(hasValidSweepTargets(CHAIN.MONAD)).toBe(true);
    expect(hasValidSweepTargets(CHAIN.SONIC)).toBe(true);
    expect(hasValidSweepTargets(CHAIN.BERACHAIN)).toBe(true);
  });

  it('should return false for chains without token entries', () => {
    // HyperEVM and Plasma were removed (no stablecoin contracts)
    expect(hasValidSweepTargets(CHAIN.HYPERVM)).toBe(false);
    expect(hasValidSweepTargets(CHAIN.PLASMA)).toBe(false);
  });

  it('should return false for unknown chain IDs', () => {
    expect(hasValidSweepTargets(99999)).toBe(false);
  });
});

describe('isAboveDustThreshold', () => {
  it('should return false for zero USD', () => {
    expect(isAboveDustThreshold(0)).toBe(false);
  });

  it('should return false for negative USD', () => {
    expect(isAboveDustThreshold(-1)).toBe(false);
  });

  it('should return false for amounts at or below dust threshold', () => {
    expect(isAboveDustThreshold(0.05)).toBe(false);
    expect(isAboveDustThreshold(0.10)).toBe(false);
  });

  it('should return true for amounts above dust threshold', () => {
    expect(isAboveDustThreshold(0.11)).toBe(true);
    expect(isAboveDustThreshold(1)).toBe(true);
    expect(isAboveDustThreshold(100)).toBe(true);
  });
});

describe('TOKEN_ADDRESSES — no placeholders', () => {
  it('should not have zero-address entries for Monad', () => {
    expect(TOKEN_ADDRESSES[CHAIN.MONAD]?.usdc).not.toBe(ZERO_ADDRESS);
  });

  it('should not have zero-address entries for Sonic', () => {
    expect(TOKEN_ADDRESSES[CHAIN.SONIC]?.usdc).not.toBe(ZERO_ADDRESS);
  });

  it('should not have zero-address entries for Berachain', () => {
    expect(TOKEN_ADDRESSES[CHAIN.BERACHAIN]?.usdc).not.toBe(ZERO_ADDRESS);
  });

  it('should not have entries for HyperEVM', () => {
    expect(TOKEN_ADDRESSES[CHAIN.HYPERVM]).toBeUndefined();
  });

  it('should not have entries for Plasma', () => {
    expect(TOKEN_ADDRESSES[CHAIN.PLASMA]).toBeUndefined();
  });
});

describe('BalanceWatcher — minValueUSD enforcement', () => {
  let mockUAManager: UAManager;

  beforeEach(() => {
    vi.useFakeTimers();
    mockUAManager = {
      getPrimaryAssets: vi.fn().mockResolvedValue({ assets: [] }),
      getDepositAddresses: vi.fn().mockReturnValue({ evm: '0x1234', solana: 'abc' }),
      isInitialized: vi.fn().mockReturnValue(true),
    } as unknown as UAManager;
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('should skip deposits below minValueUSD in detectChanges', async () => {
    let callCount = 0;
    (mockUAManager.getPrimaryAssets as any).mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return Promise.resolve({ assets: [] });
      }
      // Second poll: 0.3 USDC = $0.30 (below minValueUSD of 1.0)
      return Promise.resolve({
        assets: [{
          tokenType: 'usdc',
          chainAggregation: [{
            token: { chainId: 1 },
            chainId: 1,
            rawAmount: '300000',
            amountInUSD: '0.30',
          }],
        }],
      });
    });

    const watcher = new BalanceWatcher({
      uaManager: mockUAManager,
      pollingIntervalMs: 5000,
      minValueUSD: 1.0,
      supportedTokens: ['USDC'],
      supportedChains: [1],
    });

    const detectedHandler = vi.fn();
    watcher.on('deposit:detected', detectedHandler);

    watcher.start();
    await vi.advanceTimersByTimeAsync(100);
    await vi.advanceTimersByTimeAsync(5000);

    expect(detectedHandler).not.toHaveBeenCalled();

    watcher.stop();
  });
});

describe('BalanceWatcher — delta USD calculation', () => {
  let mockUAManager: UAManager;

  beforeEach(() => {
    vi.useFakeTimers();
    mockUAManager = {
      getPrimaryAssets: vi.fn().mockResolvedValue({ assets: [] }),
      getDepositAddresses: vi.fn().mockReturnValue({ evm: '0x1234', solana: 'abc' }),
      isInitialized: vi.fn().mockReturnValue(true),
    } as unknown as UAManager;
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('should compute proportional delta USD', async () => {
    let callCount = 0;
    (mockUAManager.getPrimaryAssets as any).mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        // First poll: empty (baseline)
        return Promise.resolve({ assets: [] });
      }
      if (callCount === 2) {
        // Second poll: 50 USDC = $50 (first deposit)
        return Promise.resolve({
          assets: [{
            tokenType: 'usdc',
            chainAggregation: [{
              token: { chainId: 1 },
              chainId: 1,
              rawAmount: '50000000',
              amountInUSD: '50',
            }],
          }],
        });
      }
      // Third poll: 100 USDC = $100 (added 50 more USDC)
      return Promise.resolve({
        assets: [{
          tokenType: 'usdc',
          chainAggregation: [{
            token: { chainId: 1 },
            chainId: 1,
            rawAmount: '100000000',
            amountInUSD: '100',
          }],
        }],
      });
    });

    const watcher = new BalanceWatcher({
      uaManager: mockUAManager,
      pollingIntervalMs: 5000,
      minValueUSD: 0.5,
      supportedTokens: ['USDC'],
      supportedChains: [1],
    });

    const detectedHandler = vi.fn();
    watcher.on('deposit:detected', detectedHandler);

    watcher.start();
    // First poll (empty baseline)
    await vi.advanceTimersByTimeAsync(100);
    expect(detectedHandler).not.toHaveBeenCalled();

    // Second poll (first deposit: 50 USDC)
    await vi.advanceTimersByTimeAsync(5000);
    expect(detectedHandler).toHaveBeenCalledTimes(1);
    // Full amount = delta since baseline was 0; deltaUSD = (50M/50M)*50 = 50
    expect(detectedHandler.mock.calls[0][0].amountUSD).toBe(50);

    // Clear processing key so third poll can detect the new deposit
    watcher.clearProcessingKey('usdc:1');

    // Third poll (second deposit: +50 USDC, total 100)
    await vi.advanceTimersByTimeAsync(5000);
    expect(detectedHandler).toHaveBeenCalledTimes(2);
    const secondDeposit = detectedHandler.mock.calls[1][0];
    // deltaAmount = 50M, currentAmount = 100M, totalUSD = 100
    // deltaUSD = (50M / 100M) * 100 = 50
    expect(secondDeposit.amountUSD).toBe(50);

    watcher.stop();
  });
});
