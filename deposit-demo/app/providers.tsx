"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import { DepositProvider } from "@particle-network/deposit-sdk/react";

const PRIVY_APP_ID = "cmj91pslf03c3l50ckh4d8ff9";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <PrivyProvider
      appId={PRIVY_APP_ID}
      config={{
        loginMethods: ["email", "wallet", "google"],
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
      <DepositProvider config={{ autoSweep: true }}>{children}</DepositProvider>
    </PrivyProvider>
  );
}
