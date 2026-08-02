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

const norm = (s: string) => s.toLowerCase().replace(/[^a-z]/g, "");

// FAOSTAT-navn som ikke matcher world-countries direkte → ISO-3.
const NAME_ALIASES: Record<string, string> = {
  iranislamicrepublicof: "IRN",
  boliviaplurinationalstateof: "BOL",
  venezuelabolivarianrepublicof: "VEN",
  cotedivoire: "CIV",
  turkiye: "TUR",
  chinamainland: "CHN",
  chinataiwanprovinceof: "TWN",
  chinahongkongsar: "HKG",
  chinamacaosar: "MAC",
  czechia: "CZE",
  netherlandskingdomofthe: "NLD",
  "unitedkingdomofgreatbritainandnorthernireland": "GBR",
};

/** ISO-3-oppslag fra M49 og navn (verdensnavn + FAOSTAT-aliaser). */
function makeNameLookups() {
  const byM49 = new Map<string, string>();
  const byName = new Map<string, string>();
  for (const c of worldCountries) {
    byM49.set(String(Number(c.ccn3)), c.cca3);
    byName.set(norm(c.name.common), c.cca3);
    byName.set(norm(c.name.official), c.cca3);
    for (const alt of c.altSpellings) byName.set(norm(alt), c.cca3);
  }
  for (const [k, v] of Object.entries(NAME_ALIASES)) byName.set(k, v);
  return { byM49, byName };
}

/**
 * Bygger en autoritativ FAO-områdekode → ISO-3 fra domenets egen kodeliste
 * (codes/areas). Unngår kollisjonen der FAO-koder tolkes som M49.
 */
async function buildAreaMap(domain: string, token: string, validIds: Set<string>): Promise<Map<string, string>> {
  const { byM49, byName } = makeNameLookups();
  const j = await authGet<{ data?: Record<string, unknown>[] }>(
    `en/codes/areas/${domain}?output_type=objects`,
    token,
  );
  const rows = j.data ?? [];
  console.log(`  · FAOSTAT areakoder(${domain}): ${rows.length}. Felt: ${Object.keys(rows[0] ?? {}).join(", ")}`);

  const map = new Map<string, string>();
  let unresolved = 0;
  for (const r of rows) {
    const code = String(r["Code"] ?? r["code"] ?? r["Area Code"] ?? "");
    if (!code) continue;
    let iso: string | undefined;
    // 1) eksplisitt ISO3-felt
    for (const k of Object.keys(r)) {
      if (/iso3/i.test(k) && /^[A-Za-z]{3}$/.test(String(r[k]))) iso = String(r[k]).toUpperCase();
    }
    // 2) M49-felt
    if (!iso) {
      for (const k of Object.keys(r)) {
        if (/m49/i.test(k)) {
          const m = String(r[k]).replace(/\D/g, "");
          if (m && byM49.has(String(Number(m)))) iso = byM49.get(String(Number(m)));
        }
      }
    }
    // 3) navn/alias
    if (!iso) {
      const label = r["Label"] ?? r["label"] ?? r["Area"];
      if (typeof label === "string") iso = byName.get(norm(label));
    }
    if (iso && validIds.has(iso)) map.set(code, iso);
    else unresolved++;
  }
  console.log(`  · FAOSTAT areakoder(${domain}): ${map.size} → ISO3 (${unresolved} uten treff)`);
  return map;
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

async function runJob(job: FaoJob, token: string, areaMap: Map<string, string>): Promise<LiveSeries[]> {
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
    const areaCode = String(r["Area Code"] ?? r["Area Code (FAO)"] ?? "");
    const iso3 = areaMap.get(areaCode);
    const year = Number(r["Year"]);
    const raw = Number(r["Value"]);
    const unit = String(r["Unit"] ?? "");
    if (!iso3 || !Number.isFinite(year) || !Number.isFinite(raw)) continue;
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
    const areaMaps = new Map<string, Map<string, string>>();
    const out: LiveSeries[] = [];
    for (const job of JOBS) {
      try {
        if (!areaMaps.has(job.domain)) {
          areaMaps.set(job.domain, await buildAreaMap(job.domain, token, validIds));
        }
        out.push(...(await runJob(job, token, areaMaps.get(job.domain)!)));
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
