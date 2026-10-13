/**
 * shared/src/utils/token-refresh.ts
 *
 * Generic queue-draining 401 token-refresh factory.
 *
 * Both the web (axios) and mobile (axios) API clients share the same queue
 * logic — only the concrete `refreshFn` and `onFailure` callbacks differ
 * between environments.
 *
 * Usage:
 *   const refreshQueue = createTokenRefreshQueue(
 *     async () => { ... fetch new tokens ...; return newAccessToken; },
 *     () => { ... handle logout / redirect ... },
 *   );
 *
 *   // In your axios 401 interceptor:
 *   return refreshQueue.enqueue(originalRequest, retryFn);
 */

export type RetryFn<T> = (newToken: string) => Promise<T>;

export interface TokenRefreshQueue {
  /**
   * Enqueue a failed request to be retried once a new access token is
   * obtained. If a refresh is already in progress the request waits in
   * the queue. If no refresh is in progress one is started immediately.
   */
  enqueue: <T>(retryFn: RetryFn<T>) => Promise<T>;
  /** Returns true while a refresh call is in-flight. */
  isRefreshing: () => boolean;
}

/**
 * Create a reusable token-refresh queue bound to the supplied callbacks.
 *
 * @param refreshFn   Async function that fetches new tokens and returns the
 *                    new access-token string. Should persist tokens to storage.
 * @param onFailure   Called when the refresh itself fails (e.g. redirect to
 *                    login, clear storage). Must be synchronous or fire-and-forget.
 */
export function createTokenRefreshQueue(
  refreshFn: () => Promise<string>,
  onFailure: (error: unknown) => void,
): TokenRefreshQueue {
  let _isRefreshing = false;
  let _queue: Array<{
    resolve: (token: string) => void;
    reject:  (err: unknown)  => void;
  }> = [];

  function drainQueue(token: string | null, error: unknown = null): void {
    _queue.forEach(({ resolve, reject }) =>
      token !== null ? resolve(token) : reject(error),
    );
    _queue = [];
  }

  return {
    isRefreshing: () => _isRefreshing,

    enqueue<T>(retryFn: RetryFn<T>): Promise<T> {
      if (_isRefreshing) {
        // A refresh is already in-flight — queue this retry
        return new Promise<T>((resolve, reject) => {
          _queue.push({
            resolve: (newToken) => resolve(retryFn(newToken)),
            reject,
          });
        });
      }

      // We are the first 401 — kick off the refresh
      _isRefreshing = true;

      return refreshFn()
        .then((newToken) => {
          drainQueue(newToken);
          return retryFn(newToken);
        })
        .catch((err) => {
          drainQueue(null, err);
          onFailure(err);
          return Promise.reject(err) as Promise<T>;
        })
        .finally(() => {
          _isRefreshing = false;
        });
    },
  };
}
