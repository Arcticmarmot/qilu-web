const TOKEN_KEY = "qilu_token";

export const AUTH_INVALID_EVENT = "qilu:auth-invalid";

export type AuthInvalidDetail = {
  message: string;
};

export function getToken() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(TOKEN_KEY);
}

export function notifyAuthInvalid(message: string) {
  clearToken();

  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent<AuthInvalidDetail>(AUTH_INVALID_EVENT, {
      detail: { message },
    }),
  );
}
