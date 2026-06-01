export class PakPayConfigError extends Error {
  readonly code = "INVALID_CONFIG";

  constructor(message: string) {
    super(message);
    this.name = "PakPayConfigError";
  }
}

export class PakPayValidationError extends Error {
  readonly code = "VALIDATION_ERROR";

  constructor(message: string) {
    super(message);
    this.name = "PakPayValidationError";
  }
}
