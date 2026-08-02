import type { DataSource } from "@/lib/types";

/**
 * Datakilder. `retrieved` settes av importtjenesten (scripts/import) hver natt.
 * Verdien her er datoen seed-hurtigbufferet ble kuratert.
 */
export const sources: DataSource[] = [
  {
    id: "ssb",
    name: "Statistisk sentralbyrå – Landsskogtakseringen (NIBIO)",
    shortName: "SSB / NIBIO",
    url: "https://www.ssb.no/statbank/table/03895",
    retrieved: "2026-07-23",
    license: "CC BY 4.0 (Norge digitalt / SSB åpne data)",
  },
  {
    id: "nibio",
    name: "NIBIO – Landsskogtakseringen",
    shortName: "NIBIO",
    url: "https://www.nibio.no/tema/skog/landsskogtakseringen",
    retrieved: "2026-07-23",
    license: "CC BY 4.0",
  },
  {
    id: "fao-fra",
    name: "FAO – Global Forest Resources Assessment (FRA 2020)",
    shortName: "FAO FRA",
    url: "https://fra-data.fao.org",
    retrieved: "2026-07-23",
    license: "CC BY-NC-SA 3.0 IGO",
  },
  {
    id: "worldbank",
    name: "Verdensbanken – Forest area (AG.LND.FRST.K2, FAO-avledet)",
    shortName: "Verdensbanken / FAO",
    url: "https://data.worldbank.org/indicator/AG.LND.FRST.K2",
    retrieved: "2026-08-02",
    license: "CC BY 4.0",
  },
  {
    id: "gcp",
    name: "Global Carbon Project / NOAA Global Monitoring Laboratory",
    shortName: "Global Carbon Project",
    url: "https://globalcarbonproject.org",
    retrieved: "2026-07-23",
    license: "CC BY 4.0",
  },
  {
    id: "faostat",
    name: "FAOSTAT – Emissions from Forests (GF)",
    shortName: "FAOSTAT",
    url: "https://www.fao.org/faostat/en/#data/GF",
    retrieved: "2026-08-02",
    license: "CC BY 4.0",
  },
  {
    id: "copernicus",
    name: "Copernicus Climate Change Service (C3S)",
    shortName: "Copernicus",
    url: "https://climate.copernicus.eu",
    retrieved: "2026-07-23",
    license: "Copernicus licence (fri gjenbruk med kildehenvisning)",
  },
];
