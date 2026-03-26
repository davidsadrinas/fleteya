import { describe, expect, it } from "vitest";
import {
  driverRowMissing,
  profileMissingBasics,
  shouldRedirectToOnboarding,
} from "@/lib/onboarding/status";

describe("onboarding status", () => {
  it("profileMissingBasics is true without phone", () => {
    expect(profileMissingBasics({ phone: null, role: "client" })).toBe(true);
    expect(profileMissingBasics({ phone: "   ", role: "client" })).toBe(true);
  });

  it("profileMissingBasics is false with phone", () => {
    expect(profileMissingBasics({ phone: "1144556677", role: "client" })).toBe(
      false
    );
  });

  it("driverRowMissing when role driver and no row", () => {
    expect(driverRowMissing("driver", null)).toBe(true);
    expect(driverRowMissing("driver", undefined)).toBe(true);
    expect(driverRowMissing("driver", "d1")).toBe(false);
    expect(driverRowMissing("client", null)).toBe(false);
  });

  it("shouldRedirectToOnboarding combines checks", () => {
    expect(
      shouldRedirectToOnboarding({ phone: "", role: "client" }, null)
    ).toBe(true);
    expect(
      shouldRedirectToOnboarding({ phone: "11", role: "driver" }, null)
    ).toBe(true);
    expect(
      shouldRedirectToOnboarding({ phone: "11", role: "driver" }, "drv")
    ).toBe(false);
    expect(
      shouldRedirectToOnboarding({ phone: "11", role: "client" }, null)
    ).toBe(false);
  });
});
