/**
 * FAOSTAT-importør – global, offisiell FAO-datatjeneste.
 *
 * FAOSTAT er FAOs stabile, dokumenterte data-API og dekker alle land.
 *   - RL (Land Use): «Forest land», element «Area» → skogareal (1000 ha), årlig
 *   - GF (Forest land emissions): «Carbon stock in living biomass» → karbon
 *
 * Vekst/biomasse per hektar finnes bare i FRA (egen importør), ikke i FAOSTAT.
 *
 * Kjøres i miljø med utgående nett (GitHub Actions/Vercel). I sandkassen er
 * fao.org blokkert, så importøren logger og faller tilbake til seed.
 *
 * Importøren er bevisst selvdiagnostiserende: den logger HTTP-status, antall
 * rader og nøklene i første rad, slik at kode-/feltnavn kan verifiseres mot
 * CI-loggen og justeres uten å gjette blindt.
 */
import { createRequire } from "node:module";
import type { LiveSeries } from "./types";

const require = createRequire(import.meta.url);
const worldCountries = require("world-countries") as {
  cca3: string;
  ccn3: string;
  name: { common: string; official: string };
  altSpellings: string[];
}[];

const API = "https://faostatservices.fao.org/api/v1/en/data";

/** Slår opp FAOSTAT-land (M49-kode eller navn) → ISO-3. */
function makeAreaResolver() {
  const byM49 = new Map<string, string>();
  const byName = new Map<string, string>();
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z]/g, "");
  for (const c of worldCountries) {
    byM49.set(String(Number(c.ccn3)), c.cca3);
    byName.set(norm(c.name.common), c.cca3);
    byName.set(norm(c.name.official), c.cca3);
    for (const alt of c.altSpellings) byName.set(norm(alt), c.cca3);
  }
  return (row: Record<string, unknown>): string | undefined => {
    // Prøv alle felt som kan inneholde en M49-kode.
    for (const key of ["Area Code (M49)", "Area Code", "AreaCode"]) {
      const raw = row[key];
      if (raw != null) {
        const m49 = String(raw).replace(/\D/g, "");
        if (m49 && byM49.has(String(Number(m49)))) return byM49.get(String(Number(m49)));
      }
    }
    const name = row["Area"] ?? row["AreaName"];
    if (typeof name === "string") return byName.get(norm(name));
    return undefined;
  };
}

interface FaostatJob {
  domain: string;
  element: string;
  item: string;
  metricId: string;
  /** Valgfri transform av verdien (f.eks. C → CO₂-ekv). */
  transform?: (v: number) => number;
  label: string;
}

const JOBS: FaostatJob[] = [
  { domain: "RL", element: "5110", item: "6661", metricId: "forest_area", label: "skogareal (RL)" },
  // Karbon i levende biomasse (Gg C) → mill. tonn CO₂-ekv.: /1000 * 44/12.
  {
    domain: "GF",
    element: "7215",
    item: "6661",
    metricId: "carbon_stock",
    transform: (v) => (v / 1000) * (44 / 12),
    label: "karbon i levende biomasse (GF)",
  },
];

async function runJob(job: FaostatJob, resolve: ReturnType<typeof makeAreaResolver>): Promise<LiveSeries[]> {
  const url =
    `${API}/${job.domain}?element=${job.element}&item=${job.item}` +
    `&output_type=objects&show_codes=true&show_unit=true&show_flags=false`;

  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = (await res.json()) as { data?: Record<string, unknown>[] };
  const rows = json.data ?? [];

  if (rows.length === 0) {
    console.warn(`  ⚠ FAOSTAT ${job.label}: 0 rader (sjekk item/element-koder).`);
    return [];
  }
  // Selvdiagnostikk til CI-loggen.
  console.log(`  · FAOSTAT ${job.label}: ${rows.length} rader. Felt: ${Object.keys(rows[0]).join(", ")}`);

  const byCountry = new Map<string, LiveSeries>();
  let unmatched = 0;
  for (const r of rows) {
    const iso3 = resolve(r);
    const year = Number(r["Year"] ?? r["Year Code"]);
    const valueRaw = r["Value"];
    const value = typeof valueRaw === "number" ? valueRaw : Number(valueRaw);
    if (!iso3 || !Number.isFinite(year) || !Number.isFinite(value)) {
      if (!iso3) unmatched++;
      continue;
    }
    const key = `${iso3}__${job.metricId}`;
    if (!byCountry.has(key)) byCountry.set(key, { countryId: iso3, metricId: job.metricId, points: [] });
    byCountry.get(key)!.points.push({
      year,
      value: job.transform ? Math.round(job.transform(value) * 100) / 100 : value,
      quality: "measured",
    });
  }

  const out = [...byCountry.values()].map((s) => ({
    ...s,
    points: s.points.sort((a, b) => a.year - b.year),
  }));
  console.log(`  ✓ FAOSTAT ${job.label}: ${out.length} land (${unmatched} rader uten land-treff)`);
  return out;
}

export async function importFaostat(): Promise<LiveSeries[]> {
  const resolve = makeAreaResolver();
  const out: LiveSeries[] = [];
  for (const job of JOBS) {
    try {
      out.push(...(await runJob(job, resolve)));
    } catch (err) {
      console.warn(`  ⚠ FAOSTAT ${job.label} feilet: ${(err as Error).message} – beholder seed.`);
    }
  }
  return out;
}
