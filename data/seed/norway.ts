/**
 * Norske ankerpunkter fra Landsskogtakseringen (SSB/NIBIO).
 *
 * Landsskogtakseringen måler i rullerende femårssykluser, så vi lagrer de
 * publiserte punktene og lar build-cache-skriptet interpolere årlige verdier
 * mellom dem (merket `interpolated`). Ankerår merkes `measured`.
 *
 * Tallene følger den publiserte utviklingen: stående volum er nær tredoblet
 * siden 1920-tallet, mens avvirkningen har ligget langt under tilveksten –
 * derfor vokser volum, biomasse og karbonlager.
 */
export type Anchor = { year: number; value: number };

export const norwayAnchors: Record<string, Anchor[]> = {
  standing_volume: [
    { year: 1925, value: 313 },
    { year: 1933, value: 331 },
    { year: 1957, value: 382 },
    { year: 1967, value: 425 },
    { year: 1980, value: 505 },
    { year: 1990, value: 590 },
    { year: 2000, value: 700 },
    { year: 2010, value: 840 },
    { year: 2015, value: 900 },
    { year: 2020, value: 942 },
    { year: 2024, value: 968 },
  ],
  annual_increment: [
    { year: 1930, value: 11.0 },
    { year: 1960, value: 14.0 },
    { year: 1980, value: 17.5 },
    { year: 1990, value: 19.6 },
    { year: 2000, value: 22.6 },
    { year: 2010, value: 24.6 },
    { year: 2020, value: 25.5 },
    { year: 2024, value: 25.8 },
  ],
  harvest: [
    { year: 1930, value: 10.5 },
    { year: 1950, value: 11.2 },
    { year: 1970, value: 10.1 },
    { year: 1990, value: 11.0 },
    { year: 2000, value: 8.6 },
    { year: 2010, value: 9.8 },
    { year: 2015, value: 10.4 },
    { year: 2020, value: 11.0 },
    { year: 2024, value: 11.6 },
  ],
  carbon_stock: [
    { year: 1925, value: 500 },
    { year: 1957, value: 610 },
    { year: 1980, value: 810 },
    { year: 1990, value: 945 },
    { year: 2000, value: 1120 },
    { year: 2010, value: 1345 },
    { year: 2020, value: 1505 },
    { year: 2024, value: 1548 },
  ],
  biomass_per_ha: [
    { year: 1990, value: 55 },
    { year: 2000, value: 64 },
    { year: 2010, value: 73 },
    { year: 2015, value: 78 },
    { year: 2020, value: 80 },
    { year: 2024, value: 82 },
  ],
  forest_area: [
    { year: 1990, value: 12132 },
    { year: 2000, value: 12150 },
    { year: 2010, value: 12167 },
    { year: 2020, value: 12180 },
    { year: 2024, value: 12190 },
  ],
};
