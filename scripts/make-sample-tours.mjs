// Makes the sample 3D tours used by the seed data: npm run tours
// Writes client/public/tours/{house,apartment,room,office}.glb (git-ignored, ~100 KB each).
// They are simple furnished rooms built from boxes, to real sizes (1 unit = 1 metre),
// so the Tour screen and its measure tool can be tried without a LiDAR scan.
// Needs the `three` package, which the client installs (feature/shared-components).
/* global Buffer, console, process -- Node.js script (eslint gives node globals only to server/ and shared/) */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as THREE from "three";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";

const OUT_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../client/public/tours",
);

// GLTFExporter needs FileReader to write a binary .glb; Node doesn't have one
globalThis.FileReader ??= class {
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then((buffer) => {
      this.result = buffer;
      this.onloadend?.();
    });
  }
  readAsDataURL(blob) {
    blob.arrayBuffer().then((buffer) => {
      this.result = `data:${blob.type};base64,${Buffer.from(buffer).toString("base64")}`;
      this.onloadend?.();
    });
  }
};

const COLORS = {
  wall: 0xf1ece2,
  wallWarm: 0xe8dcc6,
  brick: 0xa8553a,
  floorWood: 0xb08a5e,
  floorTile: 0xd9d4ca,
  ceiling: 0xfaf8f3,
  green: 0x1d5b4c,
  gold: 0xc39a4b,
  wood: 0x7a5634,
  darkWood: 0x4a3322,
  cream: 0xe9e1d0,
  white: 0xf7f7f5,
  grey: 0x8a8f8c,
  black: 0x2a2a2a,
  glass: 0x9fc3d6,
  plant: 0x3f7d4e,
};

function makeBuilder() {
  const scene = new THREE.Scene();
  const materials = {};
  const mat = (color, roughness = 0.85, extra = {}) => {
    const key = `${color}-${roughness}-${JSON.stringify(extra)}`;
    materials[key] ??= new THREE.MeshStandardMaterial({ color, roughness, ...extra });
    return materials[key];
  };
  // Box by its size and its centre position
  const box = (w, h, d, color, x, y, z, roughness) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color, roughness));
    mesh.position.set(x, y, z);
    scene.add(mesh);
    return mesh;
  };
  const cylinder = (rTop, rBottom, h, color, x, y, z) => {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBottom, h, 24), mat(color, 0.6));
    mesh.position.set(x, y, z);
    scene.add(mesh);
    return mesh;
  };
  const glass = (w, h, d, x, y, z) => {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(w, h, d),
      mat(COLORS.glass, 0.1, { transparent: true, opacity: 0.35 }),
    );
    mesh.position.set(x, y, z);
    scene.add(mesh);
  };
  return { scene, box, cylinder, glass };
}

