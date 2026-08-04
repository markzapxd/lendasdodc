import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

const serverComponentPaths = [
  "src/components/system/empty-state.tsx",
  "src/components/system/error-state.tsx",
] as const;

describe("server component icon imports", () => {
  it("uses the context-free Phosphor SSR entrypoint", async () => {
    const sources = await Promise.all(serverComponentPaths.map((path) => readFile(path, "utf8")));

    expect(sources.every((source) => source.includes('from "@phosphor-icons/react/ssr"'))).toBe(
      true,
    );
    expect(
      sources.every(
        (source) => !/import\s+\{[^}]*\}\s+from "@phosphor-icons\/react";/.test(source),
      ),
    ).toBe(true);
  });
});
