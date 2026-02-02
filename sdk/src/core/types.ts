/**
 * Core types for the Deposit SDK
 */

// ============================================
// Token & Chain Types
// ============================================

export type TokenType = 'ETH' | 'USDC' | 'USDT' | 'BTC' | 'SOL' | 'BNB';

export type AddressType = 'evm' | 'solana';

// ============================================
// Configuration
// ============================================

export interface Signer {
  signMessage: (message: string | Uint8Array) => Promise<string>;
}

/**
 * Auth Core provider interface for signing UA transactions
 * This is the intermediary wallet's provider from Particle Auth Core
 */
export interface AuthCoreProvider {
  signMessage: (message: string) => Promise<string>;
}

/**
 * Configuration for the sweep destination (where funds are sent after deposit)
 *
 * @example
 * // Default: sweep to owner's EOA on Arbitrum
 * destination: undefined
 *
 * @example
 * // Sweep to owner's EOA on Base
 * destination: { chainId: CHAIN.BASE }
 *
 * @example
 * // Sweep to a custom treasury address on Arbitrum
 * destination: { address: '0xTreasury...' }
 *
 * @example
 * // Sweep to a custom address on Ethereum mainnet
 * destination: {
 *   chainId: CHAIN.ETHEREUM,
 *   address: '0xTreasury...'
 * }
 */
export interface DestinationConfig {
  /**
   * The address to receive swept funds.
   *
   * - If not specified, defaults to the user's connected EOA (ownerAddress)
   * - For EVM chains: must be a valid 0x-prefixed address (42 characters)
   * - For Solana: must be a valid base58 address (32-44 characters)
   *
   * ⚠️ Warning: If set to a different address than ownerAddress, ensure the
   * recipient has access to this address. Funds sent to an inaccessible
   * address cannot be recovered.
   */
  address?: string;

  /**
   * The chain ID to sweep funds to.
   *
   * - If not specified, defaults to Arbitrum (42161)
   * - Must be a supported chain from the CHAIN constant
   * - The chain's address type (EVM/Solana) must match the address format
   *
   * @see CHAIN constant for available chain IDs
   * @default 42161 (Arbitrum)
   */
  chainId?: number;
}

export interface DepositClientConfig {
  // User's connected wallet address (EOA from Privy, RainbowKit, etc.)
  // This is where swept funds will be sent
  ownerAddress: string;

  // Intermediary address from Particle Auth Core (useEthereum().address)
  // This is the EOA that owns the Universal Account
  // Required for sweep operations
  intermediaryAddress: string;

  // Auth Core provider for signing UA transactions
  // This comes from useEthereum().provider in @particle-network/auth-core-modal
  // Required for sweep operations
  authCoreProvider?: AuthCoreProvider;

  // Legacy signer (deprecated - use authCoreProvider instead)
  signer?: Signer;

  /**
   * Configuration for where swept funds are sent.
   *
   * Defaults to sweeping to the owner's EOA on Arbitrum if not specified.
   *
   * @see DestinationConfig for full documentation and examples
   */
  destination?: DestinationConfig;

  // Token filtering
  supportedTokens?: TokenType[];
  supportedChains?: number[];

  // Behavior options
  autoSweep?: boolean;
  minValueUSD?: number;
  pollingIntervalMs?: number;

  // Recovery options
  recovery?: RecoveryConfig;

  // Advanced options (internal use)
  jwtServiceUrl?: string;
}

// ============================================
// Deposit Addresses
// ============================================

export interface DepositAddresses {
  evm: string;
  solana: string;
}

// ============================================
// Detected Deposits
// ============================================

export interface DetectedDeposit {
  id: string;
  token: TokenType;
  chainId: number;
  amount: string;
  amountUSD: number;
  rawAmount: bigint;
  detectedAt: number;
}

// ============================================
// Sweep Results
// ============================================

export type SweepStatus = 'success' | 'failed' | 'pending';

export interface SweepResult {
  depositId: string;
  transactionId: string;
  explorerUrl: string;
  status: SweepStatus;
  error?: string;
}

// ============================================
// Recovery Types
// ============================================

export type RecoveryStatus = 'success' | 'failed' | 'skipped';

export interface RecoveryResult {
  token: TokenType;
  chainId: number;
  amount: string;
  amountUSD: number;
  status: RecoveryStatus;
  error?: string;
  txHash?: string;
}

export interface RecoveryConfig {
  /** Enable automatic retry of failed sweeps. Default: true */
  autoRetry?: boolean;
  /** Maximum number of retry attempts. Default: 3 */
  maxRetries?: number;
  /** Initial delay between retries in ms. Default: 60000 (1 minute) */
  retryDelayMs?: number;
  /** Backoff multiplier for subsequent retries. Default: 2 */
  backoffMultiplier?: number;
  /** Callback when recovery ultimately fails after all retries */
  onRecoveryFailed?: (deposit: DetectedDeposit, error: Error) => void;
}

// ============================================
// EOA Balances
// ============================================

export interface EOABalance {
  token: TokenType;
  chainId: number;
  address: string;
  amount: string;
  amountUSD: number;
  rawAmount: bigint;
}

// ============================================
// Client Status
// ============================================

export type ClientStatus =
  | 'idle'
  | 'initializing'
  | 'ready'
  | 'watching'
  | 'sweeping'
  | 'error';

// ============================================
// Events
// ============================================

export type DepositEvents = {
  'deposit:detected': (deposit: DetectedDeposit) => void;
  'deposit:processing': (deposit: DetectedDeposit) => void;
  'deposit:complete': (result: SweepResult) => void;
  'deposit:error': (error: Error, deposit?: DetectedDeposit) => void;
  'recovery:started': () => void;
  'recovery:complete': (results: RecoveryResult[]) => void;
  'recovery:failed': (deposit: DetectedDeposit, error: Error) => void;
  'eoa:balances': (balances: EOABalance[]) => void;
  'status:change': (status: ClientStatus) => void;
  [key: string]: (...args: any[]) => void;
}

// ============================================
// Internal Types
// ============================================

export interface JwtResponse {
  jwt: string;
  expiresAt: number;
  expiresIn: number;
  sub: string;
}

export interface IntermediarySession {
  jwt: string;
  expiresAt: number;
  intermediaryAddress: string;
}

// ============================================
// Transaction History Types
// ============================================

/**
 * Transaction record from Universal Account history
 * Retrieved via universalAccount.getTransactions()
 */
export interface UATransaction {
  transactionId: string;
  tag: string;
  createdAt: string;
  updatedAt: string;
  targetToken: {
    name: string;
    type: string;
    image: string;
    price: number;
    symbol: string;
    address: string;
    assetId: string;
    chainId: number;
    decimals: number;
    realDecimals: number;
    isPrimaryToken: boolean;
    isSmartRouterSupported: boolean;
  };
  change: {
    amount: string;
    amountInUSD: string;
    from: string;
    to: string;
  };
  detail: {
    redPacketCount: number;
  };
  status: number;
  fromChains: number[];
  toChains: number[];
  exchangeRateUSD: Array<{
    type: string;
    exchangeRate: {
      type: string;
      price: number;
    };
  }>;
}
