'use client';

import { useEffect, useRef } from 'react';
import { useDepositContext } from '../context/DepositContext';
import type { DepositContextValue } from '../context/DepositContext';

export interface UseDepositOptions {
  /**
   * The user's wallet address (from any wallet provider like Privy, RainbowKit, etc.)
   * When provided, the SDK will automatically connect and initialize.
   */
  ownerAddress?: string;
}

export interface UseDepositReturn extends DepositContextValue {}

/**
 * Hook to access the Deposit SDK functionality.
 * 
 * @example
 * ```tsx
 * function DepositPage() {
 *   const { wallets } = useWallets(); // from Privy, RainbowKit, etc.
 *   const { isReady, depositAddresses, error } = useDeposit({ 
 *     ownerAddress: wallets[0]?.address 
 *   });
 * 
 *   if (!isReady) return <Loading />;
 *   return <DepositWidget />;
 * }
 * ```
 */
export function useDeposit(options: UseDepositOptions = {}): UseDepositReturn {
  const { ownerAddress } = options;
  const context = useDepositContext();
  const { isConnected, isConnecting, connect, disconnect } = context;
  const connectingRef = useRef(false);
  const lastAddressRef = useRef<string | undefined>(undefined);

  // Auto-connect when ownerAddress is provided
  useEffect(() => {
    // Skip if no address
    if (!ownerAddress) {
      lastAddressRef.current = undefined;
      return;
    }

    // Skip if same address already processed
    if (lastAddressRef.current === ownerAddress) {
      return;
    }

    // Skip if already connected or connecting
    if (isConnected || isConnecting || connectingRef.current) {
      return;
    }

    // Connect
    console.log('[DepositSDK] 🚀 Triggering connect for:', ownerAddress);
    lastAddressRef.current = ownerAddress;
    connectingRef.current = true;
    
    connect(ownerAddress).finally(() => {
      connectingRef.current = false;
    });
  }, [ownerAddress, isConnected, isConnecting, connect]);

  // Reset on address change (different address)
  useEffect(() => {
    if (lastAddressRef.current && ownerAddress && lastAddressRef.current !== ownerAddress && isConnected) {
      console.log('[useDeposit] Address changed, disconnecting...');
      disconnect().then(() => {
        lastAddressRef.current = undefined;
        connectingRef.current = false;
      });
    }
  }, [ownerAddress, isConnected, disconnect]);

  return context;
}
