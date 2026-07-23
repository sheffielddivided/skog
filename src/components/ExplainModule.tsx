import type { Driver } from "@/lib/types";

/**
 * "Explain"-seksjon under en graf. Hver driver kan åpnes for mer forklaring
 * (jf. «Hver faktor skal kunne åpnes»). Rent HTML <details> – fungerer uten JS
 * og er tastaturvennlig.
 */
export function ExplainModule({
  question,
  intro,
  drivers,
}: {
  question: string;
  intro?: string;
  drivers: Driver[];
}) {
  return (
    <div>
      <details className="group" open>
        <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-semibold text-forest-700">
          <span aria-hidden className="transition-transform group-open:rotate-90">▸</span>
          {question}
        </summary>
        <div className="mt-3 pl-5">
          {intro && <p className="mb-3 text-sm leading-6 text-ink-soft">{intro}</p>}
          <ul className="space-y-1.5">
            {drivers.map((d) => (
              <li key={d.title}>
                <details className="rounded-md border border-paper-line bg-paper-soft px-3 py-2">
                  <summary className="flex cursor-pointer list-none items-baseline justify-between gap-3 text-sm">
                    <span className="font-medium text-ink">{d.title}</span>
                    <span className="shrink-0 text-xs text-ink-muted">{d.short}</span>
                  </summary>
                  <p className="mt-2 text-sm leading-6 text-ink-soft">{d.detail}</p>
                </details>
              </li>
            ))}
          </ul>
        </div>
      </details>
    </div>
  );
}
