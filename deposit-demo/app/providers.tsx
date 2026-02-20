"use client";

import type { ReactNode } from "react";
import { PrivyProvider } from "@privy-io/react-auth";
import { DepositProvider, CHAIN } from "@particle-network/deposit-sdk/react";

const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID!;

export function Providers({ children }: { children: ReactNode }) {
  return (
    <PrivyProvider
      appId={PRIVY_APP_ID}
      config={{
        loginMethods: ["email", "google"],
        appearance: {
          theme: "dark",
          accentColor: "#3B82F6",
        },
        embeddedWallets: {
          ethereum: {
            createOnLogin: "users-without-wallets",
          },
        },
      }}
    >
      <DepositProvider
        config={{
          destination: {
            chainId: CHAIN.POLYGON,
            // address: "CUSTOM_DESTINATION_ADDRESS", // Default: User's connected wallet address
          },
          autoSweep: true,
          minValueUSD: 1,
        }}
      >
        {children}
      </DepositProvider>
    </PrivyProvider>
  );
}
