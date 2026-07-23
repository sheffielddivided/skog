"use client";

import { useCallback } from "react";
import { PlotFigure, type PlotBuilder } from "./charts/PlotFigure";
import { fmt } from "@/lib/format";

/** Stor, dramatisk hero-graf: stående volum i Norge, minimal akse-krom. */
export function HeroChart({
  points,
  unit = "mill. m³",
}: {
  points: { year: number; value: number }[];
  unit?: string;
}) {
  const build = useCallback<PlotBuilder>(
    (Plot, width) => {
      const first = points[0];
      const last = points[points.length - 1];
      const tall = width < 520;
      const height = tall ? 300 : 420;

      return Plot.plot({
        width,
        height,
        marginLeft: 44,
        marginRight: 16,
        marginTop: 28,
        marginBottom: 30,
        style: { fontSize: "12px", color: "#3d3d3d" },
        x: { label: null, tickFormat: "d", ticks: 6 },
        y: { label: null, grid: true, nice: true, tickFormat: (d: number) => fmt(d) },
        marks: [
          Plot.areaY(points, {
            x: "year",
            y: "value",
            fill: "#2f7d32",
            fillOpacity: 0.12,
            curve: "monotone-x",
          }),
          Plot.lineY(points, {
            x: "year",
            y: "value",
            stroke: "#1c5220",
            strokeWidth: 3,
            curve: "monotone-x",
          }),
          Plot.dot([first, last], { x: "year", y: "value", fill: "#1c5220", r: 4 }),
          Plot.text([first], {
            x: "year",
            y: "value",
            text: (d: { value: number }) => `${fmt(d.value)} ${unit}`,
            dy: -12,
            dx: 6,
            textAnchor: "start",
            fontWeight: 600,
            fill: "#1c5220",
          }),
          Plot.text([last], {
            x: "year",
            y: "value",
            text: (d: { value: number }) => `${fmt(d.value)} ${unit}`,
            dy: -12,
            dx: -6,
            textAnchor: "end",
            fontWeight: 600,
            fill: "#1c5220",
          }),
          Plot.ruleY([0], { stroke: "#000", strokeOpacity: 0.15 }),
        ],
      }) as SVGSVGElement;
    },
    [points, unit],
  );

  return (
    <PlotFigure
      build={build}
      ariaLabel="Hero-graf: stående volum i norsk skog fra 1925 til i dag"
      minHeight={320}
    />
  );
}
