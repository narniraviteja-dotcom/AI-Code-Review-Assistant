const AUTH_STORAGE_KEY = "ai_code_review_auth";

const readStorage = (storage) => {
  if (!storage) return null;

  try {
    const rawValue = storage.getItem(AUTH_STORAGE_KEY);
    if (!rawValue) return null;
    return JSON.parse(rawValue);
  } catch (error) {
    storage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
};

export const getStoredAuth = () => {
  const localAuth = readStorage(window.localStorage);
  if (localAuth) return localAuth;

  const sessionAuth = readStorage(window.sessionStorage);
  if (sessionAuth) return sessionAuth;

  return null;
};

export const setStoredAuth = (auth) => {
  if (typeof window === "undefined") return;

  const serialized = JSON.stringify(auth);
  window.localStorage.setItem(AUTH_STORAGE_KEY, serialized);
  window.sessionStorage.setItem(AUTH_STORAGE_KEY, serialized);
};

export const clearStoredAuth = () => {
  if (typeof window === "undefined") return;

  window.localStorage.removeItem(AUTH_STORAGE_KEY);
  window.sessionStorage.removeItem(AUTH_STORAGE_KEY);
};

export const getCurrentUser = () => getStoredAuth()?.user || null;
export const getAuthToken = () => getStoredAuth()?.token || null;
