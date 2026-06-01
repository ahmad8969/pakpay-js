export interface JazzCashConfig {
  provider: "jazzcash";
  merchantId: string;
  password: string;
  integritySalt: string;
  sandbox?: boolean;
  timeout?: number;
}

export interface EasypaisaConfig {
  provider: "easypaisa";
  storeId: string;
  hashKey: string;
  sandbox?: boolean;
  timeout?: number;
  /** Required for `getStatus()` REST inquiry */
  username?: string;
  password?: string;
}

export type PakPayConfig = JazzCashConfig | EasypaisaConfig;
