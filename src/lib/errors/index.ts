export type AppError =
  | { readonly type: "NOT_FOUND"; readonly resource: string }
  | { readonly type: "UNAUTHORIZED"; readonly reason: string }
  | { readonly type: "FORBIDDEN"; readonly reason: string }
  | { readonly type: "VALIDATION"; readonly field: string; readonly message: string }
  | { readonly type: "RATE_LIMITED"; readonly retryAfter: number }
  | { readonly type: "REDIS_UNAVAILABLE" }
  | { readonly type: "DATABASE_ERROR"; readonly code: string }
  | { readonly type: "EXTERNAL_SERVICE_ERROR"; readonly service: string; readonly code: string }
  | { readonly type: "INTERNAL_ERROR"; readonly message: string };

type ErrorType = AppError["type"];
type ErrorByType<T extends ErrorType> = Extract<AppError, { readonly type: T }>;

type ErrorArguments = {
  NOT_FOUND: [resource: string];
  UNAUTHORIZED: [reason: string];
  FORBIDDEN: [reason: string];
  VALIDATION: [field: string, message: string];
  RATE_LIMITED: [retryAfter: number];
  REDIS_UNAVAILABLE: [];
  DATABASE_ERROR: [code: string];
  EXTERNAL_SERVICE_ERROR: [service: string, code: string];
  INTERNAL_ERROR: [message: string];
};

type ErrorFactory = {
  [T in ErrorType]: (...args: ErrorArguments[T]) => ErrorByType<T>;
};

const errorFactories: ErrorFactory = {
  NOT_FOUND: (resource) => ({ type: "NOT_FOUND", resource }),
  UNAUTHORIZED: (reason) => ({ type: "UNAUTHORIZED", reason }),
  FORBIDDEN: (reason) => ({ type: "FORBIDDEN", reason }),
  VALIDATION: (field, message) => ({ type: "VALIDATION", field, message }),
  RATE_LIMITED: (retryAfter) => ({ type: "RATE_LIMITED", retryAfter }),
  REDIS_UNAVAILABLE: () => ({ type: "REDIS_UNAVAILABLE" }),
  DATABASE_ERROR: (code) => ({ type: "DATABASE_ERROR", code }),
  EXTERNAL_SERVICE_ERROR: (service, code) => ({ type: "EXTERNAL_SERVICE_ERROR", service, code }),
  INTERNAL_ERROR: (message) => ({ type: "INTERNAL_ERROR", message }),
};

export function createError<T extends ErrorType>(type: T, ...args: ErrorArguments[T]): AppError {
  return errorFactories[type](...args);
}

type UnknownRecord = { readonly type?: unknown; readonly [key: string]: unknown };

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null;
}

function hasStringProperty(value: UnknownRecord, key: string): boolean {
  return typeof value[key] === "string";
}

function hasFiniteNumberProperty(value: UnknownRecord, key: string): boolean {
  return typeof value[key] === "number" && Number.isFinite(value[key]);
}

export function isAppError(value: unknown): value is AppError {
  if (!isRecord(value) || typeof value.type !== "string") {
    return false;
  }

  switch (value.type) {
    case "NOT_FOUND":
      return hasStringProperty(value, "resource");
    case "UNAUTHORIZED":
    case "FORBIDDEN":
      return hasStringProperty(value, "reason");
    case "VALIDATION":
      return hasStringProperty(value, "field") && hasStringProperty(value, "message");
    case "RATE_LIMITED":
      return hasFiniteNumberProperty(value, "retryAfter");
    case "REDIS_UNAVAILABLE":
      return true;
    case "DATABASE_ERROR":
      return hasStringProperty(value, "code");
    case "EXTERNAL_SERVICE_ERROR":
      return hasStringProperty(value, "service") && hasStringProperty(value, "code");
    case "INTERNAL_ERROR":
      return hasStringProperty(value, "message");
    default:
      return false;
  }
}
