import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/** Integritetstester på det bygde hurtigbufferet. Kjør `npm run data:build` først. */
const dataset = JSON.parse(
  readFileSync(join(process.cwd(), "data", "cache", "dataset.json"), "utf8"),
) as {
  series: { countryId: string; metricId: string; points: { year: number; value: number }[] }[];
  countries: { id: string }[];
  metrics: { id: string }[];
};

function series(countryId: string, metricId: string) {
  return dataset.series.find((s) => s.countryId === countryId && s.metricId === metricId);
}

test("norsk stående volum er nær tredoblet siden 1920-tallet", () => {
  const v = series("NOR", "standing_volume");
  assert.ok(v, "fant NOR/standing_volume");
  const first = v!.points[0];
  const last = v!.points[v!.points.length - 1];
  const ratio = last.value / first.value;
  assert.ok(ratio > 2.5 && ratio < 3.5, `forventet ~3x, fikk ${ratio.toFixed(2)}x`);
});

test("norsk tilvekst er større enn avvirkning i siste år", () => {
  const inc = series("NOR", "annual_increment")!;
  const har = series("NOR", "harvest")!;
  const incLast = inc.points[inc.points.length - 1].value;
  const harLast = har.points[har.points.length - 1].value;
  assert.ok(incLast > harLast, "tilvekst > avvirkning");
});

test("alle serier har sorterte år og endelige, ikke-negative verdier", () => {
  for (const s of dataset.series) {
    let prev = -Infinity;
    for (const p of s.points) {
      assert.ok(Number.isFinite(p.value) && p.value >= 0, `${s.countryId}/${s.metricId} verdi`);
      assert.ok(p.year > prev, `${s.countryId}/${s.metricId} år sortert`);
      prev = p.year;
    }
  }
});

test("kartindikatorene finnes for flere land", () => {
  for (const metricId of ["forest_area", "standing_volume", "biomass_per_ha", "carbon_stock"]) {
    const countries = dataset.series.filter((s) => s.metricId === metricId && s.countryId !== "GLB");
    assert.ok(countries.length >= 5, `${metricId} skal dekke flere land`);
  }
});
