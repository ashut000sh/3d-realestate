// Unit tests for shared/area.js. Run: npm test   (Node's built-in runner, no packages)
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  aanaToSqft,
  areaSystemFor,
  formatAreaShort,
  formatBigha,
  formatLocalArea,
  formatLocalAreaShort,
  formatRopani,
  sqftToBigha,
  sqftToM2,
  sqftToRopani,
} from "./area.js";
import { AREA_SYSTEM, DISTRICTS, DISTRICT_AREA_SYSTEM } from "./constants.js";

test("1 ropani is exactly 5,476 sq ft", () => {
  assert.deepEqual(sqftToRopani(5476), { ropani: 1, aana: 0, paisa: 0, daam: 0 });
  assert.equal(formatRopani(5476), "1 ropani");
});

test("ropani, aana, paisa and daam split correctly", () => {
  // 1 ropani 2 aana 3 paisa 1 daam = 5476 + 684.5 + 256.6875 + 21.390625
  assert.deepEqual(sqftToRopani(6438.578125), { ropani: 1, aana: 2, paisa: 3, daam: 1 });
  assert.equal(formatRopani(6438.578125), "1 ropani 2 aana 3 paisa 1 daam");
});

test("formatters drop the zero parts", () => {
  assert.equal(formatRopani(5476 + 2 * 342.25), "1 ropani 2 aana");
  assert.equal(formatRopani(3 * 342.25 + 2 * 85.5625), "3 aana 2 paisa");
  assert.equal(formatBigha(3645 + 4 * 182.25), "1 kattha 4 dhur");
  assert.equal(formatBigha(72900 + 182.25), "1 bigha 1 dhur");
});

test("rounding: to the nearest daam, carrying up into aana and ropani", () => {
  // 5,475 sq ft is 0.05 daam short of 1 ropani: rounds up, no "15 aana 3 paisa 4 daam"
  assert.deepEqual(sqftToRopani(5475), { ropani: 1, aana: 0, paisa: 0, daam: 0 });
  // 1,250 sq ft = 58.44 daam -> 58 daam = 3 aana 2 paisa 2 daam
  assert.deepEqual(sqftToRopani(1250), { ropani: 0, aana: 3, paisa: 2, daam: 2 });
  // Just over half a daam rounds up, just under rounds down
  assert.equal(sqftToRopani(11).daam, 1);
  assert.equal(sqftToRopani(10).daam, 0);
});

test("rounding: bigha to the nearest 0.1 dhur", () => {
  assert.deepEqual(sqftToBigha(72900), { bigha: 1, kattha: 0, dhur: 0 });
  // 1,000 sq ft = 5.487 dhur -> 5.5 dhur
  assert.deepEqual(sqftToBigha(1000), { bigha: 0, kattha: 0, dhur: 5.5 });
  // 3,644 sq ft is a hair under 1 kattha: rounds up and carries
  assert.deepEqual(sqftToBigha(3644), { bigha: 0, kattha: 1, dhur: 0 });
});

test("square metres, one decimal", () => {
  assert.equal(sqftToM2(1250), 116.1);
  assert.equal(sqftToM2(10.763910416709722), 1);
  assert.equal(sqftToM2(0), 0);
});

test("short forms for cards", () => {
  assert.equal(formatAreaShort(1250, "Kathmandu"), "1,250 sq ft · 3.7 aana");
  assert.equal(formatAreaShort(10000, "Lalitpur"), "10,000 sq ft · 1.8 ropani");
  assert.equal(formatLocalAreaShort(15000, "Chitwan"), "4.1 kattha");
  assert.equal(formatLocalAreaShort(80000, "Chitwan"), "1.1 bigha");
  assert.equal(formatLocalAreaShort(1640, "Chitwan"), "9 dhur");
  assert.equal(formatAreaShort(12500000, "Kathmandu"), "1,25,00,000 sq ft · 2282.7 ropani");
});

test("missing or bad area", () => {
  assert.equal(formatAreaShort(null, "Kathmandu"), "Area not provided");
  assert.equal(formatAreaShort(0, "Kathmandu"), "Area not provided");
  assert.equal(sqftToRopani(-5), null);
  assert.equal(sqftToBigha(Number.NaN), null);
  assert.equal(formatRopani(undefined), "");
});

test("district decides the system; every district is mapped", () => {
  assert.equal(areaSystemFor("Kathmandu"), AREA_SYSTEM.ROPANI);
  assert.equal(areaSystemFor("Kaski"), AREA_SYSTEM.ROPANI);
  assert.equal(areaSystemFor("Chitwan"), AREA_SYSTEM.BIGHA);
  assert.equal(areaSystemFor("Somewhere new"), AREA_SYSTEM.ROPANI);
  assert.equal(formatLocalArea(4374, "Chitwan"), "1 kattha 4 dhur");
  for (const district of DISTRICTS) assert.ok(DISTRICT_AREA_SYSTEM[district], district);
});

test("aana typed in the search filter becomes whole sq ft", () => {
  assert.equal(aanaToSqft(4), 1369);
  assert.equal(aanaToSqft(2.5), 856);
});
