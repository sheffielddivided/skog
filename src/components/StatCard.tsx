import type { ReactNode } from "react";

/** Nøkkeltall-kort brukt på forsiden og temasidene. */
export function StatCard({
  value,
  label,
  sub,
  accent = false,
}: {
  value: ReactNode;
  label: ReactNode;
  sub?: ReactNode;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-5 ${
        accent ? "border-forest-200 bg-forest-50" : "border-paper-line bg-paper-soft"
      }`}
    >
      <div className={`font-serif text-3xl font-semibold tracking-tight ${accent ? "text-forest-700" : "text-ink"}`}>
        {value}
      </div>
      <div className="mt-1 text-sm font-medium text-ink">{label}</div>
      {sub && <div className="mt-1 text-xs leading-5 text-ink-muted">{sub}</div>}
    </div>
  );
}
