import { describe, expect, it } from "vitest";
import { DeterministicClock } from "../support/deterministic-clock";
import { RaceBarrier } from "../support/race-barrier";
import { testEnv } from "../support/test-env.mjs";

describe("test infrastructure", () => {
  it("testEnv generates unique RUN_ID", () => {
    expect(testEnv.RUN_ID).toBeTruthy();
    expect(typeof testEnv.RUN_ID).toBe("string");
    expect(testEnv.RUN_ID.length).toBeGreaterThan(0);
  });

  it("testEnv has isolation fields", () => {
    expect(testEnv.DB_SCHEMA).toContain("test_");
    expect(testEnv.REDIS_PREFIX).toContain("test:");
    expect(testEnv.EVIDENCE_DIR).toContain(".omo/evidence");
  });

  it("RaceBarrier coordinates concurrent waits", async () => {
    const barrier = new RaceBarrier();
    const results: number[] = [];

    const tasks = [
      barrier.wait("phase1", 3).then(() => results.push(1)),
      barrier.wait("phase1", 3).then(() => results.push(2)),
      barrier.wait("phase1", 3).then(() => results.push(3)),
    ];

    await Promise.all(tasks);
    expect(results).toHaveLength(3);
  });

  it("DeterministicClock freeze/advance works", () => {
    const clock = new DeterministicClock();
    clock.freeze(1000);
    expect(clock.now()).toBe(1000);
    clock.advance(500);
    expect(clock.now()).toBe(1500);
    clock.unfreeze();
    clock.reset();
  });
});
