import type { Metadata } from "next";
import type { FeatureCollection } from "geojson";
import { WorldExplorer, type MetricInfo, type CountryInfo } from "@/components/WorldExplorer";
import { getSeriesForMetric, getMetric, getSource, getMeta, getCountries } from "@/lib/data";
import { fmtDate } from "@/lib/format";
import worldGeo from "@data/cache/world.geo.json";

export const metadata: Metadata = {
  title: "Verden",
  description:
    "Interaktivt verdenskart over skog. Velg indikator – skogareal, volum, biomasse eller karbon – og klikk et land for å åpne tidsserien.",
};

const MAP_METRICS = ["forest_area", "forest_co2_net", "standing_volume", "biomass_per_ha", "carbon_stock"] as const;

export default function VerdenPage() {
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
      decimals: id === "forest_co2_net" ? 1 : 0,
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

  // Bare land som har data for minst én kartindikator (til nedtrekksliste).
  const withData = new Set<string>();
  for (const id of MAP_METRICS) for (const cid of Object.keys(data[id])) withData.add(cid);
  const countries: CountryInfo[] = getCountries()
    .filter((c) => withData.has(c.id))
    .map((c) => ({ id: c.id, nameNo: c.nameNo, region: c.region }));

  return (
    <div className="mx-auto max-w-wide px-4 py-12 sm:px-6">
      <header className="max-w-prose">
        <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-forest-600">Verden</p>
        <h1 className="headline text-4xl sm:text-5xl">Skogen i verden</h1>
        <p className="prose-story mt-4">
          Skogen utvikler seg svært ulikt rundt om i verden: den vokser i deler av
          Europa og Asia, mens den fortsatt krymper i mange tropiske land. Velg en
          indikator for å fargelegge kartet, filtrer på verdensdel, og klikk et land
          for å se utviklingen over tid. Tallene er fra FAOs skogressursvurdering
          (FRA 2020).
        </p>
      </header>

      <section className="mt-10">
        <WorldExplorer
          geo={worldGeo as unknown as FeatureCollection}
          metrics={metrics}
          countries={countries}
          data={data}
          updated={updated}
        />
      </section>
    </div>
  );
}
