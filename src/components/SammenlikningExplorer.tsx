"use client";

import { useEffect, useMemo, useState } from "react";
import { TimeSeriesFigure } from "@/components/charts/TimeSeriesFigure";
import { categorical } from "@/lib/palette";
import { REGION_ORDER, regionLabel } from "@/lib/regions";
import type { MetricInfo, CountryInfo } from "@/components/WorldExplorer";

type Point = { year: number; value: number; quality?: string };

const DEFAULT_COUNTRIES = ["NOR", "SWE", "FIN", "DEU", "FRA"];

export function SammenlikningExplorer({
  metrics,
  countries,
  data,
  updated,
}: {
  metrics: MetricInfo[];
  countries: CountryInfo[];
  data: Record<string, Record<string, Point[]>>;
  updated: string;
}) {
  const [metricId, setMetricId] = useState(metrics[0].id);
  const [selected, setSelected] = useState<string[]>(DEFAULT_COUNTRIES);
  const [query, setQuery] = useState("");

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
    window.history.replaceState(null, "", `${window.location.pathname}?${params.toString()}`);
  }, [metricId, selected]);

  const metric = metrics.find((m) => m.id === metricId)!;

  // Land med data for valgt indikator, filtrert på søk, gruppert på verdensdel.
  const grouped = useMemo(() => {
    const q = query.trim().toLowerCase();
    const withData = countries.filter(
      (c) => data[metricId]?.[c.id]?.length && (!q || c.nameNo.toLowerCase().includes(q)),
    );
    const byRegion = new Map<string, CountryInfo[]>();
    for (const c of withData) {
      if (!byRegion.has(c.region)) byRegion.set(c.region, []);
      byRegion.get(c.region)!.push(c);
    }
    return REGION_ORDER.filter((r) => byRegion.has(r)).map((r) => ({
      region: r,
      countries: byRegion.get(r)!.sort((a, b) => a.nameNo.localeCompare(b.nameNo, "nb")),
    }));
  }, [countries, data, metricId, query]);

  const series = useMemo(() => {
    // Bevar rekkefølgen slik brukeren valgte (stabile farger).
    return selected
      .filter((id) => data[metricId]?.[id]?.length)
      .map((id, i) => ({
        key: id,
        label: countries.find((c) => c.id === id)?.nameNo ?? id,
        color: categorical(i),
        points: data[metricId][id],
      }));
  }, [selected, data, metricId, countries]);

  const colorIndexOf = (id: string) => series.findIndex((s) => s.key === id);

  function toggle(id: string) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
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

      <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        {/* GRAF */}
        <div className="order-2 lg:order-1">
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

        {/* LANDVELGER */}
        <div className="order-1 lg:order-2">
          <div className="rounded-xl border border-paper-line bg-paper p-4">
            <div className="mb-3 flex items-baseline justify-between">
              <h2 className="text-sm font-semibold text-ink">Velg land ({selected.length})</h2>
              {selected.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelected([])}
                  className="text-xs text-forest-700 underline underline-offset-2"
                >
                  Tøm
                </button>
              )}
            </div>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Søk etter land …"
              aria-label="Søk etter land"
              className="mb-3 w-full rounded-md border border-paper-line bg-paper-soft px-3 py-2 text-sm"
            />
            <div className="max-h-[26rem] space-y-3 overflow-y-auto pr-1">
              {grouped.map((g) => (
                <div key={g.region}>
                  <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-ink-faint">
                    {regionLabel(g.region)}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {g.countries.map((c) => {
                      const on = selected.includes(c.id);
                      const idx = colorIndexOf(c.id);
                      return (
                        <button
                          key={c.id}
                          type="button"
                          aria-pressed={on}
                          onClick={() => toggle(c.id)}
                          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors ${
                            on
                              ? "border-ink bg-ink text-paper"
                              : "border-paper-line bg-paper text-ink-soft hover:border-ink-faint"
                          }`}
                        >
                          {on && idx >= 0 && (
                            <span
                              aria-hidden
                              className="h-2 w-2 rounded-full"
                              style={{ background: categorical(idx) }}
                            />
                          )}
                          {c.nameNo}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
              {grouped.length === 0 && (
                <p className="text-sm text-ink-muted">Ingen land matcher søket.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
