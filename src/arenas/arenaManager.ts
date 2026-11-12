/**
 * 5 Hand-Crafted Acoustic Architecture Arenas (Zero Procedural Generic)
 * Author & Chief Architect: Enes Öztürk
 *
 * 1. The Pipe Organ Canyons (Dev Org Boruları Vadisi)
 * 2. The Chladni Dunes (Cymatics Kum Çölü)
 * 3. The Anechoic Void (Yankısız Oda Labirenti - Sonar Echolocation)
 * 4. The Glass Carillon (Kristal Çan Katedrali)
 * 5. The Dissonance Core (Mutlak Sessizlik Çekirdeği - The White Noise Leviathan)
 */

import * as THREE from 'three';

export interface ArenaDefinition {
  id: number;
  name: string;
  nameTr: string;
  subtitle: string;
  atmosphereColor: number;
  fogDensity: number;
  lightWarmth: number; // Color hex
  defaultFrequency: number;
}

export const ARENA_DEFINITIONS: ArenaDefinition[] = [
  {
    id: 1,
    name: 'The Pipe Organ Canyons',
    nameTr: 'Dev Org Boruları Vadisi',
    subtitle: 'Kilometer-high copper & bronze pipes resonating at musical fundamentals',
    atmosphereColor: 0x140c06,
    fogDensity: 0.02,
    lightWarmth: 0xffb366,
    defaultFrequency: 220,
  },
  {
    id: 2,
    name: 'The Chladni Dunes',
    nameTr: 'Cymatics Kum Çölü',
    subtitle: 'Vibrating obsidian plates with dynamic metallic sand geometry',
    atmosphereColor: 0x080c14,
    fogDensity: 0.016,
    lightWarmth: 0xd4a359,
    defaultFrequency: 528,
  },
  {
    id: 3,
    name: 'The Anechoic Void',
    nameTr: 'Yankısız Oda Labirenti',
    subtitle: 'Zero acoustic echo chamber with pyramid wedge foam & sonar echolocation',
    atmosphereColor: 0x010204,
    fogDensity: 0.045,
    lightWarmth: 0x4fc3f7,
    defaultFrequency: 880,
  },
  {
    id: 4,
    name: 'The Glass Carillon',
    nameTr: 'Kristal Çan Katedrali',
    subtitle: 'Giant suspended hand-blown crystal bells creating harmonic shockwaves',
    atmosphereColor: 0x0a1420,
    fogDensity: 0.018,
    lightWarmth: 0x80d8ff,
    defaultFrequency: 640,
  },
  {
    id: 5,
    name: 'The Dissonance Core',
    nameTr: 'Mutlak Sessizlik Çekirdeği',
    subtitle: 'Epic undulating wave-floor vs The White Noise Leviathan',
    atmosphereColor: 0x150810,
    fogDensity: 0.022,
    lightWarmth: 0xff5252,
    defaultFrequency: 432,
  },
];

