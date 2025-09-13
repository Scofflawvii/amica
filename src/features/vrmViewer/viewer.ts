import * as THREE from "three";
import {
  computeBoundsTree,
  disposeBoundsTree,
  computeBatchedBoundsTree,
  disposeBatchedBoundsTree,
  acceleratedRaycast,
  MeshBVHHelper,
  StaticGeometryGenerator,
} from "three-mesh-bvh";
// import { GenerateMeshBVHWorker } from "@/workers/bvh/GenerateMeshBVHWorker";
import type { WorkerBase } from "@/workers/bvh/utils/WorkerBase";
// Temp Disable : WebXR
// import {
//     BatchedParticleRenderer,
//     QuarksLoader,
//     QuarksUtil,
// } from 'three.quarks';

import { VRMHumanBoneName } from "@pixiv/three-vrm";
import GUI from "lil-gui";
import Stats from "stats.js";

import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { InteractiveGroup } from "three/examples/jsm/interactive/InteractiveGroup.js";
import { HTMLMesh } from "three/examples/jsm/interactive/HTMLMesh.js";

import { loadVRMAnimation } from "@/lib/VRMAnimation/loadVRMAnimation";
import { loadMixamoAnimation } from "@/lib/VRMAnimation/loadMixamoAnimation";
import { config } from "@/utils/config";

import { XRControllerModelFactory } from "./XRControllerModelFactory";
import { XRHandModelFactory } from "./XRHandModelFactory";
import { Model } from "./model";
import { Room } from "./room";
import { logger } from "@/utils/logger";

const vlog = logger.with({ subsystem: "viewer" });

// Add the extension functions
THREE.Mesh.prototype.raycast = acceleratedRaycast;
THREE.BatchedMesh.prototype.raycast = acceleratedRaycast;

THREE.BufferGeometry.prototype.computeBoundsTree = computeBoundsTree;
THREE.BufferGeometry.prototype.disposeBoundsTree = disposeBoundsTree;

THREE.BatchedMesh.prototype.computeBoundsTree = computeBatchedBoundsTree;
THREE.BatchedMesh.prototype.disposeBoundsTree = disposeBatchedBoundsTree;

const joints: string[] = [
  "wrist",
  "thumb-metacarpal",
  "thumb-phalanx-proximal",
  "thumb-phalanx-distal",
  "thumb-tip",
  "index-finger-metacarpal",
  "index-finger-phalanx-proximal",
  "index-finger-phalanx-intermediate",
  "index-finger-phalanx-distal",
  "index-finger-tip",
  "middle-finger-metacarpal",
  "middle-finger-phalanx-proximal",
  "middle-finger-phalanx-intermediate",
  "middle-finger-phalanx-distal",
  "middle-finger-tip",
  "ring-finger-metacarpal",
  "ring-finger-phalanx-proximal",
  "ring-finger-phalanx-intermediate",
  "ring-finger-phalanx-distal",
  "ring-finger-tip",
  "pinky-finger-metacarpal",
  "pinky-finger-phalanx-proximal",
  "pinky-finger-phalanx-intermediate",
  "pinky-finger-phalanx-distal",
  "pinky-finger-tip",
];

const amicaBones: VRMHumanBoneName[] = [
  "hips",
  "spine",
  "chest",
  "upperChest",
  "neck",

  "head",
  "leftEye",
  "rightEye",
  "jaw",

  "leftUpperLeg",
  "leftLowerLeg",
  "leftFoot",
  "leftToes",

  "rightUpperLeg",
  "rightLowerLeg",
  "rightFoot",
  "rightToes",

  "leftShoulder",
  "leftUpperArm",
  "leftLowerArm",
  "leftHand",

  "rightShoulder",
  "rightUpperArm",
  "rightLowerArm",
  "rightHand",
];

// Minimal contract for dynamic scenarios loaded at runtime
type Scenario = {
  setup: () => Promise<void>;
  update?: (dt: number) => void;
};

/**
 * three.jsを使った3Dビューワー
 *
 * setup()でcanvasを渡してから使う
 */
export class Viewer {
  public isReady: boolean = false;
  public model?: Model;
  public room?: Room;

  public renderer?: THREE.WebGLRenderer;
  private clock: THREE.Clock;
  private elapsedMsMid: number = 0;
  private elapsedMsSlow: number = 0;
  private scene?: THREE.Scene;
  private camera?: THREE.PerspectiveCamera;
  private cameraControls?: OrbitControls;
  private stats?: Stats;
  private statsMesh?: THREE.Mesh;
  private gui?: GUI;
  private guiMesh?: THREE.Mesh;

  private sendScreenshotToCallback: boolean;
  private screenshotCallback: BlobCallback | undefined;

  private mediaRecorder?: MediaRecorder;
  private recordedChunks: Blob[] = [];
  private videoStream: MediaStream | null = null;

  // XR
  public currentSession: XRSession | null = null;
  private hand1: THREE.Group | null = null;
  private hand2: THREE.Group | null = null;
  private controller1: THREE.Group | null = null;
  private controller2: THREE.Group | null = null;
  private usingController1 = false;
  private usingController2 = false;
  private controllerGrip1: THREE.Group | null = null;
  private controllerGrip2: THREE.Group | null = null;
  private isPinching1 = false;
  private isPinching2 = false;
  private igroup: InteractiveGroup | null = null;

  private gparams = {
    "y-offset": 0,
    "room-x": 0,
    "room-y": 0,
    "room-z": 0,
    "room-scale": 1,
  };
  private updateMsPanel: { update: (v: number, max?: number) => void } = {
    update: () => {},
  };
  private renderMsPanel: { update: (v: number, max?: number) => void } = {
    update: () => {},
  };
  private scenarioMsPanel: { update: (v: number, max?: number) => void } = {
    update: () => {},
  };
  private physicsMsPanel: { update: (v: number, max?: number) => void } = {
    update: () => {},
  };
  private modelMsPanel: { update: (v: number, max?: number) => void } = {
    update: () => {},
  };
  private bvhMsPanel: { update: (v: number, max?: number) => void } = {
    update: () => {},
  };
  private raycastMsPanel: { update: (v: number, max?: number) => void } = {
    update: () => {},
  };
  private statsMsPanel: { update: (v: number, max?: number) => void } = {
    update: () => {},
  };

  private bvhWorker: WorkerBase | null = null;
  private modelBVHGenerator: StaticGeometryGenerator | null = null;
  private modelGeometry: THREE.BufferGeometry | null = null;
  private modelMeshHelper: THREE.Mesh | null = null;
  private modelBVHHelper: MeshBVHHelper | null = null;
  private roomBVHHelperGroup = new THREE.Group();
  private modelTargets: THREE.Mesh[] = [];
  private roomTargets: THREE.Mesh[] = [];
  private raycaster = new THREE.Raycaster();
  private raycasterTempM = new THREE.Matrix4();
  private intersectsModel: THREE.Intersection[] = [];
  private intersectsRoom: THREE.Intersection[] = [];

  private jointMeshes1: THREE.Mesh[] = []; // controller1
  private jointMeshes2: THREE.Mesh[] = []; // controller2
  private handGroup = new THREE.Group();

  private closestPart1: THREE.Object3D | null = null;
  private closestPart2: THREE.Object3D | null = null;

  private mouse = new THREE.Vector2();

