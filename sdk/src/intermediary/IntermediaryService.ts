/**
 * IntermediaryService - Manages JWT authentication and session with the intermediary wallet
 */

import { JwtError, AuthenticationError } from '../core/errors';
import type { JwtResponse, IntermediarySession } from '../core/types';
import { DEFAULT_JWT_SERVICE_URL } from '../constants';

export interface IntermediaryConfig {
  projectId: string;
  clientKey: string;
  appId: string;
  jwtServiceUrl: string;
}

export class IntermediaryService {
  private config: IntermediaryConfig;
  private session: IntermediarySession | null = null;
  private sessionPromise: Promise<IntermediarySession> | null = null;

  constructor(config: IntermediaryConfig) {
    this.config = {
      ...config,
      jwtServiceUrl: config.jwtServiceUrl || DEFAULT_JWT_SERVICE_URL,
    };
  }

  /**
   * Get or create a session for the given user ID (owner address)
   * Uses caching to avoid redundant JWT requests
   */
  async getSession(userId: string): Promise<IntermediarySession> {
    // Return cached session if still valid
    if (this.session && this.isSessionValid(this.session)) {
      return this.session;
    }

    // If a request is already in flight, wait for it
    if (this.sessionPromise) {
      return this.sessionPromise;
    }

    // Create new session
    this.sessionPromise = this.createSession(userId);

    try {
      this.session = await this.sessionPromise;
      return this.session;
    } finally {
      this.sessionPromise = null;
    }
  }

  /**
   * Force refresh the session even if current one is valid
   */
  async refreshSession(userId: string): Promise<IntermediarySession> {
    this.session = null;
    return this.getSession(userId);
  }

  /**
   * Get the current session without fetching a new one
   */
  getCurrentSession(): IntermediarySession | null {
    if (this.session && this.isSessionValid(this.session)) {
      return this.session;
    }
    return null;
  }

  /**
   * Clear the current session
   */
  clearSession(): void {
    this.session = null;
    this.sessionPromise = null;
  }

  /**
   * Check if a session is still valid (not expired)
   * Adds a 60-second buffer to account for clock skew and network latency
   */
  private isSessionValid(session: IntermediarySession): boolean {
    const now = Math.floor(Date.now() / 1000);
    const buffer = 60; // 60 second buffer
    return session.expiresAt > now + buffer;
  }

  /**
   * Create a new session by fetching JWT from the worker
   */
  private async createSession(userId: string): Promise<IntermediarySession> {
    const jwt = await this.fetchJwt(userId);

    return {
      jwt: jwt.jwt,
      expiresAt: jwt.expiresAt,
      intermediaryAddress: this.extractAddressFromSub(jwt.sub),
    };
  }

  /**
   * Fetch JWT from the Cloudflare Worker
   */
  private async fetchJwt(userId: string): Promise<JwtResponse> {
    const url = `${this.config.jwtServiceUrl}/v1/jwt`;

    let response: Response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId: this.config.projectId,
          clientKey: this.config.clientKey,
          appId: this.config.appId,
          userId: userId.toLowerCase(),
        }),
      });
    } catch (error) {
      throw new JwtError(
        `Failed to connect to JWT service: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error
      );
    }

    if (!response.ok) {
      const errorData = await this.parseErrorResponse(response);
      
      if (response.status === 401) {
        throw new AuthenticationError(
          `Invalid project credentials: ${errorData.message || 'Authentication failed'}`,
          errorData
        );
      }
      
      if (response.status === 429) {
        throw new JwtError(
          `Rate limited: ${errorData.message || 'Too many requests'}`,
          errorData
        );
      }

      throw new JwtError(
        `JWT request failed (${response.status}): ${errorData.message || 'Unknown error'}`,
        errorData
      );
    }

    const data = await response.json() as JwtResponse;

    if (!data.jwt) {
      throw new JwtError('JWT service did not return a valid token');
    }

    return data;
  }

  /**
   * Parse error response from the JWT service
   */
  private async parseErrorResponse(response: Response): Promise<{ error?: string; message?: string }> {
    try {
      return await response.json() as { error?: string; message?: string };
    } catch {
      return { message: response.statusText };
    }
  }

  /**
   * Extract the address portion from the JWT subject
   * Subject format: "ua:0x1234..." -> "0x1234..."
   */
  private extractAddressFromSub(sub: string): string {
    if (sub.startsWith('ua:')) {
      return sub.slice(3);
    }
    return sub;
  }
}
