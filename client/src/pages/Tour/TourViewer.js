// The 3D part of the Tour screen, written with plain three.js (no React inside).
// Tour.jsx creates one TourViewer, and calls destroy() when the screen closes.
//
//   const viewer = new TourViewer(containerElement, { onProgress, onLoaded, onError, onMeasure });
//   viewer.load(url);  viewer.setMeasuring(true);  viewer.resetView();  viewer.destroy();
//
// Measuring: click two points on the model and the distance appears between them.
// LiDAR scans are saved in metres, so 1 unit in the scene = 1 metre.
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const GOLD = 0xc39a4b;
const CLICK_TOLERANCE_PX = 5; // a drag shorter than this still counts as a click

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

  resetView() {
    if (!this.home) return;
    this.camera.position.copy(this.home.position);
    this.controls.target.copy(this.home.target);
    this.controls.update();
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
    this.controls.update();
    this.renderer.render(this.scene, this.camera);

    // Keep each distance label at the middle of its line
    const rect = this.renderer.domElement.getBoundingClientRect();
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
