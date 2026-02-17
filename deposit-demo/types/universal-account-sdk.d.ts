declare module "@particle-network/universal-account-sdk" {
  export const UNIVERSAL_ACCOUNT_VERSION: string;

  export interface SmartAccountOptions {
    useEIP7702?: boolean;
    name?: string;
    version?: string;
    ownerAddress: string;
  }

  export interface TradeConfig {
    slippageBps?: number;
  }

  export interface UniversalAccountConfig {
    projectId: string;
    projectClientKey: string;
    projectAppUuid: string;
    smartAccountOptions?: SmartAccountOptions;
    ownerAddress?: string;
    tradeConfig?: TradeConfig;
  }

  export interface PrimaryAssetsResponse {
    assets: unknown[];
    totalAmountInUSD: number;
  }

  export class UniversalAccount {
    constructor(config: UniversalAccountConfig);
    getPrimaryAssets(): Promise<PrimaryAssetsResponse>;
  }
}
