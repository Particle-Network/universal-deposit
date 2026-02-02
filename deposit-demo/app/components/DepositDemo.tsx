"use client";

/**
 * Deposit SDK Demo - Chain Selection
 *
 * Demonstrates using the DepositWidget with chain selection.
 * Users choose their preferred destination chain, and funds are
 * swept to their connected wallet (EOA) on that chain.
 *
 * Key SDK features shown:
 * - DepositModal with destination prop
 * - Chain selection (destination.chainId)
 * - Auto-bridge to user's EOA (no custom address)
 */

import { useState, useEffect } from "react";
import {
  usePrivy,
  useWallets,
  getEmbeddedConnectedWallet,
} from "@privy-io/react-auth";
import {
  useDeposit,
  DepositModal,
  CHAIN,
} from "@particle-network/deposit-sdk/react";
import { UniversalBalance } from "./UniversalBalance";

// Destination chains available for selection
const CHAINS = [
  { id: CHAIN.ARBITRUM, name: "Arbitrum", desc: "Fast & cheap" },
  { id: CHAIN.BASE, name: "Base", desc: "Coinbase L2" },
  { id: CHAIN.ETHEREUM, name: "Ethereum", desc: "Mainnet" },
  { id: CHAIN.POLYGON, name: "Polygon", desc: "Low fees" },
  { id: CHAIN.OPTIMISM, name: "Optimism", desc: "OP Stack" },
  { id: CHAIN.BNB, name: "BNB Chain", desc: "BSC" },
];

