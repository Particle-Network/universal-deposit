"use client";

import { useState, useEffect, useCallback } from "react";
import {
  UniversalAccount,
  UNIVERSAL_ACCOUNT_VERSION,
} from "@particle-network/universal-account-sdk";

interface UniversalBalanceProps {
  ownerAddress: string;
}

interface ChainAggregationItem {
  token: {
    chainId: number;
    assetId: string;
    type: string;
    address: string;
    decimals: number;
    realDecimals: number;
  };
  amount: number;
  amountInUSD: number;
  rawAmount: number | string;
}

interface Asset {
  tokenType: string;
  price: number;
  amount: number;
  amountInUSD: number;
  chainAggregation: ChainAggregationItem[];
}

interface PrimaryAssetsData {
  assets: Asset[];
  totalAmountInUSD: number;
}

// Chain ID to name mapping
const CHAIN_NAMES: Record<number, string> = {
  1: "Ethereum",
  8453: "Base",
  42161: "Arbitrum",
  10: "Optimism",
  137: "Polygon",
  56: "BNB Chain",
  43114: "Avalanche",
  59144: "Linea",
  101: "Solana",
  999: "Hyperliquid",
  196: "X Layer",
  9745: "zkLink",
  5000: "Mantle",
  80094: "Berachain",
  146: "Sonic",
  143: "Trondao",
};

// Token type display names
const TOKEN_NAMES: Record<string, string> = {
  eth: "Ethereum",
  usdt: "Tether USD",
  usdc: "USD Coin",
  btc: "Bitcoin",
  sol: "Solana",
  bnb: "BNB",
  mnt: "Mantle",
};

// Project credentials (same as SDK uses)
const PROJECT_ID = "2e1612a2-5757-4026-82b1-e0a7a3a69698";
const CLIENT_KEY = "cQRTw7Eqag5yHpa3iKkvwQ8J7qThRy1ZAqfPJwdy";
const APP_ID = "30c594e4-5615-49c9-89d6-86227f5e423e";

export function UniversalBalance({ ownerAddress }: UniversalBalanceProps) {
  const [data, setData] = useState<PrimaryAssetsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const fetchBalance = useCallback(async () => {
    if (!ownerAddress) return;

    setIsLoading(true);
    setError(null);

    try {
      const ua = new UniversalAccount({
        projectId: PROJECT_ID,
        projectClientKey: CLIENT_KEY,
        projectAppUuid: APP_ID,
        smartAccountOptions: {
          useEIP7702: true,
          name: "UNIVERSAL",
          version: UNIVERSAL_ACCOUNT_VERSION,
          ownerAddress,
        },
        tradeConfig: {
          slippageBps: 100,
        },
      });

      const primaryAssets = await ua.getPrimaryAssets();
      setData(primaryAssets as PrimaryAssetsData);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch balance";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [ownerAddress]);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  const formatUSD = (value: number): string => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatAmount = (value: number, decimals: number = 6): string => {
    if (value === 0) return "0";
    if (value < 0.000001) return "<0.000001";
    return value.toLocaleString("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: decimals,
    });
  };

  const getChainName = (chainId: number): string => {
    return CHAIN_NAMES[chainId] || `Chain ${chainId}`;
  };

  const getTokenName = (tokenType: string): string => {
    return TOKEN_NAMES[tokenType] || tokenType.toUpperCase();
  };

  // Filter assets with non-zero balance
  const assetsWithBalance = data?.assets.filter((asset) => asset.amountInUSD > 0.01) || [];

  return (
    <>
      {/* Balance Card */}
      <div
        onClick={() => data && assetsWithBalance.length > 0 && setIsDialogOpen(true)}
        className={`bg-zinc-900 rounded-xl p-6 border border-zinc-800 ${
          data && assetsWithBalance.length > 0 ? "cursor-pointer hover:border-zinc-700 transition-colors" : ""
        }`}
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-white font-semibold">Universal Account Balance</h2>
          <button
            onClick={(e) => {
              e.stopPropagation();
              fetchBalance();
            }}
            disabled={isLoading}
            className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors disabled:opacity-50"
            title="Refresh balance"
          >
            <svg
              className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
        </div>

        {isLoading && data === null ? (
          <div className="flex items-center gap-2">
            <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full" />
            <span className="text-zinc-400 text-sm">Loading balance...</span>
          </div>
        ) : error ? (
          <div className="text-red-400 text-sm">{error}</div>
        ) : (
          <>
            <p className="text-3xl font-bold text-white">
              {data ? formatUSD(data.totalAmountInUSD) : "$0.00"}
            </p>
            <p className="text-zinc-500 text-sm mt-2">
              <span className="text-green-400">●</span> Unified across all chains
              {assetsWithBalance.length > 0 && (
                <span className="text-zinc-400 ml-2">• Click for details</span>
              )}
            </p>
          </>
        )}
      </div>

      {/* Breakdown Dialog */}
      {isDialogOpen && data && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          onClick={() => setIsDialogOpen(false)}
        >
          <div
            className="bg-zinc-900 rounded-xl border border-zinc-800 w-full max-w-lg max-h-[80vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-zinc-800">
              <div>
                <h3 className="text-white font-semibold text-lg">Balance Breakdown</h3>
                <p className="text-zinc-500 text-sm">{formatUSD(data.totalAmountInUSD)} total</p>
              </div>
              <button
                onClick={() => setIsDialogOpen(false)}
                className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-4 overflow-y-auto max-h-[60vh] space-y-4">
              {assetsWithBalance.length === 0 ? (
                <p className="text-zinc-500 text-center py-8">No assets with balance</p>
              ) : (
                assetsWithBalance.map((asset) => {
                  const chainsWithBalance = asset.chainAggregation.filter(
                    (chain) => chain.amountInUSD > 0.001
                  );

                  return (
                    <div key={asset.tokenType} className="bg-zinc-800/50 rounded-lg p-4">
                      {/* Token Header */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-white font-medium">
                            {getTokenName(asset.tokenType)}
                          </span>
                          <span className="text-zinc-500 text-sm uppercase">
                            {asset.tokenType}
                          </span>
                        </div>
                        <div className="text-right">
                          <p className="text-white font-medium">{formatUSD(asset.amountInUSD)}</p>
                          <p className="text-zinc-500 text-xs">
                            {formatAmount(asset.amount)} @ {formatUSD(asset.price)}
                          </p>
                        </div>
                      </div>

                      {/* Chain Breakdown */}
                      {chainsWithBalance.length > 0 && (
                        <div className="space-y-2 pt-2 border-t border-zinc-700">
                          {chainsWithBalance.map((chain) => (
                            <div
                              key={`${asset.tokenType}-${chain.token.chainId}`}
                              className="flex items-center justify-between text-sm"
                            >
                              <span className="text-zinc-400">
                                {getChainName(chain.token.chainId)}
                              </span>
                              <div className="text-right">
                                <span className="text-zinc-300">
                                  {formatAmount(chain.amount)}
                                </span>
                                <span className="text-zinc-500 ml-2">
                                  ({formatUSD(chain.amountInUSD)})
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
