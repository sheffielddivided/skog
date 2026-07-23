import type { Metadata } from "next";
import { getSources, getMetrics, getMeta, getSource } from "@/lib/data";
import { fmtDate } from "@/lib/format";

export const metadata: Metadata = {
  title: "Data & kilder",
  description:
    "Datakilder, definisjoner, usikkerheter, datamodell, internt API og metode for oppdatering.",
};

export default function KilderPage() {
  const sources = getSources();
  const metrics = getMetrics();
  const meta = getMeta();

  return (
    <div className="mx-auto max-w-story px-4 py-12 sm:px-6">
      <header className="max-w-prose">
        <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-forest-600">Data & kilder</p>
        <h1 className="headline text-4xl sm:text-5xl">Åpenhet om data</h1>
        <p className="prose-story mt-4">
          All data på denne siden kommer fra åpne, offentlige kilder og kan lastes ned
          som CSV eller JSON fra hver graf. Under finner du kilder, definisjoner,
          kjente usikkerheter, datamodellen og det interne API-et.
        </p>
        <p className="mt-2 text-sm text-ink-faint">
          Hurtigbuffer sist bygget: {fmtDate(meta.generatedAt)} · {meta.seriesCount} serier ·{" "}
          {meta.observationCount.toLocaleString("nb-NO")} observasjoner.
        </p>
      </header>

      {/* KILDER */}
      <section className="mt-12">
        <h2 className="headline text-2xl">Datakilder</h2>
        <ul className="mt-4 space-y-4">
          {sources.map((s) => (
            <li key={s.id} className="rounded-lg border border-paper-line bg-paper-soft p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <a href={s.url} target="_blank" rel="noreferrer" className="font-medium text-forest-700 underline">
                  {s.name}
                </a>
                <span className="text-xs text-ink-faint">Hentet {fmtDate(s.retrieved)}</span>
              </div>
              <p className="mt-1 text-sm text-ink-muted">Lisens: {s.license}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* INDIKATORER / DATAKVALITET */}
      <section className="mt-12">
        <h2 className="headline text-2xl">Indikatorer, definisjoner og usikkerhet</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-paper-line text-left text-xs uppercase tracking-wide text-ink-faint">
                <th className="py-2 pr-4 font-semibold">Indikator</th>
                <th className="py-2 pr-4 font-semibold">Enhet</th>
                <th className="py-2 pr-4 font-semibold">Definisjon</th>
                <th className="py-2 pr-4 font-semibold">Usikkerhet</th>
                <th className="py-2 font-semibold">Kilde</th>
              </tr>
            </thead>
            <tbody>
              {metrics.map((m) => (
                <tr key={m.id} className="border-b border-paper-line align-top">
                  <td className="py-3 pr-4 font-medium text-ink">{m.nameNo}</td>
                  <td className="py-3 pr-4 text-ink-muted">{m.unit}</td>
                  <td className="py-3 pr-4 text-ink-soft">{m.definitionNo}</td>
                  <td className="py-3 pr-4 text-ink-muted">{m.uncertaintyNo}</td>
                  <td className="py-3 text-ink-muted">{getSource(m.sourceId)?.shortName}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* DATAMODELL */}
      <section className="mt-12">
        <h2 className="headline text-2xl">Datamodell</h2>
        <p className="prose-story mt-3">
          Modellen er bevisst enkel og normalisert, slik at nye datasett kan kobles på
          uten å endre grafene. Alt er observasjoner av formen{" "}
          <code className="rounded bg-paper-sunk px-1.5 py-0.5 text-sm">land × indikator × år → verdi</code>.
        </p>
        <pre className="mt-4 overflow-x-auto rounded-lg border border-paper-line bg-ink p-4 text-xs leading-6 text-paper">
{`Country      { id, iso2, name, nameNo, region }
Metric       { id, name, unit, definition, uncertainty, sourceId }
Observation  { countryId, metricId, year, value, quality }
DataSource   { id, name, url, retrieved, license }`}
        </pre>
      </section>

      {/* API */}
      <section className="mt-12">
        <h2 className="headline text-2xl">Internt API</h2>
        <p className="prose-story mt-3">
          Grafene henter aldri direkte fra SSB eller FAO. Alt går gjennom en nattlig
          importtjeneste til et JSON-hurtigbuffer, og serveres via et internt REST-API.
        </p>
        <div className="mt-4 space-y-3 font-mono text-sm">
          <ApiRow method="GET" path="/api/countries" desc="Alle land" />
          <ApiRow method="GET" path="/api/metrics" desc="Alle indikatorer" />
          <ApiRow method="GET" path="/api/series?country=Norway&metric=growing_stock" desc="Tidsserie" />
          <ApiRow method="GET" path="/api/meta" desc="Datakvalitet og kilder" />
        </div>
        <p className="mt-4 text-sm text-ink-muted">Eksempelrespons for <code>/api/series</code>:</p>
        <pre className="mt-2 overflow-x-auto rounded-lg border border-paper-line bg-ink p-4 text-xs leading-6 text-paper">
{`[
  { "year": 1990, "value": 590, "quality": "measured" },
  { "year": 1991, "value": 601, "quality": "interpolated" }
]`}
        </pre>
      </section>

      {/* METODE / OPPDATERING */}
      <section className="mt-12">
        <h2 className="headline text-2xl">Metode og oppdatering</h2>
        <p className="prose-story mt-3">{meta.method}</p>
        <ol className="prose-story mt-3 list-decimal space-y-1 pl-6 text-base">
          <li>En cron-jobb kjører hver natt.</li>
          <li>Importtjenesten henter ferske tall fra SSB, FAO og Global Carbon Project.</li>
          <li>Dataene valideres og normaliseres.</li>
          <li>JSON-hurtigbufferet bygges på nytt.</li>
          <li>Nettsiden deployes automatisk.</li>
        </ol>
      </section>
    </div>
  );
}

function ApiRow({ method, path, desc }: { method: string; path: string; desc: string }) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-paper-line bg-paper-soft px-4 py-2.5">
      <span className="rounded bg-forest-700 px-2 py-0.5 text-xs font-bold text-paper">{method}</span>
      <code className="text-ink">{path}</code>
      <span className="ml-auto text-xs text-ink-muted">{desc}</span>
    </div>
  );
}
