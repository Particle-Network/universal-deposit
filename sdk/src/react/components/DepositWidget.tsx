"use client";

import { useState, useEffect, useCallback } from "react";
import { X, Copy, QrCode, Check, Clock, AlertCircle } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { cn } from "../utils/cn";
import type { DepositClient } from "../../core/DepositClient";
import type { DetectedDeposit, SweepResult, TokenType } from "../../core/types";
import { CHAIN, CHAIN_META } from "../../constants/chains";

export interface DepositWidgetProps {
  client: DepositClient;
  onClose?: () => void;
  className?: string;
  theme?: "dark" | "light";
}

interface ActivityItem {
  id: string;
  type: "detected" | "processing" | "complete" | "error";
  token: string;
  chainId: number;
  amount: string;
  timestamp: number;
  message?: string;
}

const TOKEN_ICONS: Record<string, { color: string; label: string }> = {
  ETH: { color: "#627eea", label: "ETH" },
  USDC: { color: "#2775ca", label: "USDC" },
  USDT: { color: "#26a17b", label: "USDT" },
  BTC: { color: "#f7931a", label: "BTC" },
  SOL: { color: "#9945ff", label: "SOL" },
  BNB: { color: "#f3ba2f", label: "BNB" },
};

const CHAIN_OPTIONS = [
  {
    id: CHAIN.ARBITRUM,
    name: "Arbitrum",
    color: "#12aaeb",
    addressType: "evm" as const,
  },
  {
    id: CHAIN.ETHEREUM,
    name: "Ethereum",
    color: "#627eea",
    addressType: "evm" as const,
  },
  {
    id: CHAIN.BASE,
    name: "Base",
    color: "#0052ff",
    addressType: "evm" as const,
  },
  {
    id: CHAIN.POLYGON,
    name: "Polygon",
    color: "#8247e5",
    addressType: "evm" as const,
  },
  {
    id: CHAIN.BNB,
    name: "BNB Chain",
    color: "#f3ba2f",
    addressType: "evm" as const,
  },
  {
    id: CHAIN.SOLANA,
    name: "Solana",
    color: "#9945ff",
    addressType: "solana" as const,
  },
];

const TOKEN_OPTIONS: TokenType[] = ["USDC", "USDT", "ETH"];