  // Temp Disable : WebXR
  // private particleRenderer = new BatchedParticleRenderer();
  // private particleCartoonStarField: THREE.Object3D | null = null;

  private ammo: unknown;
  private collisionConfiguration: unknown;
  private dispatcher: unknown;
  private broadphase: unknown;
  private solver: unknown;
  private physicsWorld: unknown;
  private transformAux1: unknown;
  private tempBtVec3_1: unknown;

  private scenario?: Scenario;
  private scenarioLoading: boolean = false;
  private pausedHeavy: boolean = false;

  // Adaptive resolution controls
  private adaptiveEnabled: boolean = false;
  private pixelRatioMin: number = 0.75;
  private pixelRatioMax: number = 1.0;
  private pixelRatio: number = 1.0;
  private fpsSamples: number[] = [];
  private fpsWindowSec = 1.5; // adjust every ~1.5s
  // Minimal FPS overlay
  private fpsEnabled: boolean = false;
  private fpsCanvas: HTMLCanvasElement | undefined;
  private fpsCtx: CanvasRenderingContext2D | null | undefined;
  private fpsValue: number = 60;
  // Stored listeners for cleanup
  private _onResize?: () => void;
  private _onVisibility?: () => void;
  private _onMouseMove?: (event: MouseEvent) => void;

  constructor() {
    this.isReady = false;
    this.sendScreenshotToCallback = false;
    this.screenshotCallback = undefined;

    // animate
    this.clock = new THREE.Clock();
    this.clock.start();
  }

