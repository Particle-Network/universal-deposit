/**
 * DepositClient - Main entry point for the Deposit SDK
 */

import { TypedEventEmitter } from './EventEmitter';
import { ConfigurationError } from './errors';
import type {
  DepositClientConfig,
  DepositEvents,
  DepositAddresses,
  DetectedDeposit,
  SweepResult,
  EOABalance,
  ClientStatus,
  IntermediarySession,
} from './types';
import {
  DEFAULT_JWT_SERVICE_URL,
  DEFAULT_DESTINATION_CHAIN_ID,
  DEFAULT_MIN_VALUE_USD,
  DEFAULT_POLLING_INTERVAL_MS,
  DEFAULT_SUPPORTED_CHAINS,
  DEFAULT_PROJECT_ID,
  DEFAULT_CLIENT_KEY,
  DEFAULT_APP_ID,
} from '../constants';
import { DEFAULT_SUPPORTED_TOKENS } from '../constants/tokens';
import { IntermediaryService } from '../intermediary';
import { UAManager } from '../universal-account';
import { BalanceWatcher, Sweeper } from '../sweep';

export interface ResolvedConfig {
  projectId: string;
  clientKey: string;
  appId: string;
  ownerAddress: string;
  intermediaryAddress: string;
  authCoreProvider: DepositClientConfig['authCoreProvider'];
  signer: DepositClientConfig['signer'];
  destination: {
    address: string;
    chainId: number;
  };
  supportedTokens: string[];
  supportedChains: number[];
  autoSweep: boolean;
  minValueUSD: number;
  pollingIntervalMs: number;
  jwtServiceUrl: string;
}

export class DepositClient extends TypedEventEmitter<DepositEvents> {
  private config: ResolvedConfig;
  private status: ClientStatus = 'idle';
  private depositAddresses: DepositAddresses | null = null;
  private pendingDeposits: Map<string, DetectedDeposit> = new Map();
  
  // Services
  private intermediaryService: IntermediaryService;
  private intermediarySession: IntermediarySession | null = null;
  private uaManager: UAManager | null = null;
  private balanceWatcher: BalanceWatcher | null = null;
  private sweeper: Sweeper | null = null;

  constructor(config: DepositClientConfig) {
    super();
    this.config = this.validateAndResolveConfig(config);
    
    // Initialize IntermediaryService
    this.intermediaryService = new IntermediaryService({
      projectId: this.config.projectId,
      clientKey: this.config.clientKey,
      appId: this.config.appId,
      jwtServiceUrl: this.config.jwtServiceUrl,
    });
  }

  // ============================================
  // Configuration Validation
  // ============================================

  private validateAndResolveConfig(config: DepositClientConfig): ResolvedConfig {
    // Required fields
    if (!config.ownerAddress?.trim()) {
      throw new ConfigurationError('ownerAddress is required');
    }

    if (!config.intermediaryAddress?.trim()) {
      throw new ConfigurationError('intermediaryAddress is required (from useEthereum().address)');
    }

    // Validate address format (basic check)
    if (!this.isValidAddress(config.ownerAddress)) {
      throw new ConfigurationError('ownerAddress must be a valid EVM address');
    }

    if (!this.isValidAddress(config.intermediaryAddress)) {
      throw new ConfigurationError('intermediaryAddress must be a valid EVM address');
    }

    return {
      // JWT service uses baked-in credentials (internal to SDK)
      projectId: DEFAULT_PROJECT_ID,
      clientKey: DEFAULT_CLIENT_KEY,
      appId: DEFAULT_APP_ID,
      ownerAddress: config.ownerAddress.trim().toLowerCase(),
      intermediaryAddress: config.intermediaryAddress.trim().toLowerCase(),
      authCoreProvider: config.authCoreProvider,
      signer: config.signer,
      destination: {
        address: config.destination?.address?.trim().toLowerCase() || config.ownerAddress.trim().toLowerCase(),
        chainId: config.destination?.chainId ?? DEFAULT_DESTINATION_CHAIN_ID,
      },
      supportedTokens: config.supportedTokens ?? [...DEFAULT_SUPPORTED_TOKENS],
      supportedChains: config.supportedChains ?? DEFAULT_SUPPORTED_CHAINS,
      autoSweep: config.autoSweep ?? true,
      minValueUSD: config.minValueUSD ?? DEFAULT_MIN_VALUE_USD,
      pollingIntervalMs: config.pollingIntervalMs ?? DEFAULT_POLLING_INTERVAL_MS,
      jwtServiceUrl: config.jwtServiceUrl ?? DEFAULT_JWT_SERVICE_URL,
    };
  }

