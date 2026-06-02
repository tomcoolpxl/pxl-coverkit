export interface KeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

const memoryFallback = new Map<string, string>();

function hasLocalStorage(): boolean {
  try {
    return typeof globalThis !== 'undefined' && typeof globalThis.localStorage !== 'undefined';
  } catch {
    return false;
  }
}

export const localStorageAdapter: KeyValueStorage = {
  getItem(key) {
    if (hasLocalStorage()) {
      try {
        return globalThis.localStorage.getItem(key);
      } catch {
        /* fall through */
      }
    }
    return memoryFallback.get(key) ?? null;
  },
  setItem(key, value) {
    if (hasLocalStorage()) {
      try {
        globalThis.localStorage.setItem(key, value);
        return;
      } catch {
        /* fall through */
      }
    }
    memoryFallback.set(key, value);
  },
  removeItem(key) {
    if (hasLocalStorage()) {
      try {
        globalThis.localStorage.removeItem(key);
        return;
      } catch {
        /* fall through */
      }
    }
    memoryFallback.delete(key);
  },
};