export class ArenaManager {
  public currentArenaIndex = 1; // Default to Chladni Dunes for live cymatics
  public group: THREE.Group;
  public colliders: THREE.Object3D[] = [];
  public bellMeshes: THREE.Mesh[] = [];
  public organPipes: THREE.Mesh[] = [];
  public waveFloor: THREE.Mesh | null = null;
  private waveGeometry: THREE.PlaneGeometry | null = null;
  private waveOriginalPos: Float32Array | null = null;

  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'ArenaEnvironment';
  }

  public buildArena(index: number): { definition: ArenaDefinition; colliders: THREE.Object3D[] } {
    this.currentArenaIndex = index;
    // Clear previous
    this.dispose();

    const def = ARENA_DEFINITIONS.find((a) => a.id === index) || ARENA_DEFINITIONS[0];

    switch (index) {
      case 1:
        this.buildPipeOrganCanyons();
        break;
      case 2:
        this.buildChladniDunes();
        break;
      case 3:
        this.buildAnechoicVoid();
        break;
      case 4:
        this.buildGlassCarillon();
        break;
      case 5:
        this.buildDissonanceCore();
        break;
    }

    return { definition: def, colliders: this.colliders };
  }

  // --- Katman 1: Dev Org Boruları Vadisi ---
  private buildPipeOrganCanyons() {
    const bronzeMat = new THREE.MeshStandardMaterial({
      color: 0x9e6a32,
      metalness: 0.95,
      roughness: 0.22,
    });
    const copperMat = new THREE.MeshStandardMaterial({
      color: 0xb85d38,
      metalness: 0.92,
      roughness: 0.28,
    });
    const stoneFloorMat = new THREE.MeshStandardMaterial({
      color: 0x151210,
      metalness: 0.4,
      roughness: 0.8,
    });

    // Main Cathedral Nave Floor
    const floorGeo = new THREE.BoxGeometry(45, 1.0, 45);
    const floor = new THREE.Mesh(floorGeo, stoneFloorMat);
    floor.position.y = -0.5;
    floor.receiveShadow = true;
    this.group.add(floor);
    this.colliders.push(floor);

    // Colossal Pipe Organ Ranks (Left, Right and Back Canyons)
    const pipeHeights = [18, 26, 34, 42, 50, 42, 34, 26, 18];
    const pipeRad = 0.75;

    // Left rank
    pipeHeights.forEach((h, i) => {
      const pGeo = new THREE.CylinderGeometry(pipeRad, pipeRad * 0.9, h, 20);
      const pipe = new THREE.Mesh(pGeo, i % 2 === 0 ? bronzeMat : copperMat);
      pipe.position.set(-18, h * 0.5, (i - 4) * 3.8);
      pipe.castShadow = true;
      pipe.receiveShadow = true;
      this.group.add(pipe);
      this.colliders.push(pipe);
      this.organPipes.push(pipe);

      // Acoustic pipe mouth (languid cut)
      const mouthGeo = new THREE.BoxGeometry(1.2, 1.4, 0.4);
      const mouthMat = new THREE.MeshBasicMaterial({ color: 0x050403 });
      const mouth = new THREE.Mesh(mouthGeo, mouthMat);
      mouth.position.set(0.6, -h * 0.35, 0);
      pipe.add(mouth);
    });

    // Right rank
    pipeHeights.forEach((h, i) => {
      const pGeo = new THREE.CylinderGeometry(pipeRad, pipeRad * 0.9, h, 20);
      const pipe = new THREE.Mesh(pGeo, i % 2 === 0 ? copperMat : bronzeMat);
      pipe.position.set(18, h * 0.5, (i - 4) * 3.8);
      pipe.castShadow = true;
      pipe.receiveShadow = true;
      this.group.add(pipe);
      this.colliders.push(pipe);
      this.organPipes.push(pipe);

      const mouthGeo = new THREE.BoxGeometry(1.2, 1.4, 0.4);
      const mouthMat = new THREE.MeshBasicMaterial({ color: 0x050403 });
      const mouth = new THREE.Mesh(mouthGeo, mouthMat);
      mouth.position.set(-0.6, -h * 0.35, 0);
      pipe.add(mouth);
    });

    // Back Grand Facade Pipes
    for (let i = -6; i <= 6; i++) {
      const h = 48 - Math.abs(i) * 3.5;
      const pGeo = new THREE.CylinderGeometry(1.1, 1.0, h, 20);
      const pipe = new THREE.Mesh(pGeo, bronzeMat);
      pipe.position.set(i * 2.8, h * 0.5, -20);
      pipe.castShadow = true;
      this.group.add(pipe);
      this.colliders.push(pipe);
    }
  }

  // --- Katman 2: Cymatics Kum Çölü ---
  private buildChladniDunes() {
    const darkObsidian = new THREE.MeshStandardMaterial({
      color: 0x0a0c10,
      metalness: 0.9,
      roughness: 0.25,
    });
    const brassTrim = new THREE.MeshStandardMaterial({
      color: 0x9b7036,
      metalness: 0.95,
      roughness: 0.3,
    });

    // Outer perimeter bastion ring
    const perimeterGeo = new THREE.BoxGeometry(42, 3.5, 42);
    const perimeter = new THREE.Mesh(perimeterGeo, darkObsidian);
    perimeter.position.y = -1.5;
    perimeter.receiveShadow = true;
    this.group.add(perimeter);
    this.colliders.push(perimeter);

    // 4 Acoustic Monolith Pillars at the 4 quadrants
    const pillarPositions = [
      new THREE.Vector3(-14, 0, -14),
      new THREE.Vector3(14, 0, -14),
      new THREE.Vector3(-14, 0, 14),
      new THREE.Vector3(14, 0, 14),
    ];

    pillarPositions.forEach((pos) => {
      const pillarGroup = new THREE.Group();
      pillarGroup.position.copy(pos);

      // 4-part composite pillar
      const baseGeo = new THREE.BoxGeometry(2.4, 1.2, 2.4);
      const baseMesh = new THREE.Mesh(baseGeo, brassTrim);
      pillarGroup.add(baseMesh);

      const shaftGeo = new THREE.CylinderGeometry(0.8, 1.0, 7.0, 8);
      const shaftMesh = new THREE.Mesh(shaftGeo, darkObsidian);
      shaftMesh.position.y = 4.0;
      shaftMesh.castShadow = true;
      pillarGroup.add(shaftMesh);

      const capGeo = new THREE.OctahedronGeometry(1.1);
      const capMesh = new THREE.Mesh(capGeo, brassTrim);
      capMesh.position.y = 8.0;
      pillarGroup.add(capMesh);

      this.group.add(pillarGroup);
      this.colliders.push(shaftMesh);
    });
  }

  // --- Katman 3: Yankısız Oda Labirenti (Anechoic Void) ---
  private buildAnechoicVoid() {
    const foamMat = new THREE.MeshStandardMaterial({
      color: 0x0a0c14,
      metalness: 0.1,
      roughness: 0.95,
    });

    // Pitch black absorbing floor
    const floorGeo = new THREE.BoxGeometry(40, 1.0, 40);
    const floor = new THREE.Mesh(floorGeo, foamMat);
    floor.position.y = -0.5;
    this.group.add(floor);
    this.colliders.push(floor);

    // Perimeter walls covered in handcrafted acoustic foam wedges
    const wallConfigs = [
      { pos: new THREE.Vector3(0, 5, -18), rot: 0, w: 36, h: 10 },
      { pos: new THREE.Vector3(0, 5, 18), rot: Math.PI, w: 36, h: 10 },
      { pos: new THREE.Vector3(-18, 5, 0), rot: Math.PI / 2, w: 36, h: 10 },
      { pos: new THREE.Vector3(18, 5, 0), rot: -Math.PI / 2, w: 36, h: 10 },
    ];

    const pyramidGeo = new THREE.ConeGeometry(0.6, 1.2, 4);
    pyramidGeo.rotateX(Math.PI / 2);

    wallConfigs.forEach((wc) => {
      const wallBackGeo = new THREE.BoxGeometry(wc.w, wc.h, 0.8);
      const wallMesh = new THREE.Mesh(wallBackGeo, foamMat);
      wallMesh.position.copy(wc.pos);
      wallMesh.rotation.y = wc.rot;
      this.group.add(wallMesh);
      this.colliders.push(wallMesh);

      // Dense acoustic foam wedges (InstancedMesh)
      const rows = 6;
      const cols = 22;
      const wedgeCount = rows * cols;
      const wedgeInst = new THREE.InstancedMesh(pyramidGeo, foamMat, wedgeCount);
      wedgeInst.position.copy(wc.pos);
      wedgeInst.rotation.y = wc.rot;

      const dummy = new THREE.Object3D();
      let idx = 0;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          dummy.position.set(
            (c - cols / 2 + 0.5) * 1.4,
            (r - rows / 2 + 0.5) * 1.4,
            0.5
          );
          dummy.updateMatrix();
          wedgeInst.setMatrixAt(idx++, dummy.matrix);
        }
      }
      wedgeInst.instanceMatrix.needsUpdate = true;
      this.group.add(wedgeInst);
    });

    // Central sound dampening labyrinth monoliths
    [-7, 7].forEach((x) => {
      [-7, 7].forEach((z) => {
        const pillarGeo = new THREE.BoxGeometry(2.5, 6.0, 2.5);
        const pillar = new THREE.Mesh(pillarGeo, foamMat);
        pillar.position.set(x, 3.0, z);
        this.group.add(pillar);
        this.colliders.push(pillar);
      });
    });
  }

  // --- Katman 4: Kristal Çan Katedrali (The Glass Carillon) ---
  private buildGlassCarillon() {
    const sapphireGlassMat = new THREE.MeshPhysicalMaterial({
      color: 0x4fc3f7,
      metalness: 0.1,
      roughness: 0.12,
      transmission: 0.7,
      transparent: true,
      opacity: 0.85,
      ior: 1.6,
      reflectivity: 0.8,
    });

    const polishedTitanium = new THREE.MeshStandardMaterial({
      color: 0xdddfec,
      metalness: 0.95,
      roughness: 0.18,
    });

    // Crystalline nave floor
    const floorGeo = new THREE.BoxGeometry(42, 1.0, 42);
    const floor = new THREE.Mesh(floorGeo, polishedTitanium);
    floor.position.y = -0.5;
    floor.receiveShadow = true;
    this.group.add(floor);
    this.colliders.push(floor);

    // Giant Suspended Hand-Blown Crystal Bells
    const bellConfigs = [
      { pos: new THREE.Vector3(0, 8.5, 0), radius: 2.2, height: 3.5, freq: 440 },
      { pos: new THREE.Vector3(-10, 6.5, -8), radius: 1.6, height: 2.6, freq: 587 },
      { pos: new THREE.Vector3(10, 6.5, -8), radius: 1.6, height: 2.6, freq: 659 },
      { pos: new THREE.Vector3(-10, 6.5, 8), radius: 1.4, height: 2.2, freq: 784 },
      { pos: new THREE.Vector3(10, 6.5, 8), radius: 1.4, height: 2.2, freq: 880 },
    ];

    bellConfigs.forEach((bc) => {
      const bellGroup = new THREE.Group();
      bellGroup.position.copy(bc.pos);

      // Bell flare geometry (Lathe / Cylinder)
      const bellGeo = new THREE.CylinderGeometry(bc.radius * 0.35, bc.radius, bc.height, 24, 1, true);
      const bellMesh = new THREE.Mesh(bellGeo, sapphireGlassMat);
      bellMesh.castShadow = true;
      bellGroup.add(bellMesh);
      this.colliders.push(bellMesh);
      this.bellMeshes.push(bellMesh);

      // Suspension cable
      const cableGeo = new THREE.CylinderGeometry(0.04, 0.04, 12.0);
      const cable = new THREE.Mesh(cableGeo, polishedTitanium);
      cable.position.y = bc.height * 0.5 + 6.0;
      bellGroup.add(cable);

      // Clapper (internal striking ball)
      const clapperGeo = new THREE.SphereGeometry(bc.radius * 0.25, 16, 16);
      const clapper = new THREE.Mesh(clapperGeo, polishedTitanium);
      clapper.position.y = -bc.height * 0.3;
      bellGroup.add(clapper);

      this.group.add(bellGroup);
    });
  }

  // --- Katman 5: Mutlak Sessizlik Çekirdeği (The Dissonance Core) ---
  private buildDissonanceCore() {
    const obsidianMat = new THREE.MeshStandardMaterial({
      color: 0x07080d,
      metalness: 0.95,
      roughness: 0.15,
    });

    // Dynamic Undulating Acoustic Wave Floor (Vertex displacement in tick loop)
    const size = 45;
    const segs = 48;
    this.waveGeometry = new THREE.PlaneGeometry(size, size, segs, segs);
    this.waveGeometry.rotateX(-Math.PI / 2);

    // Save original vertex positions
    const posAttr = this.waveGeometry.attributes.position;
    this.waveOriginalPos = new Float32Array(posAttr.array.length);
    this.waveOriginalPos.set(posAttr.array);

    this.waveFloor = new THREE.Mesh(this.waveGeometry, obsidianMat);
    this.waveFloor.position.y = 0;
    this.waveFloor.receiveShadow = true;
    this.group.add(this.waveFloor);
    this.colliders.push(this.waveFloor);

    // Rotating Dissonance Monolith Ring (Surrounds the arena)
    const ringRadius = 20;
    const monolithCount = 8;
    for (let i = 0; i < monolithCount; i++) {
      const angle = (i / monolithCount) * Math.PI * 2;
      const x = Math.cos(angle) * ringRadius;
      const z = Math.sin(angle) * ringRadius;

      const monoGeo = new THREE.BoxGeometry(2.0, 10.0, 1.2);
      const mono = new THREE.Mesh(monoGeo, obsidianMat);
      mono.position.set(x, 5.0, z);
      mono.rotation.y = angle;
      this.group.add(mono);
      this.colliders.push(mono);
    }
  }

  /**
   * Updates animated elements (e.g. undulating wave floor in Layer 5, bells swinging in Layer 4)
   */
  public update(delta: number, elapsed: number) {
    // 1. Layer 5 Wave Floor Undulation
    if (this.waveFloor && this.waveGeometry && this.waveOriginalPos) {
      const posAttr = this.waveGeometry.attributes.position;
      const arr = posAttr.array as Float32Array;
      const orig = this.waveOriginalPos;

      for (let i = 0; i < arr.length; i += 3) {
        const x = orig[i];
        const z = orig[i + 2];
        const dist = Math.sqrt(x * x + z * z);
        // Acoustic concentric ripples + cross standing wave
        const ripple = Math.sin(dist * 0.45 - elapsed * 3.5) * 0.45;
        const standing = Math.cos(x * 0.25) * Math.sin(z * 0.25) * 0.35;
        arr[i + 1] = ripple + standing;
      }
      posAttr.needsUpdate = true;
      this.waveGeometry.computeVertexNormals();
    }

    // 2. Layer 4 Bells subtle idle harmonic sway
    if (this.bellMeshes.length > 0) {
      this.bellMeshes.forEach((bell, idx) => {
        bell.rotation.z = Math.sin(elapsed * 2.0 + idx * 1.2) * 0.04;
        bell.rotation.x = Math.cos(elapsed * 1.8 + idx * 0.8) * 0.03;
      });
    }

    // 3. Layer 1 Organ pipes subtle acoustic airflow vibration
    if (this.organPipes.length > 0) {
      this.organPipes.forEach((pipe, idx) => {
        const jitter = Math.sin(elapsed * 25.0 + idx) * 0.008;
        pipe.position.x += jitter;
      });
    }
  }

  public dispose() {
    this.colliders = [];
    this.bellMeshes = [];
    this.organPipes = [];
    this.waveFloor = null;
    this.waveGeometry = null;
    this.waveOriginalPos = null;

    while (this.group.children.length > 0) {
      const child = this.group.children[0];
      this.group.remove(child);
      child.traverse((obj) => {
        if ((obj as THREE.Mesh).isMesh) {
          const mesh = obj as THREE.Mesh;
          mesh.geometry?.dispose();
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach((m) => m.dispose());
          } else {
            mesh.material?.dispose();
          }
        }
      });
    }
  }
}
