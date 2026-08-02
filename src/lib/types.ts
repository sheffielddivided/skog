/**
 * Domenemodell for "Skogens utvikling".
 *
 * Modellen er bevisst enkel og normalisert slik at nye datasett kan kobles
 * på uten å endre komponentene: alt er (Country × Metric × year → value).
 */

/** Verdensdel. "Global" er reservert for den syntetiske «Verden»-oppføringen. */
export type Region =
  | "Africa"
  | "Americas"
  | "Asia"
  | "Europe"
  | "Oceania"
  | "Antarctic"
  | "Global";

export interface Country {
  /** ISO 3166-1 alpha-3, brukt som primærnøkkel. */
  id: string;
  /** ISO 3166-1 alpha-2 (for flagg/kart-join). */
  iso2: string;
  name: string;
  nameNo: string;
  /** Verdensdel. */
  region: Region;
  /** Underregion, f.eks. "Northern Europe" (til gruppering/filtrering). */
  subregion?: string;
}

/** Retning som "er bra" for fargelegging/tolkning – rent forklarende. */
export type MetricDirection = "up-good" | "down-good" | "neutral";

export interface DataSource {
  id: string;
  name: string;
  /** Kort navn brukt i graffoter, f.eks. "SSB" eller "FAO FRA". */
  shortName: string;
  url: string;
  /** Sist gang importtjenesten hentet kilden (ISO-dato). */
  retrieved: string;
  /** Lisens / bruksvilkår. */
  license: string;
}

export interface Metric {
  id: string;
  name: string;
  nameNo: string;
  /** Enhet vist på Y-aksen, f.eks. "mill. m³". */
  unit: string;
  /** Kort én-setnings definisjon (Datakvalitet-blokk). */
  definitionNo: string;
  /** Kjente usikkerheter/forbehold. */
  uncertaintyNo: string;
  direction: MetricDirection;
  /** Kildenøkkel (DataSource.id). */
  sourceId: string;
}

export interface Observation {
  countryId: string;
  metricId: string;
  year: number;
  value: number;
  /**
   * Hvordan verdien er framkommet. Nasjonal skogtakst gjøres i rullerende
   * sykluser, så årlige serier er ofte interpolert mellom takstår.
   */
  quality?: "measured" | "interpolated" | "estimated" | "modelled";
}

/** En ferdig tidsserie klar for graf/tabell/CSV. */
export interface Series {
  countryId: string;
  metricId: string;
  points: { year: number; value: number; quality?: Observation["quality"] }[];
  meta: {
    metric: Metric;
    country: Country;
    source: DataSource;
  };
}

/** Historiske hendelser til den interaktive tidslinjen. */
export interface TimelineEvent {
  year: number;
  title: string;
  body: string;
  tag: string;
}

/** En driver bak utviklingen, brukt i "Explain"-modulene. */
export interface Driver {
  title: string;
  short: string;
  detail: string;
}
