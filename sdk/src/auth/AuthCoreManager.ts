/**
 * AuthCoreManager - Manages Particle Auth Core connection internally
 * 
 * Handles:
 * 1. JWT fetching from the worker
 * 2. Auth Core connection with JWT
 * 3. Providing the intermediary address and signing provider
 */

import { AuthType } from '@particle-network/auth-core';
import { IntermediaryService } from '../intermediary';
import { AuthenticationError } from '../core/errors';
import type { AuthCoreProvider } from '../core/types';
import {
  DEFAULT_PROJECT_ID,
  DEFAULT_CLIENT_KEY,
  DEFAULT_APP_ID,
  DEFAULT_JWT_SERVICE_URL,
} from '../constants';

export interface AuthCoreManagerConfig {
  projectId?: string;
  clientKey?: string;
  appId?: string;
  jwtServiceUrl?: string;
}

export interface AuthCoreConnection {
  intermediaryAddress: string;
  provider: AuthCoreProvider;
}

export interface AuthCoreHooks {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  connect: (params: any) => Promise<any>;
  disconnect: () => Promise<void>;
  connected: boolean;
  address: string | null | undefined;
  provider: { signMessage: (message: string) => Promise<string> } | null | undefined;
}

export class AuthCoreManager {
  private config: Required<AuthCoreManagerConfig>;
  private intermediaryService: IntermediaryService;
  private connection: AuthCoreConnection | null = null;
  private connecting = false;
  private connectPromise: Promise<AuthCoreConnection> | null = null;

  constructor(config: AuthCoreManagerConfig = {}) {
    this.config = {
      projectId: config.projectId || DEFAULT_PROJECT_ID,
      clientKey: config.clientKey || DEFAULT_CLIENT_KEY,
      appId: config.appId || DEFAULT_APP_ID,
      jwtServiceUrl: config.jwtServiceUrl || DEFAULT_JWT_SERVICE_URL,
    };

    this.intermediaryService = new IntermediaryService({
      projectId: this.config.projectId,
      clientKey: this.config.clientKey,
      appId: this.config.appId,
      jwtServiceUrl: this.config.jwtServiceUrl,
    });
  }

  /**
   * Connect to Auth Core using JWT authentication
   * This method requires Auth Core hooks from the React context
   */
  async connect(
    ownerAddress: string,
    authCoreHooks: AuthCoreHooks
  ): Promise<AuthCoreConnection> {
    // Return existing connection if already connected
    if (this.connection && authCoreHooks.connected) {
      return this.connection;
    }

    // If already connecting, wait for that promise
    if (this.connectPromise) {
      return this.connectPromise;
    }

    this.connecting = true;
    this.connectPromise = this.doConnect(ownerAddress, authCoreHooks);

    try {
      const result = await this.connectPromise;
      return result;
    } finally {
      this.connecting = false;
      this.connectPromise = null;
    }
  }

  private async doConnect(
    ownerAddress: string,
    authCoreHooks: AuthCoreHooks
  ): Promise<AuthCoreConnection> {
    const { connect, connected, address, provider } = authCoreHooks;

    // If already connected, just return the connection
    if (connected && address && provider) {
      this.connection = {
        intermediaryAddress: address,
        provider: {
          signMessage: (message: string) => provider.signMessage(message),
        },
      };
      return this.connection;
    }

    // Fetch JWT from worker
    console.log('[AuthCoreManager] Fetching JWT for:', ownerAddress);
    const session = await this.intermediaryService.getSession(ownerAddress);

    // Connect to Auth Core with JWT
    console.log('[AuthCoreManager] Connecting to Auth Core...');
    await connect({
      provider: AuthType.jwt,
      thirdpartyCode: session.jwt,
    });

    // Wait a bit for the connection to establish and hooks to update
    // This is necessary because React state updates are async
    await this.waitForConnection(authCoreHooks, 5000);

    const finalAddress = authCoreHooks.address;
    const finalProvider = authCoreHooks.provider;

    if (!finalAddress || !finalProvider) {
      throw new AuthenticationError('Auth Core connection failed - no address or provider');
    }

    this.connection = {
      intermediaryAddress: finalAddress,
      provider: {
        signMessage: (message: string) => finalProvider.signMessage(message),
      },
    };

    console.log('[AuthCoreManager] Connected:', this.connection.intermediaryAddress);
    return this.connection;
  }

  private async waitForConnection(
    authCoreHooks: AuthCoreHooks,
    timeoutMs: number
  ): Promise<void> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeoutMs) {
      if (authCoreHooks.connected && authCoreHooks.address && authCoreHooks.provider) {
        return;
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    throw new AuthenticationError(`Auth Core connection timed out after ${timeoutMs}ms`);
  }

  /**
   * Disconnect from Auth Core
   */
  async disconnect(authCoreHooks: AuthCoreHooks): Promise<void> {
    if (authCoreHooks.connected) {
      await authCoreHooks.disconnect();
    }
    this.connection = null;
    this.intermediaryService.clearSession();
  }

  /**
   * Get the current connection
   */
  getConnection(): AuthCoreConnection | null {
    return this.connection;
  }

  /**
   * Check if currently connecting
   */
  isConnecting(): boolean {
    return this.connecting;
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.connection !== null;
  }

  /**
   * Get the Particle project config (for AuthCoreContextProvider)
   */
  getParticleConfig() {
    return {
      projectId: this.config.projectId,
      clientKey: this.config.clientKey,
      appId: this.config.appId,
    };
  }
}
