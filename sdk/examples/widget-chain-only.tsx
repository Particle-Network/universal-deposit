"use client";

/**
 * Example: React Widget with Specific Chain (EOA Address)
 *
 * This example demonstrates using the DepositWidget/DepositModal with a
 * specific destination chain while keeping the user's connected EOA as
 * the destination address.
 *
 * Use case: Let users receive swept funds on their preferred chain
 * (e.g., Base for lower fees) while still using their own wallet.
 */

import { useState } from "react";
import {
  DepositProvider,
  DepositModal,
  DepositWidget,
  useDepositContext,
  CHAIN,
} from "@particle-network/deposit-sdk/react";

// =============================================================================
// PSEUDOCODE: Your auth provider wrapper
// =============================================================================
// In a real app, wrap your app with your auth provider (Privy, RainbowKit, etc.)
//
// import { PrivyProvider } from "@privy-io/react-auth";
//
// function App() {
//   return (
//     <PrivyProvider appId="your-app-id">
//       <DepositProvider>
//         <YourApp />
//       </DepositProvider>
//     </PrivyProvider>
//   );
// }

// =============================================================================
// EXAMPLE: Widget with Chain Selection (User's EOA)
// =============================================================================

// Available chains for the user to choose from
const AVAILABLE_CHAINS = [
  { id: CHAIN.ARBITRUM, name: "Arbitrum", description: "Fast & cheap" },
  { id: CHAIN.BASE, name: "Base", description: "Coinbase L2" },
  { id: CHAIN.ETHEREUM, name: "Ethereum", description: "Mainnet" },
  { id: CHAIN.POLYGON, name: "Polygon", description: "Low fees" },
  { id: CHAIN.OPTIMISM, name: "Optimism", description: "Optimistic rollup" },
];

function DepositPageContent() {
  const [showModal, setShowModal] = useState(false);
  const [selectedChainId, setSelectedChainId] = useState<number>(CHAIN.ARBITRUM);

  // Access context to show current destination
  const { currentDestination, setDestination } = useDepositContext();

  // In a real app, this comes from your auth provider
  const ownerAddress = "0x1234567890abcdef1234567890abcdef12345678";

  // Handle chain selection
  const handleChainSelect = (chainId: number) => {
    setSelectedChainId(chainId);
    // Update the SDK's destination (address stays as ownerAddress)
    setDestination({ chainId });
  };

  const selectedChain = AVAILABLE_CHAINS.find((c) => c.id === selectedChainId);

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">
        Widget with Chain Selection
      </h1>
      <p className="text-gray-600 mb-8">
        User selects their preferred chain. Funds are swept to their own wallet
        on that chain.
      </p>

      {/* Current Destination Display */}
      {currentDestination && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <h2 className="font-semibold text-green-900 mb-2">
            Current Sweep Destination
          </h2>
          <p className="text-sm">
            <span className="text-green-700">Chain:</span>{" "}
            {selectedChain?.name} ({currentDestination.chainId})
          </p>
          <p className="text-sm">
            <span className="text-green-700">Address:</span>{" "}
            <code className="bg-green-100 px-1 rounded text-xs">
              {currentDestination.address}
            </code>
          </p>
        </div>
      )}

      {/* Chain Selector */}
      <div className="mb-8">
        <h2 className="font-semibold mb-3">Select Destination Chain</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {AVAILABLE_CHAINS.map((chain) => (
            <button
              key={chain.id}
              onClick={() => handleChainSelect(chain.id)}
              className={`p-4 rounded-lg border-2 transition-all text-left ${
                selectedChainId === chain.id
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <p className="font-medium">{chain.name}</p>
              <p className="text-xs text-gray-500">{chain.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Open Modal Button */}
      <div className="mb-6">
        <button
          onClick={() => setShowModal(true)}
          className="w-full px-6 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-lg font-medium"
        >
          Open Deposit Modal
        </button>
        <p className="text-center text-gray-500 text-sm mt-2">
          Funds will be swept to your wallet on {selectedChain?.name}
        </p>
      </div>

      {/* Modal - destination from props */}
      <DepositModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        theme="dark"
        destination={{
          chainId: selectedChainId,
          // No address specified = uses ownerAddress (user's EOA)
        }}
      />

      {/* Inline Widget Preview */}
      <div className="mt-8">
        <h2 className="font-semibold mb-3">Inline Widget Preview</h2>
        <div className="flex justify-center">
          <DepositWidget
            theme="light"
            destination={{
              chainId: selectedChainId,
              // No address = user's EOA
            }}
            onDestinationChange={(dest) => {
              console.log("Widget destination:", dest);
            }}
          />
        </div>
      </div>

      {/* Code Examples */}
      <div className="mt-8 space-y-4">
        <div className="p-4 bg-gray-900 rounded-lg">
          <h3 className="font-semibold text-white mb-2">
            Simple: Just Chain ID
          </h3>
          <pre className="text-sm text-green-400 overflow-x-auto">
{`import { DepositModal, CHAIN } from '@particle-network/deposit-sdk/react';

// Sweep to user's EOA on Base
<DepositModal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  destination={{ chainId: CHAIN.BASE }}
/>`}
          </pre>
        </div>

        <div className="p-4 bg-gray-900 rounded-lg">
          <h3 className="font-semibold text-white mb-2">
            Dynamic: User Selects Chain
          </h3>
          <pre className="text-sm text-green-400 overflow-x-auto">
{`const [chainId, setChainId] = useState(CHAIN.ARBITRUM);

// Chain selector buttons
<button onClick={() => setChainId(CHAIN.BASE)}>Base</button>
<button onClick={() => setChainId(CHAIN.POLYGON)}>Polygon</button>

// Widget uses selected chain
<DepositWidget destination={{ chainId }} />`}
          </pre>
        </div>

        <div className="p-4 bg-gray-900 rounded-lg">
          <h3 className="font-semibold text-white mb-2">
            Via Context: Runtime Updates
          </h3>
          <pre className="text-sm text-green-400 overflow-x-auto">
{`import { useDepositContext } from '@particle-network/deposit-sdk/react';

function ChainSelector() {
  const { setDestination, currentDestination } = useDepositContext();

  return (
    <button onClick={() => setDestination({ chainId: CHAIN.BASE })}>
      Switch to Base
    </button>
  );
}`}
          </pre>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// MAIN EXPORT: Wrapped with DepositProvider
// =============================================================================

export default function WidgetChainOnlyExample() {
  return (
    <DepositProvider
      config={{
        // Default destination - can be overridden by widget props
        destination: { chainId: CHAIN.ARBITRUM },
      }}
    >
      <DepositPageContent />
    </DepositProvider>
  );
}