// ---------- furniture ----------
function sofa(b, x, z, width = 2.2, color = COLORS.green, facing = 1) {
  b.box(width, 0.45, 0.9, color, x, 0.3, z);
  b.box(width, 0.5, 0.2, color, x, 0.75, z - 0.35 * facing);
  b.box(0.2, 0.6, 0.9, color, x - width / 2 + 0.1, 0.4, z);
  b.box(0.2, 0.6, 0.9, color, x + width / 2 - 0.1, 0.4, z);
}
function table(b, x, z, w, d, h = 0.75, color = COLORS.wood) {
  b.box(w, 0.05, d, color, x, h, z);
  for (const [dx, dz] of [
    [-1, -1],
    [1, -1],
    [-1, 1],
    [1, 1],
  ]) {
    b.box(0.05, h, 0.05, color, x + dx * (w / 2 - 0.06), h / 2, z + dz * (d / 2 - 0.06));
  }
}
function chair(b, x, z, color = COLORS.gold) {
  b.box(0.45, 0.06, 0.45, color, x, 0.45, z);
  b.box(0.45, 0.45, 0.06, color, x, 0.7, z - 0.2);
  for (const [dx, dz] of [
    [-1, -1],
    [1, -1],
    [-1, 1],
    [1, 1],
  ]) {
    b.box(0.04, 0.45, 0.04, COLORS.darkWood, x + dx * 0.19, 0.22, z + dz * 0.19);
  }
}
function bed(b, x, z, width = 1.6, color = COLORS.cream) {
  b.box(width, 0.35, 2.0, COLORS.wood, x, 0.18, z);
  b.box(width - 0.06, 0.2, 1.94, COLORS.white, x, 0.45, z);
  b.box(width - 0.06, 0.06, 1.3, color, x, 0.56, z + 0.3);
  b.box(width, 1.0, 0.1, COLORS.darkWood, x, 0.5, z - 1.0);
  b.box(0.5, 0.12, 0.35, COLORS.white, x - width / 4, 0.62, z - 0.7);
  b.box(0.5, 0.12, 0.35, COLORS.white, x + width / 4, 0.62, z - 0.7);
}
function plant(b, x, z) {
  b.cylinder(0.18, 0.14, 0.35, COLORS.cream, x, 0.18, z);
  b.cylinder(0.05, 0.32, 0.9, COLORS.plant, x, 0.8, z);
}
function lamp(b, x, z) {
  b.box(0.04, 1.45, 0.04, COLORS.black, x, 0.72, z);
  b.cylinder(0.22, 0.32, 0.32, COLORS.gold, x, 1.55, z);
}
function rug(b, x, z, w, d, color = COLORS.cream) {
  b.box(w, 0.02, d, color, x, 0.01, z);
}

// ---------- shell: floor, walls (with door/window gaps), half ceiling ----------
// openings: [{ wall: "north"|"south"|"east"|"west", at, width, kind: "door"|"window" }]
function shell(b, { w, d, h = 2.8, floor = COLORS.floorWood, wall = COLORS.wall, openings = [] }) {
  const t = 0.12;
  b.box(w, 0.1, d, floor, 0, -0.05, 0, 0.6);
  b.box(w, t, d / 2, COLORS.ceiling, 0, h, -d / 4); // half ceiling, so you can look in
  const walls = {
    north: { len: w, x: 0, z: -d / 2, along: "x" },
    south: { len: w, x: 0, z: d / 2, along: "x" },
    west: { len: d, x: -w / 2, z: 0, along: "z" },
    east: { len: d, x: w / 2, z: 0, along: "z" },
  };
  for (const [name, def] of Object.entries(walls)) {
    if (name === "south") continue; // open front, like a dollhouse
    const gaps = openings.filter((o) => o.wall === name).sort((a, c) => a.at - c.at);
    let cursor = -def.len / 2;
    const segment = (from, to, y0, y1) => {
      const len = to - from;
      if (len <= 0.01) return;
      const mid = (from + to) / 2;
      const height = y1 - y0;
      if (def.along === "x") b.box(len, height, t, wall, def.x + mid, y0 + height / 2, def.z);
      else b.box(t, height, len, wall, def.x, y0 + height / 2, def.z + mid);
    };
    for (const gap of gaps) {
      const from = gap.at - gap.width / 2;
      const to = gap.at + gap.width / 2;
      segment(cursor, from, 0, h);
      if (gap.kind === "window") {
        segment(from, to, 0, 0.9);
        segment(from, to, 2.2, h);
        const mid = gap.at;
        if (def.along === "x") b.glass(gap.width, 1.3, 0.03, def.x + mid, 1.55, def.z);
        else b.glass(0.03, 1.3, gap.width, def.x, 1.55, def.z + mid);
      } else {
        segment(from, to, 2.1, h);
      }
      cursor = to;
    }
    segment(cursor, def.len / 2, 0, h);
  }
}
// An inner wall from (x1,z1) to (x2,z2) with an optional door gap in the middle
function innerWall(b, x1, z1, x2, z2, { door = 0.9, h = 2.8, color = COLORS.wall } = {}) {
  const t = 0.1;
  const alongX = z1 === z2;
  const len = alongX ? Math.abs(x2 - x1) : Math.abs(z2 - z1);
  const half = (len - door) / 2;
  if (alongX) {
    const left = Math.min(x1, x2);
    b.box(half, h, t, color, left + half / 2, h / 2, z1);
    b.box(half, h, t, color, left + len - half / 2, h / 2, z1);
    b.box(door, h - 2.1, t, color, left + len / 2, 2.1 + (h - 2.1) / 2, z1);
  } else {
    const top = Math.min(z1, z2);
    b.box(t, h, half, color, x1, h / 2, top + half / 2);
    b.box(t, h, half, color, x1, h / 2, top + len - half / 2);
    b.box(t, h - 2.1, door, color, x1, 2.1 + (h - 2.1) / 2, top + len / 2);
  }
}

