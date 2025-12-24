"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import { AuthCoreContextProvider } from "@particle-network/auth-core-modal";

const PRIVY_APP_ID = "cmj91pslf03c3l50ckh4d8ff9";

const PARTICLE_PROJECT_ID = "2e1612a2-5757-4026-82b1-e0a7a3a69698";
const PARTICLE_CLIENT_KEY = "cQRTw7Eqag5yHpa3iKkvwQ8J7qThRy1ZAqfPJwdy";
const PARTICLE_APP_ID = "30c594e4-5615-49c9-89d6-86227f5e423e";

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
      <AuthCoreContextProvider
        options={{
          projectId: PARTICLE_PROJECT_ID,
          clientKey: PARTICLE_CLIENT_KEY,
          appId: PARTICLE_APP_ID,
          customStyle: {
            zIndex: 2000,
          },
          wallet: {
            visible: false,
          },
          promptSettingConfig: {
            promptPaymentPasswordSettingWhenSign: false,
            promptMasterPasswordSettingWhenLogin: false,
          },
        }}
      >
        {children}
      </AuthCoreContextProvider>
    </PrivyProvider>
  );
}
