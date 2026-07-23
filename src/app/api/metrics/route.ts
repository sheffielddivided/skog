import { NextResponse } from "next/server";
import { getMetrics } from "@/lib/data";

/** GET /api/metrics */
export function GET() {
  return NextResponse.json(getMetrics(), {
    headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=86400" },
  });
}
