"use client";

import { useState, type ReactNode } from "react";
import { copyPermalink } from "@/lib/export";

export interface FigureMeta {
  sourceName: string;
  sourceUrl: string;
  updated: string; // menneskelesbar dato
  definition?: string;
  uncertainty?: string;
}

/**
 * Kortramme rundt hver graf: tittel, verktøylinje (PNG/CSV/permalenke/info),
 * datakvalitet-panel, valgfrie kontroller og en "Explain"-seksjon.
 * Ren presentasjon – dataeierskap ligger i den komponerende grafen.
 */
export function FigureShell({
  id,
  title,
  subtitle,
  meta,
  onPng,
  onCsv,
  controls,
  children,
  note,
  explain,
}: {
  id: string;
  title: ReactNode;
  subtitle?: ReactNode;
  meta: FigureMeta;
  onPng?: () => void;
  onCsv?: () => void;
  controls?: ReactNode;
  children: ReactNode;
  note?: ReactNode;
  explain?: ReactNode;
}) {
  const [showInfo, setShowInfo] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handlePermalink() {
    await copyPermalink(id);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  return (
    <figure
      id={id}
      className="scroll-mt-24 rounded-xl border border-paper-line bg-paper shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
    >
      <figcaption className="flex flex-wrap items-start justify-between gap-3 border-b border-paper-line px-5 pt-4 pb-3 sm:px-6">
        <div className="min-w-0">
          <h3 className="headline text-lg sm:text-xl">{title}</h3>
          {subtitle && <p className="mt-0.5 text-sm text-ink-muted">{subtitle}</p>}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <ToolButton label="Last ned PNG" onClick={onPng} disabled={!onPng}>PNG</ToolButton>
          <ToolButton label="Last ned CSV" onClick={onCsv} disabled={!onCsv}>CSV</ToolButton>
          <ToolButton label="Kopier permalenke" onClick={handlePermalink}>
            {copied ? "Kopiert ✓" : "Lenke"}
          </ToolButton>
          <ToolButton
            label="Om data og definisjoner"
            onClick={() => setShowInfo((v) => !v)}
            pressed={showInfo}
          >
            ⓘ
          </ToolButton>
        </div>
      </figcaption>

      {showInfo && (
        <div className="border-b border-paper-line bg-paper-soft px-5 py-4 text-sm sm:px-6">
          <dl className="grid gap-3 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-ink-faint">Datakilde</dt>
              <dd className="mt-1 text-ink-soft">
                <a className="text-forest-700 underline" href={meta.sourceUrl} target="_blank" rel="noreferrer">
                  {meta.sourceName}
                </a>
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-ink-faint">Oppdatert</dt>
              <dd className="mt-1 text-ink-soft">{meta.updated}</dd>
            </div>
            {meta.definition && (
              <div className="sm:col-span-2">
                <dt className="text-xs font-semibold uppercase tracking-wide text-ink-faint">Definisjon</dt>
                <dd className="mt-1 text-ink-soft">{meta.definition}</dd>
              </div>
            )}
            {meta.uncertainty && (
              <div className="sm:col-span-2">
                <dt className="text-xs font-semibold uppercase tracking-wide text-ink-faint">Usikkerhet</dt>
                <dd className="mt-1 text-ink-soft">{meta.uncertainty}</dd>
              </div>
            )}
          </dl>
        </div>
      )}

      {controls && (
        <div className="border-b border-paper-line px-5 py-3 sm:px-6">{controls}</div>
      )}

      <div className="px-2 py-4 sm:px-4">{children}</div>

      {note && <p className="px-5 pb-2 text-xs text-ink-muted sm:px-6">{note}</p>}

      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 px-5 pb-4 pt-1 text-xs text-ink-faint sm:px-6">
        <span>
          Kilde:{" "}
          <a className="hover:text-forest-700" href={meta.sourceUrl} target="_blank" rel="noreferrer">
            {meta.sourceName}
          </a>
        </span>
        <span aria-hidden>·</span>
        <span>Oppdatert {meta.updated}</span>
      </div>

      {explain && <div className="border-t border-paper-line px-5 py-4 sm:px-6">{explain}</div>}
    </figure>
  );
}

function ToolButton({
  children,
  label,
  onClick,
  disabled,
  pressed,
}: {
  children: ReactNode;
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  pressed?: boolean;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={pressed}
      onClick={onClick}
      disabled={disabled}
      className={`rounded-md border px-2.5 py-1 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
        pressed
          ? "border-forest-500 bg-forest-50 text-forest-700"
          : "border-paper-line text-ink-soft hover:border-forest-300 hover:bg-paper-sunk hover:text-ink"
      }`}
    >
      {children}
    </button>
  );
}
