/**
 * Returns a stable session ID for this browser.
 * Generated once with crypto.randomUUID() and persisted in localStorage.
 * Used as the Redis key suffix for cart persistence.
 */
export function getSessionId(): string {
  const STORAGE_KEY = 'shopsync_session';
  let id = localStorage.getItem(STORAGE_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(STORAGE_KEY, id);
  }
  return id;
}
