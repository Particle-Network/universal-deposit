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

export interface ResolvedConfig {
  projectId: string;
  clientKey: string;
  appId: string;
  ownerAddress: string;
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
    if (!config.signer?.signMessage) {
      throw new ConfigurationError('signer with signMessage function is required');
    }

    // Validate address format (basic check)
    if (!this.isValidAddress(config.ownerAddress)) {
      throw new ConfigurationError('ownerAddress must be a valid EVM address');
    }

    return {
      // JWT service uses baked-in credentials (internal to SDK)
      projectId: DEFAULT_PROJECT_ID,
      clientKey: DEFAULT_CLIENT_KEY,
      appId: DEFAULT_APP_ID,
      ownerAddress: config.ownerAddress.trim().toLowerCase(),
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
      // Phase 2: Get JWT session for intermediary wallet
      this.intermediarySession = await this.intermediaryService.getSession(
        this.config.ownerAddress
      );
      
      console.log('[DepositSDK] Intermediary session created:', {
        intermediaryAddress: this.intermediarySession.intermediaryAddress,
        expiresAt: new Date(this.intermediarySession.expiresAt * 1000).toISOString(),
      });

      // TODO: Phase 3 - Initialize UAManager with intermediary address
      // TODO: Get deposit addresses

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

    // TODO: Phase 3 - Get from UAManager
    throw new Error('Not implemented: getDepositAddresses');
  }

  // ============================================
  // Balance Watching
  // ============================================

  startWatching(): void {
    if (this.status !== 'ready') {
      throw new ConfigurationError('Client must be initialized before watching');
    }

    this.setStatus('watching');
    // TODO: Phase 4 - Start BalanceWatcher
  }

  stopWatching(): void {
    if (this.status === 'watching') {
      // TODO: Phase 4 - Stop BalanceWatcher
      this.setStatus('ready');
    }
  }

  async checkBalances(): Promise<DetectedDeposit[]> {
    // TODO: Phase 4 - Manual balance check
    throw new Error('Not implemented: checkBalances');
  }

  // ============================================
  // Sweeping
  // ============================================

  async sweep(_depositId?: string): Promise<SweepResult[]> {
    // TODO: Phase 4 - Manual sweep
    throw new Error('Not implemented: sweep');
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
}
