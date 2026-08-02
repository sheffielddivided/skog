/**
 * Data Import Service – orkestrator.
 *
 * Kjøres nattlig (cron) i et miljø med utgående nett:
 *   1) Hent ferske tall fra SSB, FAO og Global Carbon Project
 *   2) Valider og normaliser
 *   3) Skriv til data/cache/live/series.json
 *   4) `npm run data:build` fletter live-laget over seed og genererer bufferet
 *   5) Deploy
 *
 * Kjør alt: `npm run data:refresh`
 *
 * Merk: I denne sandkassen er SSB/FAO/NOAA blokkert av nettverkspolicyen, så
 * importørene faller pent tilbake og seed-laget brukes. På Vercel/CI henter de
 * ekte data.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

import { importSsb } from "./ssb";
import { importWorldBankForestArea } from "./worldbank";
import { importFaostat } from "./faostat";
import { importGcp } from "./gcp";
import { validate } from "./validate";
import type { LiveSeries } from "./types";

const LIVE_DIR = join(process.cwd(), "data", "cache", "live");

async function main() {
  console.log("→ Henter ferske data …");
  const results = await Promise.allSettled([
    importSsb(),
    importWorldBankForestArea(),
    importFaostat(),
    importGcp(),
  ]);

  const collected: LiveSeries[] = [];
  for (const r of results) {
    if (r.status === "fulfilled") collected.push(...r.value);
    else console.warn(`  ⚠ Importør feilet: ${r.reason}`);
  }

  const { ok, warnings } = validate(collected);
  warnings.forEach((w) => console.warn(`  ⚠ ${w}`));

  await mkdir(LIVE_DIR, { recursive: true });

  if (ok.length === 0) {
    console.log(
      "→ Ingen live-serier hentet (kilder utilgjengelige). Hurtigbufferet bygges fra seed.",
    );
    // Skriv en tom markør slik at build-cache vet at import ble forsøkt.
    await writeFile(
      join(LIVE_DIR, "meta.json"),
      JSON.stringify({ importedAt: new Date().toISOString(), seriesCount: 0, fellBackToSeed: true }, null, 2),
    );
    return;
  }

  await writeFile(join(LIVE_DIR, "series.json"), JSON.stringify(ok));
  await writeFile(
    join(LIVE_DIR, "meta.json"),
    JSON.stringify(
      { importedAt: new Date().toISOString(), seriesCount: ok.length, fellBackToSeed: false },
      null,
      2,
    ),
  );

  console.log(`✓ Import ferdig: ${ok.length} live-serier → data/cache/live/`);
  console.log("  Kjør «npm run data:build» for å flette inn og bygge hurtigbufferet.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