export function DepositDemo() {
  const { login, ready, authenticated, logout } = usePrivy();
  const { wallets } = useWallets();

  // Modal state
  const [showModal, setShowModal] = useState(false);

  // Chain selection - default to Arbitrum
  const [selectedChainId, setSelectedChainId] = useState<number>(
    CHAIN.ARBITRUM,
  );

  // Get user's embedded wallet from Privy
  const embeddedWallet = getEmbeddedConnectedWallet(wallets);
  const ownerAddress = embeddedWallet?.address;

  // Wallet readiness states
  const isWalletReady = authenticated && !!ownerAddress;
  const isWalletPending = authenticated && !ownerAddress;

  // Initialize SDK with owner address
  const { isConnecting, isReady, error, disconnect } = useDeposit({
    ownerAddress: isWalletReady ? ownerAddress : undefined,
  });

  // Wallet creation timeout handling
  const [walletTimeout, setWalletTimeout] = useState(false);
  useEffect(() => {
    if (!isWalletPending) {
      setWalletTimeout(false);
      return;
    }
    const timer = setTimeout(() => setWalletTimeout(true), 30000);
    return () => clearTimeout(timer);
  }, [isWalletPending]);

  const handleLogout = async () => {
    await disconnect();
    logout();
  };

  const selectedChain = CHAINS.find((c) => c.id === selectedChainId);

  return (
    <div className="min-h-screen bg-black p-8">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-2xl font-bold text-white">Deposit SDK</h1>
          <p className="text-zinc-500 text-sm mt-1">
            Choose your chain, deposit anywhere, receive on your preferred
            network
          </p>
        </header>

        {/* Wallet Info */}
        {isWalletReady && (
          <div className="mb-6 flex items-center justify-between p-3 bg-zinc-900 rounded-lg border border-zinc-800">
            <div className="text-sm">
              <span className="text-zinc-500">Connected: </span>
              <span className="text-white font-mono">
                {ownerAddress?.slice(0, 6)}...{ownerAddress?.slice(-4)}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="text-sm text-zinc-400 hover:text-white transition-colors"
            >
              Disconnect
            </button>
          </div>
        )}

        {/* Loading */}
        {!ready && (
          <div className="p-8 bg-zinc-900 rounded-xl border border-zinc-800 text-center">
            <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-3" />
            <p className="text-zinc-400">Loading...</p>
          </div>
        )}

        {/* Login */}
        {ready && !authenticated && (
          <div className="p-8 bg-zinc-900 rounded-xl border border-zinc-800 text-center">
            <h2 className="text-lg font-semibold text-white mb-3">
              Get Started
            </h2>
            <p className="text-zinc-400 text-sm mb-6">
              Connect your wallet to start depositing
            </p>
            <button
              onClick={login}
              className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Connect Wallet
            </button>
          </div>
        )}

        {/* Wallet Creating */}
        {isWalletPending && !walletTimeout && (
          <div className="mb-4 p-4 bg-yellow-900/20 border border-yellow-500/30 rounded-lg flex items-center gap-3">
            <div className="animate-spin w-4 h-4 border-2 border-yellow-400 border-t-transparent rounded-full" />
            <span className="text-yellow-400 text-sm">Creating wallet...</span>
          </div>
        )}

        {/* Wallet Stuck */}
        {isWalletPending && walletTimeout && (
          <div className="mb-4 p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
            <p className="text-red-400 text-sm mb-2">Wallet creation stuck</p>
            <button
              onClick={logout}
              className="text-sm text-red-400 underline hover:text-red-300"
            >
              Reset and try again
            </button>
          </div>
        )}

        {/* SDK Connecting */}
        {isWalletReady && isConnecting && (
          <div className="mb-4 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg flex items-center gap-3">
            <div className="animate-spin w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full" />
            <span className="text-blue-400 text-sm">Initializing SDK...</span>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-4 p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
            <p className="text-red-400 text-sm">{error.message}</p>
          </div>
        )}

        {/* Main Demo UI - shown when SDK is ready */}
        {isReady && authenticated && ownerAddress && (
          <div className="space-y-4">
            {/* Universal Account Balance */}
            <UniversalBalance ownerAddress={ownerAddress} />

            {/* Chain Selection */}
            <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
              <h2 className="text-white font-semibold mb-1">
                Destination Chain
              </h2>
              <p className="text-zinc-500 text-sm mb-4">
                Where should your deposits be sent?
              </p>

              <div className="grid grid-cols-3 gap-2">
                {CHAINS.map((chain) => (
                  <button
                    key={chain.id}
                    onClick={() => setSelectedChainId(chain.id)}
                    className={`p-2 rounded-lg text-left transition-all ${
                      selectedChainId === chain.id
                        ? "bg-blue-600 text-white"
                        : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                    }`}
                  >
                    <span className="font-medium block text-sm">
                      {chain.name}
                    </span>
                    <span
                      className={`text-xs ${
                        selectedChainId === chain.id
                          ? "text-blue-200"
                          : "text-zinc-500"
                      }`}
                    >
                      {chain.desc}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Open Deposit Button */}
            <button
              onClick={() => setShowModal(true)}
              className="w-full py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-semibold"
            >
              Open Deposit Widget
            </button>

            {/* Info Box */}
            <div className="p-4 bg-zinc-900 rounded-xl border border-zinc-800">
              <p className="text-zinc-400 text-sm">
                <span className="text-green-400">●</span> Auto-bridge enabled.
                Deposits are automatically sent to your wallet on{" "}
                <span className="text-white font-medium">
                  {selectedChain?.name}
                </span>
                .
              </p>
            </div>

            {/* Code Example */}
            <div className="p-4 bg-zinc-950 rounded-xl border border-zinc-800">
              <p className="text-zinc-500 text-xs mb-2 font-medium">
                SDK Code:
              </p>
              <pre className="text-xs text-green-400 overflow-x-auto">
                {`<DepositModal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  destination={{ chainId: CHAIN.${selectedChain?.name.toUpperCase().replace(" ", "_")} }}
/>`}
              </pre>
            </div>
          </div>
        )}

        {/* Deposit Modal */}
        <DepositModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          theme="dark"
          destination={{ chainId: selectedChainId }}
        />
      </div>
    </div>
  );
}
