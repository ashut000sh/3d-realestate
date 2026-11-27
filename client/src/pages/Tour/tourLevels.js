// Finds the storeys (levels) of a 3D tour model, for the "Floors" view. Pure three.js, no DOM.
//
//   const levels = findLevels(gltf.scene);
//   // [{ number: 1, objects: [Object3D...], box: Box3, height, summary, source }]
//
// How (in this order, see docs/3D-PIPELINE.md):
//   1. Named nodes: top-level nodes called Level_1, Level_2 / Floor_1 / L1 ... (any case).
//      Optional glTF extras on the node: { summary: "2 bedrooms" } is shown on the label.
//   2. Otherwise auto-detect by height, using the bottom (min Y) of each mesh's world box:
//      - level starts come from floor-like slabs (thin, covering >= SLAB_MIN_FOOTPRINT of the
//        model's footprint); a new level starts when a slab is more than LEVEL_GAP_M above the
//        start of the current level (so a ceiling and the floor just above it are one start)
//      - every mesh joins the highest level that starts at or below its min Y, so meshes that
//        span levels (stairs, tall outer walls) stay with the level they start on
//      - a "level" with nothing rising MIN_LEVEL_CONTENT_M above its start (only a ceiling or a
//        roof slab) is folded into the level below: single-storey homes stay single-storey
//   3. Fewer than 2 levels: [] (the Floors button is hidden).
import * as THREE from "three";

// A storey is ~2.8-3 m: two floor slabs closer than this belong to the same level start
export const LEVEL_GAP_M = 2.2;
const SLAB_MAX_THICKNESS_M = 0.35;
const SLAB_MIN_FOOTPRINT = 0.25; // share of the whole model's floor area
const MIN_LEVEL_CONTENT_M = 1.5; // a real storey has walls at least this tall
const START_TOLERANCE_M = 0.15; // a mesh a hair below a slab still belongs to it

// "Level_2", "level-2", "Floor 2", "floor_02", "L2" -> 2
const LEVEL_NAME = /^(?:level|floor)[\s_-]*(\d+)$|^l(\d+)$/i;

export function levelNumberFromName(name = "") {
  const match = LEVEL_NAME.exec(name.trim());
  if (!match) return null;
  const n = Number(match[1] ?? match[2]);
  return Number.isInteger(n) && n > 0 ? n : null;
}

function boxOf(objects) {
  const box = new THREE.Box3();
  objects.forEach((object) => box.expandByObject(object));
  return box;
}

// Rule 1: top-level nodes with level names. glTF files often wrap everything in one root node,
// so we also look one step down when the scene has a single child.
function namedLevels(model) {
  const candidates =
    model.children.length === 1 && model.children[0].children.length > 0
      ? [...model.children, ...model.children[0].children]
      : model.children;
  const byNumber = new Map();
  for (const node of candidates) {
    const number = levelNumberFromName(node.name);
    if (number !== null && !byNumber.has(number)) byNumber.set(number, node);
  }
  return [...byNumber.entries()]
    .sort(([a], [b]) => a - b)
    .map(([number, node]) => ({
      number,
      objects: [node],
      summary: typeof node.userData?.summary === "string" ? node.userData.summary : null,
      source: "named",
    }));
}

// Rule 2: find level starts from floor slabs, then sort every mesh into a level
function detectedLevels(model) {
  const meshes = [];
  model.traverse((object) => {
    if (object.isMesh) meshes.push({ object, box: new THREE.Box3().setFromObject(object) });
  });
  if (meshes.length === 0) return [];
  const whole = boxOf(meshes.map((m) => m.object));
  const footprint = (whole.max.x - whole.min.x) * (whole.max.z - whole.min.z) || 1;

  const slabTops = meshes
    .filter(({ box }) => {
      const area = (box.max.x - box.min.x) * (box.max.z - box.min.z);
      return (
        box.max.y - box.min.y <= SLAB_MAX_THICKNESS_M && area >= footprint * SLAB_MIN_FOOTPRINT
      );
    })
    .map(({ box }) => box.min.y)
    .sort((a, b) => a - b);
  const starts = [];
  for (const y of [whole.min.y, ...slabTops]) {
    if (starts.length === 0 || y - starts[starts.length - 1] > LEVEL_GAP_M) starts.push(y);
  }

  // Each mesh -> the highest start at or below it
  const levels = starts.map((startY) => ({ startY, objects: [], topY: startY }));
  for (const { object, box } of meshes) {
    let index = 0;
    for (let i = 0; i < starts.length; i++)
      if (box.min.y >= starts[i] - START_TOLERANCE_M) index = i;
    levels[index].objects.push(object);
    levels[index].topY = Math.max(levels[index].topY, box.max.y);
  }

  // Fold "levels" that are only a ceiling or roof slab into the one below
  const real = [];
  for (const level of levels) {
    const isStorey = level.topY - level.startY >= MIN_LEVEL_CONTENT_M;
    if (isStorey || real.length === 0) real.push(level);
    else real[real.length - 1].objects.push(...level.objects);
  }
  return real
    .filter((level) => level.objects.length > 0)
    .map((level, i) => ({
      number: i + 1,
      objects: level.objects,
      summary: null,
      source: "detected",
    }));
}

export function findLevels(model) {
  model.updateMatrixWorld(true);
  let levels = namedLevels(model);
  if (levels.length < 2) levels = detectedLevels(model);
  if (levels.length < 2) return [];

  // Box of each level (as built), and a storey height for the exploded gap
  levels.forEach((level) => (level.box = boxOf(level.objects)));
  levels.forEach((level, i) => {
    const next = levels[i + 1];
    level.height = next
      ? Math.max(0.5, next.box.min.y - level.box.min.y)
      : Math.max(0.5, level.box.max.y - level.box.min.y);
  });
  return levels;
}
