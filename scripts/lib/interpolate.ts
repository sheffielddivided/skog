import type { Observation } from "../../src/lib/types";

export type Anchor = { year: number; value: number };

/**
 * Lager en tett årlig serie fra glisne ankerpunkter ved lineær interpolasjon.
 * Ankerår merkes `measured`, mellomliggende år `interpolated`. Ingen
 * ekstrapolasjon utenfor ankerintervallet.
 */
export function interpolateAnnual(
  anchors: Anchor[],
  quality: Observation["quality"] = "measured",
): { year: number; value: number; quality: Observation["quality"] }[] {
  const sorted = [...anchors].sort((a, b) => a.year - b.year);
  if (sorted.length === 0) return [];

  const first = sorted[0].year;
  const last = sorted[sorted.length - 1].year;
  const anchorYears = new Set(sorted.map((a) => a.year));
  const out: { year: number; value: number; quality: Observation["quality"] }[] = [];

  let segment = 0;
  for (let year = first; year <= last; year++) {
    // Finn segmentet [a, b] som året faller i.
    while (segment < sorted.length - 2 && year > sorted[segment + 1].year) {
      segment++;
    }
    const a = sorted[segment];
    const b = sorted[Math.min(segment + 1, sorted.length - 1)];

    let value: number;
    if (a.year === b.year) {
      value = a.value;
    } else {
      const t = (year - a.year) / (b.year - a.year);
      value = a.value + t * (b.value - a.value);
    }

    out.push({
      year,
      value: round(value),
      quality: anchorYears.has(year) ? quality : "interpolated",
    });
  }
  return out;
}

/** Interpolerer et sett med {år: verdi}-punkter (FRA-referanseår). */
export function interpolatePoints(
  points: Record<number, number>,
  quality: Observation["quality"] = "measured",
) {
  const anchors: Anchor[] = Object.entries(points).map(([year, value]) => ({
    year: Number(year),
    value,
  }));
  return interpolateAnnual(anchors, quality);
}

function round(v: number): number {
  return Math.round(v * 100) / 100;
}
