// App.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";

// Privy Imports
import { usePrivy, useWallets } from "@privy-io/react-auth";

import "./App.css";

import type { UniversalAccount } from "@particle-network/universal-account-sdk";
import { createUniversalAccount } from "./connectkit";

// Auth Core (JWT-based embedded wallet)
import {
  useConnect,
  useEthereum,
  useAuthCore,
} from "@particle-network/auth-core-modal";
import { AuthType } from "@particle-network/auth-core";

import { ethers, formatUnits } from "ethers";

/* -------------------------------------------------------------------------- */
/* Config / Assets                                                            */
/* -------------------------------------------------------------------------- */

const LOGO_URLS: Record<string, string> = {
  // Chains
  [1]: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png",
  [42161]:
    "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/arbitrum/info/logo.png",
  [8453]:
    "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/base/info/logo.png",
  [137]:
    "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/polygon/info/logo.png",
  [56]: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/binance/info/logo.png",
  [101]:
    "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/solana/info/logo.png",
  // Tokens
  ETH: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png",
  USDC: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png",
  USDT: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xdAC17F958D2ee523a2206206994597C13D831ec7/logo.png",
  BTC: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/bitcoin/info/logo.png",
  SOL: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/solana/info/logo.png",
  BNB: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/binance/info/logo.png",
};

const CHAIN = {
  ETHEREUM: 1,
  ARBITRUM: 42161,
  BASE: 8453,
  POLYGON: 137,
  BNB: 56,
  SOLANA: 101,
} as const;

// Metadata for UI display
const CHAIN_META: Record<number, { name: string; icon: string }> = {
  [CHAIN.ETHEREUM]: { name: "Ethereum", icon: LOGO_URLS[CHAIN.ETHEREUM] },
  [CHAIN.ARBITRUM]: { name: "Arbitrum", icon: LOGO_URLS[CHAIN.ARBITRUM] },
  [CHAIN.BASE]: { name: "Base", icon: LOGO_URLS[CHAIN.BASE] },
  [CHAIN.POLYGON]: { name: "Polygon", icon: LOGO_URLS[CHAIN.POLYGON] },
  [CHAIN.BNB]: { name: "BNB Chain", icon: LOGO_URLS[CHAIN.BNB] },
  [CHAIN.SOLANA]: { name: "Solana", icon: LOGO_URLS[CHAIN.SOLANA] },
};

// Token Address Map
const TOKEN_ADDRESSES: Record<number, Record<string, string>> = {
  [CHAIN.ETHEREUM]: {
    usdc: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    usdt: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
  },
  [CHAIN.ARBITRUM]: {
    usdc: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831", // Native
    usdc_e: "0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8", // Bridged
    usdt: "0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9",
  },
  [CHAIN.BASE]: {
    usdc: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    usdt: "0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2",
  },
  [CHAIN.POLYGON]: {
    usdc: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
    usdt: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F",
  },
  [CHAIN.BNB]: {
    usdc: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d",
    usdt: "0x55d398326f99059fF775485246999027B3197955",
  },
  [CHAIN.SOLANA]: {
    usdc: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    usdt: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
    sol: "11111111111111111111111111111111",
  },
};

const ERC20 = new ethers.Interface([
  "function transfer(address to, uint256 value) returns (bool)",
]);

const PRIMARY_ASSETS_BY_CHAIN: Record<number, string[]> = {
  [CHAIN.SOLANA]: ["USDC", "USDT", "SOL"],
  [CHAIN.ETHEREUM]: ["USDC", "USDT", "ETH", "BTC"],
  [CHAIN.BASE]: ["USDC", "ETH", "BTC"],
  [CHAIN.BNB]: ["USDC", "USDT", "ETH", "BTC", "BNB"],
  [CHAIN.POLYGON]: ["USDC", "USDT", "ETH", "BTC"],
  [CHAIN.ARBITRUM]: ["USDC", "USDT", "ETH", "BTC"],
};

type DepositChainOption = {
  chainId: number;
  label: string;
  addressType: "evm" | "solana";
};

const DEPOSIT_CHAIN_OPTIONS: DepositChainOption[] = [
  { chainId: CHAIN.ARBITRUM, label: "Arbitrum", addressType: "evm" },
  { chainId: CHAIN.BASE, label: "Base", addressType: "evm" },
  { chainId: CHAIN.ETHEREUM, label: "Ethereum", addressType: "evm" },
  { chainId: CHAIN.POLYGON, label: "Polygon", addressType: "evm" },
  { chainId: CHAIN.BNB, label: "BNB Chain", addressType: "evm" },
  { chainId: CHAIN.SOLANA, label: "Solana", addressType: "solana" },
];

