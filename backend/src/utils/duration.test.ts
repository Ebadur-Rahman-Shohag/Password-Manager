import { describe, it, expect } from "vitest";
import { parseDurationToMs } from "../utils/duration";

describe("parseDurationToMs", () => {
  it("parses day, hour, minute, and second durations", () => {
    expect(parseDurationToMs("1d")).toBe(24 * 60 * 60 * 1000);
    expect(parseDurationToMs("6h")).toBe(6 * 60 * 60 * 1000);
    expect(parseDurationToMs("30m")).toBe(30 * 60 * 1000);
    expect(parseDurationToMs("45s")).toBe(45 * 1000);
  });

  it("defaults to 1 day for invalid input", () => {
    expect(parseDurationToMs("invalid")).toBe(24 * 60 * 60 * 1000);
  });
});
