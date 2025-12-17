import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { particleProjectConfig } from './connectkit';
import './index.css';
import reportWebVitals from './reportWebVitals';

// Privy Imports
import { PrivyProvider } from '@privy-io/react-auth';

// Particle Auth Core (Intermediary Account Logic - Preserved)
import { AuthCoreContextProvider, PromptSettingType } from '@particle-network/auth-core-modal';
import { AuthType } from '@particle-network/auth-core';

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);

root.render(
  <React.StrictMode>
    <PrivyProvider
      appId="cmj91pslf03c3l50ckh4d8ff9" // <--- REPLACE WITH YOUR PRIVY APP ID
      config={{
        loginMethods: ['wallet', 'email', 'google'],
        appearance: {
          theme: 'dark',
          accentColor: '#676FFF',
          logo: 'https://auth.privy.io/logos/privy-logo.png', // Optional: Replace with your logo
        },
        embeddedWallets: {
          createOnLogin: 'users-without-wallets',
        },
      }}
    >
      <AuthCoreContextProvider
        options={{
          projectId: particleProjectConfig.projectId,
          clientKey: particleProjectConfig.clientKey,
          appId: particleProjectConfig.appId,
          authTypes: [AuthType.jwt],
          themeType: 'dark',
          fiatCoin: 'USD',
          language: 'en',
          wallet: {
            visible: false, // Hidden as requested (intermediary only)
          },
          promptSettingConfig: {
            promptPaymentPasswordSettingWhenSign: PromptSettingType.none,
            promptMasterPasswordSettingWhenLogin: PromptSettingType.none,
          },
        }}
      >
        <App />
      </AuthCoreContextProvider>
    </PrivyProvider>
  </React.StrictMode>
);

reportWebVitals();