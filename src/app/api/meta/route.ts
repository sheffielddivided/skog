import { NextResponse } from "next/server";
import { getMeta, getSources } from "@/lib/data";

/** GET /api/meta – datakvalitet: når hurtigbufferen ble bygget, metode, kilder. */
export function GET() {
  return NextResponse.json(
    { ...getMeta(), sources: getSources() },
    { headers: { "Cache-Control": "public, s-maxage=3600" } },
  );
}
