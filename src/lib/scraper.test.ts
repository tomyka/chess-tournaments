import { describe, it, expect } from "vitest";
import { parseTimeControl, parseStatus } from "./scraper-utils";

describe("parseTimeControl", () => {
  it("parses Standard time control", () => {
    expect(parseTimeControl("St")).toBe("STANDARD");
  });

  it("parses Rapid time control", () => {
    expect(parseTimeControl("Rp")).toBe("RAPID");
  });

  it("parses Blitz time control", () => {
    expect(parseTimeControl("Bz")).toBe("BLITZ");
  });

  it("returns UNKNOWN for unrecognized codes", () => {
    expect(parseTimeControl("XX")).toBe("UNKNOWN");
    expect(parseTimeControl("")).toBe("UNKNOWN");
  });
});

describe("parseStatus", () => {
  it("returns FINISHED for non-empty last update", () => {
    expect(parseStatus("1 Hours 11 Min.")).toBe("FINISHED");
  });

  it("returns NOT_STARTED for empty last update", () => {
    expect(parseStatus("")).toBe("NOT_STARTED");
  });
});
