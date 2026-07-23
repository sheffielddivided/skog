"use client";

import { useState } from "react";
import type { TimelineEvent } from "@/lib/types";

/** Interaktiv tidslinje. Klikk (eller tastatur) på en hendelse for detaljer. */
export function Timeline({ events }: { events: TimelineEvent[] }) {
  const sorted = [...events].sort((a, b) => a.year - b.year);
  const [active, setActive] = useState(sorted.length - 1);
  const current = sorted[active];

  return (
    <div>
      <ol className="relative flex flex-wrap gap-2 border-l-2 border-paper-line pl-0 sm:block sm:border-l-0">
        <div className="pointer-events-none absolute left-0 right-0 top-[13px] hidden h-0.5 bg-paper-line sm:block" />
        <div className="flex w-full flex-wrap justify-between gap-y-4">
          {sorted.map((e, i) => {
            const isActive = i === active;
            return (
              <li key={e.year} className="relative flex flex-col items-center">
                <button
                  type="button"
                  onClick={() => setActive(i)}
                  aria-pressed={isActive}
                  aria-label={`${e.year}: ${e.title}`}
                  className="flex flex-col items-center focus:outline-none"
                >
                  <span
                    className={`z-10 grid h-7 w-7 place-items-center rounded-full border-2 text-[10px] font-bold transition-colors ${
                      isActive
                        ? "border-forest-700 bg-forest-700 text-paper"
                        : "border-paper-line bg-paper text-ink-muted hover:border-forest-400"
                    }`}
                  >
                    ●
                  </span>
                  <span
                    className={`mt-1.5 text-sm font-semibold tabular-nums ${
                      isActive ? "text-forest-700" : "text-ink-muted"
                    }`}
                  >
                    {e.year}
                  </span>
                  <span className="mt-0.5 hidden max-w-[7rem] text-center text-[11px] leading-tight text-ink-faint sm:block">
                    {e.title}
                  </span>
                </button>
              </li>
            );
          })}
        </div>
      </ol>

      <div className="mt-6 rounded-xl border border-paper-line bg-paper-soft p-5 sm:p-6">
        <div className="flex items-baseline gap-3">
          <span className="font-serif text-3xl font-semibold text-forest-700">{current.year}</span>
          <span className="rounded-full bg-forest-100 px-2.5 py-0.5 text-xs font-medium text-forest-700">
            {current.tag}
          </span>
        </div>
        <h3 className="headline mt-2 text-xl">{current.title}</h3>
        <p className="prose-story mt-2 max-w-prose text-base">{current.body}</p>
      </div>
    </div>
  );
}
