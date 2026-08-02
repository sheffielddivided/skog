/**
 * Verdensbank-importør – globalt skogareal.
 *
 * Verdensbankens åpne API (ingen nøkkel) publiserer FAO-avledet skogareal for
 * alle land, årlig 1990–2022:
 *   indikator AG.LND.FRST.K2 = «Forest area (sq. km)»
 *
 * Verifisert mot CI-loggen (FAOSTAT-API-et krever nå autentisering / gir 401,
 * derfor bruker vi Verdensbanken som er åpen og ISO-3-nøklet).
 *
 * Vekst, biomasse per hektar og karbon finnes bare i FAO FRA (uten åpent API)
 * og forblir i seed-laget inntil en autentisert FRA/FAOSTAT-kilde kobles på.
 *
 * Kjøres i miljø med utgående nett. Faller pent tilbake til seed ved feil.
 */
import { LiveSeries } from "./types";
import { buildCountries } from "../lib/countries";

const INDICATOR = "AG.LND.FRST.K2"; // skogareal, km²
const URL =
  `https://api.worldbank.org/v2/country/all/indicator/${INDICATOR}` +
  `?format=json&per_page=20000&date=1990:2023`;

interface WbRow {
  countryiso3code: string;
  date: string;
  value: number | null;
}

export async function importWorldBankForestArea(): Promise<LiveSeries[]> {
  try {
    const res = await fetch(URL, { headers: { Accept: "application/json" } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = (await res.json()) as [unknown, WbRow[] | null];
    const rows = Array.isArray(json) ? json[1] ?? [] : [];

    if (rows.length === 0) {
      console.warn("  ⚠ Verdensbanken skogareal: 0 rader – beholder seed.");
      return [];
    }

    const validIds = new Set(buildCountries().map((c) => c.id));
    const byCountry = new Map<string, LiveSeries>();

    for (const r of rows) {
      const iso3 = r.countryiso3code;
      const year = Number(r.date);
      if (!iso3 || !validIds.has(iso3) || r.value == null || !Number.isFinite(year)) continue;
      // km² → 1000 ha (1000 ha = 10 km²).
      const value = Math.round((r.value / 10) * 100) / 100;
      const key = iso3;
      if (!byCountry.has(key)) byCountry.set(key, { countryId: iso3, metricId: "forest_area", points: [] });
      byCountry.get(key)!.points.push({ year, value, quality: "measured" });
    }

    const out = [...byCountry.values()]
      .map((s) => ({ ...s, points: s.points.sort((a, b) => a.year - b.year) }))
      .filter((s) => s.points.length >= 2);

    console.log(`  ✓ Verdensbanken skogareal: ${out.length} land (${rows.length} rader)`);
    return out;
  } catch (err) {
    console.warn(`  ⚠ Verdensbanken skogareal feilet: ${(err as Error).message} – beholder seed.`);
    return [];
  }
}
