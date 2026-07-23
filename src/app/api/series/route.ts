import { NextResponse } from "next/server";
import { getSeries, resolveCountryId, resolveMetricId } from "@/lib/data";

/**
 * GET /api/series?country=Norway&metric=growing_stock
 *
 * Returnerer tidsserien som [{ year, value, quality }].
 * Med ?meta=1 pakkes serien inn med kilde- og definisjonsmetadata.
 */
export function GET(req: Request) {
  const url = new URL(req.url);
  const countryParam = url.searchParams.get("country");
  const metricParam = url.searchParams.get("metric");
  const withMeta = url.searchParams.get("meta") === "1";

  if (!countryParam || !metricParam) {
    return NextResponse.json(
      { error: "Mangler parameter. Bruk ?country=Norway&metric=growing_stock" },
      { status: 400 },
    );
  }

  const countryId = resolveCountryId(countryParam);
  const metricId = resolveMetricId(metricParam);
  if (!countryId || !metricId) {
    return NextResponse.json(
      { error: `Ukjent ${!countryId ? "land" : "indikator"}.` },
      { status: 404 },
    );
  }

  const series = getSeries(countryId, metricId);
  if (!series) {
    return NextResponse.json(
      { error: `Ingen data for ${countryId} / ${metricId}.` },
      { status: 404 },
    );
  }

  const body = withMeta
    ? series
    : series.points.map((p) => ({ year: p.year, value: p.value, quality: p.quality }));

  return NextResponse.json(body, {
    headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=86400" },
  });
}
