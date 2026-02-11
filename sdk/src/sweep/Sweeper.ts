/**
 * Sweeper - Handles sweeping deposits to destination address
 *
 * Uses createUniversalTransaction to convert any deposited token into USDC
 * and send it to the configured destination chain + address.
 *
 * Targets (in priority order):
 * 1. USDC on destination chain via createUniversalTransaction
 * 2. USDC.e on destination chain via createUniversalTransaction
 *
 * Each target is attempted at 100%, 95%, 50% amounts to handle gas.
 * If all targets fail, the sweep fails (no source-chain fallback).
 */

import type { UAManager } from '../universal-account';
import type { DetectedDeposit, SweepResult, AuthCoreProvider } from '../core/types';
import { SweepError } from '../core/errors';
import { TOKEN_ADDRESSES, CHAIN } from '../constants';
import { encodeERC20Transfer, toSmallestUnit } from './erc20';

export interface SweeperConfig {
  uaManager: UAManager;
  authCoreProvider?: AuthCoreProvider;
  /** Called at sweep time to get the latest destination — ensures
   *  runtime destination changes are picked up even when a sweep
   *  was queued before the change. */
  getDestination: () => { address: string; chainId: number };
}

export interface SweepAttempt {
  chainId: number;
  tokenAddress?: string;
  label: string;
  /** When true, use createUniversalTransaction (any token -> USDC) */
  isUniversalTx: boolean;
  /** When set, use USD value for USDC amount (cross-token conversion) */
  targetAmountUSD?: number;
}

/** USDC has 6 decimals on all chains we target */
const USDC_DECIMALS = 6;

/** Matches SUPPORTED_TOKEN_TYPE.USDC from the UA SDK — inlined to avoid TS resolution issues */
const UA_TOKEN_USDC = 'usdc';

export class Sweeper {
  private config: SweeperConfig;
  private sweepQueue: Promise<void> = Promise.resolve();
  private sweeping = false;
  private pendingCount = 0;

  constructor(config: SweeperConfig) {
    this.config = config;
  }

  /**
   * Sweep a detected deposit to the destination.
   * Concurrent calls are queued and executed sequentially.
   */
  async sweep(deposit: DetectedDeposit): Promise<SweepResult> {
    this.pendingCount++;
    return new Promise<SweepResult>((resolve, reject) => {
      this.sweepQueue = this.sweepQueue
        .then(async () => {
          this.sweeping = true;
          try {
            console.log(`[Sweeper] Starting sweep: ${deposit.token} on chain ${deposit.chainId}`);
            const result = await this.executeSweep(deposit);
            resolve(result);
          } catch (error) {
            reject(error);
          } finally {
            this.sweeping = false;
            this.pendingCount--;
          }
        })
        .catch(() => {
          // Ensure queue chain is never broken.
          // Individual errors are forwarded via reject() above.
        });
    });
  }

  /**
   * Check if a sweep is currently in progress
   */
  isSweeping(): boolean {
    return this.sweeping || this.pendingCount > 0;
  }

  /**
   * Execute the sweep with multi-strategy fallback
   */
  private async executeSweep(deposit: DetectedDeposit): Promise<SweepResult> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ua = this.config.uaManager.getUniversalAccount() as any;
    // Read destination at sweep time (not construction time) so runtime
    // changes are always reflected, even if the sweep was queued earlier.
    const { chainId: targetChainId, address: receiver } = this.config.getDestination();

    console.log(`[Sweeper] Destination: ${this.getChainName(targetChainId)} (${targetChainId}) -> ${receiver}`);
    console.log(`[Sweeper] Deposit: ${deposit.token} on chain ${deposit.chainId}, $${deposit.amountUSD?.toFixed(2) ?? '?'}`);

    const percentages = [100n, 95n, 50n];

    const targets = this.buildSweepTargets(deposit, targetChainId);

    console.log(`[Sweeper] Targets (${targets.length}):`, targets.map(t => t.label));

    if (targets.length === 0) {
      throw new SweepError(`No sweep targets available for ${deposit.token} on destination chain ${targetChainId}`);
    }

    if (!this.config.authCoreProvider) {
      throw new SweepError('authCoreProvider is required for sweep operations');
    }

