import { describe, it, expect, beforeEach } from "vitest";
import { useShipmentWizard, useAuthStore, useTrackingStore } from "@/lib/stores";

describe("useShipmentWizard", () => {
  beforeEach(() => {
    useShipmentWizard.getState().reset();
  });

  it("starts at step 0 with empty data", () => {
    const state = useShipmentWizard.getState();
    expect(state.step).toBe(0);
    expect(state.data.type).toBe("");
    expect(state.data.legs).toHaveLength(1);
  });

  it("sets step", () => {
    useShipmentWizard.getState().setStep(2);
    expect(useShipmentWizard.getState().step).toBe(2);
  });

  it("updates data partially", () => {
    useShipmentWizard.getState().updateData({ type: "mudanza", weight: "heavy" });
    const state = useShipmentWizard.getState();
    expect(state.data.type).toBe("mudanza");
    expect(state.data.weight).toBe("heavy");
    expect(state.data.description).toBe(""); // unchanged
  });

  it("adds a leg with from = previous to", () => {
    useShipmentWizard.getState().updateLeg(0, "to", "Avellaneda", { lat: -34.66, lng: -58.37 });
    useShipmentWizard.getState().addLeg();
    const state = useShipmentWizard.getState();
    expect(state.data.legs).toHaveLength(2);
    expect(state.data.legs[1].from).toBe("Avellaneda");
    expect(state.data.legs[1].fromCoords?.lat).toBe(-34.66);
  });

  it("removes a leg (keeps minimum 1)", () => {
    useShipmentWizard.getState().addLeg();
    useShipmentWizard.getState().addLeg();
    expect(useShipmentWizard.getState().data.legs).toHaveLength(3);
    useShipmentWizard.getState().removeLeg(2);
    expect(useShipmentWizard.getState().data.legs).toHaveLength(2);
  });

  it("cascades to change to next leg from", () => {
    useShipmentWizard.getState().addLeg();
    useShipmentWizard.getState().updateLeg(0, "to", "Quilmes", { lat: -34.72, lng: -58.25 });
    expect(useShipmentWizard.getState().data.legs[1].from).toBe("Quilmes");
  });

  it("resets to initial state", () => {
    useShipmentWizard.getState().setStep(3);
    useShipmentWizard.getState().updateData({ type: "materiales" });
    useShipmentWizard.getState().reset();
    const state = useShipmentWizard.getState();
    expect(state.step).toBe(0);
    expect(state.data.type).toBe("");
  });
});

describe("useAuthStore", () => {
  it("starts with null user and loading true", () => {
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.loading).toBe(true);
  });

  it("sets user and stops loading", () => {
    useAuthStore.getState().setUser({ id: "1", email: "test@test.com", name: "Test", role: "client" });
    const state = useAuthStore.getState();
    expect(state.user?.email).toBe("test@test.com");
    expect(state.loading).toBe(false);
  });

  it("logout clears user", () => {
    useAuthStore.getState().setUser({ id: "1", email: "test@test.com", name: "Test", role: "client" });
    useAuthStore.getState().logout();
    expect(useAuthStore.getState().user).toBeNull();
  });
});

describe("useTrackingStore", () => {
  it("starts empty", () => {
    const state = useTrackingStore.getState();
    expect(state.shipmentId).toBeNull();
    expect(state.driverPosition).toBeNull();
  });

  it("updates position", () => {
    useTrackingStore.getState().updatePosition({ lat: -34.60, lng: -58.40 });
    expect(useTrackingStore.getState().driverPosition?.lat).toBe(-34.60);
  });

  it("clears everything", () => {
    useTrackingStore.getState().setShipmentId("abc");
    useTrackingStore.getState().updatePosition({ lat: -34.60, lng: -58.40 });
    useTrackingStore.getState().clear();
    expect(useTrackingStore.getState().shipmentId).toBeNull();
    expect(useTrackingStore.getState().driverPosition).toBeNull();
  });
});
