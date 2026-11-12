/**
 * Real-Time Cymatics & Chladni Plate Physics Simulation
 * Author & Chief Architect: Enes Öztürk
 *
 * Simulates physical acoustic particle migration on vibrating plates.
 * Formula: w(x,y) = a * sin(n*pi*x/L)*sin(m*pi*y/L) - b * sin(m*pi*x/L)*sin(n*pi*y/L)
 * Particles migrate from high-vibration antinodes towards zero-vibration nodal lines.
 */

import * as THREE from 'three';

export interface CymaticsConfig {
  m: number; // Chladni mode m
  n: number; // Chladni mode n
  a: number; // Mode coefficient a
  b: number; // Mode coefficient b
  frequencyHz: number;
  vibrationIntensity: number; // 0 to 1
  plateSize: number;
}

export class CymaticsPlateSystem {
  public mesh: THREE.InstancedMesh;
  public plateMesh: THREE.Mesh;
  public group: THREE.Group;
  private particleCount: number;
  private positions: Float32Array;
  private velocities: Float32Array;
  private dummy = new THREE.Object3D();
  public config: CymaticsConfig;
  private colorBronze = new THREE.Color('#d4a359');
  private colorGold = new THREE.Color('#ffd700');
  private colorObsidian = new THREE.Color('#1a1622');

  constructor(particleCount: number = 2400, plateSize: number = 28) {
    this.particleCount = particleCount;
    this.group = new THREE.Group();
    this.group.name = 'CymaticsSystem';

    this.config = {
      m: 3,
      n: 5,
      a: 1.0,
      b: 1.0,
      frequencyHz: 528,
      vibrationIntensity: 0.85,
      plateSize: plateSize,
    };

    // 1. The Heavy Obsidian / Steel Plate
    const plateGeo = new THREE.BoxGeometry(plateSize, 0.6, plateSize, 32, 1, 32);
    const plateMat = new THREE.MeshStandardMaterial({
      color: 0x0a0c12,
      metalness: 0.92,
      roughness: 0.18,
    });
    this.plateMesh = new THREE.Mesh(plateGeo, plateMat);
    this.plateMesh.receiveShadow = true;
    this.plateMesh.position.y = -0.3;
    this.group.add(this.plateMesh);

    // Decorative Forged Bronze Rim around the plate
    const rimGeo = new THREE.BoxGeometry(plateSize + 0.8, 0.7, plateSize + 0.8);
    const rimMat = new THREE.MeshStandardMaterial({
      color: 0x8a6232,
      metalness: 0.95,
      roughness: 0.28,
    });
    const rimMesh = new THREE.Mesh(rimGeo, rimMat);
    rimMesh.position.y = -0.35;
    this.group.add(rimMesh);

    // 2. Chladni Metallic Sand Particles (InstancedMesh)
    const grainGeo = new THREE.BoxGeometry(0.12, 0.14, 0.12);
    const grainMat = new THREE.MeshStandardMaterial({
      color: 0xdfab5b,
      metalness: 0.85,
      roughness: 0.35,
    });
    this.mesh = new THREE.InstancedMesh(grainGeo, grainMat, particleCount);
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = false;
    this.mesh.frustumCulled = false;
    this.group.add(this.mesh);

    // Initialize positions and velocities
    this.positions = new Float32Array(particleCount * 3);
    this.velocities = new Float32Array(particleCount * 3);

    const half = plateSize * 0.46;
    for (let i = 0; i < particleCount; i++) {
      const idx = i * 3;
      this.positions[idx] = (Math.random() - 0.5) * half * 2;
      this.positions[idx + 1] = 0.08 + Math.random() * 0.05;
      this.positions[idx + 2] = (Math.random() - 0.5) * half * 2;

      this.velocities[idx] = 0;
      this.velocities[idx + 1] = 0;
      this.velocities[idx + 2] = 0;

      this.dummy.position.set(this.positions[idx], this.positions[idx + 1], this.positions[idx + 2]);
      this.dummy.scale.setScalar(0.7 + Math.random() * 0.6);
      this.dummy.updateMatrix();
      this.mesh.setMatrixAt(i, this.dummy.matrix);

      // Varying tint between bronze, gold and brass
      const tint = (Math.random() > 0.4) ? this.colorBronze : this.colorGold;
      this.mesh.setColorAt(i, tint);
    }
    this.mesh.instanceMatrix.needsUpdate = true;
    if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true;
  }

  /**
   * Evaluates the Chladni displacement function w(x, y)
   * Normalized coordinate [-1, 1]
   */
  public evaluateChladni(normX: number, normY: number): number {
    const { m, n, a, b } = this.config;
    const pi = Math.PI;

    // Shift [-1, 1] to [0, 1]
    const u = (normX + 1) * 0.5;
    const v = (normY + 1) * 0.5;

    const term1 = a * Math.sin(n * pi * u) * Math.sin(m * pi * v);
    const term2 = b * Math.sin(m * pi * u) * Math.sin(n * pi * v);

    return term1 - term2;
  }