export function DepositWidget({
  client,
  onClose,
  className,
  theme = "dark",
}: DepositWidgetProps) {
  const [selectedToken, setSelectedToken] = useState<TokenType>("USDC");
  const [selectedChain, setSelectedChain] = useState(CHAIN_OPTIONS[0]);
  const [showTokenDropdown, setShowTokenDropdown] = useState(false);
  const [showChainDropdown, setShowChainDropdown] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [depositAddress, setDepositAddress] = useState<string>("");

  // Get deposit address based on selected chain
  useEffect(() => {
    const getAddress = async () => {
      try {
        const addresses = await client.getDepositAddresses();
        const addr =
          selectedChain.addressType === "solana"
            ? addresses.solana
            : addresses.evm;
        setDepositAddress(addr);
      } catch (error) {
        console.error("Failed to get deposit address:", error);
      }
    };
    getAddress();
  }, [client, selectedChain]);

  // Listen for deposit events
  useEffect(() => {
    const handleDetected = (deposit: DetectedDeposit) => {
      setActivity((prev) => [
        {
          id: deposit.id,
          type: "detected",
          token: deposit.token,
          chainId: deposit.chainId,
          amount: deposit.amount,
          timestamp: Date.now(),
        },
        ...prev,
      ]);
    };

    const handleProcessing = (deposit: DetectedDeposit) => {
      setActivity((prev) =>
        prev.map((item) =>
          item.id === deposit.id ? { ...item, type: "processing" } : item
        )
      );
    };

    const handleComplete = (result: SweepResult) => {
      setActivity((prev) =>
        prev.map((item) =>
          item.id === result.depositId
            ? { ...item, type: "complete", message: "Swept successfully" }
            : item
        )
      );
    };

    const handleError = (error: Error, deposit?: DetectedDeposit) => {
      if (deposit) {
        setActivity((prev) =>
          prev.map((item) =>
            item.id === deposit.id
              ? { ...item, type: "error", message: error.message }
              : item
          )
        );
      }
    };

    client.on("deposit:detected", handleDetected);
    client.on("deposit:processing", handleProcessing);
    client.on("deposit:complete", handleComplete);
    client.on("deposit:error", handleError);

    return () => {
      client.off("deposit:detected", handleDetected);
      client.off("deposit:processing", handleProcessing);
      client.off("deposit:complete", handleComplete);
      client.off("deposit:error", handleError);
    };
  }, [client]);

  const copyAddress = useCallback(async () => {
    if (!depositAddress) return;
    await navigator.clipboard.writeText(depositAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [depositAddress]);

  const formatAddress = (addr: string) => {
    if (!addr) return "...";
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const formatAmount = (amount: string, token: string) => {
    const decimals = ["ETH", "BNB"].includes(token)
      ? 18
      : token === "SOL"
      ? 9
      : 6;
    const value = Number(amount) / Math.pow(10, decimals);
    return value.toFixed(value < 1 ? 4 : 2);
  };

  const formatTime = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    if (diff < 60000) return "Just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)} min ago`;
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div
      className={cn(
        "w-[380px] rounded-[20px] border overflow-hidden shadow-2xl",
        theme === "dark"
          ? "bg-[#09090b] border-[#27272a] text-white"
          : "bg-white border-gray-200 text-gray-900",
        className
      )}
      onClick={() => {
        setShowTokenDropdown(false);
        setShowChainDropdown(false);
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-5 pb-4">
        <h2 className="text-[15px] font-semibold">Deposit Assets</h2>
        {onClose && (
          <button
            onClick={onClose}
            className={cn(
              "p-1 rounded transition-colors",
              theme === "dark"
                ? "text-[#52525b] hover:text-white"
                : "text-gray-400 hover:text-gray-900"
            )}
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* Token/Chain Selector */}
      <div className="px-6 mb-4">
        <div
          className={cn(
            "flex h-11 rounded-xl border relative",
            theme === "dark"
              ? "bg-[#18181b] border-[#27272a]"
              : "bg-gray-50 border-gray-200"
          )}
        >
          {/* Token Selector */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowTokenDropdown(!showTokenDropdown);
              setShowChainDropdown(false);
            }}
            className={cn(
              "flex-1 flex items-center justify-center gap-2.5 text-[13px] font-medium rounded-l-xl transition-colors",
              theme === "dark" ? "hover:bg-[#27272a]" : "hover:bg-gray-100"
            )}
          >
            <div
              className="w-[18px] h-[18px] rounded-full"
              style={{
                backgroundColor: TOKEN_ICONS[selectedToken]?.color || "#666",
              }}
            />
            <span>{selectedToken}</span>
            <svg
              className="w-2.5 h-1.5 opacity-40"
              viewBox="0 0 10 6"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M1 1L5 5L9 1" />
            </svg>
          </button>

          {/* Divider */}
          <div
            className={cn(
              "w-px h-5 self-center",
              theme === "dark" ? "bg-[#27272a]" : "bg-gray-200"
            )}
          />

          {/* Chain Selector */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowChainDropdown(!showChainDropdown);
              setShowTokenDropdown(false);
            }}
            className={cn(
              "flex-1 flex items-center justify-center gap-2.5 text-[13px] font-medium rounded-r-xl transition-colors",
              theme === "dark" ? "hover:bg-[#27272a]" : "hover:bg-gray-100"
            )}
          >
            <div
              className="w-[18px] h-[18px] rounded-full"
              style={{ backgroundColor: selectedChain.color }}
            />
            <span>{selectedChain.name}</span>
            <svg
              className="w-2.5 h-1.5 opacity-40"
              viewBox="0 0 10 6"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M1 1L5 5L9 1" />
            </svg>
          </button>

          {/* Token Dropdown */}
          {showTokenDropdown && (
            <div
              className={cn(
                "absolute top-full left-0 w-[48%] mt-1.5 p-1 rounded-xl border shadow-lg z-50",
                theme === "dark"
                  ? "bg-[#09090b] border-[#3f3f46]"
                  : "bg-white border-gray-200"
              )}
              onClick={(e) => e.stopPropagation()}
            >
              {TOKEN_OPTIONS.map((token) => (
                <button
                  key={token}
                  onClick={() => {
                    setSelectedToken(token);
                    setShowTokenDropdown(false);
                  }}
                  className={cn(
                    "w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-[13px] transition-colors",
                    theme === "dark"
                      ? "hover:bg-[#27272a] text-[#a1a1aa] hover:text-white"
                      : "hover:bg-gray-100 text-gray-600 hover:text-gray-900",
                    selectedToken === token &&
                      (theme === "dark"
                        ? "bg-[#27272a] text-white"
                        : "bg-gray-100 text-gray-900")
                  )}
                >
                  <div
                    className="w-[18px] h-[18px] rounded-full"
                    style={{
                      backgroundColor: TOKEN_ICONS[token]?.color || "#666",
                    }}
                  />
                  {token}
                </button>
              ))}
            </div>
          )}

          {/* Chain Dropdown */}
          {showChainDropdown && (
            <div
              className={cn(
                "absolute top-full right-0 w-[48%] mt-1.5 p-1 rounded-xl border shadow-lg z-50",
                theme === "dark"
                  ? "bg-[#09090b] border-[#3f3f46]"
                  : "bg-white border-gray-200"
              )}
              onClick={(e) => e.stopPropagation()}
            >
              {CHAIN_OPTIONS.map((chain) => (
                <button
                  key={chain.id}
                  onClick={() => {
                    setSelectedChain(chain);
                    setShowChainDropdown(false);
                  }}
                  className={cn(
                    "w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-[13px] transition-colors",
                    theme === "dark"
                      ? "hover:bg-[#27272a] text-[#a1a1aa] hover:text-white"
                      : "hover:bg-gray-100 text-gray-600 hover:text-gray-900",
                    selectedChain.id === chain.id &&
                      (theme === "dark"
                        ? "bg-[#27272a] text-white"
                        : "bg-gray-100 text-gray-900")
                  )}
                >
                  <div
                    className="w-[18px] h-[18px] rounded-full"
                    style={{ backgroundColor: chain.color }}
                  />
                  {chain.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Address Panel */}
      <div className="mx-6 mb-6">
        <div
          className={cn(
            "rounded-xl border p-1 relative",
            theme === "dark"
              ? "bg-[#121212] border-[#27272a]"
              : "bg-gray-50 border-gray-200"
          )}
        >
          {/* Address Row */}
          <div className="flex items-center gap-2.5 p-3">
            <div className="flex-1">
              <span
                className={cn(
                  "text-[11px] font-medium uppercase tracking-wide",
                  theme === "dark" ? "text-[#a1a1aa]" : "text-gray-500"
                )}
              >
                Deposit Address
              </span>
              <p className="font-mono text-[13px] mt-1">
                {formatAddress(depositAddress)}
              </p>
            </div>
            <div className="flex gap-1">
              <button
                onClick={copyAddress}
                className={cn(
                  "w-8 h-8 flex items-center justify-center rounded-md border transition-all",
                  theme === "dark"
                    ? "border-transparent hover:border-[#27272a] hover:bg-[#27272a] text-[#a1a1aa] hover:text-white"
                    : "border-transparent hover:border-gray-200 hover:bg-gray-100 text-gray-400 hover:text-gray-900",
                  copied && "text-green-500"
                )}
                title="Copy address"
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
              </button>
              <button
                onClick={() => setShowQR(!showQR)}
                className={cn(
                  "w-8 h-8 flex items-center justify-center rounded-md border transition-all",
                  theme === "dark"
                    ? "border-transparent hover:border-[#27272a] hover:bg-[#27272a] text-[#a1a1aa] hover:text-white"
                    : "border-transparent hover:border-gray-200 hover:bg-gray-100 text-gray-400 hover:text-gray-900"
                )}
                title="Show QR code"
              >
                <QrCode size={16} />
              </button>
            </div>
          </div>

          {/* QR Overlay */}
          {showQR && (
            <div className="absolute inset-0 bg-white rounded-xl flex items-center justify-center z-10">
              <button
                onClick={() => setShowQR(false)}
                className="absolute top-2 right-2 w-5 h-5 flex items-center justify-center bg-gray-100 rounded text-gray-600 hover:bg-gray-200"
              >
                <X size={14} />
              </button>
              <QRCodeSVG value={depositAddress || ""} size={100} />
            </div>
          )}

          {/* Warning Box */}
          <div
            className={cn(
              "mt-1 rounded-lg p-2.5 flex gap-2.5 items-start",
              "bg-amber-500/10 border border-amber-500/15"
            )}
          >
            <AlertCircle
              size={14}
              className="text-amber-400 flex-shrink-0 mt-0.5"
            />
            <span className="text-[11px] leading-relaxed text-amber-400/90">
              Only deposit <strong>{selectedToken}</strong> on{" "}
              <strong>{selectedChain.name}</strong>. Sending other assets may
              result in permanent loss.
            </span>
          </div>
        </div>
      </div>

      {/* Activity Section */}
      <div
        className={cn(
          "border-t",
          theme === "dark"
            ? "bg-[#121212] border-[#27272a]"
            : "bg-gray-50 border-gray-200"
        )}
      >
        <div
          className={cn(
            "px-6 pt-4 pb-2 text-[11px] font-semibold uppercase tracking-wide",
            theme === "dark" ? "text-[#a1a1aa]" : "text-gray-500"
          )}
        >
          Recent Activity
        </div>
        <div className="max-h-[200px] overflow-y-auto">
          {activity.length === 0 ? (
            <div
              className={cn(
                "px-6 py-8 text-center text-[13px]",
                theme === "dark" ? "text-[#52525b]" : "text-gray-400"
              )}
            >
              No deposits yet
            </div>
          ) : (
            activity.map((item) => (
              <div
                key={item.id}
                className={cn(
                  "px-6 py-3 flex items-center justify-between border-b last:border-b-0 transition-colors",
                  theme === "dark"
                    ? "border-[#27272a] hover:bg-[#18181b]"
                    : "border-gray-200 hover:bg-gray-100"
                )}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "w-7 h-7 rounded-full flex items-center justify-center border",
                      item.type === "complete" &&
                        "bg-green-500/10 border-green-500/20 text-green-500",
                      item.type === "processing" &&
                        (theme === "dark"
                          ? "bg-transparent border-[#333] text-[#a1a1aa]"
                          : "bg-gray-100 border-gray-200 text-gray-400"),
                      item.type === "detected" &&
                        "bg-blue-500/10 border-blue-500/20 text-blue-500",
                      item.type === "error" &&
                        "bg-red-500/10 border-red-500/20 text-red-500"
                    )}
                  >
                    {item.type === "complete" && <Check size={14} />}
                    {item.type === "processing" && (
                      <Clock size={14} className="animate-pulse" />
                    )}
                    {item.type === "detected" && <Check size={14} />}
                    {item.type === "error" && <X size={14} />}
                  </div>
                  <div>
                    <h4
                      className={cn(
                        "text-[13px] font-medium",
                        item.type === "processing" &&
                          (theme === "dark"
                            ? "text-[#a1a1aa]"
                            : "text-gray-500")
                      )}
                    >
                      {item.type === "complete" && `Received ${item.token}`}
                      {item.type === "processing" && "Processing..."}
                      {item.type === "detected" && `Detected ${item.token}`}
                      {item.type === "error" && "Failed"}
                    </h4>
                    <p
                      className={cn(
                        "text-[11px]",
                        theme === "dark" ? "text-[#a1a1aa]" : "text-gray-500"
                      )}
                    >
                      {CHAIN_META[item.chainId]?.name ||
                        `Chain ${item.chainId}`}{" "}
                      • {formatTime(item.timestamp)}
                    </p>
                  </div>
                </div>
                <span
                  className={cn(
                    "font-mono text-[13px] font-medium",
                    item.type === "processing" &&
                      (theme === "dark" ? "text-[#a1a1aa]" : "text-gray-500")
                  )}
                >
                  +{formatAmount(item.amount, item.token)}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
