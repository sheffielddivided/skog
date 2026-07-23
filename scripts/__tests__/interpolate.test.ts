import { test } from "node:test";
import assert from "node:assert/strict";
import { interpolateAnnual, interpolatePoints } from "../lib/interpolate";

test("interpolateAnnual fyller hvert år og bevarer ankerverdier", () => {
  const out = interpolateAnnual([
    { year: 2000, value: 100 },
    { year: 2010, value: 200 },
  ]);
  assert.equal(out.length, 11); // 2000..2010 inklusiv
  assert.equal(out[0].year, 2000);
  assert.equal(out[0].value, 100);
  assert.equal(out[0].quality, "measured");
  assert.equal(out[10].value, 200);
  // Lineær midtpunkt
  const mid = out.find((p) => p.year === 2005)!;
  assert.equal(mid.value, 150);
  assert.equal(mid.quality, "interpolated");
});

test("interpolateAnnual ekstrapolerer ikke utenfor ankerintervallet", () => {
  const out = interpolateAnnual([
    { year: 1990, value: 10 },
    { year: 1992, value: 30 },
  ]);
  assert.equal(out[0].year, 1990);
  assert.equal(out[out.length - 1].year, 1992);
});

test("interpolatePoints håndterer FRA-referanseår", () => {
  const out = interpolatePoints({ 1990: 500, 2000: 700 });
  assert.equal(out.length, 11);
  assert.equal(out.find((p) => p.year === 1995)!.value, 600);
});

test("interpolateAnnual takler flere segmenter monotont", () => {
  const out = interpolateAnnual([
    { year: 1925, value: 313 },
    { year: 1950, value: 400 },
    { year: 2000, value: 700 },
  ]);
  for (let i = 1; i < out.length; i++) {
    assert.ok(out[i].value >= out[i - 1].value, "skal være ikke-synkende");
  }
});
