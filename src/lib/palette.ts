/**
 * Fargepalett – tilgjengelighet er et krav (WCAG AA, fargeblindvennlig).
 *
 * Kategoriske serier bruker Okabe–Ito-paletten, som er utformet for å være
 * distinkt for alle vanlige former for fargeblindhet. Sekvensielle kart bruker
 * en perceptuelt ordnet grønn skala.
 */

// Okabe–Ito (utelater ren gul som har svak kontrast mot papir).
export const CATEGORICAL = [
  "#0072B2", // blå
  "#D55E00", // vermillion
  "#009E73", // grønn
  "#CC79A7", // rosa
  "#56B4E9", // lyseblå
  "#E69F00", // oransje
  "#8256B0", // fiolett (tillegg)
  "#666666", // grå
] as const;

export function categorical(index: number): string {
  return CATEGORICAL[index % CATEGORICAL.length];
}

/** Sekvensiell grønn skala (lav → høy) for choropleth. */
export const SEQUENTIAL_GREEN = [
  "#eef5ee",
  "#d6e8d6",
  "#a9cfa9",
  "#75b075",
  "#4a934a",
  "#2f7d32",
  "#1c5220",
  "#0f2e13",
] as const;

/** Fast farge per hovedserie i avvirkning-vs-tilvekst-grafen. */
export const SERIES_COLORS = {
  increment: "#009E73",
  harvest: "#D55E00",
  volume: "#1c5220",
  carbon: "#0072B2",
} as const;
