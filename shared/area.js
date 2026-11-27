// Land and floor area in the units Nepali buyers use. Used by the website and the server.
//
// Hill system (ropani): 1 ropani = 16 aana = 5,476 sq ft
//                       1 aana   = 4 paisa  = 342.25 sq ft
//                       1 paisa  = 4 daam   = 85.5625 sq ft     (1 daam = 21.390625 sq ft)
// Terai system (bigha): 1 bigha  = 20 kattha = 72,900 sq ft
//                       1 kattha = 20 dhur   = 3,645 sq ft      (1 dhur = 182.25 sq ft)
//
// Rounding:
//   sqftToRopani rounds to the nearest whole daam (about 21 sq ft), then carries upwards,
//     so 5,475 sq ft is "1 ropani", not "15 aana 3 paisa 3.95 daam".
//   sqftToBigha rounds to the nearest 0.1 dhur (about 18 sq ft), then carries upwards.
//   Short forms ("3.6 aana") use one decimal.
import { AREA_SYSTEM, DISTRICT_AREA_SYSTEM } from "./constants.js";

export const SQFT_PER = {
  ropani: 5476,
  aana: 342.25,
  paisa: 85.5625,
  daam: 21.390625,
  bigha: 72900,
  kattha: 3645,
  dhur: 182.25,
};

export const SQFT_PER_M2 = 10.763910416709722; // 1 m² = 10.7639... sq ft (exact: 1 / 0.3048²)

const isArea = (sqft) => typeof sqft === "number" && Number.isFinite(sqft) && sqft >= 0;

// 5476 -> { ropani: 1, aana: 0, paisa: 0, daam: 0 }
export function sqftToRopani(sqft) {
  if (!isArea(sqft)) return null;
  let daam = Math.round(sqft / SQFT_PER.daam); // whole daam
  const ropani = Math.floor(daam / 256); // 16 aana × 4 paisa × 4 daam
  daam -= ropani * 256;
  const aana = Math.floor(daam / 16);
  daam -= aana * 16;
  const paisa = Math.floor(daam / 4);
  daam -= paisa * 4;
  return { ropani, aana, paisa, daam };
}

// 72900 -> { bigha: 1, kattha: 0, dhur: 0 }   (dhur may have one decimal)
export function sqftToBigha(sqft) {
  if (!isArea(sqft)) return null;
  let tenths = Math.round(sqft / (SQFT_PER.dhur / 10)); // tenths of a dhur
  const bigha = Math.floor(tenths / 4000); // 20 kattha × 20 dhur × 10
  tenths -= bigha * 4000;
  const kattha = Math.floor(tenths / 200);
  tenths -= kattha * 200;
  return { bigha, kattha, dhur: tenths / 10 };
}

// 1250 -> 116.1 (one decimal)
export function sqftToM2(sqft) {
  if (!isArea(sqft)) return null;
  return Math.round((sqft / SQFT_PER_M2) * 10) / 10;
}

// Joins the non-zero parts: [[1, "ropani"], [0, "aana"], [2, "paisa"]] -> "1 ropani 2 paisa"
function joinParts(parts, smallestUnit) {
  const text = parts
    .filter(([value]) => value > 0)
    .map(([value, unit]) => `${value} ${unit}`)
    .join(" ");
  return text || `0 ${smallestUnit}`;
}

// 6160 -> "1 ropani 2 aana" ; 1197.875 -> "3 aana 2 paisa"
export function formatRopani(sqft) {
  const r = sqftToRopani(sqft);
  if (!r) return "";
  return joinParts(
    [
      [r.ropani, "ropani"],
      [r.aana, "aana"],
      [r.paisa, "paisa"],
      [r.daam, "daam"],
    ],
    "daam",
  );
}

// 4374 -> "1 kattha 4 dhur"
export function formatBigha(sqft) {
  const b = sqftToBigha(sqft);
  if (!b) return "";
  return joinParts(
    [
      [b.bigha, "bigha"],
      [b.kattha, "kattha"],
      [b.dhur, "dhur"],
    ],
    "dhur",
  );
}

// Which system a district uses (hill districts and anything unknown: ropani)
export const areaSystemFor = (district) => DISTRICT_AREA_SYSTEM[district] ?? AREA_SYSTEM.ROPANI;

// Full local form for a district: "3 aana 2 paisa" or "1 kattha 4 dhur"
export function formatLocalArea(sqft, district) {
  return areaSystemFor(district) === AREA_SYSTEM.BIGHA ? formatBigha(sqft) : formatRopani(sqft);
}

const oneDecimal = (n) => String(Math.round(n * 10) / 10);

// Short local form for cards: "3.6 aana", "1.8 ropani", "4.2 kattha", "1.1 bigha", "9 dhur"
export function formatLocalAreaShort(sqft, district) {
  if (!isArea(sqft)) return "";
  if (areaSystemFor(district) === AREA_SYSTEM.BIGHA) {
    if (sqft >= SQFT_PER.bigha) return `${oneDecimal(sqft / SQFT_PER.bigha)} bigha`;
    if (sqft >= SQFT_PER.kattha) return `${oneDecimal(sqft / SQFT_PER.kattha)} kattha`;
    return `${oneDecimal(sqft / SQFT_PER.dhur)} dhur`;
  }
  if (sqft >= SQFT_PER.ropani) return `${oneDecimal(sqft / SQFT_PER.ropani)} ropani`;
  return `${oneDecimal(sqft / SQFT_PER.aana)} aana`;
}

// 1250 -> "1,250 sq ft" (Nepali digit grouping)
export const formatSqft = (sqft) =>
  `${new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(sqft)} sq ft`;

// Compact one-liner for cards: "1,250 sq ft · 3.6 aana", or "Area not provided"
export function formatAreaShort(sqft, district) {
  if (!isArea(sqft) || sqft === 0) return "Area not provided";
  return `${formatSqft(sqft)} · ${formatLocalAreaShort(sqft, district)}`;
}

// Converts a search filter typed in aana back to sq ft (the API works in sq ft)
export const aanaToSqft = (aana) => Math.round(aana * SQFT_PER.aana);
