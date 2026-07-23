"use client";

import { useEffect, useMemo, useState } from "react";
import { TimeSeriesFigure } from "@/components/charts/TimeSeriesFigure";
import { categorical } from "@/lib/palette";
import type { MetricInfo } from "@/components/EuropaExplorer";

type Point = { year: number; value: number; quality?: string };

const DEFAULT_COUNTRIES = ["NOR", "SWE", "FIN", "DEU", "FRA"];

export function SammenlikningExplorer({
  metrics,
  countries,
  data,
  updated,
}: {
  metrics: MetricInfo[];
  countries: { id: string; nameNo: string }[];
  data: Record<string, Record<string, Point[]>>;
  updated: string;
}) {
  const [metricId, setMetricId] = useState(metrics[0].id);
  const [selected, setSelected] = useState<string[]>(DEFAULT_COUNTRIES);

  // Les initial tilstand fra permalenke (?metric=&countries=NOR,SWE).
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const m = params.get("metric");
    const c = params.get("countries");
    if (m && metrics.some((x) => x.id === m)) setMetricId(m);
    if (c) {
      const list = c.split(",").filter((id) => countries.some((x) => x.id === id));
      if (list.length) setSelected(list);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Skriv tilstand til URL (delbar permalenke).
  useEffect(() => {
    const params = new URLSearchParams();
    params.set("metric", metricId);
    params.set("countries", selected.join(","));
    const url = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState(null, "", url);
  }, [metricId, selected]);

  const metric = metrics.find((m) => m.id === metricId)!;

  const available = useMemo(
    () => countries.filter((c) => data[metricId]?.[c.id]?.length),
    [countries, data, metricId],
  );

  const series = useMemo(() => {
    const ordered = available.filter((c) => selected.includes(c.id));
    return ordered.map((c, i) => ({
      key: c.id,
      label: c.nameNo,
      color: categorical(i),
      points: data[metricId][c.id],
    }));
  }, [available, selected, data, metricId]);

  function toggle(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  return (
    <div>
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

      <fieldset className="mt-5">
        <legend className="mb-2 text-sm font-medium text-ink">Velg land å sammenlikne</legend>
        <div className="flex flex-wrap gap-2">
          {available.map((c) => {
            const on = selected.includes(c.id);
            const idx = series.findIndex((s) => s.key === c.id);
            return (
              <button
                key={c.id}
                type="button"
                aria-pressed={on}
                onClick={() => toggle(c.id)}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors ${
                  on
                    ? "border-ink bg-ink text-paper"
                    : "border-paper-line bg-paper text-ink-soft hover:border-ink-faint"
                }`}
              >
                {on && idx >= 0 && (
                  <span
                    aria-hidden
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ background: categorical(idx) }}
                  />
                )}
                {c.nameNo}
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="mt-8">
        {series.length === 0 ? (
          <p className="rounded-lg border border-dashed border-paper-line bg-paper-soft p-8 text-center text-sm text-ink-muted">
            Velg minst ett land for å vise grafen.
          </p>
        ) : (
          <TimeSeriesFigure
            key={metricId}
            id="sammenlikning"
            slug={`sammenlikning-${metric.id}`}
            title={metric.nameNo}
            subtitle={`Sammenlikning · ${metric.unit}`}
            unit={metric.unit}
            yLabel={metric.unit}
            decimals={metric.decimals}
            includeZero
            series={series}
            meta={{
              sourceName: metric.sourceName,
              sourceUrl: metric.sourceUrl,
              updated,
              definition: metric.definitionNo,
              uncertainty: metric.uncertaintyNo,
            }}
          />
        )}
      </div>
    </div>
  );
}
