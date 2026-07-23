/**
 * FAO FRA-importør (Europa).
 *
 * FRA publiserer skogareal, stående volum, biomasse og karbon per land for
 * referanseårene 1990/2000/2010/2015/2020. FRA-plattformen tilbyr nedlastbare
 * datasett (CSV/JSON) per indikator. Endepunktet settes i FRA_ENDPOINT og bør
 * verifiseres ved første kjøring.
 *
 * Kjøres i miljø med utgående nett. I sandkassen er FAO blokkert; seed-laget
 * (FRA 2020-tall) brukes i stedet.
 */
import type { LiveSeries } from "./types";

// Peker mot FRAs åpne datatjeneste. Justér ved behov.
const FRA_ENDPOINT = "https://fra-data.fao.org/api";

// FRA-indikator → intern metric-id.
const METRIC_MAP: Record<string, string> = {
  forest_area: "forest_area",
  growing_stock: "standing_volume",
  aboveground_biomass: "biomass_per_ha",
  carbon_stock: "carbon_stock",
};

export async function importFao(): Promise<LiveSeries[]> {
  try {
    const res = await fetch(`${FRA_ENDPOINT}/assessments/fra/2020/download`, {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const rows = (await res.json()) as {
      iso3: string;
      indicator: string;
      year: number;
      value: number;
    }[];

    const byKey = new Map<string, LiveSeries>();
    for (const r of rows) {
      const metricId = METRIC_MAP[r.indicator];
      if (!metricId || r.value == null) continue;
      const key = `${r.iso3}__${metricId}`;
      if (!byKey.has(key)) byKey.set(key, { countryId: r.iso3, metricId, points: [] });
      byKey.get(key)!.points.push({ year: r.year, value: r.value, quality: "measured" });
    }

    const out = [...byKey.values()].map((s) => ({
      ...s,
      points: s.points.sort((a, b) => a.year - b.year),
    }));
    console.log(`  ✓ FAO FRA → ${out.length} land×indikator-serier`);
    return out;
  } catch (err) {
    console.warn(`  ⚠ FAO FRA feilet: ${(err as Error).message} – beholder seed.`);
    return [];
  }
}