// ---------- the four tours ----------
function house() {
  const b = makeBuilder();
  const W = 9,
    D = 7;
  shell(b, {
    w: W,
    d: D,
    wall: COLORS.wallWarm,
    openings: [
      { wall: "north", at: -2.5, width: 1.6, kind: "window" },
      { wall: "north", at: 2.5, width: 1.6, kind: "window" },
      { wall: "west", at: 0, width: 1.4, kind: "window" },
      { wall: "east", at: 1.8, width: 1.0, kind: "door" },
    ],
  });
  // Living room (left) | bedroom (right back) | kitchen (right front)
  innerWall(b, 1, -D / 2, 1, D / 2);
  innerWall(b, 1, 0.3, W / 2, 0.3);
  rug(b, -2, -1, 3, 2.2);
  sofa(b, -2, -2.6, 2.4);
  table(b, -2, -1, 1.2, 0.6, 0.42);
  b.box(1.6, 0.5, 0.4, COLORS.darkWood, -2, 0.25, 2.2); // TV unit
  b.box(1.4, 0.8, 0.05, COLORS.black, -2, 1.1, 2.35); // TV
  lamp(b, -4, -3);
  plant(b, -0.3, -3);
  chair(b, -3.6, 0.6);
  bed(b, 3, -1.6, 1.8);
  b.box(0.45, 0.5, 0.4, COLORS.wood, 1.7, 0.25, -2.9);
  b.box(0.45, 0.5, 0.4, COLORS.wood, 4.3, 0.25, -2.9);
  b.box(0.6, 2, 1.4, COLORS.darkWood, 4.1, 1, -0.5); // wardrobe
  b.box(3.3, 0.9, 0.6, COLORS.white, 2.85, 0.45, 3.15); // kitchen counter
  b.box(3.3, 0.05, 0.64, COLORS.grey, 2.85, 0.92, 3.15);
  b.box(0.6, 1.8, 0.6, COLORS.white, 4.1, 0.9, 1.0); // fridge
  table(b, 2.4, 1.7, 1.2, 0.8);
  chair(b, 1.9, 1.2);
  chair(b, 2.9, 1.2);
  return b.scene;
}

function apartment() {
  const b = makeBuilder();
  const W = 8,
    D = 6;
  shell(b, {
    w: W,
    d: D,
    floor: COLORS.floorTile,
    openings: [
      { wall: "north", at: -1.5, width: 3, kind: "window" },
      { wall: "east", at: -1, width: 0.9, kind: "door" },
    ],
  });
  innerWall(b, 1.6, -D / 2, 1.6, D / 2);
  // Open living + dining
  rug(b, -1.8, -1, 3.2, 2.4, COLORS.cream);
  sofa(b, -1.8, -2.4, 2.6, COLORS.grey);
  table(b, -1.8, -0.9, 1.1, 0.6, 0.4, COLORS.darkWood);
  b.box(2, 0.45, 0.4, COLORS.wood, -1.8, 0.22, 1.6);
  b.box(1.6, 0.9, 0.05, COLORS.black, -1.8, 1.15, 1.78);
  table(b, -0.2, 2.2, 1.4, 0.8, 0.75, COLORS.white);
  chair(b, -0.65, 1.7, COLORS.green);
  chair(b, 0.25, 1.7, COLORS.green);
  plant(b, -3.6, -2.5);
  lamp(b, -3.6, 0);
  // Kitchen corner + bedroom behind the wall
  b.box(2.2, 0.9, 0.6, COLORS.white, 2.8, 0.45, 2.65);
  b.box(2.2, 0.05, 0.64, COLORS.black, 2.8, 0.92, 2.65);
  b.box(0.6, 1.9, 0.6, COLORS.grey, 3.6, 0.95, 1.6);
  bed(b, 2.8, -1.6, 1.5, COLORS.green);
  return b.scene;
}

