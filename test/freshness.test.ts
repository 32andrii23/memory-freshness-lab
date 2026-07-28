import { describe, expect, it } from "vitest";
import { activeFactsAt, evaluateFreshness, type FactVersion } from "../src/index.js";

const timeline: FactVersion[] = [
  { id: "plan-free", key: "plan", value: "free", validFrom: "2026-01-01T00:00:00Z", validTo: "2026-02-01T00:00:00Z", source: "event:1" },
  { id: "plan-pro", key: "plan", value: "pro", validFrom: "2026-02-01T00:00:00Z", source: "event:2" },
  { id: "region-eu", key: "region", value: "eu", validFrom: "2026-01-01T00:00:00Z", source: "event:3" },
];

describe("memory freshness evaluation", () => {
  it("selects the fact version active at observation time", () => {
    expect(activeFactsAt(timeline, "2026-02-15T00:00:00Z").map(({ id }) => id).sort()).toEqual(["plan-pro", "region-eu"]);
  });

  it("measures stale leakage and missing current facts", () => {
    const report = evaluateFreshness(timeline, [
      { id: "after-upgrade", observedAt: "2026-02-15T00:00:00Z", returnedFactIds: ["plan-free", "region-eu"] },
    ]);
    expect(report.cases[0]?.staleFactIds).toEqual(["plan-free"]);
    expect(report.cases[0]?.missingFactIds).toEqual(["plan-pro"]);
    expect(report.summary.staleLeakRate).toBe(0.5);
  });
});
