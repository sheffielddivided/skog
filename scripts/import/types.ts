import type { Observation } from "../../src/lib/types";

/** Normalisert serie fra en importør, klar for merging inn i hurtigbufferet. */
export interface LiveSeries {
  countryId: string;
  metricId: string;
  points: { year: number; value: number; quality?: Observation["quality"] }[];
}
