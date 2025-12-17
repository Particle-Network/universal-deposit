'use client';

import { UniversalAccount } from '@particle-network/universal-account-sdk';

// 1. Config Constants
const projectId = '3e63e8c0-1df6-4efb-a96e-96836accebdc';
const clientKey = 'cx5kWWPJ0AmG80U6ePLJ3U3EpEknGBYeVlWdF4xv';
const appId = 'c98e6688-ffea-4a66-8282-f3c7b52c012a';

if (!projectId || !clientKey || !appId) {
  throw new Error('Please configure the Particle project in .env first!');
}

// 2. Process Polyfill (Required for UniversalAccount SDK in browser)
declare global {
  interface Window {
    process?: any;
  }
}

if (typeof window !== 'undefined' && !window.process) {
  window.process = { env: {} };
}

// 3. Exports
export const particleProjectConfig = {
  projectId,
  clientKey,
  appId,
};

export const createUniversalAccount = (ownerAddress: string) => {
  return new UniversalAccount({
    projectId,
    projectClientKey: clientKey,
    projectAppUuid: appId,
    ownerAddress,
    tradeConfig: {
      slippageBps: 100,
      universalGas: true,
    },
  });
};