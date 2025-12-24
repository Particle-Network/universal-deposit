"use client";

import { useState, useEffect, useRef } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import {
  useConnect,
  useEthereum,
  useAuthCore,
} from "@particle-network/auth-core-modal";
import { AuthType } from "@particle-network/auth-core";
import {
  DepositWidget,
  DepositModal,
} from "@particle-network/deposit-sdk/react";
import { DepositClient } from "@particle-network/deposit-sdk";

async function getJwtForUser(userId: string): Promise<string> {
  const res = await fetch(
    "https://deposit-auth-worker.deposit-kit.workers.dev/v1/jwt",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId: "2e1612a2-5757-4026-82b1-e0a7a3a69698",
        clientKey: "cQRTw7Eqag5yHpa3iKkvwQ8J7qThRy1ZAqfPJwdy",
        appId: "30c594e4-5615-49c9-89d6-86227f5e423e",
        userId,
      }),
    }
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Failed to fetch JWT from worker");
  }
  const data = await res.json();
  if (!data.jwt) throw new Error("Worker did not return jwt field");
  return data.jwt as string;
}

export function DepositDemo() {
  const { login, ready, authenticated, logout } = usePrivy();
  const { wallets } = useWallets();

  const { connect: jwtConnect, connected: particleConnected } = useConnect();
  const { address: jwtEoa, provider: authCoreProvider } = useEthereum();
  useAuthCore(); // Keep hook for context

  const [showModal, setShowModal] = useState(false);
  const [client, setClient] = useState<DepositClient | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>("");

  const loginInitiatedRef = useRef(false);
  const clientInitiatedRef = useRef(false);

  const primaryWallet = wallets[0];
  const connectkitEoa = primaryWallet?.address;
  const isConnected = authenticated && !!connectkitEoa;

  // Step 1: After Privy login, connect to Particle Auth Core with JWT
  useEffect(() => {
    const run = async () => {
      if (!isConnected || !connectkitEoa) return;
      if (particleConnected) return;
      if (loginInitiatedRef.current) return;
      loginInitiatedRef.current = true;

      try {
        setStatusMessage("Connecting to intermediary wallet...");
        console.log("Initiating JWT Login for:", connectkitEoa);
        const jwt = await getJwtForUser(connectkitEoa);
        await jwtConnect({
          provider: AuthType.jwt,
          thirdpartyCode: jwt,
        });
        setStatusMessage("Intermediary wallet connected!");
      } catch (err) {
        console.error("JWT login failed:", err);
        setError(err instanceof Error ? err.message : "JWT login failed");
        loginInitiatedRef.current = false;
      }
    };
    void run();
  }, [isConnected, connectkitEoa, particleConnected, jwtConnect]);

  // Step 2: Initialize DepositClient when Auth Core is connected
  useEffect(() => {
    const run = async () => {
      if (!particleConnected || !jwtEoa || !authCoreProvider) return;
      if (!connectkitEoa) return;
      if (clientInitiatedRef.current) return;
      if (client) return;
      clientInitiatedRef.current = true;

      try {
        setIsInitializing(true);
        setStatusMessage("Initializing Deposit SDK...");
        setError(null);

        const depositClient = new DepositClient({
          ownerAddress: connectkitEoa,
          intermediaryAddress: jwtEoa,
          authCoreProvider: {
            signMessage: async (message: string) => {
              return authCoreProvider.signMessage(message);
            },
          },
          autoSweep: true,
        });

        await depositClient.initialize();

        // Start watching for deposits
        depositClient.startWatching();

        setClient(depositClient);
        setStatusMessage("");
        console.log("✅ DepositClient initialized and watching");
      } catch (err) {
        console.error("Failed to initialize DepositClient:", err);
        setError(err instanceof Error ? err.message : "Failed to initialize");
        clientInitiatedRef.current = false;
      } finally {
        setIsInitializing(false);
      }
    };
    void run();
  }, [particleConnected, jwtEoa, authCoreProvider, connectkitEoa, client]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (client) {
        client.destroy();
      }
    };
  }, [client]);

  const handleDisconnect = () => {
    if (client) {
      client.destroy();
      setClient(null);
    }
    loginInitiatedRef.current = false;
    clientInitiatedRef.current = false;
    logout();
  };

  return (
    <div className="min-h-screen bg-black p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Deposit SDK Demo</h1>
            <p className="text-zinc-400 text-sm mt-1">
              Login with Privy → Deposit to UA → Auto-sweep to EOA
            </p>
          </div>
          {isConnected && (
            <div className="flex items-center gap-4">
              <div className="text-sm text-zinc-400">
                <span className="text-zinc-500">Connected:</span>{" "}
                <span className="text-white font-mono">
                  {connectkitEoa?.slice(0, 6)}...{connectkitEoa?.slice(-4)}
                </span>
              </div>
              <button
                onClick={handleDisconnect}
                className="px-4 py-2 bg-zinc-800 text-zinc-300 rounded-lg hover:bg-zinc-700 transition-colors text-sm"
              >
                Disconnect
              </button>
            </div>
          )}
        </div>

        {/* Loading State */}
        {!ready && (
          <div className="mb-8 p-6 bg-zinc-900 rounded-xl border border-zinc-800 text-center">
            <div className="flex items-center justify-center gap-3">
              <div className="animate-spin w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full" />
              <p className="text-zinc-400">Loading Privy...</p>
            </div>
          </div>
        )}

        {/* Login Button */}
        {ready && !isConnected && (
          <div className="mb-8 p-6 bg-zinc-900 rounded-xl border border-zinc-800 text-center">
            <h2 className="text-lg font-semibold text-white mb-4">
              Connect Your Wallet
            </h2>
            <p className="text-zinc-400 text-sm mb-6">
              Login with Privy to start using the Deposit SDK. Your deposits
              will be automatically swept to your connected wallet.
            </p>
            <button
              onClick={login}
              className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Login with Privy
            </button>
          </div>
        )}

        {/* Status Messages */}
        {statusMessage && (
          <div className="mb-6 p-4 bg-blue-900/30 border border-blue-500/30 rounded-lg flex items-center gap-3">
            <div className="animate-spin w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full" />
            <p className="text-blue-400">{statusMessage}</p>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-900/30 border border-red-500/30 rounded-lg">
            <p className="text-red-400">Error: {error}</p>
          </div>
        )}

        {/* Debug Info */}
        {isConnected && !client && !isInitializing && !error && (
          <div className="mb-6 p-4 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-400">
            <p>
              Privy: {authenticated ? "✅" : "❌"} | Particle:{" "}
              {particleConnected ? "✅" : "❌"} | JWT EOA: {jwtEoa || "none"}
            </p>
          </div>
        )}

        {/* Demo Options */}
        {client && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Inline Widget */}
            <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
              <h2 className="text-lg font-semibold text-white mb-4">
                Inline Widget
              </h2>
              <DepositWidget client={client} theme="dark" />
            </div>

            {/* Modal Demo */}
            <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
              <h2 className="text-lg font-semibold text-white mb-4">
                Modal Widget
              </h2>
              <p className="text-zinc-400 text-sm mb-4">
                Click the button below to open the deposit widget in a modal
                overlay.
              </p>
              <button
                onClick={() => setShowModal(true)}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Open Deposit Modal
              </button>

              {/* Info */}
              <div className="mt-6 p-4 bg-green-900/20 border border-green-500/30 rounded-lg">
                <p className="text-green-400 text-sm">
                  ✅ Auto-sweep enabled. Send assets to the deposit address and
                  they will be automatically swept to your wallet on Arbitrum.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Modal */}
        {client && (
          <DepositModal
            isOpen={showModal}
            onClose={() => setShowModal(false)}
            client={client}
            theme="dark"
          />
        )}
      </div>
    </div>
  );
}
