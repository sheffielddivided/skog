/**
 * Global Carbon Project / NOAA GML – atmosfærisk CO₂.
 *
 * NOAA publiserer globale årlige CO₂-middelverdier som en enkel tekstfil.
 * Vi parser den og lager en årlig serie (ppm).
 *
 * Kjøres i miljø med utgående nett. Faller tilbake til seed ved feil.
 */
import type { LiveSeries } from "./types";

const NOAA_ANNUAL_MEAN =
  "https://gml.noaa.gov/webdata/ccgg/trends/co2/co2_annmean_gl.txt";

export async function importGcp(): Promise<LiveSeries[]> {
  try {
    const res = await fetch(NOAA_ANNUAL_MEAN);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();

    const points = text
      .split("\n")
      .filter((line) => line && !line.startsWith("#"))
      .map((line) => line.trim().split(/\s+/))
      .filter((cols) => cols.length >= 2)
      .map((cols) => ({ year: Number(cols[0]), value: Number(cols[1]), quality: "measured" as const }))
      .filter((p) => Number.isFinite(p.year) && Number.isFinite(p.value));

    if (points.length === 0) return [];
    console.log(`  ✓ NOAA/GCP → atmosfærisk CO₂ (${points.length} år)`);
    return [{ countryId: "GLB", metricId: "co2_atmospheric", points }];
  } catch (err) {
    console.warn(`  ⚠ GCP/NOAA feilet: ${(err as Error).message} – beholder seed.`);
    return [];
  }
}
