import "server-only";

import dataset from "@data/cache/dataset.json";
import type { Country, DataSource, Metric, Series } from "./types";

/**
 * Serverside dataadgang. Leser den ferdigbygde hurtigbufferen
 * (data/cache/dataset.json) som genereres av `npm run data:build`.
 *
 * All datatilgang går gjennom dette laget – hverken klienten eller sidene
 * snakker direkte med SSB/FAO. Det matcher arkitekturen:
 *   Datasource → Import Service → JSON Cache → Next.js API → React.
 */

type RawSeries = { countryId: string; metricId: string; points: Series["points"] };
type Dataset = {
  meta: { generatedAt: string; method: string; seriesCount: number; observationCount: number };
  sources: DataSource[];
  countries: Country[];
  metrics: Metric[];
  series: RawSeries[];
};

const data = dataset as unknown as Dataset;

const countryById = new Map(data.countries.map((c) => [c.id, c]));
const metricById = new Map(data.metrics.map((m) => [m.id, m]));
const sourceById = new Map(data.sources.map((s) => [s.id, s]));
const seriesByKey = new Map(data.series.map((s) => [`${s.countryId}__${s.metricId}`, s]));

export function getMeta() {
  return data.meta;
}

export function getCountries(opts?: { includeGlobal?: boolean }): Country[] {
  const list = data.countries;
  if (opts?.includeGlobal) return list;
  return list.filter((c) => c.region !== "Global");
}

export function getCountry(id: string): Country | undefined {
  return countryById.get(id);
}

export function getMetrics(): Metric[] {
  return data.metrics;
}

export function getMetric(id: string): Metric | undefined {
  return metricById.get(id);
}

export function getSources(): DataSource[] {
  return data.sources;
}

export function getSource(id: string): DataSource | undefined {
  return sourceById.get(id);
}

/** Hel serie med metadata (metric, country, source) – klar for graf/CSV. */
export function getSeries(countryId: string, metricId: string): Series | null {
  const raw = seriesByKey.get(`${countryId}__${metricId}`);
  const metric = metricById.get(metricId);
  const country = countryById.get(countryId);
  if (!raw || !metric || !country) return null;
  const source = sourceById.get(metric.sourceId);
  if (!source) return null;
  return { countryId, metricId, points: raw.points, meta: { metric, country, source } };
}

/** Alle serier for én indikator (til kart og sammenlikning). */
export function getSeriesForMetric(metricId: string): Series[] {
  return data.series
    .filter((s) => s.metricId === metricId)
    .map((s) => getSeries(s.countryId, s.metricId))
    .filter((s): s is Series => s !== null);
}

/** Hvilke indikatorer et land har data for. */
export function getMetricsForCountry(countryId: string): Metric[] {
  const ids = new Set(
    data.series.filter((s) => s.countryId === countryId).map((s) => s.metricId),
  );
  return data.metrics.filter((m) => ids.has(m.id));
}

/** Løser opp et land fra id, ISO-2 eller navn (no/en), ufølsomt for store bokstaver. */
export function resolveCountryId(input: string): string | undefined {
  const q = input.trim().toLowerCase();
  const match = data.countries.find(
    (c) =>
      c.id.toLowerCase() === q ||
      c.iso2.toLowerCase() === q ||
      c.name.toLowerCase() === q ||
      c.nameNo.toLowerCase() === q,
  );
  return match?.id;
}

/** Løser opp en indikator fra id, navn eller vanlige aliaser. */
export function resolveMetricId(input: string): string | undefined {
  const q = input.trim().toLowerCase();
  const aliases: Record<string, string> = {
    growing_stock: "standing_volume",
    volume: "standing_volume",
    increment: "annual_increment",
    fellings: "harvest",
    carbon: "carbon_stock",
    biomass: "biomass_per_ha",
    area: "forest_area",
    co2: "co2_atmospheric",
  };
  if (aliases[q]) return aliases[q];
  const match = data.metrics.find(
    (m) => m.id.toLowerCase() === q || m.name.toLowerCase() === q || m.nameNo.toLowerCase() === q,
  );
  return match?.id;
}

/** Siste tilgjengelige verdi per land for én indikator – til choropleth-kart. */
export function getLatestByMetric(metricId: string): {
  countryId: string;
  year: number;
  value: number;
}[] {
  return getSeriesForMetric(metricId)
    .filter((s) => s.countryId !== "GLB" && s.points.length > 0)
    .map((s) => {
      const last = s.points[s.points.length - 1];
      return { countryId: s.countryId, year: last.year, value: last.value };
    });
}
