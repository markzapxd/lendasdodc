declare const __brand: unique symbol;

type Brand<T, B extends string> = T & { readonly [__brand]: B };

export type CardId = Brand<string, "CardId">;
export type MessageId = Brand<string, "MessageId">;
export type SessionId = Brand<string, "SessionId">;
export type QueueItemId = Brand<string, "QueueItemId">;
export type ReportId = Brand<string, "ReportId">;
export type AdminId = Brand<string, "AdminId">;

export function asCardId(id: string): CardId {
  return id as CardId;
}

export function asMessageId(id: string): MessageId {
  return id as MessageId;
}

export function asSessionId(id: string): SessionId {
  return id as SessionId;
}

export function asQueueItemId(id: string): QueueItemId {
  return id as QueueItemId;
}

export function asReportId(id: string): ReportId {
  return id as ReportId;
}

export function asAdminId(id: string): AdminId {
  return id as AdminId;
}

export function isValidId(id: string): boolean {
  return /^[0-9a-f-]{36}$/i.test(id);
}
