import type { Anchor } from "./norway";

/**
 * Global atmosfærisk CO₂ (ppm) – Global Carbon Project / NOAA GML.
 * Brukes som klimakontekst på forsiden og i forklaringene. Årlige verdier
 * mellom ankerpunktene interpoleres i build-skriptet.
 */
export const globalAnchors: Record<string, Anchor[]> = {
  co2_atmospheric: [
    { year: 1960, value: 316.9 },
    { year: 1970, value: 325.7 },
    { year: 1980, value: 338.8 },
    { year: 1990, value: 354.4 },
    { year: 2000, value: 369.7 },
    { year: 2010, value: 389.9 },
    { year: 2015, value: 400.8 },
    { year: 2020, value: 414.2 },
    { year: 2024, value: 424.6 },
  ],
};
