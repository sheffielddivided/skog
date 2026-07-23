# Skogens utvikling

En moderne, kildebelagt nettside som visualiserer utviklingen i **skogareal,
stående volum, biomasse og karbonlager** i Norge og Europa over tid.

Designfilosofien ligger nær *Our World in Data*, *Financial Times Visual
Stories* og *Gapminder*: historiefortelling først, grafene dominerer – ikke et
dashboard.

> **«Tre ganger mer skog enn for hundre år siden.»**
> Stående volum i norsk skog er nær tredoblet siden 1920-tallet.

---

## Innhold

- [Funksjoner](#funksjoner)
- [Teknologistack](#teknologistack)
- [Arkitektur](#arkitektur)
- [Kom i gang](#kom-i-gang)
- [Datamodell](#datamodell)
- [Datakilder](#datakilder)
- [Internt API](#internt-api)
- [Automatisk oppdatering](#automatisk-oppdatering)
- [Tilgjengelighet og ytelse](#tilgjengelighet-og-ytelse)
- [Legge til nye datasett](#legge-til-nye-datasett)
- [Bevisste avvik fra spesifikasjonen](#bevisste-avvik-fra-spesifikasjonen)
- [Videre utvikling](#videre-utvikling)

## Funksjoner

- **Forside** med stor hero-graf og nøkkeltall.
- **Norge**: stående volum, årlig tilvekst, avvirkning, karbonlager og biomasse
  per hektar, samt en **interaktiv tidslinje** over hundre års skoghistorie.
- **Europa**: interaktivt choropleth-**kart** – velg indikator, klikk et land og
  åpne tidsserien.
- **Sammenlikning**: flere land i samme graf, med **delbar permalenke**.
- **Forklaringer**: en ren tekstside med utvidbare «Explain»-moduler.
- **Data & kilder**: definisjoner, usikkerheter, datamodell og API-dokumentasjon.
- Hver graf har **zoom**, **tooltip**, **last ned PNG**, **last ned CSV**,
  **permalenke** og en **datakvalitet**-boks (kilde, oppdatert, definisjon,
  usikkerhet).
- **«Explain»-moduler** der hver driver kan åpnes for mer forklaring.

## Teknologistack

| Lag            | Valg                                          |
| -------------- | --------------------------------------------- |
| Rammeverk      | Next.js 14 (App Router), React 18, TypeScript |
| Visualisering  | Observable Plot                               |
| Kart           | d3-geo (SVG-choropleth) + bundlet GeoJSON     |
| CSS            | Tailwind CSS                                   |
| Hosting        | Vercel                                         |

## Arkitektur

```
Datakilde (SSB / FAO / GCP)
        │   scripts/import/*        ← Data Import Service (nattlig)
        ▼
data/cache/live/series.json         ← validerte, ferske serier
        │   scripts/build-cache.ts  ← fletter live over seed
        ▼
data/cache/  (dataset.json, series/*, europe.geo.json)   ← JSON Cache
        │   src/lib/data.ts
        ▼
Next.js API  (/api/countries, /metrics, /series, /meta)
        │
        ▼
React-komponenter (server-render + late, klient-rendrede grafer)
```

Klienten henter **aldri** direkte fra SSB eller FAO. Alle eksterne datasett
lastes ned av importtjenesten og legges i et JSON-hurtigbuffer.

## Kom i gang

```bash
npm install

# Bygg datahurtigbufferet (kjøres også automatisk som «prebuild»)
npm run data:build      # seed → data/cache/*
npm run data:geo        # Europakart-GeoJSON

npm run dev             # utviklingsserver på http://localhost:3000
```

Andre nyttige kommandoer:

```bash
npm run build           # produksjonsbygg (kjører prebuild automatisk)
npm run typecheck       # tsc --noEmit
npm test                # enhets- og integritetstester
npm run data:import     # hent ferske data (krever utgående nett)
npm run data:refresh    # import + rebuild av hurtigbuffer
```

## Datamodell

Modellen er bevisst enkel og normalisert, slik at nye datasett kan kobles på
uten å endre grafene. Alt er observasjoner av formen
`land × indikator × år → verdi`.

```ts
Country     { id, iso2, name, nameNo, region }
Metric      { id, name, unit, definition, uncertainty, direction, sourceId }
Observation { countryId, metricId, year, value, quality }
DataSource  { id, name, url, retrieved, license }
```

`quality` skiller `measured` (takst-/rapporteringsår) fra `interpolated`
(mellomliggende år). CSV-nedlastingen inkluderer denne kolonnen.

## Datakilder

| Kilde                                  | Bruk                                       | Lisens              |
| -------------------------------------- | ------------------------------------------ | ------------------- |
| **SSB / NIBIO** (Landsskogtakseringen) | Norge: volum, tilvekst, avvirkning, karbon | CC BY 4.0           |
| **FAO FRA 2020**                       | Europa: areal, volum, biomasse, karbon     | CC BY-NC-SA 3.0 IGO |
| **Global Carbon Project / NOAA**       | Atmosfærisk CO₂                            | CC BY 4.0           |
| **Copernicus** (valgfritt)             | Europeisk temperatur                       | Copernicus-lisens   |

### Om tallene i dette repoet

Nettverkspolicyen i utviklingsmiljøet blokkerer SSB/FAO, så repoet leveres med
et **kuratert seed-lag** (`data/seed/`) basert på publiserte tall fra
Landsskogtakseringen og FRA 2020. Nasjonal skogtakst gjøres i rullerende
femårssykluser, og FRA rapporterer for referanseår (1990/2000/2010/2020) –
årlige verdier mellom disse er **lineært interpolert** og merket deretter.
Importtjenesten (`scripts/import/`) henter de ekte, ferske seriene når den
kjører i et miljø med utgående nett (Vercel/CI) og overstyrer seed-laget.

## Internt API

```
GET /api/countries[?includeGlobal=1]
GET /api/metrics
GET /api/series?country=Norway&metric=growing_stock[&meta=1]
GET /api/meta
```

`country` og `metric` godtar id, navn (no/en) eller vanlige aliaser
(`growing_stock` → `standing_volume`). Eksempelrespons for `/api/series`:

```json
[
  { "year": 1990, "value": 590, "quality": "measured" },
  { "year": 1991, "value": 601, "quality": "interpolated" }
]
```

## Automatisk oppdatering

En nattlig jobb (se `.github/workflows/update-data.yml`) gjør:

1. **Hent** ferske tall fra SSB, FAO og Global Carbon Project (`data:import`).
2. **Valider** og normaliser (`scripts/import/validate.ts`).
3. **Generer** JSON-hurtigbufferet på nytt (`data:build`).
4. **Commit + push** → Vercel deployer automatisk.

Kjør lokalt med `npm run data:refresh`.

## Tilgjengelighet og ytelse

- **WCAG AA**, fargeblindvennlige paletter (Okabe–Ito for serier, sekvensiell
  grønn for kartet).
- **Tastaturnavigasjon**: kartland, tidslinje og alle kontroller er fokuserbare
  og betjenbare med tastatur; «Hopp til innhold»-lenke; synlig fokusmarkering.
- **Mobil først**, responsivt oppsett, `prefers-reduced-motion` respekteres.
- **Lat innlasting**: grafene laster Observable Plot først når de er nær
  viewporten (IntersectionObserver). First Load JS ≈ 87–112 kB.
- Semantisk HTML, `role="img"`/`aria-label` på figurer, `<figure>`/`<figcaption>`.

## Legge til nye datasett

1. Legg til kilde i `data/seed/sources.ts` og indikator i `data/seed/metrics.ts`.
2. Legg inn observasjoner (ankerpunkter) i `data/seed/` – f.eks. et nytt
   `Record<metricId, Anchor[]>` eller FRA-lignende punkter.
3. Koble det inn i `scripts/build-cache.ts`.
4. Kjør `npm run data:build`. Grafene og API-et plukker det opp automatisk –
   ingen komponentendringer nødvendig.

For å hente datasettet automatisk: legg til en importør i `scripts/import/` som
returnerer `LiveSeries[]`, og registrer den i `scripts/import/index.ts`.

## Bevisste avvik fra spesifikasjonen

- **Kart: d3-geo SVG-choropleth i stedet for MapLibre.** Spesifikasjonen foreslår
  MapLibre + GeoJSON. For et land-choropleth over Europa gir en SVG-basert
  d3-geo-løsning bedre **tilgjengelighet** (fokuserbare/klikkbare land,
  skjermleser-etiketter), er **selvforsynt** (ingen eksterne tile-tjenester, som
  også holder Lighthouse høyt), og passer datagranulariteten (per land, ikke per
  piksel). GeoJSON genereres offline fra `world-atlas`. MapLibre kan enkelt
  byttes inn senere ved behov for zoom-/pan-kart.

## Videre utvikling

Plattformen er modulær og kan vokse mot et referanseverk – «Our World in Data
for norsk skog»:

- Flere moduler: biomangfold (Artsdatabanken), vernet skog, dødt trevirke,
  trealder, treslag, hogstformer, satellittdata (NDVI/Copernicus), brann- og
  stormskader, historiske flyfoto.
- Forklarende artikler som bruker figurene direkte i teksten.
- En AI-assistent (RAG) som svarer på spørsmål med referanser til de samme
  datasettene og forklaringene.

---

Åpen kildekode. All data kan lastes ned som CSV/JSON fra hver graf.
