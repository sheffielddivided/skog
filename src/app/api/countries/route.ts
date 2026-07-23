import { NextResponse } from "next/server";
import { getCountries } from "@/lib/data";

/** GET /api/countries[?includeGlobal=1] */
export function GET(req: Request) {
  const url = new URL(req.url);
  const includeGlobal = url.searchParams.get("includeGlobal") === "1";
  return NextResponse.json(getCountries({ includeGlobal }), {
    headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=86400" },
  });
}
