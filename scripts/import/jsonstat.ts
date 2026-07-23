/**
 * Minimal JSON-stat2-parser for SSB StatBank-svar.
 *
 * Trekker ut en tidsserie langs tidsdimensjonen mens alle andre dimensjoner
 * låses til en valgt kategori. JSON-stat2 lagrer `value` i rad-hovedrekkefølge
 * over dimensjonene i `id`, med størrelser i `size`.
 */
export interface JsonStat2 {
  id: string[];
  size: number[];
  dimension: Record<
    string,
    { category: { index: Record<string, number> | string[]; label?: Record<string, string> } }
  >;
  value: (number | null)[];
}

function indexMap(index: Record<string, number> | string[]): Record<string, number> {
  if (Array.isArray(index)) {
    const m: Record<string, number> = {};
    index.forEach((k, i) => (m[k] = i));
    return m;
  }
  return index;
}

/**
 * @param timeDim   navnet på tidsdimensjonen (ofte "Tid")
 * @param fixed     map dim -> kategorinøkkel som skal låses
 */
export function extractSeries(
  data: JsonStat2,
  timeDim: string,
  fixed: Record<string, string>,
): { year: number; value: number }[] {
  const { id, size, value } = data;
  const strides = new Array(id.length).fill(1);
  for (let i = id.length - 2; i >= 0; i--) strides[i] = strides[i + 1] * size[i + 1];

  const timeIdx = id.indexOf(timeDim);
  if (timeIdx < 0) throw new Error(`Fant ikke tidsdimensjon «${timeDim}»`);
  const timeCats = indexMap(data.dimension[timeDim].category.index);
  const timeKeys = Object.entries(timeCats)
    .sort((a, b) => a[1] - b[1])
    .map(([k]) => k);

  // Basisoffset fra de låste dimensjonene.
  let base = 0;
  for (let d = 0; d < id.length; d++) {
    if (d === timeIdx) continue;
    const dim = id[d];
    const cats = indexMap(data.dimension[dim].category.index);
    const key = fixed[dim];
    const pos = key !== undefined ? cats[key] : 0; // default: første kategori
    base += pos * strides[d];
  }

  const out: { year: number; value: number }[] = [];
  for (const key of timeKeys) {
    const offset = base + timeCats[key] * strides[timeIdx];
    const v = value[offset];
    const year = Number(String(key).slice(0, 4));
    if (v !== null && v !== undefined && Number.isFinite(year)) {
      out.push({ year, value: v });
    }
  }
  return out.sort((a, b) => a.year - b.year);
}
