# 3D pipeline: from a LiDAR scan to the tour on the website

How the scan team prepares a property's 3D model so the website's Tour screen (and its
**Measure** and **Floors** tools) work properly.

## 1. Capture

Scan every room and the stairs with the LiDAR scanner. Keep doors open between rooms, and scan
each storey fully before going up, so the storeys line up in one model.

## 2. Export rules

Export **one binary glTF file (`.glb`)** per property.

| Rule | Why |
|---|---|
| **Metres**: 1 unit = 1 m | The Measure tool reads distances straight from the model |
| **Y is up**, ground floor at about Y = 0 | Floors are found by height |
| Under **25 MB** (aim for 5–15 MB) | Buyers on mobile data; the upload limit |
| Textures: JPEG/WebP, 2048 px or smaller | Download size and phone memory |
| No cameras or lights in the file | The viewer sets its own |

## 3. Name the storeys (multi-storey homes)

So that buyers can press **Floors** to pull the storeys apart, put each storey under its own
**top-level node** named by its level number:

```
Scene
├── Level_1      ← ground floor (rooms, floor slab, furniture, stairs going up)
├── Level_2      ← first floor
└── Level_3      ← second floor / roof terrace
```

- Accepted names (any capitals): `Level_1`, `Level-1`, `Level 1`, `Floor_1`, `Floor_01`, `L1`.
  Level 1 is the **ground floor**.
- A single root node around all levels is fine (`Scene › House › Level_1 …`).
- Put the **stairs** in the level they start from.
- Optional: add glTF **extras** to a level node to set its label, for example
  `{ "summary": "2 bedrooms · bath" }`. Without it, the label says "Ground floor", "1st floor", …
- Single-storey homes: no naming needed. The Floors button only appears when there are
  2 or more levels.

### If the levels aren't named

The viewer then finds the levels by height (`client/src/pages/Tour/tourLevels.js`):

1. Floor-like slabs (thin, covering at least a quarter of the house's footprint) mark where a
   level may start. A new level starts when a slab is more than **2.2 m** (`LEVEL_GAP_M`) above
   the start of the current level, so a ceiling and the floor just above it count as one start.
2. Every part goes to the highest level that starts at or below its lowest point, so parts that
   span storeys (stairs, tall outer walls) stay with the level they start on.
3. A "level" with nothing at least 1.5 m tall (only a ceiling or roof slab) is folded into the
   one below, so single-storey homes never get a Floors button.

This works for clean models, but **naming the levels is more reliable**, especially for split
levels, mezzanines and sloping sites. Please name them.

## 4. Check before publishing

1. Open the file in a glTF viewer (e.g. <https://gltf-viewer.donmccurdy.com/>): right way up,
   right size, nothing missing.
2. Measure a known wall in the viewer: a 4 m wall should read about 4 m.
3. For multi-storey homes, check the level nodes are named as above.

## 5. Publish

Admin dashboard → **Scan queue** → the request → **Upload tour & publish** → choose the `.glb`.
The listing goes live with its tour (`server/uploads/tours/<id>.glb`).

## Sample models

`npm run tours` builds simple box models into `client/public/tours/` for development and the
demo (they are git-ignored):

| File | Used by (seed data) | Shows |
|---|---|---|
| `house.glb`, `apartment.glb`, `room.glb`, `office.glb` | most listings | single storey: no Floors button |
| `house-two-storey.glb` | 3BHK house in Budhanilkantha | levels **named** `Level_1` / `Level_2`, with `summary` extras |
| `townhouse.glb` | Newari house in Patan | 3 storeys, **unnamed**: levels are auto-detected |
