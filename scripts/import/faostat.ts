/**
 * FAOSTAT-importør med autentisering (Bearer-token via Cognito).
 *
 * Legitimasjon leses KUN fra miljøvariabler (FAOSTAT_USERNAME/PASSWORD) – aldri
 * fra koden. I CI kommer de fra GitHub Actions Secrets; lokalt fra .env.local.
 * Verken passord eller token logges. Uten legitimasjon hoppes FAOSTAT over.
 *
 * Verifisert mot CI: FAOSTAT har IKKE stående volum, biomasse per hektar eller
 * karbonlager (det er FRA-data uten API). Domenet GF (Emissions from Forests)
 * gir derimot netto CO₂-utslipp/-opptak fra skog globalt – som vi henter her.
 *   GF, element 7233 (Net emissions/removals CO2), item 6751 (Forestland)
 */
import { LiveSeries } from "./types";
import { buildCountries } from "../lib/countries";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const worldCountries = require("world-countries") as {
  cca3: string;
  ccn3: string;
  name: { common: string; official: string };
  altSpellings: string[];
}[];

const BASE = "https://faostatservices.fao.org/api/v1";

async function login(): Promise<string | null> {
  const username = process.env.FAOSTAT_USERNAME;
  const password = process.env.FAOSTAT_PASSWORD;
  if (!username || !password) {
    console.log("  · FAOSTAT: ingen legitimasjon – hopper over.");
    return null;
  }
  const res = await fetch(`${BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ username, password }),
  });
  if (!res.ok) throw new Error(`auth HTTP ${res.status}`);
  const json = (await res.json()) as Record<string, unknown>;
  const auth = json.AuthenticationResult as Record<string, unknown> | undefined;
  const token = (auth?.AccessToken as string) ?? (auth?.IdToken as string);
  if (!token) throw new Error(`fant ikke token-felt`);
  console.log("  · FAOSTAT: innlogget OK.");
  return token;
}

async function authGet<T>(path: string, token: string): Promise<T> {
  const res = await fetch(`${BASE}/${path}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} (${path})`);
  return (await res.json()) as T;
}

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
    for (const key of ["Area Code (M49)", "Area Code (ISO3)", "Area Code", "AreaCode"]) {
      const raw = row[key];
      if (raw != null) {
        const s = String(raw);
        if (/^[A-Z]{3}$/.test(s) && byName.size) {
          // Allerede ISO3?
          if ([...byM49.values()].includes(s)) return s;
        }
        const m49 = s.replace(/\D/g, "");
        if (m49 && byM49.has(String(Number(m49)))) return byM49.get(String(Number(m49)));
      }
    }
    const name = row["Area"] ?? row["AreaName"];
    if (typeof name === "string") return byName.get(norm(name));
    return undefined;
  };
}

/** Normaliserer en CO₂-verdi til millioner tonn ut fra enhetsteksten. */
function toMtCO2(value: number, unit: string): number {
  const u = (unit || "").toLowerCase();
  if (u.includes("million") || u === "mt") return value;
  if (u.includes("kiloton") || u === "kt" || u.includes("gigagram") || u === "gg") return value / 1000;
  if (u.includes("ton") && !u.includes("kilo")) return value / 1_000_000;
  return value / 1000; // FAOSTAT-utslipp er normalt kt/Gg
}

interface FaoJob {
  domain: string;
  element: string;
  item: string;
  metricId: string;
  label: string;
  kind: "co2";
}

const JOBS: FaoJob[] = [
  {
    domain: "GF",
    element: "7233",
    item: "6751",
    metricId: "forest_co2_net",
    label: "netto CO₂ fra skog (GF)",
    kind: "co2",
  },
];

async function runJob(job: FaoJob, token: string, validIds: Set<string>): Promise<LiveSeries[]> {
  const resolve = makeAreaResolver();
  const data = await authGet<{ data?: Record<string, unknown>[] }>(
    `en/data/${job.domain}?element=${job.element}&item=${job.item}&output_type=objects&show_codes=true&show_unit=true`,
    token,
  );
  const rows = data.data ?? [];
  if (rows.length === 0) return [];
  console.log(`  · FAOSTAT ${job.label}: ${rows.length} rader. Felt: ${Object.keys(rows[0]).join(", ")}`);

  const byCountry = new Map<string, LiveSeries>();
  let sampleLogged = false;
  for (const r of rows) {
    const iso3 = resolve(r);
    const year = Number(r["Year"]);
    const raw = Number(r["Value"]);
    const unit = String(r["Unit"] ?? "");
    if (!iso3 || !validIds.has(iso3) || !Number.isFinite(year) || !Number.isFinite(raw)) continue;
    const value = Math.round(toMtCO2(raw, unit) * 100) / 100;
    if (!sampleLogged) {
      console.log(`     eksempel: ${iso3} ${year} rå=${raw} ${unit} → ${value} mill. t CO₂`);
      sampleLogged = true;
    }
    const key = iso3;
    if (!byCountry.has(key)) byCountry.set(key, { countryId: iso3, metricId: job.metricId, points: [] });
    byCountry.get(key)!.points.push({ year, value, quality: "measured" });
  }
  const out = [...byCountry.values()]
    .map((s) => ({ ...s, points: s.points.sort((a, b) => a.year - b.year) }))
    .filter((s) => s.points.length >= 2);
  console.log(`  ✓ FAOSTAT ${job.label}: ${out.length} land`);
  return out;
}

export async function importFaostat(): Promise<LiveSeries[]> {
  try {
    const token = await login();
    if (!token) return [];
    const validIds = new Set(buildCountries().map((c) => c.id));
    const out: LiveSeries[] = [];
    for (const job of JOBS) {
      try {
        out.push(...(await runJob(job, token, validIds)));
      } catch (err) {
        console.warn(`  ⚠ FAOSTAT ${job.label} feilet: ${(err as Error).message}`);
      }
    }
    return out;
  } catch (err) {
    console.warn(`  ⚠ FAOSTAT feilet: ${(err as Error).message} – beholder seed.`);
    return [];
  }
}
