/**
 * Tests for IntermediaryService
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { IntermediaryService } from '../intermediary';
import { JwtError, AuthenticationError } from '../core/errors';

describe('IntermediaryService', () => {
  const mockConfig = {
    projectId: 'test-project-id',
    clientKey: 'test-client-key',
    appId: 'test-app-id',
    jwtServiceUrl: 'https://test-jwt-service.example.com',
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should create instance with provided config', () => {
      const service = new IntermediaryService(mockConfig);
      expect(service).toBeInstanceOf(IntermediaryService);
    });
  });

  describe('getSession', () => {
    it('should fetch JWT and return session', async () => {
      const mockJwtResponse = {
        jwt: 'mock-jwt-token',
        expiresAt: Math.floor(Date.now() / 1000) + 600,
        expiresIn: 600,
        sub: 'ua:0x1234567890abcdef1234567890abcdef12345678',
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockJwtResponse),
      });

      const service = new IntermediaryService(mockConfig);
      const session = await service.getSession('0x1234567890abcdef1234567890abcdef12345678');

      expect(session).toEqual({
        jwt: 'mock-jwt-token',
        expiresAt: mockJwtResponse.expiresAt,
        intermediaryAddress: '0x1234567890abcdef1234567890abcdef12345678',
      });

      expect(fetch).toHaveBeenCalledWith(
        'https://test-jwt-service.example.com/v1/jwt',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      );
    });

    it('should cache session and return cached version on subsequent calls', async () => {
      const mockJwtResponse = {
        jwt: 'mock-jwt-token',
        expiresAt: Math.floor(Date.now() / 1000) + 600,
        expiresIn: 600,
        sub: 'ua:0xtest',
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockJwtResponse),
      });

      const service = new IntermediaryService(mockConfig);
      
      await service.getSession('0xtest');
      await service.getSession('0xtest');
      await service.getSession('0xtest');

      // Should only call fetch once due to caching
      expect(fetch).toHaveBeenCalledTimes(1);
    });

    it('should throw JwtError on network failure', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      const service = new IntermediaryService(mockConfig);

      await expect(service.getSession('0xtest')).rejects.toThrow(JwtError);
    });

    it('should throw AuthenticationError on 401 response', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ error: 'invalid_project', message: 'Invalid credentials' }),
      });

      const service = new IntermediaryService(mockConfig);

      await expect(service.getSession('0xtest')).rejects.toThrow(AuthenticationError);
    });

    it('should throw JwtError on 429 rate limit response', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        json: () => Promise.resolve({ error: 'rate_limited', message: 'Too many requests' }),
      });

      const service = new IntermediaryService(mockConfig);

      await expect(service.getSession('0xtest')).rejects.toThrow(JwtError);
    });
  });

  describe('refreshSession', () => {
    it('should force fetch new session even if cached', async () => {
      const mockJwtResponse = {
        jwt: 'mock-jwt-token',
        expiresAt: Math.floor(Date.now() / 1000) + 600,
        expiresIn: 600,
        sub: 'ua:0xtest',
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockJwtResponse),
      });

      const service = new IntermediaryService(mockConfig);
      
      await service.getSession('0xtest');
      await service.refreshSession('0xtest');

      // Should call fetch twice - once for initial, once for refresh
      expect(fetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('clearSession', () => {
    it('should clear cached session', async () => {
      const mockJwtResponse = {
        jwt: 'mock-jwt-token',
        expiresAt: Math.floor(Date.now() / 1000) + 600,
        expiresIn: 600,
        sub: 'ua:0xtest',
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockJwtResponse),
      });

      const service = new IntermediaryService(mockConfig);
      
      await service.getSession('0xtest');
      service.clearSession();
      
      expect(service.getCurrentSession()).toBeNull();
    });
  });
});