  private isValidAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }

  // ============================================
  // Lifecycle
  // ============================================

  async initialize(): Promise<void> {
    if (this.status !== 'idle') {
      throw new ConfigurationError('Client already initialized');
    }

    this.setStatus('initializing');

    try {
      // Use the intermediary address provided by the consumer
      // This address comes from useEthereum().address after JWT connection
      console.log('[DepositSDK] Using intermediary address:', this.config.intermediaryAddress);

      // Create a synthetic session with the provided intermediary address
      // No need to fetch JWT since the consumer already connected Auth Core
      this.intermediarySession = {
        jwt: '', // Not needed - consumer already connected
        intermediaryAddress: this.config.intermediaryAddress,
        expiresAt: Math.floor(Date.now() / 1000) + 3600, // 1 hour placeholder
      };

      // Initialize UAManager with the intermediary address
      this.uaManager = new UAManager({
        ownerAddress: this.config.ownerAddress,
        session: this.intermediarySession,
      });
      await this.uaManager.initialize();

      // Get deposit addresses
      this.depositAddresses = this.uaManager.getDepositAddresses();

      console.log('[DepositSDK] Deposit addresses:', this.depositAddresses);

      // Phase 4: Initialize BalanceWatcher and Sweeper
      this.balanceWatcher = new BalanceWatcher({
        uaManager: this.uaManager,
        pollingIntervalMs: this.config.pollingIntervalMs,
        minValueUSD: this.config.minValueUSD,
        supportedTokens: this.config.supportedTokens,
        supportedChains: this.config.supportedChains,
      });

      this.sweeper = new Sweeper({
        uaManager: this.uaManager,
        authCoreProvider: this.config.authCoreProvider,
        destination: this.config.destination,
      });

      // Wire up balance watcher events
      this.balanceWatcher.on('deposit:detected', (deposit) => {
        this.handleDepositDetected(deposit);
      });

      this.balanceWatcher.on('error', (error) => {
        this.emit('deposit:error', error);
      });

      this.setStatus('ready');
    } catch (error) {
      this.setStatus('error');
      throw error;
    }
  }

  destroy(): void {
    this.stopWatching();
    this.removeAllListeners();
    this.pendingDeposits.clear();
    this.depositAddresses = null;
    this.intermediarySession = null;
    this.intermediaryService.clearSession();
    if (this.balanceWatcher) {
      this.balanceWatcher.stop();
      this.balanceWatcher.removeAllListeners();
      this.balanceWatcher = null;
    }
    this.sweeper = null;
    if (this.uaManager) {
      this.uaManager.destroy();
      this.uaManager = null;
    }
    this.setStatus('idle');
  }

  /**
   * Get the current intermediary session (for debugging/advanced use)
   */
  getIntermediarySession(): IntermediarySession | null {
    return this.intermediarySession;
  }

  // ============================================
  // Deposit Addresses
  // ============================================

  async getDepositAddresses(): Promise<DepositAddresses> {
    if (this.depositAddresses) {
      return this.depositAddresses;
    }

    if (!this.uaManager) {
      throw new ConfigurationError('Client not initialized. Call initialize() first.');
    }

    return this.uaManager.getDepositAddresses();
  }

  /**
   * Get the UAManager instance (for advanced use)
   */
  getUAManager(): UAManager | null {
    return this.uaManager;
  }

  // ============================================
  // Balance Watching
  // ============================================

  startWatching(): void {
    if (this.status !== 'ready') {
      throw new ConfigurationError('Client must be initialized before watching');
    }

    if (!this.balanceWatcher) {
      throw new ConfigurationError('BalanceWatcher not initialized');
    }

    this.balanceWatcher.start();
    this.setStatus('watching');
    console.log('[DepositSDK] Started watching for deposits');
  }

  stopWatching(): void {
    if (this.status === 'watching' && this.balanceWatcher) {
      this.balanceWatcher.stop();
      this.setStatus('ready');
      console.log('[DepositSDK] Stopped watching for deposits');
    }
  }

  async checkBalances(): Promise<DetectedDeposit[]> {
    if (!this.balanceWatcher) {
      throw new ConfigurationError('Client not initialized');
    }
    return this.balanceWatcher.getCurrentBalances();
  }

  // ============================================
  // Sweeping
  // ============================================

  async sweep(depositId?: string): Promise<SweepResult[]> {
    if (!this.sweeper) {
      throw new ConfigurationError('Client not initialized');
    }

    const results: SweepResult[] = [];

    if (depositId) {
      // Sweep specific deposit
      const deposit = this.pendingDeposits.get(depositId);
      if (!deposit) {
        throw new ConfigurationError(`Deposit ${depositId} not found`);
      }
      const result = await this.sweeper.sweep(deposit);
      results.push(result);
    } else {
      // Sweep all pending deposits
      for (const deposit of this.pendingDeposits.values()) {
        try {
          const result = await this.sweeper.sweep(deposit);
          results.push(result);
        } catch (error) {
          console.error(`[DepositSDK] Failed to sweep ${deposit.id}:`, error);
          results.push({
            depositId: deposit.id,
            transactionId: '',
            explorerUrl: '',
            status: 'failed',
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }
    }

    return results;
  }

  // ============================================
  // EOA Operations
  // ============================================

  async detectEOABalances(): Promise<EOABalance[]> {
    // TODO: Phase 5 - EOA balance detection
    throw new Error('Not implemented: detectEOABalances');
  }

  async depositFromEOA(_params: {
    token: string;
    chainId: number;
    amount: string;
  }): Promise<SweepResult> {
    // TODO: Phase 5 - EOA deposit
    throw new Error('Not implemented: depositFromEOA');
  }

  // ============================================
  // State Accessors
  // ============================================

  getStatus(): ClientStatus {
    return this.status;
  }

  getPendingDeposits(): DetectedDeposit[] {
    return Array.from(this.pendingDeposits.values());
  }

  getConfig(): Readonly<ResolvedConfig> {
    return this.config;
  }

  // ============================================
  // Internal Helpers
  // ============================================

  private setStatus(status: ClientStatus): void {
    if (this.status !== status) {
      this.status = status;
      this.emit('status:change', status);
    }
  }

  /**
   * Handle a detected deposit
   */
  private handleDepositDetected(deposit: DetectedDeposit): void {
    console.log('[DepositSDK] Deposit detected:', deposit);

    // Store in pending deposits
    this.pendingDeposits.set(deposit.id, deposit);

    // Emit event
    this.emit('deposit:detected', deposit);

    // Auto-sweep if enabled
    if (this.config.autoSweep && this.sweeper) {
      this.emit('deposit:processing', deposit);
      this.setStatus('sweeping');

      this.sweeper.sweep(deposit)
        .then((result) => {
          // Remove from pending
          this.pendingDeposits.delete(deposit.id);
          this.emit('deposit:complete', result);
          
          // Return to watching if still active
          if (this.balanceWatcher?.isActive()) {
            this.setStatus('watching');
          } else {
            this.setStatus('ready');
          }
        })
        .catch((error) => {
          console.error('[DepositSDK] Auto-sweep failed:', error);
          this.emit('deposit:error', error, deposit);
          
          // Return to watching if still active
          if (this.balanceWatcher?.isActive()) {
            this.setStatus('watching');
          } else {
            this.setStatus('ready');
          }
        });
    }
  }
}
