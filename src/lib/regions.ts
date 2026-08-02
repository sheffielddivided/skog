import type { Region } from "./types";

/** Norske navn på verdensdeler, delt mellom server og klient. */
export const REGION_LABELS_NO: Record<Region, string> = {
  Africa: "Afrika",
  Americas: "Amerika",
  Asia: "Asia",
  Europe: "Europa",
  Oceania: "Oseania",
  Antarctic: "Antarktis",
  Global: "Verden",
};

/** Rekkefølge for gruppering i menyer. */
export const REGION_ORDER: Region[] = [
  "Europe",
  "Asia",
  "Africa",
  "Americas",
  "Oceania",
  "Antarctic",
];

export function regionLabel(region: Region): string {
  return REGION_LABELS_NO[region] ?? region;
}
