export interface HttpOptions {
  timeout?: number;
  headers?: Record<string, string>;
}

export async function postJson<T>(
  url: string,
  body: Record<string, string | number | boolean>,
  options: HttpOptions = {},
): Promise<T> {
  const controller = new AbortController();
  const timeout = options.timeout ?? 30_000;
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    const text = await res.text();
    let data: T;
    try {
      data = JSON.parse(text) as T;
    } catch {
      throw new Error(`Invalid JSON response (${res.status}): ${text.slice(0, 200)}`);
    }

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${text.slice(0, 200)}`);
    }

    return data;
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error("Request timed out");
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}
