import Link from "next/link";
import { HeroChart } from "@/components/HeroChart";
import { StatCard } from "@/components/StatCard";
import { TimeSeriesFigure } from "@/components/charts/TimeSeriesFigure";
import { ExplainModule } from "@/components/ExplainModule";
import { getSeries, getMeta, getSource } from "@/lib/data";
import { fmt, fmtDate, multiplier } from "@/lib/format";
import { biomassDrivers } from "@data/seed/drivers";
import { SERIES_COLORS } from "@/lib/palette";

export default function HomePage() {
  const volume = getSeries("NOR", "standing_volume")!;
  const increment = getSeries("NOR", "annual_increment")!;
  const harvest = getSeries("NOR", "harvest")!;
  const meta = getMeta();
  const ssb = getSource("ssb")!;

  const first = volume.points[0];
  const last = volume.points[volume.points.length - 1];
  const incLast = increment.points[increment.points.length - 1];
  const harvLast = harvest.points[harvest.points.length - 1];

  const updated = fmtDate(meta.generatedAt);

  return (
    <div>
      {/* HERO */}
      <section className="border-b border-paper-line bg-gradient-to-b from-forest-50/60 to-paper">
        <div className="mx-auto max-w-story px-4 pb-6 pt-14 sm:px-6 sm:pt-20">
          <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-forest-600">
            Skogens utvikling
          </p>
          <h1 className="headline text-hero">
            Tre ganger mer skog enn for hundre år siden
          </h1>
          <p className="prose-story mt-5 max-w-prose text-lg">
            Det stående volumet i norsk skog er nær tredoblet siden 1920-tallet – fra
            om lag {fmt(first.value)} til {fmt(last.value)} millioner kubikkmeter.
            Denne siden viser hvordan skogareal, volum, biomasse og karbonlager har
            utviklet seg, med åpne data fra SSB, FAO og Global Carbon Project.
          </p>
        </div>

        <div className="mx-auto max-w-story px-2 pb-14 sm:px-6">
          <div className="rounded-2xl border border-paper-line bg-paper p-3 shadow-sm sm:p-5">
            <HeroChart points={volume.points.map((p) => ({ year: p.year, value: p.value }))} />
            <p className="mt-2 px-2 text-xs text-ink-faint">
              Stående volum i norsk skog, {first.year}–{last.year}. Kilde: {ssb.shortName}.
            </p>
          </div>
        </div>
      </section>

      {/* NØKKELTALL */}
      <section className="mx-auto max-w-wide px-4 py-14 sm:px-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            accent
            value={multiplier(first.value, last.value)}
            label="mer stående volum"
            sub={`${first.year} → ${last.year}`}
          />
          <StatCard
            value={`${fmt(incLast.value, 1)}`}
            label="mill. m³ årlig tilvekst"
            sub="Hvor mye skogen vokser hvert år"
          />
          <StatCard
            value={`${fmt(harvLast.value, 1)}`}
            label="mill. m³ avvirkning"
            sub="Langt under tilveksten – derfor øker volumet"
          />
          <StatCard
            value={`${fmt(incLast.value - harvLast.value, 1)}`}
            label="mill. m³ netto per år"
            sub="Differansen legger seg opp som ny skog"
          />
        </div>
      </section>

      {/* DEN SENTRALE GRAFEN: tilvekst vs avvirkning */}
      <section className="mx-auto max-w-story px-4 pb-8 sm:px-6">
        <div className="mb-6 max-w-prose">
          <h2 className="headline text-2xl sm:text-3xl">Hvorfor vokser skogen?</h2>
          <p className="prose-story mt-3">
            Det korte svaret ligger i én graf: vi høster mye mindre enn skogen vokser.
            Det skraverte feltet mellom tilvekst og avvirkning er skogen som blir
            stående igjen – år etter år.
          </p>
        </div>

        <TimeSeriesFigure
          id="tilvekst-vs-avvirkning"
          slug="tilvekst-vs-avvirkning"
          title="Tilvekst vs. avvirkning"
          subtitle="Norge · millioner m³ per år"
          unit="mill. m³/år"
          yLabel="mill. m³ per år"
          decimals={1}
          includeZero
          shadeBetween={["increment", "harvest"]}
          series={[
            { key: "increment", label: "Årlig tilvekst", color: SERIES_COLORS.increment, points: increment.points },
            { key: "harvest", label: "Avvirkning", color: SERIES_COLORS.harvest, points: harvest.points },
          ]}
          meta={{
            sourceName: ssb.name,
            sourceUrl: ssb.url,
            updated,
            definition: increment.meta.metric.definitionNo,
            uncertainty: increment.meta.metric.uncertaintyNo,
          }}
          note="Det skraverte området er differansen som akkumuleres som økt stående volum og karbonlager."
          explain={
            <ExplainModule
              question="Hvorfor øker biomassen?"
              intro="De viktigste årsakene henger sammen – klikk hver faktor for mer."
              drivers={biomassDrivers}
            />
          }
        />
      </section>

      {/* NAVIGASJON TIL TEMASIDER */}
      <section className="mx-auto max-w-wide px-4 py-10 sm:px-6">
        <div className="grid gap-4 md:grid-cols-3">
          <NavCard
            href="/norge"
            title="Norge"
            body="Stående volum, tilvekst, avvirkning og karbonlager – med en interaktiv tidslinje over hundre års skoghistorie."
          />
          <NavCard
            href="/europa"
            title="Europa"
            body="Klikk deg gjennom et kart over europeisk skog. Velg indikator og land, og åpne tidsserien."
          />
          <NavCard
            href="/sammenlikning"
            title="Sammenlikning"
            body="Sammenlign flere land i samme graf – Norge, Sverige, Finland, Tyskland, Frankrike og flere."
          />
        </div>
      </section>
    </div>
  );
}

function NavCard({ href, title, body }: { href: string; title: string; body: string }) {
  return (
    <Link
      href={href}
      className="group rounded-xl border border-paper-line bg-paper p-6 transition-colors hover:border-forest-300 hover:bg-forest-50/40"
    >
      <h3 className="headline flex items-center gap-2 text-xl">
        {title}
        <span aria-hidden className="text-forest-500 transition-transform group-hover:translate-x-0.5">→</span>
      </h3>
      <p className="mt-2 text-sm leading-6 text-ink-muted">{body}</p>
    </Link>
  );
}