  public async setup(canvas: HTMLCanvasElement) {
    vlog.debug("setup canvas");
    const parentElement = canvas.parentElement;
    const width = parentElement?.clientWidth || canvas.width;
    const height = parentElement?.clientHeight || canvas.height;

    // Prefer WebGPU if requested (or auto with support), else fallback to WebGL
    let renderer: THREE.WebGLRenderer;
    const webgpuPref = config("use_webgpu");
    const wantWebGPU =
      webgpuPref === "true" ||
      (webgpuPref === "auto" &&
        typeof navigator !== "undefined" &&
        "gpu" in navigator);
    if (wantWebGPU) {
      try {
        const WebGPURenderer = (
          await import("three/src/renderers/webgpu/WebGPURenderer.js")
        ).default as unknown as {
          new (opts: {
            canvas: HTMLCanvasElement;
            alpha: boolean;
            antialias: boolean;
            powerPreference: string;
          }): THREE.WebGLRenderer;
        };
        renderer = new WebGPURenderer({
          canvas,
          alpha: true,
          antialias: true,
          powerPreference: "high-performance",
        }) as unknown as THREE.WebGLRenderer;
      } catch (err) {
        vlog.warn("WebGPU init failed; falling back to WebGL", err);
        renderer = new THREE.WebGLRenderer({
          canvas,
          alpha: true,
          antialias: true,
          powerPreference: "high-performance",
        });
      }
    } else {
      renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
        powerPreference: "high-performance",
      });
    }
    this.renderer = renderer;

    renderer.setClearColor(0x000000, 0);
    // Modern defaults: color space, tone mapping, physically correct lighting
    if (
      (renderer as unknown as { outputColorSpace?: unknown })
        .outputColorSpace !== undefined
    ) {
      (renderer as unknown as { outputColorSpace: unknown }).outputColorSpace =
        THREE.SRGBColorSpace;
    }
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    (
      renderer as unknown as { physicallyCorrectLights?: boolean }
    ).physicallyCorrectLights = true;
    renderer.shadowMap.enabled = false;

    // Adaptive pixel ratio setup
    this.adaptiveEnabled = config("adaptive_pixel_ratio") === "true";
    // bounds from config, with safe parsing
    const prMin = parseFloat(config("min_pixel_ratio"));
    const prMax = parseFloat(config("max_pixel_ratio"));
    if (!Number.isNaN(prMin))
      this.pixelRatioMin = Math.max(0.5, Math.min(1.0, prMin));
    if (!Number.isNaN(prMax))
      this.pixelRatioMax = Math.max(this.pixelRatioMin, Math.min(2.0, prMax));
    const devicePR =
      typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
    this.pixelRatio = Math.min(
      this.pixelRatioMax,
      Math.max(this.pixelRatioMin, devicePR),
    );

    renderer.setSize(width, height);
    renderer.setPixelRatio(this.pixelRatio);
    renderer.xr.enabled = true;
    // TODO should this be enabled for only the quest3?
    const xrScale = parseFloat(config("xr_framebuffer_scale"));
    renderer.xr.setFramebufferScaleFactor(
      !Number.isNaN(xrScale) ? xrScale : 2.0,
    ); // reduce pixelation with minimal performance hit on quest 3
    // Set XR foveation only on WebGL renderers that support it
    if (
      !(renderer as unknown as { isWebGPURenderer?: boolean }).isWebGPURenderer
    ) {
      const foveation = parseFloat(config("xr_foveation"));
      if (
        typeof (
          renderer.xr as unknown as { setFoveation?: (v: number) => void }
        ).setFoveation === "function"
      ) {
        (
          renderer.xr as unknown as { setFoveation: (v: number) => void }
        ).setFoveation(!Number.isNaN(foveation) ? foveation : 0);
      }
    }

    // Temp Disable : WebXR
    // initialize phyics
    // we have this weird construct because ammo is loaded globally
    // and things get funny with hot reloading
    // if (typeof window.Ammo === 'undefined') {
    //   console.error("Ammo not found");
    // } else if (typeof window.Ammo === 'function') {
    //   this.ammo = await window.Ammo();
    // } else {
    //   this.ammo = window.Ammo;
    // }
    // if (this.ammo) {
    //   this.collisionConfiguration = new this.ammo.btDefaultCollisionConfiguration();
    //   this.dispatcher = new this.ammo.btCollisionDispatcher(this.collisionConfiguration);
    //   this.broadphase = new this.ammo.btDbvtBroadphase();
    //   this.solver = new this.ammo.btSequentialImpulseConstraintSolver();
    //   this.physicsWorld = new this.ammo.btDiscreteDynamicsWorld(
    //     this.dispatcher,
    //     this.broadphase,
    //     this.solver,
    //     this.collisionConfiguration
    //   );
    //   this.physicsWorld.setGravity(new this.ammo.btVector3(0, -7.8, 0));
    //   this.transformAux1 = new this.ammo.btTransform();
    //   this.tempBtVec3_1 = new this.ammo.btVector3(0, 0, 0);
    // }

    const scene = new THREE.Scene();
    this.scene = scene;

    // Temp Disable : WebXR -> 1.2
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
    directionalLight.position.set(1.0, 1.0, 1.0).normalize();
    directionalLight.castShadow = false;
    scene.add(directionalLight);

    const ambientLight = new THREE.AmbientLight(0xffffff, 2);
    scene.add(ambientLight);

    scene.add(this.roomBVHHelperGroup);

    // camera
    const camera = new THREE.PerspectiveCamera(20.0, width / height, 0.1, 20.0);
    this.camera = camera;

    // Temp Disable : WebXR y -> -3
    camera.position.set(0, 8.5, 3.5);

    const cameraControls = new OrbitControls(camera, renderer.domElement);
    this.cameraControls = cameraControls;

    cameraControls.screenSpacePanning = true;
    cameraControls.enableDamping = true;
    cameraControls.dampingFactor = 0.08;
    cameraControls.minDistance = 0.5;
    // Temp Disable : WebXR max -> 8
    cameraControls.maxDistance = 4;
    cameraControls.update();

    const igroup = new InteractiveGroup();
    this.igroup = igroup;

    igroup.position.set(-0.25, 1.3, -0.8);
    igroup.rotation.set(0, Math.PI / 8, 0);
    igroup.visible = false;
    scene.add(igroup);

    igroup.listenToPointerEvents(renderer, camera);

    const pointerFromCanvas = config("pointer_from_canvas") !== "false"; // default true
    this._onMouseMove = (event: MouseEvent) => {
      if (pointerFromCanvas) {
        const rect = canvas.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width;
        const y = (event.clientY - rect.top) / rect.height;
        this.mouse.x = x * 2 - 1;
        this.mouse.y = -(y * 2 - 1);
      } else {
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
      }
    };
    canvas.addEventListener("mousemove", this._onMouseMove);

    // check if controller is available
    try {
      const controller1 = renderer.xr.getController(0);
      this.controller1 = controller1;

      const controller2 = renderer.xr.getController(1);
      this.controller2 = controller2;

      scene.add(controller1);
      scene.add(controller2);

      controller1.addEventListener("connected", (_event) => {
        this.usingController1 = true;
      });
      controller2.addEventListener("connected", (_event) => {
        this.usingController2 = true;
      });

      const controllerModelFactory = new XRControllerModelFactory();

      const controllerGrip1 = renderer.xr.getControllerGrip(0);
      this.controllerGrip1 = controllerGrip1;

      controllerGrip1.add(
        controllerModelFactory.createControllerModel(controllerGrip1),
      );
      scene.add(controllerGrip1);

      const controllerGrip2 = renderer.xr.getControllerGrip(1);
      this.controllerGrip2 = controllerGrip2;

      controllerGrip2.add(
        controllerModelFactory.createControllerModel(controllerGrip2),
      );
      scene.add(controllerGrip2);

      const handModelFactory = new XRHandModelFactory();

      const hand1 = renderer.xr.getHand(0);
      this.hand1 = hand1;
      this.hand1.add(handModelFactory.createHandModel(this.hand1, "mesh"));
      scene.add(hand1);

      const hand2 = renderer.xr.getHand(1);
      this.hand2 = hand2;
      this.hand2.add(handModelFactory.createHandModel(this.hand2, "mesh"));
      scene.add(hand2);

      hand1.addEventListener("pinchstart", () => {
        this.isPinching1 = true;
      });
      hand2.addEventListener("pinchstart", () => {
        this.isPinching2 = true;
      });

      hand1.addEventListener("pinchend", () => {
        this.isPinching1 = false;
      });
      hand2.addEventListener("pinchend", () => {
        this.isPinching2 = false;
      });

      {
        const geometry = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(0, 0, 0),
          new THREE.Vector3(0, 0, -1),
        ]);

        const line = new THREE.Line(geometry);
        line.scale.z = 5;

        controller1.add(line.clone());
        controller2.add(line.clone());
      }

      // webgpu does not support xr controller events yet
      if (config("use_webgpu") !== "true") {
        igroup.listenToXRControllerEvents(controller1);
        igroup.listenToXRControllerEvents(controller2);
      }
    } catch (e) {
      vlog.debug("No controller available", e);
    }

    // gui
    const showDebugUI = config("debug_gfx") === "true";
    if (showDebugUI) {
      const gui = new GUI();
      this.gui = gui;
      let updateDebounceId: ReturnType<typeof setTimeout> | null = null;
      gui.add(this.gparams, "room-x", -10, 10).onChange((value: number) => {
        this.room?.room?.position.setX(value);
      });
      gui.add(this.gparams, "room-y", -10, 10).onChange((value: number) => {
        this.room?.room?.position.setY(value);
      });
      gui.add(this.gparams, "room-z", -10, 10).onChange((value: number) => {
        this.room?.room?.position.setZ(value);
      });
      gui.add(this.gparams, "room-scale", 0, 1).onChange((value: number) => {
        this.room?.room?.scale.set(value, value, value);
      });

      gui.add(this.gparams, "y-offset", -0.2, 0.2).onChange((value: number) => {
        if (updateDebounceId) {
          clearTimeout(updateDebounceId);
        }

        updateDebounceId = setTimeout(() => {
          this.teleport(0, value, 0);
          this.gparams["y-offset"] = 0;
        }, 1000);
      });

      const guiMesh = new HTMLMesh(gui.domElement);
      this.guiMesh = guiMesh;
      // Ensure GUI panel is opaque for readability
      try {
        const el = (gui as unknown as { domElement?: HTMLElement })
          .domElement as HTMLElement | undefined;
        if (el) {
          el.style.background = "hsl(var(--surface))";
          el.style.color = "hsl(var(--text))";
        }
      } catch {
        // no-op
        void 0;
      }

      guiMesh.position.x = 0;
      guiMesh.position.y = 0;
      guiMesh.position.z = 0;
      guiMesh.scale.setScalar(2);
      igroup.add(guiMesh);
    }

    // stats
    if (showDebugUI) {
      const stats = new Stats();
      this.stats = stats;

      // Support both stats.js APIs: `.dom` (modern) and `.domElement` (legacy)
      const statsDom: HTMLElement | null =
        (stats as unknown as { dom?: HTMLElement }).dom ||
        (stats as unknown as { domElement?: HTMLElement }).domElement ||
        null;
      if (typeof document !== "undefined" && statsDom) {
        statsDom.style.width = "80px";
        statsDom.style.height = "48px";
        statsDom.style.position = "absolute";
        statsDom.style.top = "0px";
        statsDom.style.left = window.innerWidth - 80 + "px";
        // Opaque background for debug overlay
        statsDom.style.background = "hsl(var(--surface))";
        statsDom.style.color = "hsl(var(--text))";
        document.body.appendChild(statsDom);
      } else {
        vlog.warn(
          "Stats DOM element not available; skipping on-page stats overlay.",
        );
      }

      const hasPanels =
        typeof (
          Stats as unknown as { Panel?: new (...args: unknown[]) => unknown }
        ).Panel === "function" &&
        typeof (
          stats as unknown as {
            addPanel?: (p: unknown) => {
              update: (v: number, max?: number) => void;
            };
          }
        ).addPanel === "function";
      if (hasPanels) {
        const S = Stats as unknown as {
          Panel: new (name: string, fg: string, bg: string) => unknown;
        };
        const s = stats as unknown as {
          addPanel: (p: InstanceType<typeof S.Panel>) => {
            update: (v: number, max?: number) => void;
          };
        };
        this.updateMsPanel = s.addPanel(
          new S.Panel("update_ms", "#fff", "#221"),
        );
        this.renderMsPanel = s.addPanel(
          new S.Panel("render_ms", "#ff8", "#221"),
        );
        this.scenarioMsPanel = s.addPanel(
          new S.Panel("scenario_ms", "#f8f", "#221"),
        );
        this.physicsMsPanel = s.addPanel(
          new S.Panel("physics_ms", "#88f", "#212"),
        );
        this.modelMsPanel = s.addPanel(new S.Panel("model_ms", "#f8f", "#212"));
        this.bvhMsPanel = s.addPanel(new S.Panel("bvh_ms", "#8ff", "#122"));
        this.raycastMsPanel = s.addPanel(
          new S.Panel("raycast_ms", "#f8f", "#212"),
        );
        this.statsMsPanel = s.addPanel(new S.Panel("stats_ms", "#8f8", "#212"));
      } else {
        // Fallback: provide no-op panels, legacy stats.js doesn't support custom panels
        const noop = { update: (_v: number, _max?: number) => {} };
        this.updateMsPanel = noop;
        this.renderMsPanel = noop;
        this.scenarioMsPanel = noop;
        this.physicsMsPanel = noop;
        this.modelMsPanel = noop;
        this.bvhMsPanel = noop;
        this.raycastMsPanel = noop;
        this.statsMsPanel = noop;
      }

      if (statsDom) {
        const statsMesh = new HTMLMesh(statsDom);
        this.statsMesh = statsMesh;

        statsMesh.position.x = 0;
        statsMesh.position.y = 0.25;
        statsMesh.position.z = 0;
        statsMesh.scale.setScalar(2.5);
        igroup.add(statsMesh);
      }
    } else {
      // Ensure panels are no-ops when UI disabled
      const noop = { update: (_v: number, _max?: number) => {} };
      this.updateMsPanel = noop;
      this.renderMsPanel = noop;
      this.scenarioMsPanel = noop;
      this.physicsMsPanel = noop;
      this.modelMsPanel = noop;
      this.bvhMsPanel = noop;
      this.raycastMsPanel = noop;
      this.statsMsPanel = noop;
    }

    // Initialize BVH worker based on capability and config
    try {
      const mode = config("bvh_worker_mode"); // auto | off | single | parallel
      if (mode === "off") {
        this.bvhWorker = null;
      } else if (mode === "single") {
        const { GenerateMeshBVHWorker } = await import(
          "@/workers/bvh/GenerateMeshBVHWorker"
        );
        this.bvhWorker = new GenerateMeshBVHWorker();
      } else if (mode === "parallel") {
        // Temporarily fallback to single-threaded worker to avoid bundling parallel worker in dev/test
        const { GenerateMeshBVHWorker } = await import(
          "@/workers/bvh/GenerateMeshBVHWorker"
        );
        this.bvhWorker = new GenerateMeshBVHWorker();
        if (config("debug_gfx") === "true") {
          vlog.info(
            "Parallel BVH worker disabled in this build; using single-threaded worker",
          );
        }
      } else {
        // auto: use single-threaded worker to avoid bundling parallel worker in dev/test
        const { GenerateMeshBVHWorker } = await import(
          "@/workers/bvh/GenerateMeshBVHWorker"
        );
        this.bvhWorker = new GenerateMeshBVHWorker();
      }
    } catch (e) {
      this.bvhWorker = null;
      if (config("debug_gfx") === "true") {
        vlog.warn("BVH worker init failed; falling back to main thread", e);
      }
    }
    this.raycaster.firstHitOnly = true;

    // Temp Disable : WebXR
    // add joint / hand meshes
    // {
    //   const geometry = new THREE.BoxGeometry(0.005, 0.005, 0.005);
    //   const material = new THREE.MeshStandardMaterial({
    //     color: 0xffffff,
    //     roughness: 1.0,
    //     metalness: 0.0,
    //   });

    //   const mesh = new THREE.Mesh(geometry, material);

    //   const lineGeometry = new THREE.BufferGeometry().setFromPoints([
    //     new THREE.Vector3(0, 0, 0),
    //     new THREE.Vector3(0, -1, 0),
    //   ]);

    //   const line = new THREE.Line(lineGeometry);
    //   line.scale.z = 5;

    //   for (const _ of joints) {
    //     // Make joint mesh invisible
    //     const clonedMesh = mesh.clone();
    //     clonedMesh.visible = false;

    //     this.jointMeshes1.push(clonedMesh);
    //     this.jointMeshes2.push(clonedMesh);
    //     // this.jointMeshes1[this.jointMeshes1.length - 1].add(line.clone());
    //     // this.jointMeshes2[this.jointMeshes2.length - 1].add(line.clone());

    //     this.handGroup.add(this.jointMeshes1[this.jointMeshes1.length - 1]);
    //     this.handGroup.add(this.jointMeshes2[this.jointMeshes2.length - 1]);
    //   }

    //   this.handGroup.visible = false;
    //   scene.add(this.handGroup);
    // }

    // {
    //   const geometry = new THREE.SphereGeometry(1, 16, 16);
    //   const material = new THREE.MeshBasicMaterial({
    //     color: 0xffff00,
    //     transparent: true,
    //     opacity: 0.5,
    //   });
    //   const mesh = new THREE.Mesh(geometry, material);
    //   this.closestPart1 = mesh.clone();
    //   this.closestPart2 = mesh.clone();
    //   this.closestPart1.visible = false;
    //   this.closestPart2.visible = false;
    //   scene.add(this.closestPart1);
    //   scene.add(this.closestPart2);
    // }

    // this.particleRenderer = new BatchedParticleRenderer();
    // scene.add(this.particleRenderer);

    // Temp Disable : WebXR
    // new QuarksLoader().load('particles/cartoon_star_field', (obj) => {
    //   this.particleCartoonStarField = obj;

    //   this.newParticleInstance();
    // });

    // Store listeners so we can clean them up
    this._onResize = () => this.resize();
    window.addEventListener("resize", this._onResize);
    if (typeof document !== "undefined") {
      this._onVisibility = () => {
        this.pausedHeavy =
          document.hidden && config("pause_when_hidden") !== "false";
      };
      document.addEventListener("visibilitychange", this._onVisibility);
    }

    this.isReady = true;
    // FPS overlay initial state from config
    this.setFpsOverlayEnabled(config("show_fps_overlay") === "true");
    renderer.setAnimationLoop(() => {
      this.update();
    });
  }

  // Temp Disable : WebXR
  // public newParticleInstance() {
  //   function listener(event: any) {
  //     console.log(event.type);
  //   }

  //   const effect = this.particleCartoonStarField!.clone(true);
  //   QuarksUtil.runOnAllParticleEmitters(effect, (emitter) => {
  //       emitter.system.addEventListener("emitEnd", listener);
  //   })
  //   QuarksUtil.setAutoDestroy(effect, true);
  //   QuarksUtil.addToBatchRenderer(effect, this.particleRenderer);
  //   QuarksUtil.play(effect);
  //   this.scene!.add(effect);
  // }

  public getCanvas() {
    return this.renderer?.domElement?.parentElement?.getElementsByTagName(
      "canvas",
    )[0];
  }

  public async onSessionStarted(
    session: XRSession,
    immersiveType: XRSessionMode,
  ) {
    if (!this.renderer) return;
    this.renderer.xr.setReferenceSpaceType("local");
    await this.renderer.xr.setSession(session);

    this.teleport(0, -1.2, -1);

    // TODO igroup should only be visible if xr doesnt support dom-overlay
    this.igroup!.visible = true;
    if (immersiveType === "immersive-vr") {
      this.handGroup.visible = true;
    }

    this.currentSession = session;
    this.currentSession.addEventListener("end", () => this.onSessionEnded());

    /*
    // TODO this doesnt seem to do anything
    // https://developers.meta.com/horizon/documentation/web/webxr-frames/
    if (this.currentSession) {
      if (this.currentSession.frameRate !== undefined) {
        console.log("frame rate", this.currentSession.frameRate);

        if (this.currentSession.supportedFrameRates !== undefined) {
          const frameRates = this.currentSession.supportedFrameRates;
          console.log("supported frame rates", frameRates);

          this.currentSession.updateTargetFrameRate(frameRates[3]);
        }
      }
    }
    */
  }

  public onSessionEnded(/*event*/) {
    // TODO investigate this
    if (!this) {
      vlog.error("onSessionEnded called without this");
      return;
    }
    if (!this.currentSession) return;

    // reset camera
    this.camera!.position.set(0, -3, 3.5);
    this.resetCamera();

    const _canvas = this.getCanvas();
    _canvas!.style.display = "inline";

    this.currentSession.removeEventListener("end", this.onSessionEnded);
    this.currentSession = null;

    this.igroup!.visible = false;
    this.handGroup.visible = false;
  }

  public teleport(x: number, y: number, z: number) {
    if (!this.renderer?.xr?.isPresenting) return;

    const baseReferenceSpace = this.renderer!.xr.getReferenceSpace();
    if (!baseReferenceSpace) {
      vlog.warn("baseReferenceSpace not found");
      return;
    }

    const offsetPosition = { x, y, z, w: 1 };
    const offsetRotation = new THREE.Quaternion();
    // offsetRotation.setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI);
    const transform = new XRRigidTransform(offsetPosition, offsetRotation);
    const teleportSpaceOffset =
      baseReferenceSpace.getOffsetReferenceSpace(transform);

    this.renderer!.xr.setReferenceSpace(teleportSpaceOffset);
  }

  public async loadVrm(
    url: string,
    setLoadingProgress: (progress: string) => void,
  ) {
    if (this.model?.vrm) {
      this.unloadVRM();
    }
    // Temp Disable : WebXR
    // setLoadingProgress("Loading VRM");

    // gltf and vrm
    this.model = new Model(this.camera || new THREE.Object3D());
    await this.model.loadVRM(url, setLoadingProgress);
    // Temp Disable : WebXR
    // setLoadingProgress("VRM loaded");
    if (!this.model?.vrm) return;

    // Temp Disable : WebXR
    // build bvh
    // this.modelBVHGenerator = new StaticGeometryGenerator(this.model.vrm.scene);
    // setLoadingProgress("Creating geometry");

    // TODO show during debug mode
    const wireframeMaterial = new THREE.MeshBasicMaterial({
      wireframe: true,
      transparent: true,
      opacity: 0.05,
      depthWrite: false,
    });
    this.modelMeshHelper = new THREE.Mesh(
      new THREE.BufferGeometry(),
      wireframeMaterial,
    );
    this.modelTargets = [this.modelMeshHelper];

    if (config("debug_gfx") === "true") {
      this.scene!.add(this.modelMeshHelper);
    }

    this.modelBVHHelper = new MeshBVHHelper(this.modelMeshHelper);
    if (config("debug_gfx") === "true") {
      this.scene!.add(this.modelBVHHelper);
    }

    this.scene!.add(this.model.vrm.scene);

    // Cache humanoid nodes for faster closest-bone queries
    this.cachedHumanoidNodes = amicaBones
      .map((b) => this.model!.vrm!.humanoid.getNormalizedBoneNode(b))
      .filter((n): n is THREE.Object3D => !!n);

    // TODO since poses still work for procedural animation, we can use this to debug
    if (config("animation_procedural") !== "true") {
      // Temp Disable : WebXR
      // setLoadingProgress("Loading animation");
      const animation =
        config("animation_url").indexOf("vrma") > 0
          ? await loadVRMAnimation(config("animation_url"))
          : await loadMixamoAnimation(config("animation_url"), this.model?.vrm);
      if (animation) {
        await this.model.loadAnimation(animation);
        this.model.update(0);
      }
    }

    // Temp Disable : WebXR
    // this.model?.vrm?.springBoneManager?.joints.forEach((e) => {
    //   const geometry = new THREE.SphereGeometry(0.07, 16, 16);
    //   const material = new THREE.MeshBasicMaterial({
    //     color: 0xffff00,
    //     transparent: true,
    //     opacity: 0.5,
    //     depthWrite: false,
    //   });
    //   const mesh = new THREE.Mesh(geometry, material);
    //   mesh.position.copy(e.bone.getWorldPosition(new THREE.Vector3()));
    //   // this.scene!.add(mesh);
    // });

    // Temp Disable : WebXR
    // If model BVH is needed later, re-enable and guard with worker flag:
    // if (this.bvhWorker && this.modelBVHGenerator) {
    //   setLoadingProgress("Regenerating BVH");
    //   await this.regenerateBVHForModel();
    // }

    // Temp Disable : WebXR
    // setLoadingProgress("Complete");

    // HACK: Adjust the camera position after playback because the origin of the animation is offset
    this.resetCamera();
  }

  public unloadVRM(): void {
    if (this.model?.vrm) {
      this.scene!.remove(this.model.vrm.scene);
      // TODO if we don't dispose and create a new geometry then it seems like the performance gets slower
      {
        const geometry = this.modelMeshHelper?.geometry;
        geometry?.dispose();
        for (const key in geometry?.attributes) {
          geometry?.deleteAttribute(key);
        }
        this.scene!.remove(this.modelMeshHelper as THREE.Object3D);
        this.scene!.remove(this.modelBVHHelper as THREE.Object3D);
      }
      this.model?.unLoadVrm();
      // Clear caches
      this.cachedHumanoidNodes = [];
    }
  }

  public async loadRoom(
    url: string,
    pos: THREE.Vector3,
    rot: THREE.Euler,
    scale: THREE.Vector3,
    setLoadingProgress: (progress: string) => void,
  ) {
    if (this.room?.room) {
      this.unloadRoom();
    }

    this.room = new Room();
    setLoadingProgress("Loading room");
    await this.room.loadRoom(url, setLoadingProgress);
    setLoadingProgress(`Room load complete ${this.room}`);
    if (!this.room?.room) return;

    this.gparams["room-x"] = pos.x;
    this.gparams["room-y"] = pos.y;
    this.gparams["room-z"] = pos.z;
    this.gparams["room-scale"] = scale.x; // TODO should be uniform scale ?
    this.gui!.controllers.forEach((c) => {
      c.updateDisplay();
    });

    this.room.room.position.set(pos.x, pos.y, pos.z);
    this.room.room.rotation.set(rot.x, rot.y, rot.z);
    this.room.room.scale.set(scale.x, scale.y, scale.z);
    this.scene!.add(this.room.room);

    // build bvh (worker if enabled; else main-thread)
    this.roomTargets = [];
    for (let child of this.room.room.children) {
      if (child instanceof THREE.Mesh) {
        this.roomTargets.push(child);
        const geometry = child.geometry.clone() as THREE.BufferGeometry;
        let bvh: unknown;
        if (this.bvhWorker) {
          bvh = await this.bvhWorker.generate(geometry, { maxLeafTris: 1 });
        } else {
          // Main thread fallback
          geometry.computeBoundsTree({ maxLeafTris: 1 } as unknown as object);
          bvh = (geometry as unknown as { boundsTree: unknown }).boundsTree;
        }
        (child.geometry as unknown as { boundsTree?: unknown }).boundsTree =
          bvh as unknown;

        if (config("debug_gfx") === "true") {
          const helper = new MeshBVHHelper(child);
          helper.color.set(0xe91e63);
          this.roomBVHHelperGroup.add(helper);
        }
      }
    }

    this.scene!.add(this.roomBVHHelperGroup);
  }

  public unloadRoom(): void {
    if (this.room?.room) {
      this.scene!.remove(this.room.room);
      // TODO if we don't dispose and create a new geometry then it seems like the performance gets slower
      for (const item of this.roomBVHHelperGroup.children) {
        if (item instanceof MeshBVHHelper) {
          try {
            const geometry = (
              item as unknown as { geometry?: THREE.BufferGeometry }
            ).geometry;
            geometry?.dispose();
            for (const key in geometry?.attributes) {
              geometry?.deleteAttribute(key);
            }
          } catch (e) {
            vlog.error("error disposing room geometry", e);
          }
        }
      }
      // Dispose BVH trees on room meshes
      for (const m of this.roomTargets) {
        try {
          const g = m.geometry as unknown as { disposeBoundsTree?: () => void };
          if (typeof g.disposeBoundsTree === "function") g.disposeBoundsTree();
        } catch (e) {
          // ignore dispose errors in teardown
          if (config("debug_gfx") === "true")
            vlog.warn("disposeBoundsTree failed", e);
        }
      }
      this.roomTargets = [];
      this.scene!.remove(this.roomBVHHelperGroup);
    }
  }

  // probably too slow to use
  // but fun experiment. maybe some use somewhere for tiny splats ?
  public loadSplat(url: string) {
    if (!this.room) {
      this.room = new Room();
    }
    return this.room.loadSplat(url).then(async () => {
      vlog.debug("splat loaded");
      if (!this.room?.splat) return;

      const splat = this.room.splat as unknown as THREE.Object3D; // DropInViewer lacks three.js Object3D typing
      splat.position.set(0, 4, 0);
      splat.rotation.set(0, 0, Math.PI);
      this.scene!.add(splat);
    });
  }

  // TODO use the bvh worker to generate the bvh / bounds tree
  // TODO run this in its own loop to keep the bvh in sync with animation
  // TODO investigate if we can get speedup using parallel bvh generation
  public async regenerateBVHForModel() {
    if (!this.modelMeshHelper) return;

    this.modelBVHGenerator!.generate(this.modelMeshHelper!.geometry);

    if (!this.modelMeshHelper!.geometry.boundsTree) {
      this.modelMeshHelper!.geometry.computeBoundsTree();
    } else {
      this.modelMeshHelper!.geometry.boundsTree.refit();
    }

    this.modelBVHHelper!.update();
  }

  public onSelect(event: XRInputSourceEvent) {
    const src = event.inputSource as unknown as {
      handedness?: string;
      targetRayMode?: string;
      hand?: unknown;
      gripSpace?: unknown;
    };
    vlog.debug("onSelect", {
      handedness: src?.handedness,
      targetRayMode: src?.targetRayMode,
      hasHand: !!src?.hand,
      hasGripSpace: !!src?.gripSpace,
    });
  }

  public doublePinchHandler() {
    const cam = this.renderer!.xr.getCamera();

    const avgControllerPos = new THREE.Vector3()
      .addVectors(this.controller1!.position, this.controller2!.position)
      .multiplyScalar(0.5);

    const directionToControllers = new THREE.Vector3()
      .subVectors(avgControllerPos, cam.position)
      .normalize();

    const controller1Distance = cam.position.distanceTo(
      this.controller1!.position,
    );
    const controller2Distance = cam.position.distanceTo(
      this.controller2!.position,
    );
    const avgControllerDistance =
      (controller1Distance + controller2Distance) / 2;

    const distanceScale = 1;
    const d = 0.7 + avgControllerDistance * distanceScale;

    const pos = new THREE.Vector3().addVectors(
      cam.position,
      directionToControllers.multiplyScalar(d),
    );

    this.igroup!.position.copy(pos);
    this.igroup!.lookAt(cam.position);
  }

  /**
   * canvasの親要素を参照してサイズを変更する
   */
  public resize() {
    if (!this.renderer) return;

    const parentElement = this.renderer.domElement.parentElement;
    if (!parentElement) return;

    // Preserve adaptive pixel ratio selection
    this.renderer.setPixelRatio(this.pixelRatio);
    this.renderer.setSize(
      parentElement.clientWidth,
      parentElement.clientHeight,
    );

    this.camera!.aspect =
      parentElement.clientWidth / parentElement.clientHeight;
    this.camera!.updateProjectionMatrix();
  }

  public resizeChatMode(on: boolean) {
    if (!this.renderer) return;

    const parentElement = this.renderer.domElement.parentElement;
    if (!parentElement) return;

    // Preserve adaptive pixel ratio selection
    this.renderer.setPixelRatio(this.pixelRatio);

    let width = parentElement.clientWidth;
    let height = parentElement.clientHeight;
    if (on) {
      width = width / 2;
      height = height / 2;
    }

    this.renderer.setSize(width, height);

    if (!this.camera) return;
    this.camera.aspect = parentElement.clientWidth / parentElement.clientHeight;
    this.camera.updateProjectionMatrix();
  }

  /**
   * VRMのheadノードを参照してカメラ位置を調整する
   */
  public resetCamera() {
    const headNode = this.model?.vrm?.humanoid.getNormalizedBoneNode("head");

    if (headNode) {
      const headPos = headNode.getWorldPosition(new THREE.Vector3());
      this.camera?.position.set(
        this.camera.position.x,
        headPos.y,
        this.camera.position.z,
      );
      this.cameraControls?.target.set(headPos.x, headPos.y, headPos.z);
      this.cameraControls?.update();
    }
  }

  public resetCameraLerp() {
    // y = 1.3 is from initial setup position of camera
    const newPosition = new THREE.Vector3(
      this.camera?.position.x,
      1.3,
      this.camera?.position.z,
    );
    const from = this.camera?.position.clone();
    if (from) {
      this.camera!.position.lerpVectors(from, newPosition, 0.1);
    }
    // this.cameraControls?.target.lerpVectors(this.cameraControls?.target,headWPos,0.5);
    // this.cameraControls?.update();
  }

  public hslToRgb(h: number, s: number, l: number) {
    let r, g, b;

    if (s == 0) {
      r = g = b = l; // achromatic
    } else {
      function hue2rgb(p: number, q: number, t: number) {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
      }

      var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      var p = 2 * l - q;

      r = hue2rgb(p, q, h + 1 / 3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1 / 3);
    }

    return parseInt(
      `0x` +
        [r * 255, g * 255, b * 255]
          .map(Math.floor)
          .map((v) => v.toString(16).padStart(2, "0"))
          .join(""),
    );
  }

  // itype: 0 = amica, 1 = room
  public createBallAtPoint(point: THREE.Vector3, _itype: number = 0) {
    // Function disabled - removing unreachable code
    return;
  }

  public updateHands() {
    const handle = (hand: THREE.Group, jointMeshes: THREE.Mesh[]) => {
      const h = hand as unknown as {
        joints?: Record<string, { matrix: THREE.Matrix4 }>;
      };
      if (h.joints) {
        let i = 0;
        for (const name of joints) {
          const joint = h.joints[name];
          if (!joint) {
            break; // if one isnt found then they all wont be found
          }
          const mesh = jointMeshes[i];
          if (mesh) {
            mesh.position.setFromMatrixPosition(joint.matrix);
            mesh.quaternion.setFromRotationMatrix(joint.matrix);
          }
          ++i;
        }
      }
    };

    if (this.hand1) handle(this.hand1, this.jointMeshes1);
    if (this.hand2) handle(this.hand2, this.jointMeshes2);
  }

  public updateRaycasts() {
    const checkIntersection = (closestPart: THREE.Object3D) => {
      try {
        if (this.modelTargets.length > 0) {
          this.intersectsModel = this.raycaster.intersectObjects(
            this.modelTargets,
            true,
          );
        }
        if (this.roomTargets.length > 0) {
          this.intersectsRoom = this.raycaster.intersectObjects(
            this.roomTargets,
            true,
          );
        }
      } catch (e) {
        // if the models get removed from scene during raycast then this will throw an error
        vlog.error("intersectObjects error", e);
        return;
      }

      const highlightClosestBone = (point: THREE.Vector3) => {
        if (!this.cachedHumanoidNodes.length) return;

        const vec3 = new THREE.Vector3();
        let closest: THREE.Object3D | null = null;
        let minDist = Number.MAX_VALUE;

        for (const node of this.cachedHumanoidNodes) {
          const dist = point.distanceTo(node.getWorldPosition(vec3));
          if (dist < minDist) {
            minDist = dist;
            closest = node;
          }
        }

        if (closest) {
          closestPart.position.copy(closest.getWorldPosition(vec3));
          closestPart.scale.setScalar(0.1);
        }
      };

      const handleAmicaIntersection = (point: THREE.Vector3) => {
        highlightClosestBone(point);
      };

      // check which object is closer
      // TODO clean this up
      if (this.intersectsModel.length > 0 && this.intersectsRoom.length > 0) {
        const m0 = this.intersectsModel[0];
        const r0 = this.intersectsRoom[0];
        if (m0 && r0) {
          if (m0.distance < r0.distance) {
            handleAmicaIntersection(m0.point);
          } else {
            this.createBallAtPoint(r0.point, 1);
          }
        }
      } else if (this.intersectsModel.length > 0) {
        const m0 = this.intersectsModel[0];
        if (m0) handleAmicaIntersection(m0.point);
      } else if (this.intersectsRoom.length > 0) {
        const r0 = this.intersectsRoom[0];
        if (r0) this.createBallAtPoint(r0.point, 1);
      }
    };

    if (!this.usingController1 && !this.usingController2) {
      this.raycaster.setFromCamera(this.mouse, this.camera!);
      if (this.closestPart1) checkIntersection(this.closestPart1);
    }

    const handleController = (
      controller: THREE.Group,
      closestPart: THREE.Object3D,
    ) => {
      this.raycasterTempM.identity().extractRotation(controller.matrixWorld);
      this.raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
      this.raycaster.ray.direction
        .set(0, 0, -1)
        .applyMatrix4(this.raycasterTempM);
      checkIntersection(closestPart);
    };

    const handleHand = (joints: THREE.Mesh[], closestPart: THREE.Object3D) => {
      for (const joint of joints) {
        const m = joint.matrixWorld;
        this.raycasterTempM.identity().extractRotation(m);
        this.raycaster.ray.origin.setFromMatrixPosition(m);
        this.raycaster.ray.direction
          .set(0, -1, 0)
          .applyMatrix4(this.raycasterTempM);

        checkIntersection(closestPart);
      }
    };

    if (this.hand1) {
      if (this.closestPart1) handleHand(this.jointMeshes1, this.closestPart1);
    } else if (this.controller1) {
      if (this.closestPart1)
        handleController(this.controller1, this.closestPart1);
    }
    if (this.hand2) {
      if (this.closestPart2) handleHand(this.jointMeshes2, this.closestPart2);
    } else if (this.controller2) {
      if (this.closestPart2)
        handleController(this.controller2, this.closestPart2);
    }
  }

  // thx @ke456-png :)
  public applyWind(dir: THREE.Vector3, strength: number) {
    this.model?.vrm?.springBoneManager?.joints.forEach((e) => {
      e.settings.gravityDir = dir;
      e.settings.gravityPower = strength;
    });
  }

  public async loadScenario(url: string) {
    "use strict";

    this.scenarioLoading = true;
    const res = await fetch(url);
    const classCode = await res.text();

    const ClassDefinition = new Function(`return ${classCode}`)();

    this.scenario = new ClassDefinition({
      scope: this,
      THREE,
    });

    await this.scenario?.setup();
    this.scenarioLoading = false;
  }

  public update(_time?: DOMHighResTimeStamp, _frame?: XRFrame) {
    let utime = performance.now(); // count total update time

    // WebXR: quick exit until setup finishes
    // if (!this.isReady) return;
    // if (!this.scenario || this.scenarioLoading) return;

    const delta = this.clock.getDelta();

    this.elapsedMsSlow += delta;
    this.elapsedMsMid += delta;

    this.updateHands();

    // Stats.js legacy export provides update(); call if present
    if (
      this.stats &&
      typeof (this.stats as unknown as { update?: () => void }).update ===
        "function"
    ) {
      (this.stats as unknown as { update: () => void }).update();
    }

    let ptime = performance.now();

    // Temp Disable : WebXR
    // ptime = performance.now();
    // try {
    //   this.scenario.update(delta);
    // } catch (e) {
    //   console.error("scenario update error", e);
    // }
    // this.scenarioMsPanel.update(performance.now() - ptime, 100);

    // Temp Disable : WebXR
    // ptime = performance.now();
    // try {
    //   this.physicsWorld.stepSimulation(delta, 10);
    // } catch (e) {
    //   console.error("physics update error", e);
    // }
    // this.physicsMsPanel.update(performance.now() - ptime, 100);

    ptime = performance.now();
    try {
      this.model?.update(delta);
    } catch (e) {
      vlog.error("model update error", e);
    }

    this.modelMsPanel.update(performance.now() - ptime, 40);

    ptime = performance.now();
    try {
      this.renderer!.render(this.scene!, this.camera!);
    } catch (e) {
      vlog.error("render error", e);
    }
    this.renderMsPanel.update(performance.now() - ptime, 100);

    // Temp Disable : WebXR
    // this.room?.splat?.update(this.renderer, this.camera);
    // this.room?.splat?.render();

    if (this.isPinching1 && this.isPinching2) {
      this.doublePinchHandler();
    }

    if (!this.pausedHeavy && this.elapsedMsMid > 1 / 30) {
      /*
      const dir = this.
      this.applyWind(
        new THREE.Vector3(0, 1, 0),
        (Math.sin(this.clock.elapsedTime * Math.PI / 3) + 1) * 0.3
      );
      */

      ptime = performance.now();
      this.updateRaycasts();
      this.raycastMsPanel.update(performance.now() - ptime, 100);

      this.elapsedMsMid = 0;
    }

    if (!this.pausedHeavy && this.elapsedMsSlow > 1) {
      // updating the texture for this is very slow
      ptime = performance.now();
      if (this.statsMesh) {
        const mat = this.statsMesh.material as unknown as {
          map?: { update: () => void };
        };
        mat.map?.update();
      }
      if (this.guiMesh) {
        const mat = this.guiMesh.material as unknown as {
          map?: { update: () => void };
        };
        mat.map?.update();
      }
      this.statsMsPanel.update(performance.now() - ptime, 100);

      // TODO run this in a web worker
      // ideally parallel version
      ptime = performance.now();
      // this.regenerateBVHForModel();
      this.bvhMsPanel.update(performance.now() - ptime, 100);
      this.elapsedMsSlow = 0;
    }

    if (this.sendScreenshotToCallback && this.screenshotCallback) {
      this.renderer!.domElement.toBlob(this.screenshotCallback, "image/jpeg");
      this.sendScreenshotToCallback = false;
    }

    const frameMs = performance.now() - utime;
    this.updateMsPanel.update(frameMs, 40);

    // Adaptive pixel ratio feedback loop
    if (this.adaptiveEnabled && !this.renderer?.xr.isPresenting) {
      this.fpsSamples.push(1000 / Math.max(1e-3, frameMs));
      const maxSamples = Math.max(10, Math.floor(60 * this.fpsWindowSec));
      if (this.fpsSamples.length > maxSamples) this.fpsSamples.shift();

      // Adjust roughly every fpsWindowSec seconds
      if (this.elapsedMsSlow > this.fpsWindowSec) {
        const avgFps =
          this.fpsSamples.reduce((a, b) => a + b, 0) / this.fpsSamples.length;
        let newPR = this.pixelRatio;
        if (avgFps < 50 && this.pixelRatio > this.pixelRatioMin) {
          newPR = Math.max(this.pixelRatioMin, this.pixelRatio - 0.1);
        } else if (avgFps > 58 && this.pixelRatio < this.pixelRatioMax) {
          newPR = Math.min(this.pixelRatioMax, this.pixelRatio + 0.1);
        }
        if (Math.abs(newPR - this.pixelRatio) > 1e-3 && this.renderer) {
          this.pixelRatio = newPR;
          this.renderer.setPixelRatio(this.pixelRatio);
          const parent = this.renderer.domElement.parentElement;
          if (parent)
            this.renderer.setSize(parent.clientWidth, parent.clientHeight);
        }
      }
    }

    // FPS overlay update/draw
    if (this.fpsEnabled) {
      this.fpsValue = 1000 / Math.max(1e-3, frameMs);
      this.drawFpsOverlay();
    }
  }

  public startStreaming(videoElement: HTMLVideoElement) {
    if (!this.renderer) return;

    // Create a stream from the renderer's canvas
    const stream = this.renderer.domElement.captureStream(60); // 60 FPS for smooth streaming

    this.videoStream = stream;

    // Assign the stream to the provided video element for live view
    videoElement.srcObject = stream;
    videoElement.play();

    vlog.debug("Start streaming!");
  }

  public stopStreaming() {
    if (!this.videoStream) return;

    // Stop all tracks on the stream to end streaming
    this.videoStream
      .getTracks()
      .forEach((track: MediaStreamTrack) => track.stop());
    this.videoStream = null; // Clear the stream reference

    vlog.debug("Streaming stopped!");
  }

  // Method to start recording
  public startRecording() {
    if (!this.renderer) return;

    // Create a stream from the renderer's canvas
    const stream = this.renderer.domElement.captureStream(60); // 30 FPS

    // Higher quality and bit rate for better video clarity
    const options = {
      mimeType: "video/webm;codecs=vp9",
      videoBitsPerSecond: 8000000, // 8 Mbps for higher quality
    };

    this.mediaRecorder = new MediaRecorder(stream, options);

    // Collect data in chunks
    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        this.recordedChunks.push(event.data);
      }
    };

    // Start recording
    this.mediaRecorder.start();
  }

  // Method to stop recording and trigger callback
  public stopRecording(callback: BlobCallback) {
    if (!this.mediaRecorder) return;

    // Stop recording and create the video blob
    this.mediaRecorder.onstop = () => {
      const recordedBlob = new Blob(this.recordedChunks, {
        type: "video/webm",
      });
      callback(recordedBlob); // Pass the video blob to the callback
      this.recordedChunks = []; // Clear chunks for the next recording
    };

    // Stop the recorder
    this.mediaRecorder.stop();
  }

  public getScreenshotBlob = (callback: BlobCallback) => {
    this.screenshotCallback = callback;
    this.sendScreenshotToCallback = true;
  };

  // Cached humanoid bone nodes for quick nearest-bone queries
  private cachedHumanoidNodes: THREE.Object3D[] = [];

  // Toggle a tiny on-screen FPS overlay (no Stats.js, minimal cost)
  public setFpsOverlayEnabled(on: boolean) {
    // Persist state
    this.fpsEnabled = on;
    if (typeof document === "undefined") return;

    if (on && !this.fpsCanvas) {
      const c = document.createElement("canvas");
      c.width = 96;
      c.height = 48;
      c.style.position = "absolute";
      c.style.top = "0";
      c.style.right = "0";
      c.style.pointerEvents = "none";
      c.style.zIndex = "1000";
      document.body.appendChild(c);
      this.fpsCanvas = c;
      this.fpsCtx = c.getContext("2d", { alpha: true });
    } else if (!on && this.fpsCanvas) {
      this.fpsCanvas.remove();
      this.fpsCanvas = undefined;
      this.fpsCtx = null;
    }
  }

  private drawFpsOverlay() {
    if (!this.fpsCanvas || !this.fpsCtx) return;
    const ctx = this.fpsCtx;
    const w = this.fpsCanvas.width;
    const h = this.fpsCanvas.height;
    ctx.clearRect(0, 0, w, h);
    // Opaque background for readability
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, w, h);
    // Text
    ctx.fillStyle = "#0f0";
    ctx.font = "bold 16px monospace";
    const fpsText = `${Math.round(this.fpsValue)} fps`;
    ctx.fillText(fpsText, 8, 20);
    // Simple bar showing load (0..16.7ms green; 33ms red)
    const ms = Math.min(33, 1000 / Math.max(1, this.fpsValue));
    const t = ms / 33; // 0..1
    const barW = Math.round((1 - t) * (w - 16));
    ctx.fillStyle = t < 0.5 ? "#0f0" : t < 0.8 ? "#ff0" : "#f00";
    ctx.fillRect(8, 28, barW, 12);
    ctx.strokeStyle = "#fff";
    ctx.strokeRect(8, 28, w - 16, 12);
  }

  // Clean up resources and listeners
  public dispose() {
    try {
      // Stop animation loop
      if (this.renderer) this.renderer.setAnimationLoop(null);
      // Remove listeners
      if (this._onResize) window.removeEventListener("resize", this._onResize);
      if (this._onVisibility && typeof document !== "undefined")
        document.removeEventListener("visibilitychange", this._onVisibility);
      const canvas = this.renderer?.domElement;
      if (canvas && this._onMouseMove)
        canvas.removeEventListener("mousemove", this._onMouseMove);
      // Remove UI overlays
      this.setFpsOverlayEnabled(false);
      // Dispose helpers
      if (this.modelBVHHelper) this.scene?.remove(this.modelBVHHelper);
      if (this.modelMeshHelper) this.scene?.remove(this.modelMeshHelper);
      if (this.roomBVHHelperGroup) this.scene?.remove(this.roomBVHHelperGroup);
      // Dispose scene contents via VRM utilities when unloading models/rooms
      this.unloadVRM();
      this.unloadRoom();
      // Dispose renderer
      this.renderer?.dispose();
    } catch (e) {
      vlog.warn("Viewer dispose error", e);
    }
  }
}