type PrimaryAssetType = "eth" | "usdc" | "usdt" | "btc" | "sol" | "bnb";

type DetectedDelta = {
  key: string;
  tokenType: PrimaryAssetType;
  chainId: number;
  amount: bigint;
  displaySymbol: string;
};

type ProcessingItem = {
  id: string;
  detectedAt: number;
  delta: DetectedDelta;
  status: "detected" | "processing" | "done" | "rejected" | "error";
  message?: string;
};

type PrimaryAssetsResponse = any;

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

/* -------------------------------------------------------------------------- */
/* App Component                               */
/* -------------------------------------------------------------------------- */

function App() {
  const { login, connectWallet, ready, authenticated, logout } = usePrivy();
  const { wallets } = useWallets();

  const primaryWallet = wallets[0];
  const connectkitEoa = primaryWallet?.address;
  const isConnected = authenticated && !!connectkitEoa;

  const { connect: jwtConnect, connected: particleConnected } = useConnect();
  const { address: jwtEoa, provider: authCoreProvider } = useEthereum();

  const [ua, setUa] = useState<UniversalAccount | null>(null);
  const [open, setOpen] = useState(false);
  const [selectedChainId, setSelectedChainId] = useState<number>(
    CHAIN.ARBITRUM
  );
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [uaEvmAddr, setUaEvmAddr] = useState<string | null>(null);
  const [uaSolAddr, setUaSolAddr] = useState<string | null>(null);
  const [processing, setProcessing] = useState<ProcessingItem[]>([]);
  const [statusLine, setStatusLine] = useState<string>("");

  // UI State for Copy Feedback
  const [copied, setCopied] = useState(false);

  const lastSnapshotRef = useRef<Map<string, bigint>>(new Map());
  const pollingRef = useRef<number | null>(null);
  const processingKeysRef = useRef<Set<string>>(new Set());
  const sweepLockRef = useRef(false);
  const loginInitiatedRef = useRef(false);
  const initialCheckDoneRef = useRef(false);

  const selectedChain = useMemo(
    () =>
      DEPOSIT_CHAIN_OPTIONS.find((c) => c.chainId === selectedChainId) ??
      DEPOSIT_CHAIN_OPTIONS[0],
    [selectedChainId]
  );

  const supportedAssetsForSelectedChain = useMemo(() => {
    return PRIMARY_ASSETS_BY_CHAIN[selectedChainId] ?? [];
  }, [selectedChainId]);

  const depositAddress =
    selectedChain.addressType === "solana" ? uaSolAddr : uaEvmAddr;

  const { userInfo } = useAuthCore();

  // --- Debug: Log security account status ---
  useEffect(() => {
    if (userInfo) {
      console.log(
        "[AUTH] UserInfo security_account:",
        userInfo.security_account
      );
      console.log(
        "[AUTH] has_set_master_password:",
        userInfo.security_account?.has_set_master_password
      );
      console.log(
        "[AUTH] has_set_payment_password:",
        userInfo.security_account?.has_set_payment_password
      );
    }
  }, [userInfo]);

  // --- Login Logic ---
  useEffect(() => {
    const run = async () => {
      if (!isConnected || !connectkitEoa) return;
      if (particleConnected) return;
      if (loginInitiatedRef.current) return;
      loginInitiatedRef.current = true;

      try {
        console.log("Initiating JWT Login for:", connectkitEoa);
        const jwt = await getJwtForUser(connectkitEoa);
        await jwtConnect({
          provider: AuthType.jwt,
          thirdpartyCode: jwt,
        });
      } catch (err) {
        console.error("JWT login failed:", err);
        loginInitiatedRef.current = false;
      }
    };
    void run();
  }, [isConnected, connectkitEoa, particleConnected, jwtConnect]);

  // --- UA Creation ---
  useEffect(() => {
    if (!jwtEoa || ua) return;
    const instance = createUniversalAccount(jwtEoa);
    setUa(instance);
    (async () => {
      try {
        const options: any = await instance.getSmartAccountOptions();
        const evm =
          options?.evmSmartAccount ?? options?.smartAccountAddress ?? null;
        const sol =
          options?.solanaSmartAccount ??
          options?.solanaSmartAccountAddress ??
          null;
        setUaEvmAddr(evm);
        setUaSolAddr(sol);
      } catch (e) {
        console.error("Failed to load UA addresses:", e);
      }
    })();
  }, [jwtEoa, ua]);

  // --- Modal Control ---
  const canOpenDeposit = Boolean(
    isConnected && connectkitEoa && ua && uaEvmAddr && uaSolAddr
  );

  const openDeposit = () => {
    setOpen(true);
    setStatusLine("");
    lastSnapshotRef.current = new Map();
    processingKeysRef.current = new Set();
    setProcessing([]);
    initialCheckDoneRef.current = false; // Reset check logic
  };

  const closeDeposit = () => {
    setOpen(false);
    setStatusLine("");
    setIsDropdownOpen(false);
    stopPolling();
  };

  function stopPolling() {
    if (pollingRef.current) {
      window.clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }

  // --- Helper Utils ---
  function normalizeTokenType(t: any): PrimaryAssetType | null {
    const v = String(t ?? "").toLowerCase();
    if (v === "eth") return "eth";
    if (v === "usdc") return "usdc";
    if (v === "usdt") return "usdt";
    if (v === "btc") return "btc";
    if (v === "sol") return "sol";
    if (v === "bnb") return "bnb";
    return null;
  }

  function tokenTypeToSymbol(t: PrimaryAssetType) {
    return t.toUpperCase();
  }

  // --- Polling & Check Logic ---

  async function checkExistingBalances() {
    if (!ua || initialCheckDoneRef.current) return;
    initialCheckDoneRef.current = true;

    try {
      console.log("[CHECK] Scanning for existing balances > $0.50...");
      const primaryAssets = await (ua as any).getPrimaryAssets();

      const assets = primaryAssets?.assets || [];
      const foundDeltas: DetectedDelta[] = [];

      for (const a of assets) {
        const tokenType = normalizeTokenType(a?.tokenType || a?.token?.type);
        if (!tokenType) continue;

        const chainAgg = a?.chainAggregation ?? a?.chains ?? [];
        for (const ca of chainAgg) {
          const chainId = Number(ca?.chainId ?? ca?.token?.chainId);
          const raw = BigInt(ca?.rawAmount ?? ca?.amount ?? "0");
          const valueUsd = Number(ca?.amountInUSD ?? "0");

          if (chainId > 0 && raw > 0n && valueUsd > 0.5) {
            const key = `${tokenType}:${chainId}`;
            if (!processingKeysRef.current.has(key)) {
              console.log(
                `[CHECK] Found existing ${tokenType} on chain ${chainId} ($${valueUsd})`
              );
              foundDeltas.push({
                key,
                tokenType,
                chainId,
                amount: raw,
                displaySymbol: tokenTypeToSymbol(tokenType),
              });
            }
          }
        }
      }

      for (const d of foundDeltas) {
        processingKeysRef.current.add(d.key);
        const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
        setProcessing((p) => [
          { id, detectedAt: Date.now(), delta: d, status: "detected" },
          ...p,
        ]);
        void handleDelta(id, d);
      }
    } catch (e) {
      console.warn("[CHECK] Error scanning balances:", e);
    }
  }

  async function pollOnce() {
    if (!ua) return;

    if (!initialCheckDoneRef.current) {
      await checkExistingBalances();
    }

    try {
      const primaryAssets = await (ua as any).getPrimaryAssets();
      const nextSnap = extractSnapshot(primaryAssets);
      if (lastSnapshotRef.current.size === 0) {
        lastSnapshotRef.current = nextSnap;
        return;
      }
      const deltas = diffSnapshot(lastSnapshotRef.current, nextSnap);
      lastSnapshotRef.current = nextSnap;

      for (const d of deltas) {
        if (processingKeysRef.current.has(d.key)) continue;
        processingKeysRef.current.add(d.key);

        const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
        setProcessing((p) => [
          { id, detectedAt: Date.now(), delta: d, status: "detected" },
          ...p,
        ]);
        void handleDelta(id, d);
      }
    } catch (e) {
      console.warn("[WATCH] Polling error:", e);
    }
  }

  function extractSnapshot(
    primaryAssets: PrimaryAssetsResponse
  ): Map<string, bigint> {
    const snap = new Map<string, bigint>();
    const assets =
      primaryAssets?.assets ??
      primaryAssets?.data?.assets ??
      primaryAssets?.result?.assets ??
      [];
    for (const a of assets) {
      const tokenType = normalizeTokenType(a?.tokenType || a?.token?.type);
      if (!tokenType) continue;
      const chainAgg = a?.chainAggregation ?? a?.chains ?? [];
      for (const ca of chainAgg) {
        const chainId = Number(ca?.chainId ?? ca?.token?.chainId);
        const raw = ca?.rawAmount ?? ca?.amount ?? "0";
        let amt = 0n;
        try {
          if (typeof raw === "string") amt = BigInt(raw);
          else if (typeof raw === "number") amt = BigInt(raw);
          else if (typeof raw === "bigint") amt = raw;
        } catch {
          amt = 0n;
        }
        if (!chainId) continue;
        snap.set(`${tokenType}:${chainId}`, amt);
      }
    }
    return snap;
  }

  function diffSnapshot(
    prev: Map<string, bigint>,
    next: Map<string, bigint>
  ): DetectedDelta[] {
    const deltas: DetectedDelta[] = [];
    for (const [key, nextAmt] of next.entries()) {
      const prevAmt = prev.get(key) ?? 0n;
      if (nextAmt > prevAmt) {
        const [tokenTypeRaw, chainIdRaw] = key.split(":");
        deltas.push({
          key,
          tokenType: normalizeTokenType(tokenTypeRaw) as PrimaryAssetType,
          chainId: Number(chainIdRaw),
          amount: nextAmt - prevAmt,
          displaySymbol: tokenTypeToSymbol(
            normalizeTokenType(tokenTypeRaw) as PrimaryAssetType
          ),
        });
      }
    }
    return deltas;
  }

  function startPolling() {
    stopPolling();
    pollingRef.current = window.setInterval(() => {
      void pollOnce();
    }, 8000);
    void pollOnce();
  }

  useEffect(() => {
    if (!open || !ua) return;
    startPolling();
    return () => stopPolling();
  }, [open, ua]);

  /* ------------------------------------------------------------------------ */
  /* SWEEP LOGIC: Universal Transaction & Multi-Path Fallback                 */
  /* ------------------------------------------------------------------------ */

  async function sweepToArbitrum(
    tokenType: PrimaryAssetType,
    rawAmount: bigint,
    sourceChainId: number
  ): Promise<string> {
    if (!ua || !authCoreProvider || !connectkitEoa)
      throw new Error("Deps not ready");
    if (sweepLockRef.current) return "Locked";
    sweepLockRef.current = true;

    const TARGET_CHAIN = CHAIN.ARBITRUM;
    // UPDATED: Attempt 100% first, then 95%
    const percentages = [100n, 95n, 50n];

    console.log(
      `[SWEEP] Detected ${tokenType} on ${sourceChainId}. Initiating sweep protocol...`
    );

    try {
      // Helper to build TX
      const buildTx = async (
        amountHumanReadable: string,
        destChainId: number,
        destTokenAddr?: string
      ) => {
        // 1. Native ETH: Use createTransferTransaction for ETH now too
        if (tokenType === "eth") {
          // We use createTransferTransaction for ETH because it handles cross-chain wrapping/bridging better than universalTx in recent SDKs
          // And we are passing a human-readable amount string now.
          return await (ua as any).createTransferTransaction({
            token: {
              chainId: destChainId,
              address: "0x0000000000000000000000000000000000000000",
            },
            amount: amountHumanReadable,
            receiver: connectkitEoa,
          });
        }

        // 2. Tokens (USDC/USDT): Use createTransferTransaction with Destination Token
        if (destTokenAddr) {
          return await (ua as any).createTransferTransaction({
            token: { chainId: destChainId, address: destTokenAddr },
            amount: amountHumanReadable,
            receiver: connectkitEoa,
          });
        }
        throw new Error("Missing token address");
      };

      const destConfig = TOKEN_ADDRESSES[TARGET_CHAIN];
      const sourceConfig = TOKEN_ADDRESSES[sourceChainId];

      const targets = [];

      // 1. Target: Native Asset on Arbitrum
      if (tokenType === "usdc" && destConfig?.usdc)
        targets.push({
          chainId: TARGET_CHAIN,
          addr: destConfig.usdc,
          label: "Arb Native USDC",
        });
      else if (tokenType === "usdt" && destConfig?.usdt)
        targets.push({
          chainId: TARGET_CHAIN,
          addr: destConfig.usdt,
          label: "Arb USDT",
        });
      else if (tokenType === "eth")
        targets.push({
          chainId: TARGET_CHAIN,
          addr: undefined,
          label: "Arb ETH",
        });

      // 2. Target: Bridged Asset (USDC.e) on Arbitrum
      if (tokenType === "usdc" && destConfig?.usdc_e) {
        targets.push({
          chainId: TARGET_CHAIN,
          addr: destConfig.usdc_e,
          label: "Arb Bridged USDC.e",
        });
      }

      // 3. Fallback: Source Chain
      if (tokenType === "eth")
        targets.push({
          chainId: sourceChainId,
          addr: undefined,
          label: "Source Chain Fallback",
        });
      else if (sourceConfig?.[tokenType])
        targets.push({
          chainId: sourceChainId,
          addr: sourceConfig[tokenType],
          label: "Source Chain Fallback",
        });

      for (const target of targets) {
        for (const pct of percentages) {
          try {
            const safePct = target.chainId === sourceChainId ? 100n : pct;
            const tryAmountWei = (rawAmount * safePct) / 100n;

            if (tryAmountWei < 1000n) break;

            // Format for SDK - ALWAYS HUMAN READABLE
            const decimals = tokenType === "eth" ? 18 : 6;
            const amountArg = formatUnits(tryAmountWei, decimals);

            console.log(
              `[SWEEP] Attempt: ${target.label} (${safePct}%) -> ${amountArg}`
            );
            const tx = await buildTx(amountArg, target.chainId, target.addr);

            const sig = await authCoreProvider.signMessage(tx.rootHash);
            await (ua as any).sendTransaction(tx, sig);

            console.log(`[SWEEP] Success! Sent to ${target.label}`);
            return `Swept to ${
              target.chainId === TARGET_CHAIN ? "Arbitrum" : "User Wallet"
            }`;
          } catch (e) {
            console.warn(`[SWEEP] Failed attempt (${target.label}):`, e);
          }
        }
      }

      throw new Error("All sweep strategies failed.");
    } catch (error) {
      console.error("[SWEEP] Critical Failure:", error);
      throw error;
    } finally {
      sweepLockRef.current = false;
    }
  }

  async function handleDelta(itemId: string, d: DetectedDelta) {
    if (!connectkitEoa) {
      setProcessing((p) =>
        p.map((x) =>
          x.id === itemId
            ? { ...x, status: "error", message: "Wallet not ready" }
            : x
        )
      );
      return;
    }

    setProcessing((p) =>
      p.map((x) => (x.id === itemId ? { ...x, status: "processing" } : x))
    );
    setStatusLine("Processing deposit…");

    try {
      if (["eth", "usdc", "usdt"].includes(d.tokenType)) {
        const resultMsg = await sweepToArbitrum(
          d.tokenType,
          d.amount,
          d.chainId
        );

        setProcessing((p) =>
          p.map((x) =>
            x.id === itemId ? { ...x, status: "done", message: resultMsg } : x
          )
        );
      } else if (d.tokenType === "sol") {
        setProcessing((p) =>
          p.map((x) =>
            x.id === itemId
              ? {
                  ...x,
                  status: "rejected",
                  message: "Manual SOL withdrawal needed",
                }
              : x
          )
        );
      } else {
        setProcessing((p) =>
          p.map((x) =>
            x.id === itemId
              ? { ...x, status: "rejected", message: "Asset not handled" }
              : x
          )
        );
      }
    } catch (e: any) {
      setProcessing((p) =>
        p.map((x) =>
          x.id === itemId
            ? { ...x, status: "error", message: "Transaction Failed" }
            : x
        )
      );
    } finally {
      setStatusLine("");
    }
  }

  return (
    <div className="App">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        @keyframes spin { from { transform: rotate(0deg);} to { transform: rotate(360deg);} }
        @keyframes fadeIn { from { opacity: 0; transform: scale(0.98); } to { opacity: 1; transform: scale(1); } }
        @keyframes pulse { 0% { opacity: 0.5; transform: scale(0.95); } 50% { opacity: 1; transform: scale(1.05); } 100% { opacity: 0.5; transform: scale(0.95); } }
        * { box-sizing: border-box; font-family: 'Inter', -apple-system, system-ui, sans-serif; }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
      `}</style>

      <div className="connect-btn-container">
        {ready &&
          (!isConnected ? (
            <button
              onClick={authenticated ? connectWallet : login}
              style={{ ...primaryBtn, padding: "12px 24px", fontSize: 16 }}
            >
              {authenticated ? "Connect Wallet" : "Log In"}
            </button>
          ) : (
            <div style={{ display: "flex", gap: 10 }}>
              <div style={walletBadge}>
                <span style={{ opacity: 0.6 }}>Connected:</span>
                {connectkitEoa?.slice(0, 6)}...{connectkitEoa?.slice(-4)}
              </div>
              <button onClick={logout} style={ghostBtnSmall}>
                Disconnect
              </button>
            </div>
          ))}
      </div>

      <button
        style={{
          ...primaryBtn,
          marginTop: 24,
          padding: "14px 28px",
          fontSize: 15,
        }}
        onClick={openDeposit}
        disabled={!canOpenDeposit}
      >
        Open Deposit Modal
      </button>

      {open && (
        <div style={backdrop}>
          <div style={sheet}>
            <div style={headerRow}>
              <div style={title}>Deposit Assets</div>
              <button
                style={closeIconBtn}
                onClick={closeDeposit}
                aria-label="Close"
              >
                <XIcon />
              </button>
            </div>

            <div style={{ position: "relative", zIndex: 50 }}>
              <div style={fieldLabel}>Select Chain</div>
              <div
                style={customSelectTrigger}
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <ChainAvatar chainId={selectedChainId} size={22} />
                  <span style={{ fontSize: 15, fontWeight: 500 }}>
                    {selectedChain.label}
                  </span>
                </div>
                <div style={{ color: "#6b7280" }}>
                  <ChevronDownIcon />
                </div>
              </div>

              {isDropdownOpen && (
                <div className="custom-scrollbar" style={customSelectMenu}>
                  {DEPOSIT_CHAIN_OPTIONS.map((c) => {
                    const supportedTokens =
                      PRIMARY_ASSETS_BY_CHAIN[c.chainId] || [];
                    return (
                      <div
                        key={c.chainId}
                        style={customSelectItem}
                        onClick={() => {
                          setSelectedChainId(c.chainId);
                          setIsDropdownOpen(false);
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background =
                            "rgba(255,255,255,0.05)")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background = "transparent")
                        }
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                          }}
                        >
                          <ChainAvatar chainId={c.chainId} size={20} />
                          <span style={{ fontSize: 14 }}>{c.label}</span>
                        </div>
                        <div style={{ display: "flex", gap: 4 }}>
                          {supportedTokens.slice(0, 4).map((sym) => (
                            <TokenAvatar key={sym} symbol={sym} size={14} />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {(statusLine ||
              processing.some((p) => p.status === "processing")) && (
              <div style={statusPill}>
                <SpinnerMini />
                <span style={{ fontSize: 13, fontWeight: 500 }}>
                  {statusLine || "Processing deposit…"}
                </span>
              </div>
            )}

            <div style={{ marginTop: 24 }}>
              <div style={fieldLabel}>Your Deposit Address</div>
              <div style={addressCard}>
                <div style={addressText}>{depositAddress ?? "Loading…"}</div>
                <button
                  style={copyBtn}
                  onClick={async () => {
                    if (!depositAddress) return;
                    await navigator.clipboard.writeText(depositAddress);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                >
                  {copied ? <CheckIcon /> : <CopyIcon />}
                </button>
              </div>
              <div style={hintRow}>
                <span
                  style={{
                    ...hintDot,
                    background:
                      selectedChain.addressType === "solana"
                        ? "#14F195"
                        : "#627EEA",
                  }}
                />
                <span style={hintText}>
                  Send{" "}
                  <b>
                    {selectedChain.addressType === "solana" ? "Solana" : "EVM"}
                  </b>{" "}
                  assets to this address.
                </span>
              </div>
            </div>

            <div style={{ marginTop: 24 }}>
              <div style={fieldLabel}>Supported Tokens</div>
              <div style={tokenRow}>
                {supportedAssetsForSelectedChain.map((sym) => (
                  <TokenChip key={sym} symbol={sym} />
                ))}
              </div>
            </div>

            <div style={divider} />

            <div>
              <div style={{ ...fieldLabel, marginBottom: 12 }}>
                Recent Activity
              </div>
              {processing.length === 0 ? (
                <div style={emptyStateListening}>
                  <div style={pulsingDot} />
                  <span>Listening for deposits...</span>
                </div>
              ) : (
                <div style={activityList}>
                  {processing.slice(0, 3).map((p) => {
                    const chainMeta = CHAIN_META[p.delta.chainId] ?? {
                      name: `Chain ${p.delta.chainId}`,
                      icon: "",
                    };
                    return (
                      <div key={p.id} style={activityItem}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                          }}
                        >
                          <div style={activityIconFrame}>
                            <TokenAvatar
                              symbol={p.delta.displaySymbol}
                              size={20}
                            />
                          </div>
                          <div style={{ textAlign: "left" }}>
                            <div style={activityTitle}>
                              {p.delta.displaySymbol}{" "}
                              <span style={{ opacity: 0.5, fontWeight: 400 }}>
                                Detected
                              </span>
                            </div>
                            <div style={activitySub}>
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 6,
                                }}
                              >
                                {chainMeta.icon && (
                                  <img
                                    src={chainMeta.icon}
                                    alt=""
                                    style={{
                                      width: 14,
                                      height: 14,
                                      borderRadius: "50%",
                                    }}
                                  />
                                )}
                                <span>{chainMeta.name}</span>
                                <span style={{ opacity: 0.3 }}>•</span>
                                <span>
                                  {new Date(p.detectedAt).toLocaleTimeString(
                                    [],
                                    { hour: "2-digit", minute: "2-digit" }
                                  )}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <StatusBadge status={p.status} />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
          {isDropdownOpen && (
            <div
              style={{ position: "fixed", inset: 0, zIndex: 40 }}
              onClick={() => setIsDropdownOpen(false)}
            />
          )}
        </div>
      )}
    </div>
  );
}

export default App;

/* -------------------------------------------------------------------------- */
/* UI Components                                */
/* -------------------------------------------------------------------------- */

function TokenChip({ symbol }: { symbol: string }) {
  return (
    <div style={chip}>
      <TokenAvatar symbol={symbol} size={16} />
      <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.01em" }}>
        {symbol}
      </span>
    </div>
  );
}

function ChainAvatar({
  chainId,
  size = 20,
}: {
  chainId: number;
  size?: number;
}) {
  const url = LOGO_URLS[chainId];
  if (!url) {
    return (
      <div style={{ ...avatarFallback, width: size, height: size }}>#</div>
    );
  }
  return (
    <img
      src={url}
      alt="Chain"
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        objectFit: "cover",
      }}
    />
  );
}

function TokenAvatar({ symbol, size = 20 }: { symbol: string; size?: number }) {
  const s = symbol.toUpperCase();
  const url = LOGO_URLS[s];
  if (!url) {
    const label = s[0] || "?";
    return (
      <div
        style={{
          ...avatarFallback,
          width: size,
          height: size,
          fontSize: Math.max(10, size - 8),
        }}
      >
        {label}
      </div>
    );
  }
  return (
    <img
      src={url}
      alt={s}
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        objectFit: "cover",
      }}
    />
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { text: string; style: React.CSSProperties }> = {
    processing: { text: "Processing", style: badgeProcessing },
    done: { text: "Complete", style: badgeDone },
    rejected: { text: "Action Needed", style: badgeWarn },
    error: { text: "Failed", style: badgeError },
    detected: { text: "Detected", style: badgeNeutral },
  };
  const item = map[status] ?? map.detected;
  return (
    <div style={{ ...badgeBase, ...item.style }}>
      <span style={{ ...badgeDot, backgroundColor: item.style.color }} />
      {item.text}
    </div>
  );
}

function SpinnerMini() {
  return <span style={spinnerMini} />;
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" color="#4ade80">
      <path
        d="M20 6L9 17l-5-5"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path
        d="M6 6l12 12M18 6L6 18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <rect
        x="9"
        y="9"
        width="13"
        height="13"
        rx="2"
        ry="2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path
        d="M6 9l6 6 6-6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/* Styles                                   */
/* -------------------------------------------------------------------------- */

const backdrop: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.6)",
  backdropFilter: "blur(8px)",
  WebkitBackdropFilter: "blur(8px)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 16,
  zIndex: 9999,
  animation: "fadeIn 0.2s ease-out",
};

const sheet: React.CSSProperties = {
  width: 440,
  maxWidth: "100%",
  borderRadius: 24,
  background: "#131418",
  color: "#fff",
  border: "1px solid rgba(255,255,255,0.08)",
  boxShadow: "0 0 0 1px rgba(0,0,0,0.2), 0 24px 60px rgba(0,0,0,0.7)",
  padding: 24,
  position: "relative",
  overflow: "visible",
};

const headerRow: React.CSSProperties = {
  position: "relative",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  marginBottom: 20,
};

const title: React.CSSProperties = {
  fontSize: 20,
  fontWeight: 700,
  letterSpacing: "-0.02em",
  color: "#fff",
  textAlign: "center",
};

const closeIconBtn: React.CSSProperties = {
  position: "absolute",
  right: 0,
  width: 32,
  height: 32,
  borderRadius: 10,
  display: "grid",
  placeItems: "center",
  background: "transparent",
  color: "#6b7280",
  cursor: "pointer",
  border: "none",
  transition: "all 0.2s",
};

const divider: React.CSSProperties = {
  height: 1,
  background: "rgba(255,255,255,0.06)",
  margin: "24px 0",
};

const fieldLabel: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  color: "#6b7280",
  marginBottom: 10,
};

const customSelectTrigger: React.CSSProperties = {
  width: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  borderRadius: 12,
  padding: "14px 16px",
  border: "1px solid rgba(255,255,255,0.1)",
  background: "rgba(255,255,255,0.03)",
  color: "#fff",
  fontSize: 15,
  fontWeight: 500,
  cursor: "pointer",
  transition: "border-color 0.2s, background 0.2s",
};

const customSelectMenu: React.CSSProperties = {
  position: "absolute",
  top: "100%",
  left: 0,
  width: "100%",
  maxHeight: 220,
  overflowY: "auto",
  background: "#1c1d21",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 12,
  marginTop: 6,
  zIndex: 100,
  boxShadow: "0 10px 40px rgba(0,0,0,0.5)",
  padding: 4,
};

const customSelectItem: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "10px 12px",
  borderRadius: 8,
  cursor: "pointer",
  transition: "background 0.1s",
  color: "#fff",
};

const addressCard: React.CSSProperties = {
  display: "flex",
  gap: 10,
  alignItems: "center",
  justifyContent: "space-between",
  padding: "10px 10px 10px 14px",
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.08)",
  background: "#0a0a0c",
};

const addressText: React.CSSProperties = {
  fontFamily: "'SF Mono', 'Menlo', 'Monaco', 'Courier New', monospace",
  fontSize: 13,
  color: "#d1d5db",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const copyBtn: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: 36,
  height: 36,
  borderRadius: 8,
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(255,255,255,0.05)",
  color: "#fff",
  cursor: "pointer",
  transition: "all 0.2s",
};

const hintRow: React.CSSProperties = {
  marginTop: 10,
  display: "flex",
  alignItems: "center",
  gap: 8,
  paddingLeft: 4,
};

const hintDot: React.CSSProperties = {
  width: 6,
  height: 6,
  borderRadius: "50%",
};

const hintText: React.CSSProperties = {
  fontSize: 12,
  color: "#6b7280",
};

const tokenRow: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 8,
};

const chip: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  padding: "6px 12px 6px 8px",
  borderRadius: 100,
  border: "1px solid rgba(255,255,255,0.1)",
  background: "rgba(255,255,255,0.02)",
  color: "#e5e7eb",
};

const avatarFallback: React.CSSProperties = {
  borderRadius: "50%",
  background: "rgba(255,255,255,0.1)",
  display: "grid",
  placeItems: "center",
  fontWeight: 600,
  color: "#fff",
};

const statusPill: React.CSSProperties = {
  marginTop: 16,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 10,
  padding: "10px",
  borderRadius: 12,
  border: "1px solid rgba(99, 102, 241, 0.2)",
  background: "rgba(99, 102, 241, 0.1)",
  color: "#818cf8",
};

const spinnerMini: React.CSSProperties = {
  display: "block",
  width: 16,
  height: 16,
  borderRadius: "50%",
  border: "2px solid currentColor",
  borderTopColor: "transparent",
  animation: "spin 0.8s linear infinite",
};

const activityList: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 10,
};

const activityItem: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: 12,
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.06)",
  background: "rgba(255,255,255,0.02)",
};

const activityIconFrame: React.CSSProperties = {
  width: 32,
  height: 32,
  borderRadius: 8,
  background: "rgba(255,255,255,0.05)",
  display: "grid",
  placeItems: "center",
};

const activityTitle: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 600,
  color: "#fff",
  lineHeight: 1.2,
};

const activitySub: React.CSSProperties = {
  fontSize: 12,
  color: "#6b7280",
  marginTop: 3,
  lineHeight: 1.2,
};

const emptyStateListening: React.CSSProperties = {
  fontSize: 13,
  color: "#52525b",
  padding: "24px",
  borderRadius: 12,
  border: "1px dashed rgba(255,255,255,0.1)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  gap: 10,
};

const pulsingDot: React.CSSProperties = {
  width: 8,
  height: 8,
  borderRadius: "50%",
  background: "#10b981",
  boxShadow: "0 0 0 0 rgba(16, 185, 129, 0.7)",
  animation: "pulse 2s infinite",
};

const primaryBtn: React.CSSProperties = {
  background: "linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)",
  color: "#fff",
  border: "none",
  borderRadius: 12,
  cursor: "pointer",
  fontWeight: 600,
  boxShadow: "0 4px 12px rgba(79, 70, 229, 0.3)",
  transition: "transform 0.1s",
};

const ghostBtnSmall: React.CSSProperties = {
  background: "transparent",
  border: "1px solid rgba(255,255,255,0.2)",
  color: "#fff",
  padding: "6px 12px",
  borderRadius: 8,
  cursor: "pointer",
  fontSize: 13,
};

const walletBadge: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  background: "rgba(255,255,255,0.05)",
  padding: "6px 12px",
  borderRadius: 8,
  fontSize: 14,
  fontWeight: 500,
  border: "1px solid rgba(255,255,255,0.1)",
};

const badgeBase: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  padding: "4px 10px",
  borderRadius: 100,
  textTransform: "uppercase",
  letterSpacing: "0.02em",
  display: "flex",
  alignItems: "center",
  gap: 6,
};

const badgeDot: React.CSSProperties = {
  width: 6,
  height: 6,
  borderRadius: "50%",
};

const badgeNeutral: React.CSSProperties = {
  background: "rgba(255,255,255,0.06)",
  color: "#9ca3af",
};

const badgeProcessing: React.CSSProperties = {
  background: "rgba(99, 102, 241, 0.1)",
  color: "#818cf8",
};

const badgeDone: React.CSSProperties = {
  background: "rgba(34, 197, 94, 0.1)",
  color: "#4ade80",
};

const badgeWarn: React.CSSProperties = {
  background: "rgba(245, 158, 11, 0.1)",
  color: "#fbbf24",
};

const badgeError: React.CSSProperties = {
  background: "rgba(239, 68, 68, 0.1)",
  color: "#f87171",
};
