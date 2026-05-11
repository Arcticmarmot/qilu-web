const TOKEN_KEY = "qilu_token";

export const AUTH_INVALID_EVENT = "qilu:auth-invalid";
export const AUTH_TOKEN_CHANGED_EVENT = "qilu:auth-token-changed";

export type AuthInvalidDetail = {
  message: string;
};

export type AuthTokenChangedDetail = {
  token: string | null;
};

function notifyTokenChanged(token: string | null) {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent<AuthTokenChangedDetail>(AUTH_TOKEN_CHANGED_EVENT, {
      detail: { token },
    }),
  );
}

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
  notifyTokenChanged(token);
}

export function clearToken() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(TOKEN_KEY);
  notifyTokenChanged(null);
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
