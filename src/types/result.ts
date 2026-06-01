export type PakPayResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; code?: string };

export function ok<T>(data: T): PakPayResult<T> {
  return { success: true, data };
}

export function fail<T>(error: string, code?: string): PakPayResult<T> {
  return { success: false, error, code };
}
