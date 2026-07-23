/** Norsk tallformatering, delt mellom server og klient. */

const nf0 = new Intl.NumberFormat("nb-NO", { maximumFractionDigits: 0 });
const nf1 = new Intl.NumberFormat("nb-NO", { maximumFractionDigits: 1 });

export function fmt(value: number, decimals = 0): string {
  return (decimals >= 1 ? nf1 : nf0).format(value);
}

export function fmtWithUnit(value: number, unit: string, decimals = 0): string {
  return `${fmt(value, decimals)} ${unit}`;
}

/** "1950–2024" e.l. */
export function yearRange(min: number, max: number): string {
  return `${min}–${max}`;
}

export function fmtDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("nb-NO", { dateStyle: "long" }).format(new Date(iso));
  } catch {
    return iso;
  }
}

/** Prosentvis endring mellom to verdier, formatert med fortegn. */
export function pctChange(from: number, to: number): string {
  if (from === 0) return "–";
  const pct = ((to - from) / from) * 100;
  const sign = pct > 0 ? "+" : "";
  return `${sign}${fmt(pct, Math.abs(pct) < 10 ? 1 : 0)} %`;
}

/** Multiplikator, f.eks. 3,1× */
export function multiplier(from: number, to: number): string {
  if (from === 0) return "–";
  return `${fmt(to / from, 1)}×`;
}
