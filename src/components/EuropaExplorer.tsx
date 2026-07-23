"use client";

import { useMemo, useState } from "react";
import type { FeatureCollection } from "geojson";
import { EuropeMap } from "@/components/charts/EuropeMap";
import { TimeSeriesFigure } from "@/components/charts/TimeSeriesFigure";

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

export function EuropaExplorer({
  geo,
  metrics,
  countryNames,
  data,
  updated,
}: {
  geo: FeatureCollection;
  metrics: MetricInfo[];
  countryNames: Record<string, string>;
  /** data[metricId][countryId] = points */
  data: Record<string, Record<string, Point[]>>;
  updated: string;
}) {
  const [metricId, setMetricId] = useState(metrics[0].id);
  const [country, setCountry] = useState("NOR");

  const metric = metrics.find((m) => m.id === metricId)!;

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

  const countryOptions = useMemo(
    () =>
      Object.keys(data[metricId] ?? {})
        .map((cid) => ({ id: cid, name: countryNames[cid] ?? cid }))
        .sort((a, b) => a.name.localeCompare(b.name, "nb")),
    [data, metricId, countryNames],
  );

  const points = data[metricId]?.[country] ?? [];

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

      <div className="mt-6 grid gap-8 lg:grid-cols-2">
        {/* KART */}
        <div className="rounded-xl border border-paper-line bg-paper p-4">
          <h2 className="headline text-lg">{metric.nameNo} i Europa</h2>
          <p className="mt-0.5 text-sm text-ink-muted">
            Klikk på et land for å åpne tidsserien. Farge viser siste tilgjengelige år.
          </p>
          <div className="mt-3">
            <EuropeMap
              geo={geo}
              values={values}
              unit={metric.unit}
              metricLabel={metric.nameNo}
              selected={country}
              onSelect={setCountry}
            />
          </div>
        </div>

        {/* TIDSSERIE FOR VALGT LAND */}
        <div>
          <label className="mb-3 flex items-center gap-2 text-sm">
            <span className="font-medium text-ink">Land:</span>
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="rounded-md border border-paper-line bg-paper px-2.5 py-1.5 text-sm"
            >
              {countryOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>

          <TimeSeriesFigure
            key={`${country}-${metricId}`}
            id="europa-tidsserie"
            slug={`${metric.id}-${country.toLowerCase()}`}
            title={`${metric.nameNo} · ${countryNames[country] ?? country}`}
            subtitle={metric.unit}
            unit={metric.unit}
            yLabel={metric.unit}
            decimals={metric.decimals}
            includeZero
            series={[{ key: country, label: countryNames[country] ?? country, color: "#1c5220", points }]}
            meta={{
              sourceName: metric.sourceName,
              sourceUrl: metric.sourceUrl,
              updated,
              definition: metric.definitionNo,
              uncertainty: metric.uncertaintyNo,
            }}
          />
        </div>
      </div>
    </div>
  );
}
