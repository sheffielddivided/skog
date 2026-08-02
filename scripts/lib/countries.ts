/**
 * Bygger et komplett landregister fra åpne referansepakker (helt offline):
 *   - world-countries  → ISO-koder (alpha-2/3, numerisk), verdensdel, underregion
 *   - i18n-iso-countries (nb) → norske landnavn
 *
 * Brukes av både build-cache (data) og build-geo (kart), slik at de alltid
 * bruker samme id-er og navn.
 */
import { createRequire } from "node:module";
import type { Country, Region } from "../../src/lib/types";

const require = createRequire(import.meta.url);
// eslint-disable-next-line @typescript-eslint/no-var-requires
const worldCountries = require("world-countries") as WcEntry[];
// eslint-disable-next-line @typescript-eslint/no-var-requires
const isoCountries = require("i18n-iso-countries");
isoCountries.registerLocale(require("i18n-iso-countries/langs/nb.json"));

interface WcEntry {
  cca2: string;
  cca3: string;
  ccn3: string;
  name: { common: string };
  region: string;
  subregion: string;
  independent: boolean | null;
}

const VALID_REGIONS = new Set<Region>([
  "Africa",
  "Americas",
  "Asia",
  "Europe",
  "Oceania",
  "Antarctic",
]);

function norwegianName(cca3: string, fallback: string): string {
  return isoCountries.getName(cca3, "nb") ?? fallback;
}

/** Fullt register (alle land) + den syntetiske «Verden»-oppføringen. */
export function buildCountries(): Country[] {
  const list: Country[] = worldCountries
    .filter((c) => c.cca3 && c.ccn3 && c.region)
    .map((c) => ({
      id: c.cca3,
      iso2: c.cca2,
      name: c.name.common,
      nameNo: norwegianName(c.cca3, c.name.common),
      region: (VALID_REGIONS.has(c.region as Region) ? c.region : "Africa") as Region,
      subregion: c.subregion || undefined,
    }))
    .sort((a, b) => a.nameNo.localeCompare(b.nameNo, "nb"));

  list.push({ id: "GLB", iso2: "XX", name: "World", nameNo: "Verden", region: "Global" });
  return list;
}

/** Oppslag numerisk ISO (ccn3, uten null-padding) → land, til kart-join. */
export function numericToCountry(): Map<string, Country> {
  const byIso3 = new Map(buildCountries().map((c) => [c.id, c]));
  const map = new Map<string, Country>();
  for (const c of worldCountries) {
    const country = byIso3.get(c.cca3);
    if (country) map.set(String(Number(c.ccn3)), country);
  }
  return map;
}
