/**
 * @particle-network/deposit-sdk
 * 
 * Deposit SDK for Universal Accounts - solve the empty smart account problem
 */

// Core exports
export { DepositClient } from './core/DepositClient';
export type { ResolvedConfig } from './core/DepositClient';

// Types
export type {
  TokenType,
  AddressType,
  Signer,
  DestinationConfig,
  DepositClientConfig,
  DepositAddresses,
  DetectedDeposit,
  SweepStatus,
  SweepResult,
  EOABalance,
  ClientStatus,
  DepositEvents,
  JwtResponse,
  IntermediarySession,
} from './core/types';

// Errors
export {
  DepositSDKError,
  ConfigurationError,
  AuthenticationError,
  JwtError,
  UniversalAccountError,
  SweepError,
  NetworkError,
} from './core/errors';

// Constants
export {
  CHAIN,
  CHAIN_META,
  DEFAULT_SUPPORTED_CHAINS,
  PRIMARY_ASSETS_BY_CHAIN,
  TOKEN_ADDRESSES,
  TOKEN_DECIMALS,
  DEFAULT_SUPPORTED_TOKENS,
  DEFAULT_JWT_SERVICE_URL,
  DEFAULT_DESTINATION_CHAIN_ID,
  DEFAULT_MIN_VALUE_USD,
  DEFAULT_POLLING_INTERVAL_MS,
} from './constants';
export type { ChainId } from './constants/chains';
