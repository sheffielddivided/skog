/**
 * Bygger et lettvekts GeoJSON for det europeiske kartet fra `world-atlas`
 * (Natural Earth 1:110m), helt uten eksterne nettkall. Filtreres til Europa og
 * merkes med ISO-3 slik at choropleth-kartet kan slå opp verdier per land.
 *
 * Kjør: npm run data:geo
 */
import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { createRequire } from "node:module";
import { feature } from "topojson-client";
import { countries as seedCountries } from "../data/seed/countries";

const require = createRequire(import.meta.url);
// eslint-disable-next-line @typescript-eslint/no-var-requires
const topo = require("world-atlas/countries-110m.json");

/** ISO 3166-1 numerisk → alpha-3 for europeiske land (+ naboer for kontekst). */
const NUM_TO_ISO3: Record<string, string> = {
  "578": "NOR", "752": "SWE", "246": "FIN", "208": "DNK", "276": "DEU",
  "250": "FRA", "616": "POL", "040": "AUT", "826": "GBR", "724": "ESP",
  "380": "ITA", "756": "CHE", "233": "EST", "428": "LVA", "642": "ROU",
  "372": "IRL", "528": "NLD", "056": "BEL", "620": "PRT", "203": "CZE",
  "703": "SVK", "348": "HUN", "705": "SVN", "191": "HRV", "440": "LTU",
  "112": "BLR", "804": "UKR", "100": "BGR", "300": "GRC", "688": "SRB",
  "070": "BIH", "352": "ISL", "442": "LUX", "008": "ALB", "807": "MKD",
  "499": "MNE", "498": "MDA", "674": "SMR",
};

const nameNoByIso3 = new Map(seedCountries.map((c) => [c.id, c.nameNo]));

async function main() {
  const fc = feature(topo, topo.objects.countries) as unknown as GeoJSON.FeatureCollection;

  const features = fc.features
    .map((f) => {
      const num = String(f.id).padStart(3, "0");
      const iso3 = NUM_TO_ISO3[num];
      if (!iso3) return null;
      return {
        ...f,
        id: iso3,
        properties: {
          iso3,
          name: (f.properties as { name?: string })?.name ?? iso3,
          nameNo: nameNoByIso3.get(iso3),
        },
      };
    })
    .filter((f): f is NonNullable<typeof f> => f !== null);

  const out: GeoJSON.FeatureCollection = { type: "FeatureCollection", features };
  const path = join(process.cwd(), "data", "cache", "europe.geo.json");
  await writeFile(path, JSON.stringify(out));
  console.log(`✓ Europakart: ${features.length} land → data/cache/europe.geo.json`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
