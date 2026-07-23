import type { Metadata } from "next";
import Link from "next/link";
import { ExplainModule } from "@/components/ExplainModule";
import { biomassDrivers } from "@data/seed/drivers";

export const metadata: Metadata = {
  title: "Forklaringer",
  description:
    "Hvorfor vokser skogen? En forklarende artikkel om driverne bak økningen i norsk og europeisk skogvolum, biomasse og karbon.",
};

export default function ForklaringerPage() {
  return (
    <article className="mx-auto max-w-prose px-4 py-12 sm:px-6">
      <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-forest-600">Forklaringer</p>
      <h1 className="headline text-4xl sm:text-5xl">Hvorfor vokser skogen?</h1>

      <div className="prose-story mt-6">
        <p>
          At skogen i Norge og store deler av Europa vokser, overrasker mange. Vi er
          vant til å høre om avskoging globalt – i tropene forsvinner skog i høyt
          tempo. Men i tempererte og boreale strøk er bildet et helt annet: her har
          skogen bygd seg opp gjennom hele det tjuende århundret.
        </p>

        <h2 className="headline mt-10 text-2xl">Fra uthogd til frodig</h2>
        <p>
          Rundt år 1900 var norske skoger tynnere enn i dag. Tømmer og trelast var en
          bærebjelke i økonomien, og uttaket var stort. Da{" "}
          <Link href="/norge#staaende-volum">Landsskogtakseringen</Link> startet i
          1919, kunne skogens tilstand for første gang måles systematisk – og den var
          langt fra urørt villmark.
        </p>
        <p>
          Etterpå snudde det. Ved ble erstattet av elektrisitet og olje, det ble
          plantet i stor skala, og beitepresset fra husdyr i utmark falt. Skogen fikk
          rett og slett vokse.
        </p>

        <h2 className="headline mt-10 text-2xl">Regnestykket bak</h2>
        <p>
          Det grunnleggende regnestykket er enkelt. Hvert år legger skogen på seg ny
          tilvekst, og hvert år tas noe ut gjennom avvirkning og naturlig avgang. Så
          lenge tilveksten er større enn uttaket, øker det stående volumet – og med
          det biomassen og karbonlageret.
        </p>
        <p>
          I Norge er tilveksten i dag rundt 25 millioner kubikkmeter i året, mens
          avvirkningen ligger på rundt 11. Differansen – over halvparten av
          tilveksten – blir stående igjen. Se dette i praksis i grafen{" "}
          <Link href="/norge#avvirkning">tilvekst mot avvirkning</Link>.
        </p>
      </div>

      <div className="mt-10 rounded-xl border border-paper-line bg-paper-soft p-5 sm:p-6">
        <ExplainModule
          question="De sju viktigste driverne"
          intro="Årsakene henger sammen og forsterker hverandre. Klikk hver faktor."
          drivers={biomassDrivers}
        />
      </div>

      <div className="prose-story mt-10">
        <h2 className="headline mt-4 text-2xl">Hva med klimaet?</h2>
        <p>
          En voksende skog trekker CO₂ ut av atmosfæren og lagrer karbonet i ved,
          røtter og jord. Norsk skog er derfor et betydelig netto karbonopptak. Økt
          CO₂ og lengre vekstsesong bidrar også til veksten, men effekten er mindre
          enn de menneskeskapte endringene i arealbruk og skogskjøtsel.
        </p>
        <p>
          Samtidig er ikke bildet entydig positivt. Tett, ensaldret plantasjeskog kan
          være fattig på biologisk mangfold, og eldre naturskog forsvinner. Derfor
          bør volum og karbon leses sammen med indikatorer for mangfold, død ved og
          gammelskog – slikt vi ønsker å bygge inn i framtidige moduler.
        </p>
      </div>

      <nav className="mt-12 flex flex-wrap gap-3" aria-label="Videre lesning">
        <Link
          href="/norge"
          className="rounded-full border border-forest-300 bg-forest-50 px-4 py-2 text-sm font-medium text-forest-700 hover:bg-forest-100"
        >
          Se tallene for Norge →
        </Link>
        <Link
          href="/kilder"
          className="rounded-full border border-paper-line px-4 py-2 text-sm font-medium text-ink-soft hover:bg-paper-sunk"
        >
          Data, metode og kilder →
        </Link>
      </nav>
    </article>
  );
}
