// The 3D part of the Tour screen, written with plain three.js (no React inside).
// Tour.jsx creates one TourViewer, and calls destroy() when the screen closes.
//
//   const viewer = new TourViewer(containerElement, { onProgress, onLoaded, onError, onMeasure,
//                                                     onLevels, onFloorsChange });
//   viewer.load(url);  viewer.setMeasuring(true);  viewer.resetView();  viewer.destroy();
//   viewer.setExploded(true);  viewer.focusLevel(1);  viewer.focusLevel(null)   // "Floors" view
//
// Measuring: click two points on the model and the distance appears between them.
// LiDAR scans are saved in metres, so 1 unit in the scene = 1 metre.
//
// Floors: multi-storey models can be pulled apart, each level lifted by (index x gap) so you can
// look into every storey. Levels come from tourLevels.js (named nodes, or found by height).
// Measuring is switched off while the floors are apart (Tour.jsx), so distances stay true.
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { findLevels } from "./tourLevels.js";

const GOLD = 0xc39a4b;
const CLICK_TOLERANCE_PX = 5; // a drag shorter than this still counts as a click
const EXPLODE_MS = 600;
const EXPLODE_GAP = 0.6; // gap between lifted levels, as a share of a level's height
const FADED_OPACITY = 0.15; // other levels while one level is in focus

const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// "Ground floor", "1st floor", "2nd floor"... (British / Nepali usage: level 1 = ground)
function floorName(number) {
  if (number === 1) return "Ground floor";
  const n = number - 1;
  const teen = n % 100 >= 11 && n % 100 <= 13;
  const suffix = teen ? "th" : (["th", "st", "nd", "rd"][n % 10] ?? "th");
  return `${n}${suffix} floor`;
}

export class TourViewer {
  constructor(container, callbacks = {}) {
    this.container = container;
    this.callbacks = callbacks;
    this.measuring = false;
    this.pendingPoint = null; // first click of a measurement
    this.measurements = []; // { id, a, b, meters, line, dots, label }
    this.nextId = 1;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0e1714);
    this.scene.fog = new THREE.Fog(0x0e1714, 30, 90);

    this.camera = new THREE.PerspectiveCamera(55, 1, 0.05, 500);
    this.camera.position.set(6, 5, 8);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.shadowMap.enabled = true;
    container.appendChild(this.renderer.domElement);

    // Labels for measurements are plain HTML on top of the canvas
    this.labelLayer = document.createElement("div");
    this.labelLayer.style.cssText = "position:absolute;inset:0;pointer-events:none;overflow:hidden";
    container.appendChild(this.labelLayer);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.autoRotateSpeed = 0.6;

    this.scene.add(new THREE.HemisphereLight(0xffffff, 0x2a3a34, 1.4));
    const sun = new THREE.DirectionalLight(0xfff4e0, 2.2);
    sun.position.set(8, 14, 6);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    this.scene.add(sun);
    this.sun = sun;

    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();
    this.model = null;

    // Floors view
    this.levels = []; // see setupLevels()
    this.gap = 0; // metres between lifted levels
    this.explode = 0; // 0 = together, 1 = apart (animated in between)
    this.exploded = false;
    this.focusedLevel = null; // index, or null = all levels
    this.tween = null; // running animation, see startTween()
    this.ownMaterials = []; // per-level material copies made for fading (disposed in destroy)
    this.measurementsHidden = false;

    this.handleResize = this.handleResize.bind(this);
    this.handlePointerDown = this.handlePointerDown.bind(this);
    this.handlePointerUp = this.handlePointerUp.bind(this);
    this.handleKey = this.handleKey.bind(this);
    window.addEventListener("resize", this.handleResize);
    window.addEventListener("keydown", this.handleKey);
    this.renderer.domElement.addEventListener("pointerdown", this.handlePointerDown);
    this.renderer.domElement.addEventListener("pointerup", this.handlePointerUp);
    this.handleResize();

