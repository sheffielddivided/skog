"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { geoNaturalEarth1, geoPath } from "d3-geo";
import { scaleQuantize } from "d3-scale";
import type { FeatureCollection, Feature } from "geojson";
import { SEQUENTIAL_GREEN, DIVERGING_SINK, DIVERGING_SOURCE, DIVERGING_NEUTRAL } from "@/lib/palette";
import type { MapView } from "@/lib/regions";
import { fmt } from "@/lib/format";

type ValueMap = Record<string, { value: number; year: number }>;
type Scale = "sequential" | "diverging";

const MAX_H = 560;

/**
 * Rektangel-omriss (lon/lat) som en LineString – ikke Polygon. Et sfærisk
 * polygon er tvetydig (vindingsretning kan tolkes som «hele kloden minus
 * rektangelet»), noe som får fitWidth til å zoome ut til verdensskala. En
 * LineString gir korrekt bounding-box uansett.
 */
function rectOutline([[w, s], [e, n]]: [[number, number], [number, number]]): Feature {
  const pts: [number, number][] = [];
  const step = 2;
  for (let x = w; x <= e; x += step) pts.push([x, s]);
  for (let y = s; y <= n; y += step) pts.push([e, y]);
  for (let x = e; x >= w; x -= step) pts.push([x, n]);
  for (let y = n; y >= s; y -= step) pts.push([w, y]);
  pts.push([w, s]);
  return { type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: pts } };
}

/**
 * Interaktivt choropleth-verdenskart. Hand-rendret med d3-geo som SVG –
 * selvforsynt, tastaturnavigerbart og fargeblindvennlig. Klikk (eller
 * Enter/Space) på et land åpner tidsserien. `view` rammer inn til én verdensdel
 * (fast rektangel + evt. rotasjon over datolinjen); `scale="diverging"` gir en
 * sluk/kilde-fargeskala (teal/oransje) sentrert på null.
 */
