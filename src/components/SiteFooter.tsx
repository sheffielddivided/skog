import Link from "next/link";
import { getMeta, getSources } from "@/lib/data";
import { fmtDate } from "@/lib/format";

export function SiteFooter() {
  const meta = getMeta();
  const sources = getSources();

  return (
    <footer className="mt-24 border-t border-paper-line bg-paper-soft">
      <div className="mx-auto max-w-wide px-4 py-12 sm:px-6">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <h2 className="font-serif text-base font-semibold">Skogens utvikling</h2>
            <p className="mt-2 text-sm leading-6 text-ink-muted">
              En åpen kunnskapsportal om skogareal, volum, biomasse og karbon i
              Norge og resten av verden – i «Our World in Data»-ånd.
            </p>
          </div>

          <nav aria-label="Sider">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-faint">Sider</h2>
            <ul className="mt-3 space-y-2 text-sm">
              <li><Link className="text-ink-soft hover:text-forest-700" href="/norge">Norge</Link></li>
              <li><Link className="text-ink-soft hover:text-forest-700" href="/verden">Verden</Link></li>
              <li><Link className="text-ink-soft hover:text-forest-700" href="/sammenlikning">Sammenlikning</Link></li>
              <li><Link className="text-ink-soft hover:text-forest-700" href="/forklaringer">Forklaringer</Link></li>
            </ul>
          </nav>

          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-faint">Datakilder</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {sources.map((s) => (
                <li key={s.id}>
                  <a className="text-ink-soft hover:text-forest-700" href={s.url} target="_blank" rel="noreferrer">
                    {s.shortName}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-faint">API</h2>
            <ul className="mt-3 space-y-2 font-mono text-xs text-ink-muted">
              <li>GET /api/countries</li>
              <li>GET /api/metrics</li>
              <li>GET /api/series</li>
            </ul>
            <p className="mt-4 text-xs text-ink-faint">
              Hurtigbuffer bygget {fmtDate(meta.generatedAt)}.
            </p>
          </div>
        </div>

        <p className="mt-10 border-t border-paper-line pt-6 text-xs text-ink-faint">
          Data fra SSB/NIBIO, FAO FRA og Global Carbon Project. All data kan lastes
          ned som CSV/JSON fra hver graf. Åpen kildekode.
        </p>
      </div>
    </footer>
  );
}
