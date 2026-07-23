import type { TimelineEvent } from "@/lib/types";

/** Hendelser til den interaktive tidslinjen på Norge-siden. */
export const timeline: TimelineEvent[] = [
  {
    year: 1900,
    title: "Storhogstens tid",
    tag: "Hogst",
    body:
      "Rundt århundreskiftet var norske skoger sterkt uthogd etter tiår med eksport av tømmer og trelast. Stående volum var lavt og mange skoger var glisne.",
  },
  {
    year: 1919,
    title: "Landsskogtakseringen starter",
    tag: "Kunnskap",
    body:
      "Norge blir et av de første landene i verden med en systematisk, utvalgsbasert skogtaksering. For første gang kan skogens tilstand måles objektivt.",
  },
  {
    year: 1945,
    title: "Storstilt skogplanting",
    tag: "Planting",
    body:
      "Etter krigen settes det i gang omfattende planting og skogreising, blant annet med gran på Vestlandet. Grunnlaget for dagens volumøkning legges.",
  },
  {
    year: 1970,
    title: "Moderne, mekanisert skogbruk",
    tag: "Skogbruk",
    body:
      "Hogstmaskiner og planmessig skjøtsel gir jevn foryngelse. Tilveksten øker raskere enn avvirkningen, og volumet begynner å bygge seg opp for alvor.",
  },
  {
    year: 1990,
    title: "Miljøsertifisering og hensyn",
    tag: "Miljø",
    body:
      "Levende Skog-standarden og senere PEFC/FSC-sertifisering endrer skogbruket. Mer hensyn til biologisk mangfold, kantsoner og gammelskog.",
  },
  {
    year: 2020,
    title: "Rekordhøyt karbonlager",
    tag: "Karbon",
    body:
      "Stående volum og karbonlager i levende biomasse er de høyeste som er målt. Skogen er blitt et betydelig netto karbonopptak for Norge.",
  },
];
