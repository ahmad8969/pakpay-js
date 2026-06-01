import type { PakPayConfig } from "../types/config.js";
import { PakPayConfigError } from "../errors/index.js";
import { JazzCashAdapter } from "./jazzcash/adapter.js";
import { EasypaisaAdapter } from "./easypaisa/adapter.js";
import type { ProviderAdapter } from "./types.js";

export function createProviderAdapter(config: PakPayConfig): ProviderAdapter {
  switch (config.provider) {
    case "jazzcash":
      validateJazzCashConfig(config);
      return new JazzCashAdapter(config);
    case "easypaisa":
      validateEasypaisaConfig(config);
      return new EasypaisaAdapter(config);
    default:
      throw new PakPayConfigError(
        `Unsupported provider: ${(config as { provider: string }).provider}`,
      );
  }
}

function validateJazzCashConfig(config: PakPayConfig): void {
  if (config.provider !== "jazzcash") return;
  if (!config.merchantId?.trim()) {
    throw new PakPayConfigError("merchantId is required");
  }
  if (!config.password?.trim()) {
    throw new PakPayConfigError("password is required");
  }
  if (!config.integritySalt?.trim()) {
    throw new PakPayConfigError("integritySalt is required");
  }
}

function validateEasypaisaConfig(config: PakPayConfig): void {
  if (config.provider !== "easypaisa") return;
  if (!config.storeId?.trim()) {
    throw new PakPayConfigError("storeId is required");
  }
  if (!config.hashKey?.trim()) {
    throw new PakPayConfigError("hashKey is required");
  }
}
