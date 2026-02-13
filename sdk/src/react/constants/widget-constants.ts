import type { TokenType } from "../../core/types";
import { CHAIN } from "../../constants/chains";

export const LOGO_URLS: Record<string, string> = {
  // Chains
  [CHAIN.ETHEREUM]:
    "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png",
  [CHAIN.ARBITRUM]:
    "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/arbitrum/info/logo.png",
  [CHAIN.BASE]:
    "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/base/info/logo.png",
  [CHAIN.POLYGON]:
    "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/polygon/info/logo.png",
  [CHAIN.BNB]:
    "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/binance/info/logo.png",
  [CHAIN.SOLANA]:
    "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/solana/info/logo.png",
  [CHAIN.OPTIMISM]:
    "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/optimism/info/logo.png",
  [CHAIN.AVALANCHE]:
    "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/avalanchec/info/logo.png",
  [CHAIN.LINEA]:
    "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/linea/info/logo.png",
  [CHAIN.MANTLE]:
    "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/mantle/info/logo.png",
  [CHAIN.HYPERVM]:
    "https://universalx.app/_next/image?url=https%3A%2F%2Fstatic.particle.network%2Fchains%2Fevm%2Ficons%2F999.png&w=32&q=75",
  [CHAIN.MERLIN]:
    "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/merlin/info/logo.png",
  [CHAIN.XLAYER]:
    "https://universalx.app/_next/image?url=https%3A%2F%2Fstatic.particle.network%2Fchains%2Fevm%2Ficons%2F196.png&w=32&q=75",
  [CHAIN.MONAD]:
    "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/monad/info/logo.png",
  [CHAIN.SONIC]:
    "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/sonic/info/logo.png",
  [CHAIN.PLASMA]:
    "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/plasma/info/logo.png",
  [CHAIN.BERACHAIN]:
    "https://universalx.app/_next/image?url=https%3A%2F%2Fstatic.particle.network%2Fchains%2Fevm%2Ficons%2F80094.png&w=32&q=75",
  // Tokens
  ETH: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png",
  USDC: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png",
  USDT: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xdAC17F958D2ee523a2206206994597C13D831ec7/logo.png",
  BTC: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/bitcoin/info/logo.png",
  SOL: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/solana/info/logo.png",
  BNB: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/binance/info/logo.png",
};

interface ChainOption {
  id: number;
  name: string;
  color: string;
  addressType: "evm" | "solana";
}

export const CHAIN_OPTIONS: ChainOption[] = [
  { id: CHAIN.SOLANA, name: "Solana", color: "#9945ff", addressType: "solana" },
  { id: CHAIN.ETHEREUM, name: "Ethereum", color: "#627eea", addressType: "evm" },
  { id: CHAIN.BNB, name: "BNB Chain", color: "#f3ba2f", addressType: "evm" },
  { id: CHAIN.MANTLE, name: "Mantle", color: "#000000", addressType: "evm" },
  { id: CHAIN.MONAD, name: "Monad", color: "#6366f1", addressType: "evm" },
  { id: CHAIN.PLASMA, name: "Plasma", color: "#8b5cf6", addressType: "evm" },
  { id: CHAIN.XLAYER, name: "X Layer", color: "#000000", addressType: "evm" },
  { id: CHAIN.BASE, name: "Base", color: "#0052ff", addressType: "evm" },
  { id: CHAIN.ARBITRUM, name: "Arbitrum", color: "#12aaeb", addressType: "evm" },
  { id: CHAIN.AVALANCHE, name: "Avalanche", color: "#e84142", addressType: "evm" },
  { id: CHAIN.OPTIMISM, name: "OP (Optimism)", color: "#ff0420", addressType: "evm" },
  { id: CHAIN.POLYGON, name: "Polygon", color: "#8247e5", addressType: "evm" },
  { id: CHAIN.HYPERVM, name: "HyperEVM", color: "#00d4ff", addressType: "evm" },
  { id: CHAIN.BERACHAIN, name: "Berachain", color: "#f5841f", addressType: "evm" },
  { id: CHAIN.LINEA, name: "Linea", color: "#121212", addressType: "evm" },
  { id: CHAIN.SONIC, name: "Sonic", color: "#1969ff", addressType: "evm" },
  { id: CHAIN.MERLIN, name: "Merlin", color: "#f7931a", addressType: "evm" },
];

export const CHAIN_SUPPORTED_TOKENS: Record<number, TokenType[]> = {
  [CHAIN.SOLANA]: ["USDC", "USDT", "SOL"],
  [CHAIN.ETHEREUM]: ["USDC", "USDT", "ETH", "BTC"],
  [CHAIN.BASE]: ["USDC", "ETH", "BTC"],
  [CHAIN.BNB]: ["USDC", "USDT", "ETH", "BTC", "BNB"],
  [CHAIN.MANTLE]: ["USDT"],
  [CHAIN.MONAD]: ["USDC"],
  [CHAIN.PLASMA]: ["USDT"],
  [CHAIN.XLAYER]: ["USDC", "USDT"],
  [CHAIN.HYPERVM]: ["USDT"],
  [CHAIN.SONIC]: ["USDC"],
  [CHAIN.BERACHAIN]: ["USDC"],
  [CHAIN.AVALANCHE]: ["USDC", "USDT", "ETH", "BTC"],
  [CHAIN.ARBITRUM]: ["USDC", "USDT", "ETH", "BTC"],
  [CHAIN.OPTIMISM]: ["USDC", "USDT", "ETH", "BTC"],
  [CHAIN.LINEA]: ["USDC", "USDT", "ETH", "BTC"],
  [CHAIN.POLYGON]: ["USDC", "USDT", "ETH", "BTC"],
  [CHAIN.MERLIN]: ["BTC"],
};

export const TOKEN_SUPPORTED_CHAINS: Record<TokenType, number[]> =
  Object.entries(CHAIN_SUPPORTED_TOKENS).reduce(
    (acc, [chainIdStr, tokens]) => {
      const chainId = Number(chainIdStr);
      return tokens.reduce(
        (innerAcc, token) => ({
          ...innerAcc,
          [token]: [...(innerAcc[token as TokenType] || []), chainId],
        }),
        acc,
      );
    },
    {} as Record<TokenType, number[]>,
  );
