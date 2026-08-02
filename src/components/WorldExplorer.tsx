"use client";

import { useMemo, useState } from "react";
import type { FeatureCollection } from "geojson";
import { WorldMap } from "@/components/charts/WorldMap";
import { TimeSeriesFigure } from "@/components/charts/TimeSeriesFigure";
import type { Region } from "@/lib/types";
import { REGION_ORDER, regionLabel } from "@/lib/regions";

type Point = { year: number; value: number; quality?: string };

export interface MetricInfo {
  id: string;
  nameNo: string;
  unit: string;
  definitionNo: string;
  uncertaintyNo: string;
  sourceName: string;
  sourceUrl: string;
  decimals: number;
}

export interface CountryInfo {
  id: string;
  nameNo: string;
  region: Region;
}

export function WorldExplorer({
  geo,
  metrics,
  countries,
  data,
  updated,
}: {
  geo: FeatureCollection;
  metrics: MetricInfo[];
  countries: CountryInfo[];
  /** data[metricId][countryId] = points */
  data: Record<string, Record<string, Point[]>>;
  updated: string;
}) {
  const [metricId, setMetricId] = useState(metrics[0].id);
  const [country, setCountry] = useState("NOR");
  const [continent, setContinent] = useState<Region | "all">("all");

  const metric = metrics.find((m) => m.id === metricId)!;
  const nameById = useMemo(() => new Map(countries.map((c) => [c.id, c.nameNo])), [countries]);

  // Verdier per land for valgt indikator (siste tilgjengelige år) → farge på kart.
  const values = useMemo(() => {
    const byCountry = data[metricId] ?? {};
    const out: Record<string, { value: number; year: number }> = {};
    for (const [cid, points] of Object.entries(byCountry)) {
      if (points.length) {
        const last = points[points.length - 1];
        out[cid] = { value: last.value, year: last.year };
      }
    }
    return out;
  }, [data, metricId]);

  // Filtrer kartet til valgt verdensdel.
  const shownGeo = useMemo<FeatureCollection>(() => {
    if (continent === "all") return geo;
    return {
      type: "FeatureCollection",
      features: geo.features.filter(
        (f) => (f.properties as { region?: string })?.region === continent,
      ),
    };
  }, [geo, continent]);

  // Land med data for valgt indikator (+ verdensdelsfilter), gruppert.
  const grouped = useMemo(() => {
    const withData = countries.filter(
      (c) => data[metricId]?.[c.id]?.length && (continent === "all" || c.region === continent),
    );
    const byRegion = new Map<Region, CountryInfo[]>();
    for (const c of withData) {
      if (!byRegion.has(c.region)) byRegion.set(c.region, []);
      byRegion.get(c.region)!.push(c);
    }
    return REGION_ORDER.filter((r) => byRegion.has(r)).map((r) => ({
      region: r,
      countries: byRegion.get(r)!.sort((a, b) => a.nameNo.localeCompare(b.nameNo, "nb")),
    }));
  }, [countries, data, metricId, continent]);

  // Hvis valgt land ikke finnes for gjeldende indikator/verdensdel, fall
  // tilbake til første tilgjengelige (unngår at nedtrekk og graf spriker).
  const availableIds = useMemo(() => grouped.flatMap((g) => g.countries.map((c) => c.id)), [grouped]);
  const effectiveCountry = availableIds.includes(country) ? country : availableIds[0] ?? "";

  const points = data[metricId]?.[effectiveCountry] ?? [];
  const hasSeries = points.length > 0;
  const withDataCount = Object.keys(values).length;

  return (
    <div>
      {/* Indikatorvelger */}
      <div role="tablist" aria-label="Velg indikator" className="flex flex-wrap gap-2">
        {metrics.map((m) => (
          <button
            key={m.id}
            role="tab"
            aria-selected={m.id === metricId}
            onClick={() => setMetricId(m.id)}
            className={`rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
              m.id === metricId
                ? "border-forest-700 bg-forest-700 text-paper"
                : "border-paper-line bg-paper text-ink-soft hover:border-forest-300 hover:bg-paper-sunk"
            }`}
          >
            {m.nameNo}
          </button>
        ))}
      </div>

      {/* Verdensdelsfilter */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-ink-muted">Vis:</span>
        <ContinentButton active={continent === "all"} onClick={() => setContinent("all")}>
          Hele verden
        </ContinentButton>
        {REGION_ORDER.filter((r) => r !== "Antarctic").map((r) => (
          <ContinentButton key={r} active={continent === r} onClick={() => setContinent(r)}>
            {regionLabel(r)}
          </ContinentButton>
        ))}
      </div>

      <div className="mt-6 grid gap-8 lg:grid-cols-2">
        {/* KART */}
        <div className="rounded-xl border border-paper-line bg-paper p-4">
          <h2 className="headline text-lg">{metric.nameNo}</h2>
          <p className="mt-0.5 text-sm text-ink-muted">
            Klikk på et land for å åpne tidsserien. {withDataCount} land har data for
            denne indikatoren.
          </p>
          <div className="mt-3">
            <WorldMap
              geo={shownGeo}
              values={values}
              unit={metric.unit}
              metricLabel={metric.nameNo}
              selected={effectiveCountry}
              onSelect={setCountry}
            />
          </div>
        </div>

        {/* TIDSSERIE FOR VALGT LAND */}
        <div>
          <label className="mb-3 flex items-center gap-2 text-sm">
            <span className="font-medium text-ink">Land:</span>
            <select
              value={effectiveCountry}
              onChange={(e) => setCountry(e.target.value)}
              className="rounded-md border border-paper-line bg-paper px-2.5 py-1.5 text-sm"
            >
              {grouped.map((g) => (
                <optgroup key={g.region} label={regionLabel(g.region)}>
                  {g.countries.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nameNo}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </label>

          {hasSeries ? (
            <TimeSeriesFigure
              key={`${effectiveCountry}-${metricId}`}
              id="verden-tidsserie"
              slug={`${metric.id}-${effectiveCountry.toLowerCase()}`}
              title={`${metric.nameNo} · ${nameById.get(effectiveCountry) ?? effectiveCountry}`}
              subtitle={metric.unit}
              unit={metric.unit}
              yLabel={metric.unit}
              decimals={metric.decimals}
              includeZero
              series={[{ key: effectiveCountry, label: nameById.get(effectiveCountry) ?? effectiveCountry, color: "#1c5220", points }]}
              meta={{
                sourceName: metric.sourceName,
                sourceUrl: metric.sourceUrl,
                updated,
                definition: metric.definitionNo,
                uncertainty: metric.uncertaintyNo,
              }}
            />
          ) : (
            <p className="rounded-lg border border-dashed border-paper-line bg-paper-soft p-8 text-center text-sm text-ink-muted">
              Ingen land i dette utvalget har {metric.nameNo.toLowerCase()} i
              seed-datasettet ennå. Velg «Hele verden» eller en annen indikator – den
              nattlige FAO-importen fyller inn flere land etter hvert.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function ContinentButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`rounded-full border px-3 py-1 text-xs transition-colors ${
        active
          ? "border-ink bg-ink text-paper"
          : "border-paper-line bg-paper text-ink-soft hover:border-ink-faint"
      }`}
    >
      {children}
    </button>
  );
}
