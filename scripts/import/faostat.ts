/**
 * FAOSTAT-importør med autentisering.
 *
 * FAOSTAT krever nå Bearer-token. Innlogging skjer med brukernavn/passord som
 * KUN leses fra miljøvariabler (FAOSTAT_USERNAME / FAOSTAT_PASSWORD) – aldri fra
 * koden. I CI kommer de fra GitHub Actions Secrets; lokalt fra .env.local.
 * Uten legitimasjon hoppes FAOSTAT pent over (seed brukes).
 *
 * SIKKERHET: verken passord eller token logges noen gang.
 *
 * Importøren er selvdiagnostiserende: første autentiserte CI-kjøring logger
 * hvilke skog-/karbon-domener og element-/item-koder som finnes, slik at de
 * eksakte kodene kan verifiseres mot loggen og settes i JOBS under.
 */
import { LiveSeries } from "./types";
import { buildCountries } from "../lib/countries";

const BASE = "https://faostatservices.fao.org/api/v1";

/** Henter Bearer-token. Returnerer null hvis legitimasjon mangler. */
async function login(): Promise<string | null> {
  const username = process.env.FAOSTAT_USERNAME;
  const password = process.env.FAOSTAT_PASSWORD;
  if (!username || !password) {
    console.log("  · FAOSTAT: ingen legitimasjon (FAOSTAT_USERNAME/PASSWORD) – hopper over.");
    return null;
  }

  const res = await fetch(`${BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ username, password }),
  });
  if (!res.ok) throw new Error(`auth HTTP ${res.status}`);

  const json = (await res.json()) as Record<string, unknown>;
  // FAOSTAT bruker AWS Cognito: token ligger i AuthenticationResult.AccessToken.
  const auth = json.AuthenticationResult as Record<string, unknown> | undefined;
  const token =
    (auth?.AccessToken as string) ??
    (auth?.IdToken as string) ??
    (json.access_token as string) ??
    (json.token as string);
  if (!token) {
    // Logg kun NØKLENE (ikke verdier) for å finne riktig token-felt.
    const keys = auth ? Object.keys(auth).join(", ") : Object.keys(json).join(", ");
    throw new Error(`fant ikke token-felt (nøkler: ${keys})`);
  }
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

/** Lister koder for en dimensjon i et domene (prøver flere endepunkt-varianter). */
async function listCodes(dim: string, domain: string, token: string) {
  const paths = [
    `en/codes/${dim}/${domain}?output_type=objects`,
    `en/definitions/${dim}/${domain}?output_type=objects`,
    `en/dimensions/${dim}/${domain}?output_type=objects`,
  ];
  for (const path of paths) {
    try {
      const j = await authGet<{ data?: Record<string, unknown>[] }>(path, token);
      const rows = j.data ?? [];
      if (rows.length) {
        console.log(`     [${dim}@${domain}] ${rows.length} rader via ${path.split("?")[0]}. Felt: ${Object.keys(rows[0]).join(", ")}`);
        for (const r of rows.slice(0, 40)) {
          const code = r["Code"] ?? r["code"] ?? r["Element Code"] ?? r["Item Code"];
          const label = r["Label"] ?? r["label"] ?? r["Element"] ?? r["Item"];
          console.log(`        ${code} = ${label}`);
        }
        return;
      }
    } catch (e) {
      console.log(`     [${dim}@${domain}] ${path.split("?")[0]} → ${(e as Error).message}`);
    }
  }
}

/** Logger skog-/karbon-relaterte domener og kodene i GF-domenet (til verifisering). */
async function discover(token: string) {
  try {
    const g = await authGet<{ data?: { domain_code?: string; domain_name?: string; code?: string; label?: string }[] }>(
      "en/groupsanddomains?output_type=objects",
      token,
    );
    const rows = g.data ?? [];
    const hits = rows.filter((d) =>
      /forest|carbon|land|emission|fra/i.test(`${d.domain_name ?? d.label ?? ""}`),
    );
    console.log(`  · FAOSTAT domener (skog/karbon/land): ${hits.length}`);
    for (const d of hits.slice(0, 18)) {
      console.log(`     - ${d.domain_code ?? d.code} = ${d.domain_name ?? d.label}`);
    }
    // GF = Emissions from Forests: list elementer og items for å finne karbon-koder.
    console.log("  · FAOSTAT GF-koder:");
    await listCodes("elements", "GF", token);
    await listCodes("items", "GF", token);
  } catch (err) {
    console.warn(`  · FAOSTAT discovery feilet: ${(err as Error).message}`);
  }
}

interface FaoJob {
  domain: string;
  element: string;
  item: string;
  metricId: string;
  label: string;
  transform?: (v: number) => number;
}

/**
 * Konkrete uttrekk. Fylles ut med verifiserte koder fra discovery-loggen.
 * (Tomt inntil kodene er bekreftet mot en autentisert CI-kjøring.)
 */
const JOBS: FaoJob[] = [];

async function runJob(job: FaoJob, token: string, validIds: Set<string>): Promise<LiveSeries[]> {
  const m49 = new Map(buildCountries().map((c) => [c.id, c])); // (reservert til evt. områdemapping)
  void m49;
  const data = await authGet<{ data?: Record<string, unknown>[] }>(
    `en/data/${job.domain}?element=${job.element}&item=${job.item}&output_type=objects&show_codes=true`,
    token,
  );
  const rows = data.data ?? [];
  if (rows.length === 0) return [];
  console.log(`  · FAOSTAT ${job.label}: ${rows.length} rader. Felt: ${Object.keys(rows[0]).join(", ")}`);

  const byCountry = new Map<string, LiveSeries>();
  for (const r of rows) {
    const iso3 = String(r["Area Code (ISO3)"] ?? r["ISO3"] ?? "");
    const year = Number(r["Year"]);
    const value = Number(r["Value"]);
    if (!validIds.has(iso3) || !Number.isFinite(year) || !Number.isFinite(value)) continue;
    const key = `${iso3}__${job.metricId}`;
    if (!byCountry.has(key)) byCountry.set(key, { countryId: iso3, metricId: job.metricId, points: [] });
    byCountry.get(key)!.points.push({
      year,
      value: job.transform ? Math.round(job.transform(value) * 100) / 100 : value,
      quality: "measured",
    });
  }
  const out = [...byCountry.values()].map((s) => ({ ...s, points: s.points.sort((a, b) => a.year - b.year) }));
  console.log(`  ✓ FAOSTAT ${job.label}: ${out.length} land`);
  return out;
}

export async function importFaostat(): Promise<LiveSeries[]> {
  try {
    const token = await login();
    if (!token) return [];

    await discover(token); // logger tilgjengelige koder for verifisering

    if (JOBS.length === 0) {
      console.log("  · FAOSTAT: ingen uttrekk konfigurert ennå (venter på verifiserte koder).");
      return [];
    }
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
