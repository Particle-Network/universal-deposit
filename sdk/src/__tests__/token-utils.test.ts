import { describe, it, expect } from 'vitest';
import { normalizeTokenType, parseBigInt } from '../utils/token-utils';

describe('normalizeTokenType', () => {
  it('should normalize known tokens to lowercase', () => {
    expect(normalizeTokenType('ETH')).toBe('eth');
    expect(normalizeTokenType('USDC')).toBe('usdc');
    expect(normalizeTokenType('Usdt')).toBe('usdt');
    expect(normalizeTokenType('btc')).toBe('btc');
    expect(normalizeTokenType('SOL')).toBe('sol');
    expect(normalizeTokenType('BNB')).toBe('bnb');
  });

  it('should return null for unknown tokens', () => {
    expect(normalizeTokenType('DOGE')).toBeNull();
    expect(normalizeTokenType('SHIB')).toBeNull();
    expect(normalizeTokenType('')).toBeNull();
  });

  it('should return null for undefined', () => {
    expect(normalizeTokenType(undefined)).toBeNull();
  });
});

describe('parseBigInt', () => {
  it('should parse string values', () => {
    expect(parseBigInt('1000000')).toBe(1000000n);
    expect(parseBigInt('0')).toBe(0n);
  });

  it('should parse number values (floored)', () => {
    expect(parseBigInt(42)).toBe(42n);
    expect(parseBigInt(3.7)).toBe(3n);
  });

  it('should pass through bigint values', () => {
    expect(parseBigInt(123n)).toBe(123n);
  });

  it('should return 0n for undefined/null', () => {
    expect(parseBigInt(undefined)).toBe(0n);
    expect(parseBigInt(null as any)).toBe(0n);
  });

  it('should return 0n for invalid strings', () => {
    expect(parseBigInt('not-a-number')).toBe(0n);
    expect(parseBigInt('')).toBe(0n);
  });
});
