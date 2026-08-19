import { beforeEach, describe, expect, it } from "vitest";

describe("PublicExplorer sort persistence", () => {
  const store = new Map<string, string>();

  beforeEach(() => {
    store.clear();
    globalThis.localStorage = {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => store.set(key, value),
      removeItem: (key: string) => store.delete(key),
      clear: () => store.clear(),
      key: (index: number) => Array.from(store.keys())[index] ?? null,
      get length() {
        return store.size;
      },
    };
  });

  it("saves and retrieves sort preference from localStorage", () => {
    localStorage.setItem("explorer_sort_mode", "messages");
    expect(localStorage.getItem("explorer_sort_mode")).toBe("messages");

    localStorage.setItem("explorer_sort_mode", "name");
    expect(localStorage.getItem("explorer_sort_mode")).toBe("name");
  });
});
