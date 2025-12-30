"use client";

import { UniversalAccount } from "@particle-network/universal-account-sdk";

// 1. Config Constants
const particleConfig = {
  projectId: "2e1612a2-5757-4026-82b1-e0a7a3a69698",
  clientKey: "cQRTw7Eqag5yHpa3iKkvwQ8J7qThRy1ZAqfPJwdy",
  appId: "30c594e4-5615-49c9-89d6-86227f5e423e",
};

if (
  !particleConfig.projectId ||
  !particleConfig.clientKey ||
  !particleConfig.appId
) {
  throw new Error("Please configure the Particle project in .env first!");
}

// 2. Process Polyfill (Required for UniversalAccount SDK in browser)
declare global {
  interface Window {
    process?: any;
  }
}

if (typeof window !== "undefined" && !window.process) {
  window.process = { env: {} };
}

// 3. Exports
export const particleProjectConfig = {
  projectId: particleConfig.projectId,
  clientKey: particleConfig.clientKey,
  appId: particleConfig.appId,
};

export const createUniversalAccount = (ownerAddress: string) => {
  return new UniversalAccount({
    projectId: particleConfig.projectId,
    projectClientKey: particleConfig.clientKey,
    projectAppUuid: particleConfig.appId,
    ownerAddress,
    tradeConfig: {
      slippageBps: 100,
      universalGas: true,
    },
  });
};
