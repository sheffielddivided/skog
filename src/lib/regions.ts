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

/**
 * Kartutsnitt per verdensdel. Vi rammer inn til et fast lengde-/breddegrad-
 * rektangel (klipper bort oversjøiske territorier som Fransk Guyana og
 * Russlands ytterste øst) og roterer der en verdensdel krysser datolinjen
 * (Oseania). `null` = hele verden (tilpasses til alle land).
 */
export interface MapView {
  rotate: [number, number];
  bounds?: [[number, number], [number, number]]; // [[vest, sør], [øst, nord]]
}

export const REGION_VIEWS: Record<Region | "all", MapView | null> = {
  all: null,
  Europe: { rotate: [-10, 0], bounds: [[-25, 34], [45, 72]] },
  Asia: { rotate: [-85, 0], bounds: [[25, -11], [147, 78]] },
  Africa: { rotate: [-17, 0], bounds: [[-19, -36], [52, 38]] },
  Americas: { rotate: [95, 0], bounds: [[-168, -56], [-34, 74]] },
  Oceania: { rotate: [-150, 0], bounds: [[110, -50], [180, 8]] },
  Antarctic: { rotate: [0, 0], bounds: [[-180, -90], [180, -60]] },
  Global: null,
};
