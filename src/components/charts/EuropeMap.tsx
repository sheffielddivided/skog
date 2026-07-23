"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { geoConicConformal, geoPath } from "d3-geo";
import { scaleQuantize } from "d3-scale";
import type { FeatureCollection, Feature } from "geojson";
import { SEQUENTIAL_GREEN } from "@/lib/palette";
import { fmt } from "@/lib/format";

type ValueMap = Record<string, { value: number; year: number }>;

/**
 * Interaktivt choropleth-kart over Europa. Hand-rendret med d3-geo som SVG –
 * selvforsynt (ingen tile-tjenester), tastaturnavigerbart og fargeblindvennlig.
 * Klikk (eller Enter/Space) på et land åpner tidsserien.
 */
export function EuropeMap({
  geo,
  values,
  unit,
  metricLabel,
  selected,
  onSelect,
}: {
  geo: FeatureCollection;
  values: ValueMap;
  unit: string;
  metricLabel: string;
  selected?: string;
  onSelect: (iso3: string) => void;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(680);
  const [hover, setHover] = useState<{ iso3: string; x: number; y: number } | null>(null);

  useEffect(() => {
    const el = hostRef.current;
    if (!el) return;
    const ro = new ResizeObserver((e) => {
      const w = e[0]?.contentRect.width;
      if (w) setWidth(Math.round(w));
    });
    ro.observe(el);
    setWidth(Math.round(el.getBoundingClientRect().width || 680));
    return () => ro.disconnect();
  }, []);

  const height = Math.round(width * 0.82);

  const { paths, color, thresholds, domain } = useMemo(() => {
    const projection = geoConicConformal()
      .parallels([43, 62])
      .rotate([-12, 0])
      .fitExtent(
        [
          [12, 12],
          [width - 12, height - 12],
        ],
        geo,
      );
    const path = geoPath(projection);

    const vals = Object.values(values).map((v) => v.value);
    const min = vals.length ? Math.min(...vals) : 0;
    const max = vals.length ? Math.max(...vals) : 1;
    const color = scaleQuantize<string>().domain([min, max]).range(SEQUENTIAL_GREEN as unknown as string[]);

    const paths = geo.features.map((f: Feature) => ({
      iso3: String(f.id),
      name: (f.properties as { nameNo?: string; name?: string })?.nameNo ??
        (f.properties as { name?: string })?.name ??
        String(f.id),
      d: path(f) ?? "",
      centroid: path.centroid(f),
    }));

    return { paths, color, thresholds: color.thresholds(), domain: [min, max] as [number, number] };
  }, [geo, values, width, height]);

  const legendStops = [domain[0], ...thresholds, domain[1]];

  return (
    <div>
      <div ref={hostRef} className="relative w-full">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          width="100%"
          height={height}
          role="group"
          aria-label={`Kart over Europa fargelagt etter ${metricLabel}`}
          className="touch-manipulation"
        >
          {paths.map((p) => {
            const v = values[p.iso3];
            const isSel = selected === p.iso3;
            const hasData = !!v;
            return (
              <path
                key={p.iso3}
                d={p.d}
                fill={hasData ? color(v.value) : "#eceae3"}
                stroke={isSel ? "#c2410c" : "#ffffff"}
                strokeWidth={isSel ? 2 : 0.6}
                tabIndex={hasData ? 0 : -1}
                role={hasData ? "button" : undefined}
                aria-label={
                  hasData
                    ? `${p.name}: ${fmt(v.value, v.value < 100 ? 1 : 0)} ${unit} (${v.year})`
                    : `${p.name}: ingen data`
                }
                aria-pressed={hasData ? isSel : undefined}
                style={{ cursor: hasData ? "pointer" : "default", outline: "none" }}
                onClick={() => hasData && onSelect(p.iso3)}
                onKeyDown={(e) => {
                  if (hasData && (e.key === "Enter" || e.key === " ")) {
                    e.preventDefault();
                    onSelect(p.iso3);
                  }
                }}
                onMouseMove={(e) => {
                  const rect = hostRef.current?.getBoundingClientRect();
                  if (rect) setHover({ iso3: p.iso3, x: e.clientX - rect.left, y: e.clientY - rect.top });
                }}
                onMouseLeave={() => setHover((h) => (h?.iso3 === p.iso3 ? null : h))}
                onFocus={() => setHover({ iso3: p.iso3, x: p.centroid[0], y: p.centroid[1] })}
                onBlur={() => setHover(null)}
              />
            );
          })}
        </svg>

        {hover && values[hover.iso3] && (
          <Tooltip
            x={hover.x}
            y={hover.y}
            name={paths.find((p) => p.iso3 === hover.iso3)?.name ?? hover.iso3}
            value={values[hover.iso3].value}
            year={values[hover.iso3].year}
            unit={unit}
            width={width}
          />
        )}
      </div>

      <MapLegend stops={legendStops} unit={unit} label={metricLabel} />
    </div>
  );
}

function Tooltip({
  x,
  y,
  name,
  value,
  year,
  unit,
  width,
}: {
  x: number;
  y: number;
  name: string;
  value: number;
  year: number;
  unit: string;
  width: number;
}) {
  const flip = x > width - 160;
  return (
    <div
      className="pointer-events-none absolute z-10 rounded-md border border-paper-line bg-paper px-2.5 py-1.5 text-xs shadow-md"
      style={{
        left: flip ? x - 12 : x + 12,
        top: y + 12,
        transform: flip ? "translateX(-100%)" : undefined,
      }}
    >
      <div className="font-semibold text-ink">{name}</div>
      <div className="text-ink-muted">
        {fmt(value, value < 100 ? 1 : 0)} {unit} · {year}
      </div>
    </div>
  );
}

function MapLegend({ stops, unit, label }: { stops: number[]; unit: string; label: string }) {
  return (
    <div className="mt-3 px-2">
      <div className="mb-1 text-xs font-medium text-ink-muted">
        {label} ({unit})
      </div>
      <div className="flex items-stretch">
        {SEQUENTIAL_GREEN.map((c, i) => (
          <div key={c} className="flex-1">
            <div className="h-3 w-full" style={{ background: c }} />
            <div className="mt-1 text-[10px] tabular-nums text-ink-faint">
              {stops[i] !== undefined ? fmt(Math.round(stops[i])) : ""}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
