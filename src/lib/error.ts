export const API_SUCCESS_CODE = 0;
export const API_UNAUTHORIZED_CODE = 40100;
export const API_SYSTEM_ERROR_CODE = 50000;

type ApiErrorType = "business" | "auth" | "network" | "timeout" | "parse";

type ApiErrorOptions = {
  code?: number;
  type?: ApiErrorType;
  cause?: unknown;
};

export class ApiError extends Error {
  code?: number;
  type: ApiErrorType;
  cause?: unknown;

  constructor(message: string, options: ApiErrorOptions = {}) {
    super(message);
    this.name = "ApiError";
    this.code = options.code;
    this.type = options.type ?? "business";
    this.cause = options.cause;
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

export function isAuthError(error: unknown) {
  return isApiError(error) && error.code === API_UNAUTHORIZED_CODE;
}

export function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

export function logErrorInDev(error: unknown) {
  if (process.env.NODE_ENV !== "production") {
    console.error(error);
  }
}
