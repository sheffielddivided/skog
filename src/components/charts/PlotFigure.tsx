"use client";

import { useEffect, useRef, useState } from "react";
import type * as Plot from "@observablehq/plot";

export type PlotBuilder = (
  plot: typeof Plot,
  width: number,
) => SVGSVGElement | HTMLElement;

/**
 * Generisk, responsiv og lat renderer for Observable Plot.
 *
 * - Laster Plot-biblioteket først når grafen er i (eller nær) viewporten
 *   (lazy loading, jf. ytelseskravet).
 * - Re-rendrer ved bredde­endring via ResizeObserver.
 * - Eksponerer det gjengitte <svg> til foreldre for PNG-eksport.
 */
export function PlotFigure({
  build,
  ariaLabel,
  minHeight = 300,
  onSvg,
}: {
  build: PlotBuilder;
  ariaLabel: string;
  minHeight?: number;
  onSvg?: (svg: SVGSVGElement | null) => void;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  const [width, setWidth] = useState(0);

  // Lat innlasting: aktiver når nær viewport.
  useEffect(() => {
    const el = hostRef.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setInView(true);
          io.disconnect();
        }
      },
      { rootMargin: "200px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Følg bredden.
  useEffect(() => {
    const el = hostRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width ?? 0;
      if (w) setWidth(Math.round(w));
    });
    ro.observe(el);
    setWidth(Math.round(el.getBoundingClientRect().width));
    return () => ro.disconnect();
  }, []);

  // Render.
  useEffect(() => {
    const el = hostRef.current;
    if (!el || !inView || width === 0) return;

    let cancelled = false;
    let node: SVGSVGElement | HTMLElement | null = null;

    import("@observablehq/plot").then((plot) => {
      if (cancelled || !hostRef.current) return;
      node = build(plot, width);
      hostRef.current.replaceChildren(node);
      const svg =
        node instanceof SVGSVGElement
          ? node
          : (node.querySelector("svg") as SVGSVGElement | null);
      onSvg?.(svg);
    });

    return () => {
      cancelled = true;
    };
  }, [build, inView, width, onSvg]);

  return (
    <div
      ref={hostRef}
      className="plot-host w-full"
      style={{ minHeight }}
      role="img"
      aria-label={ariaLabel}
    >
      {!inView && (
        <div
          className="flex h-full w-full items-center justify-center text-sm text-ink-faint"
          style={{ minHeight }}
        >
          Laster graf …
        </div>
      )}
    </div>
  );
}
