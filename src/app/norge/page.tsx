import type { Metadata } from "next";
import { TimeSeriesFigure } from "@/components/charts/TimeSeriesFigure";
import { ExplainModule } from "@/components/ExplainModule";
import { Timeline } from "@/components/Timeline";
import { getSeries, getMeta, getSource } from "@/lib/data";
import { fmtDate } from "@/lib/format";
import { timeline } from "@data/seed/timeline";
import { biomassDrivers, volumeDrivers, carbonDrivers } from "@data/seed/drivers";
import { SERIES_COLORS } from "@/lib/palette";

export const metadata: Metadata = {
  title: "Norge",
  description:
    "Hvordan har norsk skog utviklet seg? Stående volum, årlig tilvekst, avvirkning, karbonlager og biomasse – med interaktiv tidslinje.",
};

export default function NorgePage() {
  const volume = getSeries("NOR", "standing_volume")!;
  const increment = getSeries("NOR", "annual_increment")!;
  const harvest = getSeries("NOR", "harvest")!;
  const carbon = getSeries("NOR", "carbon_stock")!;
  const biomass = getSeries("NOR", "biomass_per_ha")!;
  const meta = getMeta();
  const updated = fmtDate(meta.generatedAt);

  const metaFor = (s: typeof volume) => ({
    sourceName: s.meta.source.name,
    sourceUrl: s.meta.source.url,
    updated,
    definition: s.meta.metric.definitionNo,
    uncertainty: s.meta.metric.uncertaintyNo,
  });

  return (
    <div className="mx-auto max-w-story px-4 py-12 sm:px-6">
      <header className="max-w-prose">
        <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-forest-600">Norge</p>
        <h1 className="headline text-4xl sm:text-5xl">Hvordan har norsk skog utviklet seg?</h1>
        <p className="prose-story mt-4">
          Norge var blant de første landene i verden med systematisk skogtaksering.
          Over hundre år med målinger forteller en tydelig historie: en glissen,
          uthogd skog rundt 1900 har blitt et voksende volum- og karbonlager.
        </p>
      </header>

      {/* TIDSLINJE */}
      <section className="mt-14">
        <h2 className="headline text-2xl">Hundre år på under ett minutt</h2>
        <p className="prose-story mt-2 max-w-prose">Klikk på en hendelse i tidslinjen.</p>
        <div className="mt-6">
          <Timeline events={timeline} />
        </div>
      </section>

      {/* GRAFENE */}
      <div className="mt-16 space-y-16">
        <TimeSeriesFigure
          id="staaende-volum"
          slug="staaende-volum-norge"
          title="Stående volum"
          subtitle="Norge · millioner m³"
          unit="mill. m³"
          yLabel="mill. m³"
          includeZero
          series={[
            { key: "volume", label: "Stående volum", color: SERIES_COLORS.volume, points: volume.points },
          ]}
          meta={metaFor(volume)}
          explain={
            <ExplainModule
              question="Hvorfor øker det stående volumet?"
              drivers={volumeDrivers}
            />
          }
        />

        <TimeSeriesFigure
          id="tilvekst"
          slug="tilvekst-norge"
          title="Årlig tilvekst"
          subtitle="Norge · millioner m³ per år"
          unit="mill. m³/år"
          yLabel="mill. m³ per år"
          decimals={1}
          includeZero
          series={[
            { key: "increment", label: "Årlig tilvekst", color: SERIES_COLORS.increment, points: increment.points },
          ]}
          meta={metaFor(increment)}
        />

        <div>
          <div className="mb-5 max-w-prose">
            <h2 className="headline text-2xl">Nøkkelgrafen: tilvekst mot avvirkning</h2>
            <p className="prose-story mt-2">
              Så lenge den grønne linjen ligger over den oransje, vokser skogen.
              Det skraverte feltet er skogen som blir stående igjen.
            </p>
          </div>
          <TimeSeriesFigure
            id="avvirkning"
            slug="tilvekst-vs-avvirkning-norge"
            title="Tilvekst og avvirkning"
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
            meta={metaFor(increment)}
            note="Det skraverte området er differansen som akkumuleres som økt volum og karbon."
            explain={
              <ExplainModule
                question="Hvorfor øker biomassen?"
                intro="Klikk hver faktor for mer."
                drivers={biomassDrivers}
              />
            }
          />
        </div>

        <TimeSeriesFigure
          id="karbonlager"
          slug="karbonlager-norge"
          title="Karbonlager i levende biomasse"
          subtitle="Norge · millioner tonn CO₂-ekvivalenter"
          unit="mill. t CO₂-ekv."
          yLabel="mill. t CO₂-ekv."
          includeZero
          series={[
            { key: "carbon", label: "Karbonlager", color: SERIES_COLORS.carbon, points: carbon.points },
          ]}
          meta={metaFor(carbon)}
          explain={
            <ExplainModule question="Hva betyr dette for klimaet?" drivers={carbonDrivers} />
          }
        />

        <TimeSeriesFigure
          id="biomasse-per-hektar"
          slug="biomasse-per-hektar-norge"
          title="Biomasse per hektar"
          subtitle="Norge · tonn overjordisk biomasse per hektar"
          unit="tonn/ha"
          yLabel="tonn/ha"
          includeZero
          series={[
            { key: "biomass", label: "Biomasse per hektar", color: "#8256B0", points: biomass.points },
          ]}
          meta={metaFor(biomass)}
        />
      </div>
    </div>
  );
}