    this.renderer.setAnimationLoop(() => this.render());
  }

  load(url) {
    const loader = new GLTFLoader();
    loader.load(
      url,
      (gltf) => {
        this.model = gltf.scene;
        this.model.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });
        this.scene.add(this.model);
        this.addGround();
        this.fitCamera();
        this.setupLevels();
        this.callbacks.onLoaded?.();
      },
      (event) => {
        if (event.total)
          this.callbacks.onProgress?.(Math.round((event.loaded / event.total) * 100));
      },
      (error) => this.callbacks.onError?.(error),
    );
  }

  // Soft shadow catcher under the model
  addGround() {
    const box = new THREE.Box3().setFromObject(this.model);
    const size = box.getSize(new THREE.Vector3());
    const ground = new THREE.Mesh(
      new THREE.CircleGeometry(Math.max(size.x, size.z) * 1.2, 64),
      new THREE.ShadowMaterial({ opacity: 0.35 }),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = box.min.y - 0.001;
    ground.receiveShadow = true;
    ground.userData.isGround = true;
    this.scene.add(ground);
  }

  fitCamera() {
    const box = new THREE.Box3().setFromObject(this.model);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const radius = size.length() / 2;
    const distance = radius / Math.sin(THREE.MathUtils.degToRad(this.camera.fov / 2));
    const direction = new THREE.Vector3(0.9, 0.75, 1).normalize();
    this.home = {
      position: center.clone().add(direction.multiplyScalar(distance * 0.85)),
      target: center.clone(),
    };
    this.controls.maxDistance = distance * 3;
    this.controls.minDistance = Math.max(0.3, radius * 0.05);
    this.sun.position.copy(center).add(new THREE.Vector3(radius, radius * 2, radius * 0.8));
    this.sun.target.position.copy(center);
    const shadowSize = radius * 1.5;
    Object.assign(this.sun.shadow.camera, {
      left: -shadowSize,
      right: shadowSize,
      top: shadowSize,
      bottom: -shadowSize,
      far: radius * 6,
    });
    this.sun.shadow.camera.updateProjectionMatrix();
    this.scene.fog.near = distance * 2;
    this.scene.fog.far = distance * 6;
    this.resetView();
  }

  // Back to the default camera, with the floors together and every level showing
  resetView() {
    if (!this.home) return;
    this.tween = null;
    this.controls.enabled = true;
    if (this.levels.length) {
      this.focusLevel(null, { moveCamera: false });
      this.applyExplode(0);
      this.setFloorsState(false);
    }
    this.camera.position.copy(this.home.position);
    this.controls.target.copy(this.home.target);
    this.controls.update();
  }

  // ----- floors view -----

  // Finds the levels and remembers where every part starts, so lifting is always relative to
  // the model as it was built (no drift after many toggles).
  setupLevels() {
    this.levels = findLevels(this.model).map((level) => ({
      ...level,
      dimmed: false,
      parts: level.objects.map((object) => {
        // A 1 m world-space lift, expressed in the parent's space (scans can have scaled or
        // rotated parent nodes)
        const a = object.parent.worldToLocal(new THREE.Vector3(0, 0, 0));
        const b = object.parent.worldToLocal(new THREE.Vector3(0, 1, 0));
        return { object, base: object.position.clone(), perMetre: b.sub(a) };
      }),
      label: this.makeLevelLabel(level),
    }));
    // One gap for the whole house: 60% of a typical (median) level height
    const heights = this.levels.map((l) => l.height).sort((x, y) => x - y);
    this.gap = EXPLODE_GAP * (heights[Math.floor(heights.length / 2)] ?? 3);
    this.callbacks.onLevels?.(
      this.levels.map(({ number, summary }) => ({ number, summary, name: floorName(number) })),
    );
  }

  // Label beside a level: "LEVEL 2" in gold, a white line under it, a thin grey callout line
  makeLevelLabel(level) {
    const el = document.createElement("div");
    el.style.cssText =
      "position:absolute;display:none;align-items:center;gap:8px;transform:translateY(-50%);" +
      "pointer-events:none;transition:opacity .2s";
    const line = document.createElement("span");
    line.style.cssText = "display:block;width:40px;height:1px;background:rgba(255,255,255,.45)";
    const text = document.createElement("span");
    text.style.cssText =
      "display:block;padding:6px 10px;border-radius:10px;background:rgba(14,23,20,.72);" +
      "backdrop-filter:blur(6px);white-space:nowrap;font-family:Inter,system-ui,sans-serif";
    const title = document.createElement("span");
    title.style.cssText =
      "display:block;font-size:10px;font-weight:700;letter-spacing:.18em;color:#c39a4b";
    title.textContent = `LEVEL ${level.number}`;
    const sub = document.createElement("span");
    sub.style.cssText = "display:block;font-size:13px;font-weight:600;color:#fff";
    sub.textContent = level.summary || floorName(level.number);
    text.append(title, sub);
    el.append(line, text);
    this.labelLayer.appendChild(el);
    return { el };
  }

  // Lift every level by its share of the explode amount (0 = together, 1 = apart)
  applyExplode(amount) {
    this.explode = amount;
    this.levels.forEach((level, index) => {
      const lift = index * this.gap * amount;
      for (const part of level.parts) {
        part.object.position.copy(part.base).addScaledVector(part.perMetre, lift);
      }
    });
  }

  // Box around the levels as they are at explode `amount` (or around one level only)
  levelsBox(amount, onlyIndex = null) {
    const box = new THREE.Box3();
    this.levels.forEach((level, index) => {
      if (onlyIndex !== null && index !== onlyIndex) return;
      box.union(level.box.clone().translate(new THREE.Vector3(0, index * this.gap * amount, 0)));
    });
    return box;
  }

  // A camera that keeps the current viewing direction but fits `box` on screen
  cameraFor(box, margin = 1.15) {
    const center = box.getCenter(new THREE.Vector3());
    const radius = box.getSize(new THREE.Vector3()).length() / 2;
    const halfFov = THREE.MathUtils.degToRad(this.camera.fov / 2);
    const halfFovX = Math.atan(Math.tan(halfFov) * this.camera.aspect);
    const distance = (radius / Math.sin(Math.min(halfFov, halfFovX))) * margin * 0.85;
    const direction = this.camera.position.clone().sub(this.controls.target).normalize();
    return { position: center.clone().add(direction.multiplyScalar(distance)), target: center };
  }

  setFloorsState(exploded) {
    this.exploded = exploded;
    this.setMeasurementsVisible(!exploded); // their points are in "together" positions
    this.callbacks.onFloorsChange?.({ exploded, focusedLevel: this.focusedLevel });
  }

  // Pull the floors apart (true) or put them back together (false)
  setExploded(on) {
    if (!this.levels.length || on === this.exploded) return;
    if (!on) this.focusLevel(null, { moveCamera: false });
    this.clearPending();
    this.setFloorsState(on);
    const camera = this.cameraFor(this.levelsBox(on ? 1 : 0), on ? 1.3 : 1.0); // room for the toolbar
    this.startTween({ explodeTo: on ? 1 : 0, camera });
  }

  // Fade the other levels to 15% and frame this one. index null = all levels again.
  focusLevel(index, { moveCamera = true } = {}) {
    if (!this.levels.length) return;
    if (index !== null) this.ensureOwnMaterials();
    this.focusedLevel = index;
    this.levels.forEach((level, i) => {
      level.dimmed = index !== null && i !== index;
      for (const part of level.parts) {
        part.object.traverse((child) => {
          const original = child.userData.levelMaterial;
          if (!child.isMesh || !original) return;
          child.material.opacity = level.dimmed
            ? FADED_OPACITY * original.opacity
            : original.opacity;
          child.material.transparent = level.dimmed || original.transparent;
          child.material.depthWrite = level.dimmed ? false : original.depthWrite;
        });
      }
    });
    if (moveCamera) {
      const box = this.levelsBox(this.explode, index);
      this.startTween({ camera: this.cameraFor(box, index === null ? 1.15 : 1.35) });
    }
    this.callbacks.onFloorsChange?.({ exploded: this.exploded, focusedLevel: index });
  }

  // Models often share one material between many parts and levels. Fading one level must not
  // fade the others, so each mesh gets its own copy the first time a level is focused.
  ensureOwnMaterials() {
    if (this.ownMaterials.length) return;
    for (const level of this.levels) {
      for (const part of level.parts) {
        part.object.traverse((child) => {
          if (!child.isMesh || child.userData.levelMaterial || Array.isArray(child.material)) {
            return; // (multi-material meshes are rare in scans; they just don't fade)
          }
          const source = child.material;
          child.userData.levelMaterial = {
            source,
            opacity: source.opacity,
            transparent: source.transparent,
            depthWrite: source.depthWrite,
          };
          child.material = source.clone();
          this.ownMaterials.push(child.material);
        });
      }
    }
  }

  // One animation at a time: the explode amount and/or the camera, eased over EXPLODE_MS.
  // With "reduce motion" switched on it jumps straight to the end.
  startTween({ explodeTo = this.explode, camera = null }) {
    this.tween = {
      start: performance.now(),
      duration: reducedMotion() ? 0 : EXPLODE_MS,
      explodeFrom: this.explode,
      explodeTo,
      cameraFrom: { position: this.camera.position.clone(), target: this.controls.target.clone() },
      cameraTo: camera,
    };
    this.controls.enabled = false; // a drag would fight the animation
    this.stepTween(performance.now());
  }

  stepTween(now) {
    const t = this.tween;
    if (!t) return;
    const k = t.duration === 0 ? 1 : Math.min(1, (now - t.start) / t.duration);
    const e = easeInOutCubic(k);
    this.applyExplode(t.explodeFrom + (t.explodeTo - t.explodeFrom) * e);
    if (t.cameraTo) {
      this.camera.position.lerpVectors(t.cameraFrom.position, t.cameraTo.position, e);
      this.controls.target.lerpVectors(t.cameraFrom.target, t.cameraTo.target, e);
    }
    if (k >= 1) {
      this.tween = null;
      this.controls.enabled = true;
    }
  }

  // Labels follow their level on screen each frame, only while the floors are apart
  updateLevelLabels(rect) {
    const show = this.explode > 0.5;
    this.levels.forEach((level, index) => {
      const { el } = level.label;
      if (!show) {
        el.style.display = "none";
        return;
      }
      const ownHeight = Math.min(level.height, level.box.max.y - level.box.min.y);
      const anchor = new THREE.Vector3(
        level.box.max.x,
        level.box.min.y + ownHeight / 2 + index * this.gap * this.explode,
        (level.box.min.z + level.box.max.z) / 2,
      ).project(this.camera);
      if (anchor.z > 1) {
        el.style.display = "none";
        return;
      }
      const x = ((anchor.x + 1) / 2) * rect.width;
      const y = ((1 - anchor.y) / 2) * rect.height;
      el.style.display = "flex";
      el.style.opacity = String(Math.min(1, (this.explode - 0.5) * 2) * (level.dimmed ? 0.4 : 1));
      // Near the right edge, put the label on the left of its point so it stays readable
      const flip = x + 190 > rect.width;
      el.style.flexDirection = flip ? "row-reverse" : "row";
      el.style.left = flip ? "auto" : `${x}px`;
      el.style.right = flip ? `${rect.width - x}px` : "auto";
      el.style.top = `${Math.min(rect.height - 40, Math.max(40, y))}px`;
    });
  }

  setAutoRotate(on) {
    this.controls.autoRotate = on;
  }

  setMeasuring(on) {
    this.measuring = on;
    this.renderer.domElement.style.cursor = on ? "crosshair" : "";
    if (!on) this.clearPending();
  }

  // ----- measuring -----

  handlePointerDown(event) {
    this.downAt = { x: event.clientX, y: event.clientY };
  }

  handlePointerUp(event) {
    if (!this.measuring || !this.model || !this.downAt) return;
    const moved = Math.hypot(event.clientX - this.downAt.x, event.clientY - this.downAt.y);
    if (moved > CLICK_TOLERANCE_PX) return; // that was a drag to look around

    const rect = this.renderer.domElement.getBoundingClientRect();
    this.pointer.set(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1,
    );
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const hit = this.raycaster.intersectObject(this.model, true)[0];
    if (!hit) return;

    if (!this.pendingPoint) {
      this.pendingPoint = { point: hit.point.clone(), dot: this.makeDot(hit.point) };
      this.callbacks.onMeasure?.(this.summary(), true);
      return;
    }
    this.addMeasurement(this.pendingPoint.point, hit.point.clone(), this.pendingPoint.dot);
    this.pendingPoint = null;
  }

  handleKey(event) {
    if (event.key === "Escape") this.clearPending();
  }

  // Measurements were taken with the floors together; hide them while the floors are apart
  setMeasurementsVisible(visible) {
    this.measurementsHidden = !visible;
    for (const m of this.measurements) {
      m.line.visible = visible;
      m.dots.forEach((dot) => (dot.visible = visible));
      if (!visible) m.label.style.display = "none";
    }
  }

  makeDot(position) {
    const dot = new THREE.Mesh(
      new THREE.SphereGeometry(0.045, 20, 20),
      new THREE.MeshBasicMaterial({ color: GOLD, depthTest: false }),
    );
    dot.renderOrder = 10;
    dot.position.copy(position);
    this.scene.add(dot);
    return dot;
  }

  addMeasurement(a, b, firstDot) {
    const line = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([a, b]),
      new THREE.LineBasicMaterial({ color: GOLD, depthTest: false }),
    );
    line.renderOrder = 9;
    this.scene.add(line);
    const secondDot = this.makeDot(b);

    const meters = a.distanceTo(b);
    const label = document.createElement("div");
    label.style.cssText =
      "position:absolute;transform:translate(-50%,-50%);padding:4px 10px;border-radius:999px;" +
      "background:#fff;color:#0e2a23;font:600 13px Inter,system-ui,sans-serif;white-space:nowrap;" +
      "box-shadow:0 6px 18px rgba(0,0,0,.35)";
    label.textContent = formatLength(meters);
    this.labelLayer.appendChild(label);

    this.measurements.push({
      id: this.nextId++,
      a,
      b,
      meters,
      line,
      dots: [firstDot, secondDot],
      label,
    });
    this.callbacks.onMeasure?.(this.summary(), false);
  }

  clearPending() {
    if (!this.pendingPoint) return;
    this.disposeObject(this.pendingPoint.dot);
    this.pendingPoint = null;
    this.callbacks.onMeasure?.(this.summary(), false);
  }

  removeMeasurement(id) {
    const index = this.measurements.findIndex((m) => m.id === id);
    if (index === -1) return;
    const [m] = this.measurements.splice(index, 1);
    this.disposeObject(m.line);
    m.dots.forEach((dot) => this.disposeObject(dot));
    m.label.remove();
    this.callbacks.onMeasure?.(this.summary(), Boolean(this.pendingPoint));
  }

  clearMeasurements() {
    [...this.measurements].forEach((m) => this.removeMeasurement(m.id));
    this.clearPending();
  }

  summary() {
    return this.measurements.map(({ id, meters }) => ({ id, meters }));
  }

  // ----- frame loop & housekeeping -----

  render() {
    this.stepTween(performance.now());
    this.controls.update();
    this.renderer.render(this.scene, this.camera);

    const rect = this.renderer.domElement.getBoundingClientRect();
    if (this.levels.length) this.updateLevelLabels(rect);

    // Keep each distance label at the middle of its line
    if (this.measurementsHidden) return;
    for (const m of this.measurements) {
      const mid = m.a.clone().add(m.b).multiplyScalar(0.5).project(this.camera);
      const visible = mid.z < 1;
      m.label.style.display = visible ? "block" : "none";
      if (visible) {
        m.label.style.left = `${((mid.x + 1) / 2) * rect.width}px`;
        m.label.style.top = `${((1 - mid.y) / 2) * rect.height}px`;
      }
    }
  }

  handleResize() {
    const { clientWidth: width, clientHeight: height } = this.container;
    if (!width || !height) return;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  disposeObject(object) {
    this.scene.remove(object);
    object.geometry?.dispose();
    object.material?.dispose();
  }

  destroy() {
    this.renderer.setAnimationLoop(null);
    window.removeEventListener("resize", this.handleResize);
    window.removeEventListener("keydown", this.handleKey);
    this.controls.dispose();
    this.scene.traverse((object) => {
      object.geometry?.dispose();
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      materials.forEach((material) => {
        if (!material) return;
        Object.values(material).forEach((value) => value?.isTexture && value.dispose());
        material.dispose();
      });
    });
    // Materials swapped out for per-level copies are no longer in the scene: dispose them too
    for (const level of this.levels) {
      for (const part of level.parts) {
        part.object.traverse((child) => child.userData.levelMaterial?.source.dispose());
      }
    }
    this.levels = [];
    this.ownMaterials = [];
    this.tween = null;
    this.renderer.dispose();
    this.renderer.domElement.remove();
    this.labelLayer.remove();
  }
}

// 4.8263 -> "4.83 m · 15′ 10″"
export function formatLength(meters) {
  const totalInches = Math.round(meters * 39.3701);
  const feet = Math.floor(totalInches / 12);
  const inches = totalInches % 12;
  return `${meters.toFixed(2)} m · ${feet}′ ${inches}″`;
}