    for (const target of targets) {
      for (const pct of percentages) {
        const amountHuman = this.computeAmount(deposit, target, pct);
        if (amountHuman === null) continue;

        try {
          console.log(`[Sweeper] Attempting: ${target.label} (${pct}%) -> chain ${target.chainId}`);

          const tx = await this.buildUniversalTransaction(ua, target.chainId, target.tokenAddress!, amountHuman, receiver);

          // Sign — if signing fails, abort all attempts (Auth Core issue)
          let signature: string;
          try {
            signature = await this.config.authCoreProvider.signMessage(tx.rootHash);
          } catch (signError) {
            const err = new SweepError(
              `Signing failed: ${signError instanceof Error ? signError.message : 'Unknown signing error'}`
            );
            err.code = 'SIGNING_FAILED';
            throw err;
          }

          await ua.sendTransaction(tx, signature);

          console.log(`[Sweeper] Success! Swept to ${target.label}`);

          return {
            depositId: deposit.id,
            transactionId: tx.rootHash || `sweep-${Date.now()}`,
            explorerUrl: this.getExplorerUrl(target.chainId, tx.rootHash),
            status: 'success',
          };
        } catch (error) {
          if (error instanceof SweepError && error.code === 'SIGNING_FAILED') {
            throw error;
          }
          console.warn(`[Sweeper] Failed attempt (${target.label}, ${pct}%):`, error);
        }
      }
    }

    throw new SweepError('All sweep strategies failed');
  }

  /**
   * Compute the human-readable amount string for a sweep attempt.
   * Returns null when the resulting amount is too small.
   */
  private computeAmount(
    deposit: DetectedDeposit,
    target: SweepAttempt,
    pct: bigint
  ): string | null {
    // Amount is always in USDC terms for universal transactions
    const baseUSD = target.targetAmountUSD ?? deposit.amountUSD ?? 0;
    if (baseUSD <= 0) return null;
    const scaledUSD = baseUSD * Number(pct) / 100;
    if (scaledUSD < 0.001) return null;
    return scaledUSD.toFixed(USDC_DECIMALS);
  }

  /**
   * Build list of sweep targets in priority order
   */
  private buildSweepTargets(deposit: DetectedDeposit, targetChainId: number): SweepAttempt[] {
    const targets: SweepAttempt[] = [];
    const token = deposit.token.toLowerCase();

    const destConfig = TOKEN_ADDRESSES[targetChainId] || {};

    const isUsdcDeposit = token === 'usdc';

    // 1. Primary: USDC on destination chain via createUniversalTransaction
    if (destConfig.usdc) {
      targets.push({
        chainId: targetChainId,
        tokenAddress: destConfig.usdc,
        label: `${this.getChainName(targetChainId)} USDC`,
        isUniversalTx: true,
        targetAmountUSD: isUsdcDeposit ? undefined : deposit.amountUSD,
      });
    }

    // 2. Secondary: USDC.e (bridged) on destination
    if (destConfig.usdc_e) {
      targets.push({
        chainId: targetChainId,
        tokenAddress: destConfig.usdc_e,
        label: `${this.getChainName(targetChainId)} USDC.e`,
        isUniversalTx: true,
        targetAmountUSD: isUsdcDeposit ? undefined : deposit.amountUSD,
      });
    }

    // No source-chain fallback: if USDC/USDC.e targets on the destination
    // chain both fail, the sweep should fail and retry rather than sending
    // funds to a chain the user didn't choose.

    return targets;
  }

  /**
   * Build a universal transaction that converts any token -> USDC and
   * sends it via an ERC20 transfer call to the receiver.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async buildUniversalTransaction(
    ua: any,
    chainId: number,
    usdcAddress: string,
    amountHuman: string,
    receiver: string
  ): Promise<any> {
    const amountSmallest = toSmallestUnit(amountHuman, USDC_DECIMALS);

    return await ua.createUniversalTransaction({
      chainId,
      expectTokens: [
        {
          type: UA_TOKEN_USDC,
          amount: amountHuman,
        },
      ],
      transactions: [
        {
          to: usdcAddress,
          data: encodeERC20Transfer(receiver, amountSmallest),
        },
      ],
    });
  }

  /**
   * Get chain name for logging
   */
  private getChainName(chainId: number): string {
    const names: Record<number, string> = {
      [CHAIN.ETHEREUM]: 'Ethereum',
      [CHAIN.ARBITRUM]: 'Arbitrum',
      [CHAIN.BASE]: 'Base',
      [CHAIN.POLYGON]: 'Polygon',
      [CHAIN.BNB]: 'BNB Chain',
      [CHAIN.SOLANA]: 'Solana',
    };
    return names[chainId] || `Chain ${chainId}`;
  }

  /**
   * Get explorer URL for a transaction
   */
  private getExplorerUrl(chainId: number, txHash: string): string {
    const explorers: Record<number, string> = {
      [CHAIN.ETHEREUM]: 'https://etherscan.io/tx/',
      [CHAIN.ARBITRUM]: 'https://arbiscan.io/tx/',
      [CHAIN.BASE]: 'https://basescan.org/tx/',
      [CHAIN.POLYGON]: 'https://polygonscan.com/tx/',
      [CHAIN.BNB]: 'https://bscscan.com/tx/',
    };
    const base = explorers[chainId] || 'https://etherscan.io/tx/';
    return `${base}${txHash}`;
  }
}
