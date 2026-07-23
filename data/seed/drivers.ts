import type { Driver } from "@/lib/types";

/** Drivere brukt i "Explain"-modulene, f.eks. "Hvorfor øker biomassen?". */
export const biomassDrivers: Driver[] = [
  {
    title: "Mindre vedhogst",
    short: "Ved er byttet ut med strøm og olje til oppvarming.",
    detail:
      "Fra 1900-tallet erstattet elektrisitet, parafin og fjernvarme ved som oppvarmingskilde. Uttaket av ved til husholdninger falt kraftig, og mer biomasse ble stående igjen i skogen.",
  },
  {
    title: "Aktiv planting",
    short: "Systematisk foryngelse etter hogst siden 1950-tallet.",
    detail:
      "Skogloven stiller krav om foryngelse etter hogst. Milliarder av planter er satt ut, ofte med gran, noe som ga tette, produktive bestand som nå er i sterk vekst.",
  },
  {
    title: "Redusert beite",
    short: "Færre husdyr på utmarksbeite gir mer treoppslag.",
    detail:
      "Nedgangen i geiter, sauer og storfe på utmarksbeite har redusert beitepresset. Trær som før ble beitet ned, får nå vokse opp til skog.",
  },
  {
    title: "Mekanisert skogbruk",
    short: "Planmessig skjøtsel gir jevn og høy tilvekst.",
    detail:
      "Moderne skogbruk med tynning, gjødsling og planmessig hogst optimaliserer tilveksten. Bestandene holdes i den mest produktive vekstfasen.",
  },
  {
    title: "Høyere CO₂",
    short: "Mer CO₂ i lufta virker som gjødsel for trærne.",
    detail:
      "Økt atmosfærisk CO₂ (fra ~315 ppm i 1960 til over 420 ppm i dag) stimulerer fotosyntesen. Effekten er reell, men mindre enn skjøtsel og arealendringer.",
  },
  {
    title: "Lengre vekstsesong",
    short: "Klimaendringer forlenger somrene i nord.",
    detail:
      "Høyere temperaturer forlenger vekstsesongen, særlig i høyereliggende og nordlige områder. Trærne har flere dager med aktiv vekst per år.",
  },
  {
    title: "Tilvekst større enn avvirkning",
    short: "Vi høster langt mindre enn skogen vokser.",
    detail:
      "Den samlede årlige tilveksten (~25 mill. m³) er mer enn dobbelt så stor som avvirkningen (~11 mill. m³). Differansen akkumuleres år for år som økt stående volum.",
  },
];

export const volumeDrivers: Driver[] = [
  {
    title: "Oppbygging etter uthogst",
    short: "Skogen var glissen rundt 1900.",
    detail:
      "Etter tiår med hard hogst var mange skoger tynne ved århundreskiftet. Da uttaket avtok, begynte volumet å bygge seg opp fra et lavt utgangspunkt.",
  },
  {
    title: "Tette, unge produksjonsbestand",
    short: "Planting etter krigen gir vekst nå.",
    detail:
      "Bestand som ble plantet på 1950–70-tallet er nå i sin mest produktive fase. De legger på seg mye volum hvert år.",
  },
  {
    title: "Lav avvirkning i forhold til tilvekst",
    short: "Vi høster under halvparten av tilveksten.",
    detail:
      "Så lenge avvirkningen ligger godt under tilveksten, vokser det samlede volumet. Det har vært tilfellet i hele etterkrigstiden.",
  },
];

export const carbonDrivers: Driver[] = [
  {
    title: "Karbon følger biomassen",
    short: "Mer volum = mer bundet karbon.",
    detail:
      "Om lag halvparten av tørrvekten i trevirke er karbon. Når volum og biomasse øker, øker karbonlageret i levende trær tilsvarende.",
  },
  {
    title: "Netto opptak fra atmosfæren",
    short: "Skogen tar opp mer CO₂ enn den slipper ut.",
    detail:
      "Fordi tilveksten er større enn avvirkning og naturlig avgang, er norsk skog et netto karbonopptak – et av de største enkeltbidragene i det norske klimaregnskapet.",
  },
  {
    title: "Jord og dødved kommer i tillegg",
    short: "Denne grafen viser bare levende trær.",
    detail:
      "Det største karbonlageret i skog ligger faktisk i jorda. Tallene her dekker levende biomasse over og under bakken, ikke jordkarbon eller dødt trevirke.",
  },
];