  /**
   * Updates particle positions according to vibrational acceleration away from antinodes.
   */
  public update(delta: number, elapsed: number) {
    const half = this.config.plateSize * 0.46;
    const h = 0.02; // Finite difference step for gradient
    const speed = 14.0 * this.config.vibrationIntensity;
    const drag = 0.92;

    for (let i = 0; i < this.particleCount; i++) {
      const idx = i * 3;
      let x = this.positions[idx];
      let z = this.positions[idx + 2];

      const normX = Math.max(-1, Math.min(1, x / half));
      const normY = Math.max(-1, Math.min(1, z / half));

      // Calculate vibration amplitude |w|
      const wCenter = this.evaluateChladni(normX, normY);
      const absW = Math.abs(wCenter);

      // Numerical gradient of |w|: particles are kicked AWAY from high amplitude areas
      const wRight = Math.abs(this.evaluateChladni(normX + h, normY));
      const wLeft = Math.abs(this.evaluateChladni(normX - h, normY));
      const wDown = Math.abs(this.evaluateChladni(normX, normY + h));
      const wUp = Math.abs(this.evaluateChladni(normX, normY - h));

      const gradX = (wRight - wLeft) / (2 * h);
      const gradZ = (wDown - wUp) / (2 * h);

      // Force pushes towards nodal lines (down the gradient of |w|)
      // plus slight chaotic jitter proportional to vibration intensity
      const jitter = (Math.random() - 0.5) * absW * 0.4 * this.config.vibrationIntensity;

      this.velocities[idx] = (this.velocities[idx] - gradX * speed * delta + jitter) * drag;
      this.velocities[idx + 2] = (this.velocities[idx + 2] - gradZ * speed * delta + jitter) * drag;

      // Update position
      x += this.velocities[idx] * delta * 60;
      z += this.velocities[idx + 2] * delta * 60;

      // Bounce at plate boundaries
      if (Math.abs(x) > half) {
        x = Math.sign(x) * half * 0.98;
        this.velocities[idx] *= -0.5;
      }
      if (Math.abs(z) > half) {
        z = Math.sign(z) * half * 0.98;
        this.velocities[idx + 2] *= -0.5;
      }

      this.positions[idx] = x;
      this.positions[idx + 2] = z;

      // Vertical bounce: when near antinodes, grains jump slightly off the plate!
      const bounceHeight = 0.08 + absW * 0.3 * Math.abs(Math.sin(elapsed * 25.0 + i));
      this.positions[idx + 1] = bounceHeight;

      this.dummy.position.set(x, bounceHeight, z);
      // Grains on nodal lines settle and stack slightly higher
      const nodalCloseness = Math.max(0, 1.0 - absW * 3.0);
      this.dummy.scale.set(
        1.0 + nodalCloseness * 0.4,
        1.0 + nodalCloseness * 0.8,
        1.0 + nodalCloseness * 0.4
      );
      this.dummy.updateMatrix();
      this.mesh.setMatrixAt(i, this.dummy.matrix);
    }

    this.mesh.instanceMatrix.needsUpdate = true;
  }

  /**
   * Set modal parameters (e.g. from weapon strikes or frequency dial)
   */
  public setModes(m: number, n: number, freq: number = 432) {
    this.config.m = m;
    this.config.n = n;
    this.config.frequencyHz = freq;
    // Temporary impulse shock when changing mode
    for (let i = 0; i < this.particleCount; i++) {
      const idx = i * 3;
      this.velocities[idx] += (Math.random() - 0.5) * 4.0;
      this.velocities[idx + 2] += (Math.random() - 0.5) * 4.0;
    }
  }

  public pulseShockwave(epicenterX: number, epicenterZ: number, power: number = 1.0) {
    for (let i = 0; i < this.particleCount; i++) {
      const idx = i * 3;
      const dx = this.positions[idx] - epicenterX;
      const dz = this.positions[idx + 2] - epicenterZ;
      const dist = Math.sqrt(dx * dx + dz * dz) + 0.1;
      if (dist < 12.0) {
        const force = (1.0 - dist / 12.0) * power * 15.0;
        this.velocities[idx] += (dx / dist) * force;
        this.velocities[idx + 2] += (dz / dist) * force;
      }
    }
  }

  public dispose() {
    this.mesh.geometry.dispose();
    if (Array.isArray(this.mesh.material)) {
      this.mesh.material.forEach(m => m.dispose());
    } else {
      this.mesh.material.dispose();
    }
    this.plateMesh.geometry.dispose();
    if (Array.isArray(this.plateMesh.material)) {
      this.plateMesh.material.forEach(m => m.dispose());
    } else {
      this.plateMesh.material.dispose();
    }
  }
}
