import { NextRequest, NextResponse } from "next/server";
import { runShipmentAssignment } from "@/lib/shipments/run-assignment";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * On-demand assignment: runs after postulations (or cron) using service role.
 * Auth: Bearer ASSIGNMENT_RUN_SECRET.
 */
export async function POST(req: NextRequest, context: RouteContext) {
  const { id: shipmentId } = await context.params;
  const secret = process.env.ASSIGNMENT_RUN_SECRET;
  const auth = req.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  let strategyOverride: string | undefined;
  try {
    const raw = await req.text();
    if (raw.trim()) {
      const body = JSON.parse(raw) as { strategyId?: string };
      if (typeof body.strategyId === "string") strategyOverride = body.strategyId;
    }
  } catch {
    strategyOverride = undefined;
  }

  const result = await runShipmentAssignment({
    shipmentId,
    strategyId: strategyOverride ?? process.env.ASSIGNMENT_STRATEGY_ID ?? null,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.data.error }, { status: result.data.status });
  }

  return NextResponse.json(result.data);
}
