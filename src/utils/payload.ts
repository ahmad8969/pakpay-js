/** Normalize gateway callback bodies to string key/value pairs. */
export function normalizePayload(
  payload: Record<string, string | undefined>,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(payload)) {
    if (value !== undefined && value !== null) {
      out[key] = String(value);
    }
  }
  return out;
}
