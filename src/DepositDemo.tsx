import { useState, useEffect } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import {
  DepositWidget,
  DepositModal,
} from "@particle-network/deposit-sdk/react";
import { DepositClient } from "@particle-network/deposit-sdk";

export function DepositDemo() {
  const { ready, authenticated, login, logout } = usePrivy();
  const { wallets } = useWallets();
  const [showModal, setShowModal] = useState(false);
  const [client, setClient] = useState<DepositClient | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const wallet = wallets[0];

  // Create and initialize client when wallet is available
  useEffect(() => {
    if (!wallet?.address) {
      setClient(null);
      return;
    }

    const initClient = async () => {
      setIsInitializing(true);
      setError(null);

      try {
        const depositClient = new DepositClient({
          ownerAddress: wallet.address,
          signer: {
            signMessage: async (msg: string | Uint8Array) => {
              const message =
                typeof msg === "string" ? msg : new TextDecoder().decode(msg);
              const provider = await wallet.getEthereumProvider();
              return provider.request({
                method: "personal_sign",
                params: [message, wallet.address],
              });
            },
          },
          autoSweep: false, // Manual sweep for demo
        });

        await depositClient.initialize();
        setClient(depositClient);
        console.log("✅ DepositClient initialized");
      } catch (err) {
        console.error("Failed to initialize DepositClient:", err);
        setError(err instanceof Error ? err.message : "Failed to initialize");
      } finally {
        setIsInitializing(false);
      }
    };

    initClient();

    return () => {
      // Cleanup handled by component unmount
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wallet?.address]);

  if (!ready) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-white">Loading...</p>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-bold text-white">Deposit SDK Demo</h1>
        <p className="text-gray-400">
          Connect your wallet to test the deposit widget
        </p>
        <button
          onClick={login}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Connect Wallet
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Deposit SDK Demo</h1>
            <p className="text-gray-400 text-sm mt-1">
              Connected: {wallet?.address?.slice(0, 6)}...
              {wallet?.address?.slice(-4)}
            </p>
          </div>
          <button
            onClick={logout}
            className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Disconnect
          </button>
        </div>

        {/* Status */}
        {isInitializing && (
          <div className="mb-6 p-4 bg-blue-900/30 border border-blue-500/30 rounded-lg">
            <p className="text-blue-400">Initializing deposit client...</p>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-900/30 border border-red-500/30 rounded-lg">
            <p className="text-red-400">Error: {error}</p>
          </div>
        )}

        {/* Demo Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Inline Widget */}
          <div className="bg-gray-900 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">
              Inline Widget
            </h2>
            {client ? (
              <DepositWidget client={client} theme="dark" />
            ) : (
              <div className="h-[400px] flex items-center justify-center border border-gray-700 rounded-xl">
                <p className="text-gray-500">
                  {isInitializing
                    ? "Initializing..."
                    : "Connect wallet to see widget"}
                </p>
              </div>
            )}
          </div>

          {/* Modal Demo */}
          <div className="bg-gray-900 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">
              Modal Widget
            </h2>
            <p className="text-gray-400 text-sm mb-4">
              Click the button below to open the deposit widget in a modal
              overlay.
            </p>
            <button
              onClick={() => setShowModal(true)}
              disabled={!client}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Open Deposit Modal
            </button>

            {/* Code Example */}
            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-400 mb-2">Usage:</h3>
              <pre className="bg-black p-4 rounded-lg text-xs text-gray-300 overflow-x-auto">
                {`import { DepositModal } from '@particle-network/deposit-sdk/react';

<DepositModal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  client={client}
  theme="dark"
/>`}
              </pre>
            </div>
          </div>
        </div>

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
