import { test } from "node:test";
import assert from "node:assert/strict";
import { extractSeries, type JsonStat2 } from "../import/jsonstat";

// Syntetisk JSON-stat2: dimensjoner [Region(2), Tid(3)], rad-hovedrekkefølge.
const sample: JsonStat2 = {
  id: ["Region", "Tid"],
  size: [2, 3],
  dimension: {
    Region: { category: { index: { "0": 0, "30": 1 } } },
    Tid: { category: { index: { "2000": 0, "2001": 1, "2002": 2 } } },
  },
  // Region 0 → [10,11,12], Region 30 → [20,21,22]
  value: [10, 11, 12, 20, 21, 22],
};

test("extractSeries henter riktig serie for låst region", () => {
  const s = extractSeries(sample, "Tid", { Region: "30" });
  assert.deepEqual(
    s.map((p) => [p.year, p.value]),
    [
      [2000, 20],
      [2001, 21],
      [2002, 22],
    ],
  );
});

test("extractSeries defaulter til første kategori når ikke låst", () => {
  const s = extractSeries(sample, "Tid", {});
  assert.deepEqual(
    s.map((p) => p.value),
    [10, 11, 12],
  );
});

test("extractSeries hopper over null-verdier", () => {
  const withNull: JsonStat2 = { ...sample, value: [10, null, 12, 20, 21, 22] };
  const s = extractSeries(withNull, "Tid", { Region: "0" });
  assert.deepEqual(
    s.map((p) => p.year),
    [2000, 2002],
  );
});
