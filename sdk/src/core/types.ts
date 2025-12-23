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

export interface DestinationConfig {
  address?: string;
  chainId?: number;
}

export interface DepositClientConfig {
  // User's connected wallet (provider-agnostic)
  ownerAddress: string;

  // Signer for UA transactions (works with any provider)
  signer: Signer;

  // Destination configuration
  destination?: DestinationConfig;

  // Token filtering
  supportedTokens?: TokenType[];
  supportedChains?: number[];

  // Behavior options
  autoSweep?: boolean;
  minValueUSD?: number;
  pollingIntervalMs?: number;

  // Advanced options
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
