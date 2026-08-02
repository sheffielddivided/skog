import type { LiveSeries } from "./types";

/**
 * Enkel validering av importerte serier før de skrives til hurtigbufferet.
 * Fjerner ugyldige punkter og forkaster serier som ser urimelige ut, slik at
 * en feil i en kilde ikke ødelegger nettsiden.
 */
export function validate(series: LiveSeries[]): { ok: LiveSeries[]; warnings: string[] } {
  const warnings: string[] = [];
  const ok: LiveSeries[] = [];

  for (const s of series) {
    // Netto CO₂-flux kan være negativ (karbonsluk); andre indikatorer ikke.
    const allowNegative = s.metricId === "forest_co2_net";
    const points = s.points
      .filter((p) => Number.isFinite(p.year) && Number.isFinite(p.value))
      .filter((p) => p.year >= 1800 && p.year <= new Date().getFullYear() + 1)
      .filter((p) => allowNegative || p.value >= 0)
      .sort((a, b) => a.year - b.year);

    if (points.length < 2) {
      warnings.push(`${s.countryId}/${s.metricId}: for få gyldige punkter – hoppet over.`);
      continue;
    }

    // Fjern duplikat-år (behold siste).
    const byYear = new Map(points.map((p) => [p.year, p]));
    ok.push({ ...s, points: [...byYear.values()].sort((a, b) => a.year - b.year) });
  }

  return { ok, warnings };
}
