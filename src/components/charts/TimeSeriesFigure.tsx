"use client";

import { useCallback, useMemo, useRef, useState, type ReactNode } from "react";
import { FigureShell, type FigureMeta } from "./FigureShell";
import { PlotFigure, type PlotBuilder } from "./PlotFigure";
import { downloadCsv, svgToPng } from "@/lib/export";
import { fmt } from "@/lib/format";

export interface TimeSeriesInput {
  key: string;
  label: string;
  color: string;
  points: { year: number; value: number; quality?: string }[];
}

export function TimeSeriesFigure({
  id,
  title,
  subtitle,
  unit,
  yLabel,
  series,
  meta,
  decimals = 0,
  includeZero = false,
  shadeBetween,
  zoom = true,
  note,
  explain,
  height = 380,
  slug = "graf",
}: {
  id: string;
  title: ReactNode;
  subtitle?: ReactNode;
  unit: string;
  yLabel?: string;
  series: TimeSeriesInput[];
  meta: FigureMeta;
  decimals?: number;
  includeZero?: boolean;
  shadeBetween?: [string, string];
  zoom?: boolean;
  note?: ReactNode;
  explain?: ReactNode;
  height?: number;
  slug?: string;
}) {
  const svgRef = useRef<SVGSVGElement | null>(null);

  const [minYear, maxYear] = useMemo(() => {
    const years = series.flatMap((s) => s.points.map((p) => p.year));
    return years.length ? [Math.min(...years), Math.max(...years)] : [0, 0];
  }, [series]);

  const [lo, setLo] = useState(minYear);
  const [hi, setHi] = useState(maxYear);

  const inRange = useCallback((y: number) => y >= lo && y <= hi, [lo, hi]);

  const build = useCallback<PlotBuilder>(
    (Plot, width) => {
      const long = series.flatMap((s) =>
        s.points
          .filter((p) => inRange(p.year))
          .map((p) => ({ year: p.year, value: p.value, series: s.label })),
      );

      const domain = series.map((s) => s.label);
      const range = series.map((s) => s.color);

      const marks: unknown[] = [
        Plot.gridY({ stroke: "#000", strokeOpacity: 0.06 }),
      ];

      if (includeZero) marks.push(Plot.ruleY([0], { stroke: "#000", strokeOpacity: 0.15 }));

      if (shadeBetween) {
        const [aKey, bKey] = shadeBetween;
        const a = series.find((s) => s.key === aKey);
        const b = series.find((s) => s.key === bKey);
        if (a && b) {
          const bMap = new Map(b.points.map((p) => [p.year, p.value]));
          const shade = a.points
            .filter((p) => inRange(p.year) && bMap.has(p.year))
            .map((p) => {
              const bv = bMap.get(p.year)!;
              return { year: p.year, lo: Math.min(p.value, bv), hi: Math.max(p.value, bv) };
            });
          marks.push(
            Plot.areaY(shade, {
              x: "year",
              y1: "lo",
              y2: "hi",
              fill: a.color,
              fillOpacity: 0.13,
              curve: "monotone-x",
            }),
          );
        }
      }

      marks.push(
        Plot.line(long, {
          x: "year",
          y: "value",
          stroke: "series",
          strokeWidth: 2.4,
          curve: "monotone-x",
        }),
        Plot.ruleX(long, Plot.pointerX({ x: "year", stroke: "#000", strokeOpacity: 0.18 })),
        Plot.dot(
          long,
          Plot.pointerX({ x: "year", y: "value", stroke: "series", fill: "white", r: 4, strokeWidth: 2 }),
        ),
        Plot.tip(
          long,
          Plot.pointerX({
            x: "year",
            y: "value",
            stroke: "series",
            format: {
              x: (d: number) => String(d),
              y: (d: number) => `${fmt(d, decimals)} ${unit}`,
              stroke: true,
            },
          }),
        ),
      );

      return Plot.plot({
        width,
        height,
        marginLeft: 58,
        marginRight: 18,
        marginBottom: 34,
        style: { background: "transparent", color: "#3d3d3d", fontSize: "12px" },
        x: { label: "År", tickFormat: "d", ticks: Math.min(8, hi - lo + 1) },
        y: {
          label: `↑ ${yLabel ?? unit}`,
          grid: false,
          nice: true,
          zero: includeZero,
          tickFormat: (d: number) => fmt(d, decimals),
        },
        color: { domain, range, legend: series.length > 1 },
        marks: marks as never,
      }) as SVGSVGElement;
    },
    [series, inRange, includeZero, shadeBetween, height, hi, lo, unit, decimals, yLabel],
  );

  const onPng = useCallback(() => {
    if (svgRef.current) void svgToPng(svgRef.current, `${slug}.png`);
  }, [slug]);

  const onCsv = useCallback(() => {
    const rows = series.flatMap((s) =>
      s.points
        .filter((p) => inRange(p.year))
        .map((p) => ({
          year: p.year,
          series: s.label,
          value: p.value,
          quality: p.quality ?? "",
          unit,
        })),
    );
    rows.sort((a, b) => a.year - b.year || a.series.localeCompare(b.series));
    downloadCsv(`${slug}.csv`, rows, [
      { key: "year", header: "år" },
      { key: "series", header: "serie" },
      { key: "value", header: "verdi" },
      { key: "unit", header: "enhet" },
      { key: "quality", header: "datakvalitet" },
    ]);
  }, [series, inRange, unit, slug]);

  const controls =
    zoom && maxYear > minYear ? (
      <YearZoom
        min={minYear}
        max={maxYear}
        lo={lo}
        hi={hi}
        onChange={(a, b) => {
          setLo(a);
          setHi(b);
        }}
        onReset={() => {
          setLo(minYear);
          setHi(maxYear);
        }}
      />
    ) : undefined;

  return (
    <FigureShell
      id={id}
      title={title}
      subtitle={subtitle}
      meta={meta}
      onPng={onPng}
      onCsv={onCsv}
      controls={controls}
      note={note}
      explain={explain}
    >
      <PlotFigure
        build={build}
        ariaLabel={
          typeof title === "string" ? `Graf: ${title}` : "Interaktiv tidsseriegraf"
        }
        minHeight={height}
        onSvg={(svg) => (svgRef.current = svg)}
      />
    </FigureShell>
  );
}