function room() {
  const b = makeBuilder();
  const W = 5,
    D = 4.5;
  shell(b, {
    w: W,
    d: D,
    wall: COLORS.wallWarm,
    openings: [
      { wall: "north", at: 0.8, width: 1.8, kind: "window" },
      { wall: "west", at: 1.2, width: 0.9, kind: "door" },
    ],
  });
  rug(b, -0.5, -0.3, 2.6, 2.2, COLORS.cream);
  bed(b, -0.6, -0.9, 1.6, COLORS.gold);
  b.box(0.45, 0.5, 0.4, COLORS.wood, -1.75, 0.25, -1.95);
  b.box(0.45, 0.5, 0.4, COLORS.wood, 0.55, 0.25, -1.95);
  b.cylinder(0.1, 0.14, 0.3, COLORS.gold, -1.75, 0.65, -1.95);
  table(b, 1.8, 0.8, 1.0, 0.55); // desk
  chair(b, 1.8, 1.3, COLORS.green);
  b.box(1.0, 2.0, 0.6, COLORS.darkWood, 1.9, 1.0, -1.9); // wardrobe
  sofa(b, -1.4, 1.6, 1.4, COLORS.green, -1);
  plant(b, 2.2, 2.0);
  return b.scene;
}

function office() {
  const b = makeBuilder();
  const W = 12,
    D = 8;
  shell(b, {
    w: W,
    d: D,
    floor: COLORS.floorTile,
    wall: COLORS.white,
    openings: [
      { wall: "north", at: -3, width: 4, kind: "window" },
      { wall: "north", at: 3, width: 4, kind: "window" },
      { wall: "west", at: 1, width: 1.0, kind: "door" },
    ],
  });
  // Rows of desks
  for (const x of [-4, -1.5, 1]) {
    for (const z of [-2, 0.2]) {
      table(b, x, z, 1.6, 0.8, 0.75, COLORS.white);
      b.box(0.6, 0.38, 0.04, COLORS.black, x, 1.0, z - 0.2); // screen
      chair(b, x, z + 0.65, COLORS.black);
    }
  }
  // Meeting room behind glass
  b.glass(0.04, 2.6, 4, 3.5, 1.3, -1.9);
  b.glass(2.4, 2.6, 0.04, 4.7, 1.3, 0.1);
  table(b, 4.75, -2, 1.8, 1.0, 0.75, COLORS.wood);
  for (const [x, z] of [
    [4.2, -2.75],
    [5.3, -2.75],
    [4.2, -1.25],
    [5.3, -1.25],
  ])
    chair(b, x, z, COLORS.gold);
  sofa(b, -4.2, 3, 2.2, COLORS.green, -1);
  plant(b, -5.4, -3.4);
  plant(b, 2.6, 3.3);
  b.box(2.2, 0.95, 0.6, COLORS.darkWood, 2, 0.48, 3.4); // reception desk
  return b.scene;
}

// ---------- write files ----------
const TOURS = { house, apartment, room, office };
fs.mkdirSync(OUT_DIR, { recursive: true });
const exporter = new GLTFExporter();
for (const [name, build] of Object.entries(TOURS)) {
  const result = await exporter.parseAsync(build(), { binary: true });
  const file = path.join(OUT_DIR, `${name}.glb`);
  fs.writeFileSync(file, Buffer.from(result));
  console.log(
    `wrote ${path.relative(process.cwd(), file)} (${Math.round(fs.statSync(file).size / 1024)} KB)`,
  );
}
