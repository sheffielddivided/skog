import type { Metadata } from "next";
import type { FeatureCollection } from "geojson";
import { EuropaExplorer, type MetricInfo } from "@/components/EuropaExplorer";
import { getSeriesForMetric, getMetric, getSource, getMeta, getCountries } from "@/lib/data";
import { fmtDate } from "@/lib/format";
import europeGeo from "@data/cache/europe.geo.json";

export const metadata: Metadata = {
  title: "Europa",
  description:
    "Interaktivt kart over europeisk skog. Velg indikator – skogareal, volum, biomasse eller karbon – og klikk et land for å åpne tidsserien.",
};

const MAP_METRICS = ["forest_area", "standing_volume", "biomass_per_ha", "carbon_stock"] as const;
const DECIMALS: Record<string, number> = { biomass_per_ha: 0, forest_area: 0, standing_volume: 0, carbon_stock: 0 };

export default function EuropaPage() {
  const updated = fmtDate(getMeta().generatedAt);

  const metrics: MetricInfo[] = MAP_METRICS.map((id) => {
    const m = getMetric(id)!;
    const src = getSource(m.sourceId)!;
    return {
      id: m.id,
      nameNo: m.nameNo,
      unit: m.unit,
      definitionNo: m.definitionNo,
      uncertaintyNo: m.uncertaintyNo,
      sourceName: src.name,
      sourceUrl: src.url,
      decimals: DECIMALS[id] ?? 0,
    };
  });

  const data: Record<string, Record<string, { year: number; value: number; quality?: string }[]>> = {};
  for (const id of MAP_METRICS) {
    data[id] = {};
    for (const s of getSeriesForMetric(id)) {
      if (s.countryId === "GLB") continue;
      data[id][s.countryId] = s.points;
    }
  }

  const countryNames: Record<string, string> = {};
  for (const c of getCountries()) countryNames[c.id] = c.nameNo;

  return (
    <div className="mx-auto max-w-wide px-4 py-12 sm:px-6">
      <header className="max-w-prose">
        <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-forest-600">Europa</p>
        <h1 className="headline text-4xl sm:text-5xl">Skogen i Europa</h1>
        <p className="prose-story mt-4">
          Europeisk skog har vokst i både areal og volum de siste tiårene. Velg en
          indikator for å fargelegge kartet, og klikk et land for å se utviklingen
          over tid. Tallene er fra FAOs skogressursvurdering (FRA 2020).
        </p>
      </header>

      <section className="mt-10">
        <EuropaExplorer
          geo={europeGeo as unknown as FeatureCollection}
          metrics={metrics}
          countryNames={countryNames}
          data={data}
          updated={updated}
        />
      </section>
    </div>
  );
}
