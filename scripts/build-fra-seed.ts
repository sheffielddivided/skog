/**
 * Bygger data/seed/fra.json fra FAO FRA 2025 bulk-nedlastingen (data/fra/*.csv).
 *
 * FRA-bulken er en manuell nedlasting fra https://fra-data.fao.org (kan ikke
 * hentes av den nattlige cron-jobben), så den lagres som et committet seed-lag.
 * Kjør på nytt når en ny bulk legges inn: `npm run data:fra`.
 *
 * Gir globale, harmoniserte serier for stående volum, biomasse per hektar,
 * karbonlager (levende biomasse) og skogareal, for FRA-referanseårene
 * 1990/2000/2010/2015/2020/2025.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { buildCountries } from "./lib/countries";

const FRA_DIR = join(process.cwd(), "data", "fra");
const YEARS = ["1990", "2000", "2010", "2015", "2020", "2025"];
const C_TO_CO2 = 44 / 12;

/** Minimal CSV-parser som håndterer anførselstegn og komma i felt. */
function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let field = "";
  let row: string[] = [];
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field); field = "";
      if (row.some((v) => v !== "")) rows.push(row);
      row = [];
    } else field += c;
  }
  if (field !== "" || row.length) { row.push(field); if (row.some((v) => v !== "")) rows.push(row); }

  const header = rows[0].map((h) => h.replace(/^﻿/, "").trim());
  return rows.slice(1).map((r) => Object.fromEntries(header.map((h, i) => [h, r[i] ?? ""])));
}

/** Leser en FRA-variabelfil → { iso3: {år: verdi} }. */
function readVar(file: string): Map<string, Record<number, number>> {
  const rows = parseCsv(readFileSync(join(FRA_DIR, file), "utf8"));
  const out = new Map<string, Record<number, number>>();
  for (const r of rows) {
    const iso3 = (r["iso3"] || "").trim();
    if (!/^[A-Z]{3}$/.test(iso3)) continue;
    const anchors: Record<number, number> = {};
    for (const y of YEARS) {
      const v = parseFloat(r[y]);
      if (Number.isFinite(v)) anchors[Number(y)] = v;
    }
    if (Object.keys(anchors).length) out.set(iso3, anchors);
  }
  return out;
}

type FraSeed = { countryId: string; metricId: string; anchors: Record<number, number> };

function main() {
  const validIds = new Set(buildCountries().map((c) => c.id));
  const gs = readVar("growing_stock.csv");
  const agb = readVar("agb.csv");
  const area = readVar("forest_area.csv");
  const cAgb = readVar("carbon_agb.csv");
  const cBgb = readVar("carbon_bgb.csv");

  const out: FraSeed[] = [];
  const push = (metricId: string, m: Map<string, Record<number, number>>, transform?: (v: number) => number) => {
    for (const [iso3, anchors] of m) {
      if (!validIds.has(iso3)) continue;
      const a = transform
        ? Object.fromEntries(Object.entries(anchors).map(([y, v]) => [y, Math.round(transform(v) * 100) / 100]))
        : anchors;
      out.push({ countryId: iso3, metricId, anchors: a });
    }
  };

  push("standing_volume", gs); // mill. m³
  push("biomass_per_ha", agb); // tonn/ha
  push("forest_area", area); // 1000 ha (FRA-enhet, uendret)

  // Karbon i levende biomasse = AGB + BGB (Mt C) → Mt CO₂-ekv.
  for (const iso3 of new Set([...cAgb.keys(), ...cBgb.keys()])) {
    if (!validIds.has(iso3)) continue;
    const a = cAgb.get(iso3) ?? {};
    const b = cBgb.get(iso3) ?? {};
    const anchors: Record<number, number> = {};
    for (const y of YEARS) {
      const yn = Number(y);
      if (a[yn] === undefined && b[yn] === undefined) continue;
      anchors[yn] = Math.round(((a[yn] ?? 0) + (b[yn] ?? 0)) * C_TO_CO2 * 100) / 100;
    }
    if (Object.keys(anchors).length) out.push({ countryId: iso3, metricId: "carbon_stock", anchors });
  }

  writeFileSync(join(process.cwd(), "data", "seed", "fra.json"), JSON.stringify(out));
  const byMetric = out.reduce<Record<string, number>>((acc, s) => ((acc[s.metricId] = (acc[s.metricId] ?? 0) + 1), acc), {});
  console.log(`✓ FRA-seed bygget: ${out.length} serier → data/seed/fra.json`);
  console.log("  per indikator:", JSON.stringify(byMetric));
}

main();
