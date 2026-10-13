/**
 * web/src/lib/api/client.ts
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * DEMO TRANSPORT — replaces the production axios client.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * In the production app this module created an axios instance pointed at
 * `NEXT_PUBLIC_API_URL` (the private backend), attached a bearer token, and
 * refreshed expired access tokens against `POST /auth/refresh`.
 *
 * In this public demo the *exact same public helpers* are kept —
 * `apiGet` / `apiPost` / `apiPatch` / `apiDelete` plus the axios-shaped
 * `apiClient.get/post/patch/delete` that a few screens call directly — but the
 * request is answered locally by `@/lib/mock/router` instead of being sent
 * over the network.
 *
 * Guarantees:
 *   • no HTTP request is issued for any API route; there is no backend host,
 *     no token, and no refresh cookie involved
 *   • successful responses keep the production envelope
 *     `{ success: true, data, meta? }`, so callers are unchanged
 *   • failures are thrown as axios-shaped errors
 *     (`err.response.data.error.message`) so the existing error handling and
 *     `extractApiError()` keep working
 */

import { mockRequest, MockApiError, type Method, type MockEnvelope } from '@/lib/mock/router';

// ─── In-memory "session" ──────────────────────────────────────────────────────
// Kept for interface compatibility with the production client. The value is an
// opaque demo placeholder — it is never sent anywhere.

let _accessToken: string | null = null;

export const setInMemoryToken = (t: string | null) => { _accessToken = t; };
export const getInMemoryToken = () => _accessToken;

/** Production helper that cleared legacy localStorage tokens; no-op here. */
export const migrateAndClearLocalStorage = (): string | null => {
  if (typeof window === 'undefined') return null;
  try {
    localStorage.removeItem('wm_access');
    localStorage.removeItem('wm_refresh');
  } catch {
    /* storage unavailable — nothing to migrate in the demo */
  }
  return null;
};

// ─── Axios-shaped error ───────────────────────────────────────────────────────

class DemoApiError extends Error {
  response: {
    status: number;
    data: { success: false; error: { code: string; message: string; details?: unknown } };
  };

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = 'DemoApiError';
    this.response = { status, data: { success: false, error: { code, message, details } } };
  }
}

const toDemoError = (err: unknown): DemoApiError => {
  if (err instanceof MockApiError) {
    return new DemoApiError(err.status, err.code, err.message, err.details);
  }
  return new DemoApiError(
    500,
    'DEMO_CLIENT_ERROR',
    err instanceof Error ? err.message : 'حدث خطأ في طبقة العرض التجريبي',
  );
};

// ─── Core dispatch ───────────────────────────────────────────────────────────

const dispatch = async <T>(
  method: Method,
  url: string,
  body?: unknown,
  params?: Record<string, unknown>,
): Promise<MockEnvelope<T>> => {
  try {
    // The demo router answers with an untyped body, exactly like a real HTTP
    // response would; the calling service supplies the expected shape.
    const envelope = (await mockRequest(method, url, body, params)) as MockEnvelope<T>;
    return envelope;
  } catch (err) {
    throw toDemoError(err);
  }
};

// ─── Typed request helpers (unchanged signatures) ────────────────────────────

export const apiGet = async <T>(url: string, params?: Record<string, unknown>): Promise<T> => {
  const envelope = await dispatch<T>('GET', url, undefined, params);
  return envelope.data;
};

export const apiPost = async <T>(url: string, body?: unknown): Promise<T> => {
  const envelope = await dispatch<T>('POST', url, body);
  return envelope.data;
};

export const apiPatch = async <T>(url: string, body?: unknown): Promise<T> => {
  const envelope = await dispatch<T>('PATCH', url, body);
  return envelope.data;
};

export const apiDelete = async <T = void>(url: string): Promise<T> => {
  const envelope = await dispatch<T>('DELETE', url);
  return envelope.data;
};

// ─── Axios-shaped facade ─────────────────────────────────────────────────────
// Two screens (`/notifications`, `/profile`, `/create-event`) call the client
// directly and read `res.data.data`. Keeping this shape means those screens did
// not have to be touched during extraction.

interface AxiosLikeConfig {
  params?: Record<string, unknown>;
  headers?: Record<string, string>;
}

/**
 * Axios-shaped response. As with axios, `T` describes the *body* that the
 * caller expects in `res.data` — i.e. the production envelope
 * `{ success: true, data: <payload> }`, which is why callers read
 * `res.data.data`.
 */
interface AxiosLikeResponse<T> {
  data: T;
  status: number;
  headers: Record<string, string>;
}

const envelopeOf = <T>(value: unknown): T => value as T;

export const apiClient = {
  get: async <T>(url: string, config?: AxiosLikeConfig): Promise<AxiosLikeResponse<T>> => {
    const envelope = await dispatch<unknown>('GET', url, undefined, config?.params);
    return { data: envelopeOf<T>(envelope), status: 200, headers: {} };
  },
  post: async <T>(url: string, body?: unknown, _config?: AxiosLikeConfig): Promise<AxiosLikeResponse<T>> => {
    const envelope = await dispatch<unknown>('POST', url, body);
    return { data: envelopeOf<T>(envelope), status: 200, headers: {} };
  },
  patch: async <T>(url: string, body?: unknown, _config?: AxiosLikeConfig): Promise<AxiosLikeResponse<T>> => {
    const envelope = await dispatch<unknown>('PATCH', url, body);
    return { data: envelopeOf<T>(envelope), status: 200, headers: {} };
  },
  delete: async <T>(url: string, _config?: AxiosLikeConfig): Promise<AxiosLikeResponse<T>> => {
    const envelope = await dispatch<unknown>('DELETE', url);
    return { data: envelopeOf<T>(envelope), status: 200, headers: {} };
  },
  /** No-op: the demo has no request/response interceptors to install. */
  interceptors: {
    request: { use: () => 0, eject: () => undefined },
    response: { use: () => 0, eject: () => undefined },
  },
};

/** Legacy alias kept for components that import the client by this name. */
export const api = apiClient;

/** True when the app is running against the local demo data layer. */
export const IS_DEMO_TRANSPORT = true;
