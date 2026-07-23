import type { Metadata } from "next";
import { SammenlikningExplorer } from "@/components/SammenlikningExplorer";
import { getSeriesForMetric, getMetric, getSource, getMeta, getCountries } from "@/lib/data";
import { fmtDate } from "@/lib/format";
import type { MetricInfo } from "@/components/EuropaExplorer";

export const metadata: Metadata = {
  title: "Sammenlikning",
  description:
    "Sammenlign skogutviklingen i flere europeiske land i samme graf – volum, areal, biomasse og karbon.",
};

const COMPARE_METRICS = ["standing_volume", "forest_area", "biomass_per_ha", "carbon_stock"] as const;

export default function SammenlikningPage() {
  const updated = fmtDate(getMeta().generatedAt);

  const metrics: MetricInfo[] = COMPARE_METRICS.map((id) => {
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
      decimals: id === "biomass_per_ha" ? 0 : 0,
    };
  });

  const data: Record<string, Record<string, { year: number; value: number; quality?: string }[]>> = {};
  for (const id of COMPARE_METRICS) {
    data[id] = {};
    for (const s of getSeriesForMetric(id)) {
      if (s.countryId === "GLB") continue;
      data[id][s.countryId] = s.points;
    }
  }

  const countries = getCountries().map((c) => ({ id: c.id, nameNo: c.nameNo }));

  return (
    <div className="mx-auto max-w-wide px-4 py-12 sm:px-6">
      <header className="max-w-prose">
        <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-forest-600">Sammenlikning</p>
        <h1 className="headline text-4xl sm:text-5xl">Sammenlign land</h1>
        <p className="prose-story mt-4">
          Legg flere land inn i samme graf og se hvordan skogen utvikler seg ulikt.
          Valget ditt lagres i lenken, så du kan dele akkurat denne sammenlikningen.
        </p>
      </header>

      <section className="mt-10">
        <SammenlikningExplorer
          metrics={metrics}
          countries={countries}
          data={data}
          updated={updated}
        />
      </section>
    </div>
  );
}
