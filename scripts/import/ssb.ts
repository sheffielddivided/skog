/**
 * SSB StatBank-importør (Norge).
 *
 * SSBs åpne API tar en POST med en JSON-stat2-spørring og svarer med et
 * JSON-stat2-datasett. Tabell-IDer og innholdskoder må verifiseres mot
 * https://www.ssb.no/statbank ved første kjøring – de er lagt inn som
 * konfigurasjon under, slik at de er enkle å justere.
 *
 * NB: Kjøres i miljø med utgående nett (Vercel/CI). I sandkassen er SSB
 * blokkert, og seed-laget brukes i stedet.
 */
import { extractSeries, type JsonStat2 } from "./jsonstat";
import type { LiveSeries } from "./types";

const BASE = "https://data.ssb.no/api/v0/en/table";

interface SsbJob {
  table: string;
  metricId: string;
  contentsCode: string;
  timeDim?: string;
  fixed?: Record<string, string>;
}

// Kartlegging tabell → indikator. Verifiser koder mot tabellens metadata.
const JOBS: SsbJob[] = [
  { table: "03895", metricId: "standing_volume", contentsCode: "StaaendeVolum" },
  { table: "03794", metricId: "annual_increment", contentsCode: "Tilvekst" },
  { table: "03795", metricId: "harvest", contentsCode: "Avvirket" },
];

async function fetchTable(job: SsbJob): Promise<LiveSeries | null> {
  const body = {
    query: [
      { code: "ContentsCode", selection: { filter: "item", values: [job.contentsCode] } },
    ],
    response: { format: "json-stat2" },
  };

  const res = await fetch(`${BASE}/${job.table}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`SSB ${job.table}: HTTP ${res.status}`);
  const data = (await res.json()) as JsonStat2;

  const points = extractSeries(data, job.timeDim ?? "Tid", job.fixed ?? {}).map((p) => ({
    ...p,
    quality: "measured" as const,
  }));
  if (points.length === 0) return null;

  return { countryId: "NOR", metricId: job.metricId, points };
}

export async function importSsb(): Promise<LiveSeries[]> {
  const out: LiveSeries[] = [];
  for (const job of JOBS) {
    try {
      const s = await fetchTable(job);
      if (s) {
        out.push(s);
        console.log(`  ✓ SSB ${job.table} → ${job.metricId} (${s.points.length} år)`);
      }
    } catch (err) {
      console.warn(`  ⚠ SSB ${job.table} feilet: ${(err as Error).message} – beholder seed.`);
    }
  }
  return out;
}
