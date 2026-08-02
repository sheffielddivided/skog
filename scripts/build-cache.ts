/**
 * Data Import Service → JSON Cache.
 *
 * Bygger hurtigbufferet under data/cache/ fra de kuraterte seed-dataene.
 * I produksjon kjøres scripts/import/index.ts først (henter ferske tall fra
 * SSB/FAO/GCP og oppdaterer seed-laget); deretter kjøres dette skriptet for å
 * generere den normaliserte, klient-vennlige hurtigbufferen.
 *
 * Kjør: npm run data:build
 */
import { mkdir, writeFile, rm, readFile } from "node:fs/promises";
import { join } from "node:path";

import { sources } from "../data/seed/sources";
import { metrics } from "../data/seed/metrics";
import { norwayAnchors } from "../data/seed/norway";
import { globalAnchors } from "../data/seed/global";
import { europeFra } from "../data/seed/europe";
import { worldForestArea } from "../data/seed/world";
import { interpolateAnnual, interpolatePoints } from "./lib/interpolate";
import { buildCountries } from "./lib/countries";
import type { Series } from "../src/lib/types";

const countries = buildCountries();

const CACHE_DIR = join(process.cwd(), "data", "cache");
const SERIES_DIR = join(CACHE_DIR, "series");

type BuiltSeries = Pick<Series, "countryId" | "metricId" | "points">;

function build(): BuiltSeries[] {
  const series: BuiltSeries[] = [];

  // 1) Norge – lange nasjonale serier fra Landsskogtakseringen.
  for (const [metricId, anchors] of Object.entries(norwayAnchors)) {
    series.push({ countryId: "NOR", metricId, points: interpolateAnnual(anchors) });
  }

  // 2) Global klimakontekst – atmosfærisk CO₂.
  for (const [metricId, anchors] of Object.entries(globalAnchors)) {
    series.push({ countryId: "GLB", metricId, points: interpolateAnnual(anchors) });
  }

  // 3) Europa – FRA-referanseår per land (Norge håndteres av #1).
  for (const [metricId, byCountry] of Object.entries(europeFra)) {
    for (const [countryId, points] of Object.entries(byCountry)) {
      if (countryId === "NOR") continue;
      series.push({ countryId, metricId, points: interpolatePoints(points) });
    }
  }

  // 4) Verden – skogareal for store skogland utenfor Europa (FRA 2020).
  for (const [countryId, points] of Object.entries(worldForestArea)) {
    series.push({ countryId, metricId: "forest_area", points: interpolatePoints(points) });
  }

  return series;
}

function seriesKey(countryId: string, metricId: string) {
  return `${countryId}__${metricId}`;
}

/**
 * Fletter inn live-serier fra importtjenesten (data/cache/live/series.json)
 * hvis de finnes – de overstyrer seed-serier med samme land×indikator.
 */
async function mergeLive(seed: BuiltSeries[]): Promise<BuiltSeries[]> {
  try {
    const raw = await readFile(join(CACHE_DIR, "live", "series.json"), "utf8");
    const live = JSON.parse(raw) as BuiltSeries[];
    if (!Array.isArray(live) || live.length === 0) return seed;
    const byKey = new Map(seed.map((s) => [seriesKey(s.countryId, s.metricId), s]));
    for (const s of live) byKey.set(seriesKey(s.countryId, s.metricId), s);
    console.log(`  ↳ flettet inn ${live.length} live-serier fra importtjenesten`);
    return [...byKey.values()];
  } catch {
    return seed; // ingen live-data – bruk seed
  }
}

async function main() {
  const series = await mergeLive(build());

  await rm(SERIES_DIR, { recursive: true, force: true });
  await mkdir(SERIES_DIR, { recursive: true });

  // Per-serie-filer (transparens + rå nedlasting).
  for (const s of series) {
    await writeFile(
      join(SERIES_DIR, `${seriesKey(s.countryId, s.metricId)}.json`),
      JSON.stringify(s),
    );
  }

  const index = series.map((s) => ({
    countryId: s.countryId,
    metricId: s.metricId,
    minYear: s.points.length ? s.points[0].year : null,
    maxYear: s.points.length ? s.points[s.points.length - 1].year : null,
    count: s.points.length,
  }));

  const meta = {
    generatedAt: new Date().toISOString(),
    method:
      "Seed-kuraterte publiserte tall fra SSB/NIBIO (Landsskogtakseringen), FAO FRA 2020 og Global Carbon Project. Årlige verdier mellom takst-/rapporteringsår er lineært interpolert.",
    seriesCount: series.length,
    observationCount: series.reduce((n, s) => n + s.points.length, 0),
  };

  // Konsolidert datasett (rask enkelt-lesning i runtime).
  const dataset = { meta, sources, countries, metrics, series, index };

  await writeFile(join(CACHE_DIR, "dataset.json"), JSON.stringify(dataset));
  await writeFile(join(CACHE_DIR, "countries.json"), JSON.stringify(countries, null, 2));
  await writeFile(join(CACHE_DIR, "metrics.json"), JSON.stringify(metrics, null, 2));
  await writeFile(join(CACHE_DIR, "sources.json"), JSON.stringify(sources, null, 2));
  await writeFile(join(CACHE_DIR, "index.json"), JSON.stringify({ meta, index }, null, 2));

  console.log(
    `✓ Hurtigbuffer bygget: ${series.length} serier, ${meta.observationCount} observasjoner → data/cache/`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
