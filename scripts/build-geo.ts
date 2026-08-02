/**
 * Bygger et lettvekts verdenskart-GeoJSON fra `world-atlas` (Natural Earth
 * 1:110m), helt uten eksterne nettkall. Hvert land merkes med ISO-3, norsk navn
 * og verdensdel via det delte landregisteret, slik at choropleth-kartet kan slå
 * opp verdier og filtrere per verdensdel.
 *
 * Kjør: npm run data:geo
 */
import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { createRequire } from "node:module";
import { feature } from "topojson-client";
import { numericToCountry } from "./lib/countries";

const require = createRequire(import.meta.url);
// eslint-disable-next-line @typescript-eslint/no-var-requires
const topo = require("world-atlas/countries-110m.json");

// Antarktis utelates (stort, forvrenger projeksjonen, ingen skogdata her).
const EXCLUDE = new Set(["ATA"]);

async function main() {
  const numToCountry = numericToCountry();
  const fc = feature(topo, topo.objects.countries) as unknown as GeoJSON.FeatureCollection;

  const features = fc.features
    .map((f) => {
      const num = String(Number(f.id));
      const country = numToCountry.get(num);
      if (!country || EXCLUDE.has(country.id)) return null;
      return {
        ...f,
        id: country.id,
        properties: {
          iso3: country.id,
          name: country.name,
          nameNo: country.nameNo,
          region: country.region,
          subregion: country.subregion ?? null,
        },
      };
    })
    .filter((f): f is NonNullable<typeof f> => f !== null);

  const out: GeoJSON.FeatureCollection = { type: "FeatureCollection", features };
  const path = join(process.cwd(), "data", "cache", "world.geo.json");
  await writeFile(path, JSON.stringify(out));
  console.log(`✓ Verdenskart: ${features.length} land → data/cache/world.geo.json`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