export function WorldMap({
  geo,
  values,
  unit,
  metricLabel,
  selected,
  onSelect,
  view = null,
  scale = "sequential",
  decimals = 0,
}: {
  geo: FeatureCollection;
  values: ValueMap;
  unit: string;
  metricLabel: string;
  selected?: string;
  onSelect: (iso3: string) => void;
  view?: MapView | null;
  scale?: Scale;
  decimals?: number;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(720);
  const [hover, setHover] = useState<{ iso3: string; x: number; y: number } | null>(null);

  useEffect(() => {
    const el = hostRef.current;
    if (!el) return;
    const ro = new ResizeObserver((e) => {
      const w = e[0]?.contentRect.width;
      if (w) setWidth(Math.round(w));
    });
    ro.observe(el);
    setWidth(Math.round(el.getBoundingClientRect().width || 720));
    return () => ro.disconnect();
  }, []);

  const { paths, height, colorFn, legend } = useMemo(() => {
    const projection = geoNaturalEarth1();
    if (view?.rotate) projection.rotate(view.rotate);
    const fitTarget: Feature | FeatureCollection = view?.bounds ? rectOutline(view.bounds) : geo;

    projection.fitWidth(width, fitTarget);
    let path = geoPath(projection);
    let b = path.bounds(fitTarget);
    let h = Math.ceil(b[1][1] - b[0][1]);

    if (h > MAX_H) {
      // For høyt utsnitt: tilpass innenfor en boks og sentrer.
      projection.fitExtent(
        [
          [0, 0],
          [width, MAX_H],
        ],
        fitTarget,
      );
      path = geoPath(projection);
      b = path.bounds(fitTarget);
      h = MAX_H;
      const t = projection.translate();
      projection.translate([t[0] - b[0][0] + (width - (b[1][0] - b[0][0])) / 2, t[1] - b[0][1]]);
    } else {
      const t = projection.translate();
      projection.translate([t[0] - b[0][0], t[1] - b[0][1]]);
    }
    path = geoPath(projection);

    const vals = Object.values(values).map((v) => v.value);
    const min = vals.length ? Math.min(...vals) : 0;
    const max = vals.length ? Math.max(...vals) : 1;

    let colorFn: (v: number) => string;
    let legend:
      | { kind: "sequential"; stops: number[] }
      | { kind: "diverging"; negMax: number; posMax: number };

    if (scale === "diverging") {
      const negMax = Math.min(0, min);
      const posMax = Math.max(0, max);
      const sink = scaleQuantize<string>()
        .domain([negMax, 0])
        .range([...DIVERGING_SINK].reverse());
      const source = scaleQuantize<string>()
        .domain([0, posMax || 1])
        .range([...DIVERGING_SOURCE]);
      colorFn = (v) => (v < 0 ? sink(v) : v > 0 ? source(v) : DIVERGING_NEUTRAL);
      legend = { kind: "diverging", negMax, posMax };
    } else {
      const seq = scaleQuantize<string>().domain([min, max]).range([...SEQUENTIAL_GREEN]);
      colorFn = (v) => seq(v);
      legend = { kind: "sequential", stops: [min, ...seq.thresholds(), max] };
    }

    const paths = geo.features.map((f: Feature) => ({
      iso3: String(f.id),
      name:
        (f.properties as { nameNo?: string; name?: string })?.nameNo ??
        (f.properties as { name?: string })?.name ??
        String(f.id),
      d: path(f) ?? "",
      centroid: path.centroid(f),
    }));

    return { paths, height: h, colorFn, legend };
  }, [geo, values, width, view, scale]);

  const fmtVal = (v: number) => fmt(v, Math.abs(v) < 100 ? Math.max(decimals, 1) : decimals);

  return (
    <div>
      <div ref={hostRef} className="relative w-full">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          width="100%"
          height={height}
          role="group"
          aria-label={`Verdenskart fargelagt etter ${metricLabel}`}
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
                fill={hasData ? colorFn(v.value) : "#eceae3"}
                stroke={isSel ? "#111827" : "#ffffff"}
                strokeWidth={isSel ? 2 : 0.4}
                tabIndex={hasData ? 0 : -1}
                role={hasData ? "button" : undefined}
                aria-label={
                  hasData
                    ? `${p.name}: ${fmtVal(v.value)} ${unit} (${v.year})`
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
            text={`${fmtVal(values[hover.iso3].value)} ${unit} · ${values[hover.iso3].year}`}
            width={width}
          />
        )}
      </div>

      {legend.kind === "diverging" ? (
        <DivergingLegend negMax={legend.negMax} posMax={legend.posMax} unit={unit} label={metricLabel} />
      ) : (
        <SequentialLegend stops={legend.stops} unit={unit} label={metricLabel} />
      )}
    </div>
  );
}

function Tooltip({
  x,
  y,
  name,
  text,
  width,
}: {
  x: number;
  y: number;
  name: string;
  text: string;
  width: number;
}) {
  const flip = x > width - 170;
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
      <div className="text-ink-muted">{text}</div>
    </div>
  );
}

function SequentialLegend({ stops, unit, label }: { stops: number[]; unit: string; label: string }) {
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

function DivergingLegend({
  negMax,
  posMax,
  unit,
  label,
}: {
  negMax: number;
  posMax: number;
  unit: string;
  label: string;
}) {
  const swatches = [...[...DIVERGING_SINK].reverse(), DIVERGING_NEUTRAL, ...DIVERGING_SOURCE];
  return (
    <div className="mt-3 px-2">
      <div className="mb-1 text-xs font-medium text-ink-muted">
        {label} ({unit})
      </div>
      <div className="flex items-stretch">
        {swatches.map((c, i) => (
          <div key={i} className="h-3 flex-1" style={{ background: c }} />
        ))}
      </div>
      <div className="mt-1 flex justify-between text-[10px] tabular-nums text-ink-faint">
        <span>{fmt(Math.round(negMax))} (opptak)</span>
        <span>0</span>
        <span>+{fmt(Math.round(posMax))} (utslipp)</span>
      </div>
    </div>
  );
}