function YearZoom({
  min,
  max,
  lo,
  hi,
  onChange,
  onReset,
}: {
  min: number;
  max: number;
  lo: number;
  hi: number;
  onChange: (lo: number, hi: number) => void;
  onReset: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      <span className="text-xs font-medium text-ink-muted">Zoom år</span>
      <label className="flex items-center gap-2 text-xs text-ink-soft">
        <span className="sr-only">Fra år</span>
        <input
          type="range"
          min={min}
          max={max}
          value={lo}
          aria-label="Startår"
          onChange={(e) => onChange(Math.min(Number(e.target.value), hi), hi)}
          className="h-1 w-28 cursor-pointer accent-forest-600 sm:w-40"
        />
        <span className="w-10 tabular-nums">{lo}</span>
      </label>
      <label className="flex items-center gap-2 text-xs text-ink-soft">
        <span className="sr-only">Til år</span>
        <input
          type="range"
          min={min}
          max={max}
          value={hi}
          aria-label="Sluttår"
          onChange={(e) => onChange(lo, Math.max(Number(e.target.value), lo))}
          className="h-1 w-28 cursor-pointer accent-forest-600 sm:w-40"
        />
        <span className="w-10 tabular-nums">{hi}</span>
      </label>
      {(lo !== min || hi !== max) && (
        <button
          type="button"
          onClick={onReset}
          className="text-xs font-medium text-forest-700 underline underline-offset-2"
        >
          Tilbakestill
        </button>
      )}
    </div>
  );
}
