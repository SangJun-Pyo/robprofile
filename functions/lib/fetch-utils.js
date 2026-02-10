// Shared fetch utility with timeout, retry, and 429 backoff.
// All external Roblox API calls should use robustFetch instead of bare fetch.

const DEFAULT_TIMEOUT_MS = 4000;
const DEFAULT_MAX_RETRIES = 2; // total attempts = 1 + retries
const INITIAL_BACKOFF_MS = 1000;

/**
 * Fetch with automatic timeout, retry on failure/5xx, and 429 backoff.
 *
 * @param {string} url
 * @param {object} [opts]
 * @param {number} [opts.timeoutMs=4000]
 * @param {number} [opts.maxRetries=2]
 * @param {RequestInit} [opts.fetchOpts]  — extra options forwarded to fetch
 * @returns {Promise<{ok:boolean, data:any, status:number|null, error:string|null, durationMs:number}>}
 */
export async function robustFetch(url, opts = {}) {
  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const maxRetries = opts.maxRetries ?? DEFAULT_MAX_RETRIES;
  const fetchOpts = opts.fetchOpts ?? {};

  const start = Date.now();
  let lastError = null;
  let lastStatus = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        ...fetchOpts,
        signal: controller.signal
      });
      clearTimeout(timer);

      lastStatus = response.status;

      // 429 — respect Retry-After then retry
      if (response.status === 429 && attempt < maxRetries) {
        const retryAfter = parseRetryAfter(response.headers.get('Retry-After'));
        const delay = retryAfter ?? INITIAL_BACKOFF_MS * Math.pow(2, attempt);
        await sleep(delay);
        continue;
      }

      // 5xx — retry with backoff
      if (response.status >= 500 && attempt < maxRetries) {
        await sleep(INITIAL_BACKOFF_MS * Math.pow(2, attempt));
        continue;
      }

      // Parse body
      const text = await response.text();
      if (response.ok) {
        try {
          return { ok: true, data: JSON.parse(text), status: response.status, error: null, durationMs: Date.now() - start };
        } catch {
          // Body is not JSON — return raw text as data
          return { ok: true, data: text, status: response.status, error: null, durationMs: Date.now() - start };
        }
      }

      // Non-retryable error (4xx except 429)
      return { ok: false, data: null, status: response.status, error: text.slice(0, 300), durationMs: Date.now() - start };

    } catch (err) {
      clearTimeout(timer);
      lastError = err.name === 'AbortError' ? 'timeout' : err.message;

      if (attempt < maxRetries) {
        await sleep(INITIAL_BACKOFF_MS * Math.pow(2, attempt));
        continue;
      }
    }
  }

  return { ok: false, data: null, status: lastStatus, error: lastError, durationMs: Date.now() - start };
}

function parseRetryAfter(header) {
  if (!header) return null;
  const seconds = Number(header);
  if (!Number.isNaN(seconds) && seconds > 0 && seconds <= 30) {
    return seconds * 1000;
  }
  return null;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
