/**
 * Acoustic Enemies & Boss System (Resonance Shatter Mechanics)
 * Author & Chief Architect: Enes Öztürk
 *
 * Implements physical acoustic eigenfrequency vulnerability,
 * dynamic vertex jitter during frequency resonance, and explosive
 * multi-shard shattering when struck with matching in-phase acoustic shockwaves.
 */

import * as THREE from 'three';

export interface EnemyShard {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  angularVelocity: THREE.Vector3;
  life: number;
  maxLife: number;
}

export class AcousticEnemy {
  public group: THREE.Group;
  public id: number;
  public type: 'golem' | 'shrieker' | 'leviathan_core';
  public naturalFrequency: number; // e.g. 432, 528, 640, 880
  public health: number;
  public maxHealth: number;
  public isDead = false;
  public isResonating = false;
  public resonanceIntensity = 0; // 0 to 1
  public shards: EnemyShard[] = [];

  // Procedural 3-12 part group
  public coreMesh: THREE.Mesh;
  public armorPlates: THREE.Mesh[] = [];
  public attackTimer = 0;
  private attackInterval = 2.5;

  constructor(id: number, type: 'golem' | 'shrieker' | 'leviathan_core', pos: THREE.Vector3) {
    this.id = id;
    this.type = type;
    this.group = new THREE.Group();
    this.group.name = `Enemy_${type}_${id}`;
    this.group.position.copy(pos);

    // Pick distinct acoustic eigenfrequency
    const frequencies = [432, 528, 640, 740, 880];
    this.naturalFrequency = frequencies[Math.floor(Math.random() * frequencies.length)];

    const obsidianMat = new THREE.MeshStandardMaterial({
      color: 0x11131a,
      metalness: 0.9,
      roughness: 0.25,
    });

    const bronzeTrimMat = new THREE.MeshStandardMaterial({
      color: 0x9e6a32,
      metalness: 0.95,
      roughness: 0.3,
    });

    // Frequency hue for crystal core
    const hue = (this.naturalFrequency % 1000) / 1000;
    const crystalMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color().setHSL(hue, 0.9, 0.55),
      emissive: new THREE.Color().setHSL(hue, 0.9, 0.4),
      emissiveIntensity: 0.6,
      metalness: 0.85,
      roughness: 0.15,
      transparent: true,
      opacity: 0.92,
    });

    if (type === 'golem') {
      this.health = 100;
      this.maxHealth = 100;

      // Primary: Obsidian torso
      const torsoGeo = new THREE.BoxGeometry(1.2, 1.6, 0.9);
      const torso = new THREE.Mesh(torsoGeo, obsidianMat);
      torso.position.y = 1.4;
      torso.castShadow = true;
      this.group.add(torso);
      this.armorPlates.push(torso);

      // Resonating Crystal Core in chest
      const coreGeo = new THREE.OctahedronGeometry(0.38, 0);
      this.coreMesh = new THREE.Mesh(coreGeo, crystalMat);
      this.coreMesh.position.set(0, 1.5, 0.45);
      this.group.add(this.coreMesh);

      // Secondary: Floating crystalline shoulder clusters
      [-0.9, 0.9].forEach((sideX) => {
        const shoulderGeo = new THREE.DodecahedronGeometry(0.42, 0);
        const shoulder = new THREE.Mesh(shoulderGeo, bronzeTrimMat);
        shoulder.position.set(sideX, 2.0, 0);
        shoulder.castShadow = true;
        this.group.add(shoulder);
        this.armorPlates.push(shoulder);
      });

      // Accent: Horned acoustic tuning spikes
      [-0.4, 0.4].forEach((sideX) => {
        const spikeGeo = new THREE.ConeGeometry(0.12, 0.7, 6);
        const spike = new THREE.Mesh(spikeGeo, bronzeTrimMat);
        spike.position.set(sideX, 2.45, 0.1);
        this.group.add(spike);
        this.armorPlates.push(spike);
      });

      // Legs / base monoliths
      [-0.4, 0.4].forEach((sideX) => {
        const legGeo = new THREE.BoxGeometry(0.38, 0.9, 0.45);
        const leg = new THREE.Mesh(legGeo, obsidianMat);
        leg.position.set(sideX, 0.45, 0);
        leg.castShadow = true;
        this.group.add(leg);
        this.armorPlates.push(leg);
      });
    } else if (type === 'shrieker') {
      this.health = 60;
      this.maxHealth = 60;

      // Floating inverted bell drone
      const bellGeo = new THREE.CylinderGeometry(0.2, 0.8, 0.9, 16, 1, true);
      const bell = new THREE.Mesh(bellGeo, bronzeTrimMat);
      bell.position.y = 2.2;
      this.group.add(bell);
      this.armorPlates.push(bell);

      const coreGeo = new THREE.SphereGeometry(0.3, 16, 16);
      this.coreMesh = new THREE.Mesh(coreGeo, crystalMat);
      this.coreMesh.position.y = 2.0;
      this.group.add(this.coreMesh);

      // Acoustic emitter rings
      const ringGeo = new THREE.TorusGeometry(0.85, 0.04, 8, 24);
      const ring = new THREE.Mesh(ringGeo, obsidianMat);
      ring.position.y = 2.2;
      ring.rotateX(Math.PI / 2);
      this.group.add(ring);
      this.armorPlates.push(ring);
    } else {
      // leviathan_core (Boss node)
      this.health = 300;
      this.maxHealth = 300;

      const baseGeo = new THREE.CylinderGeometry(1.5, 2.0, 3.5, 8);
      const baseMesh = new THREE.Mesh(baseGeo, obsidianMat);
      baseMesh.position.y = 1.75;
      this.group.add(baseMesh);
      this.armorPlates.push(baseMesh);

      const coreGeo = new THREE.IcosahedronGeometry(1.2, 1);
      this.coreMesh = new THREE.Mesh(coreGeo, crystalMat);
      this.coreMesh.position.y = 3.8;
      this.group.add(this.coreMesh);
    }
  }

  public update(delta: number, elapsed: number, playerPos: THREE.Vector3): { attackReady: boolean } {
    if (this.isDead) {
      // Update exploding shards
      for (let i = this.shards.length - 1; i >= 0; i--) {
        const s = this.shards[i];
        s.life += delta;
        s.mesh.position.addScaledVector(s.velocity, delta);
        s.mesh.rotation.x += s.angularVelocity.x * delta;
        s.mesh.rotation.y += s.angularVelocity.y * delta;
        s.velocity.y -= 15.0 * delta; // Gravity

        const fade = Math.max(0, 1.0 - s.life / s.maxLife);
        (s.mesh.material as THREE.MeshStandardMaterial).opacity = fade;

        if (s.life >= s.maxLife) {
          this.group.remove(s.mesh);
          s.mesh.geometry.dispose();
          (s.mesh.material as THREE.Material).dispose();
          this.shards.splice(i, 1);
        }
      }
      return { attackReady: false };
    }

    // Facing player
    const toPlayer = playerPos.clone().sub(this.group.position);
    toPlayer.y = 0;
    if (toPlayer.lengthSq() > 0.01) {
      toPlayer.normalize();
      const targetAngle = Math.atan2(toPlayer.x, toPlayer.z);
      this.group.rotation.y = THREE.MathUtils.damp(this.group.rotation.y, targetAngle, 4, delta);
    }

    // Core pulsing with natural eigenfrequency
    const pulseSpeed = this.naturalFrequency * 0.02;
    const coreScale = 1.0 + Math.sin(elapsed * pulseSpeed) * 0.08;
    this.coreMesh.scale.setScalar(coreScale);

    // Structural vibration when resonating
    if (this.isResonating) {
      this.resonanceIntensity = Math.min(1.0, this.resonanceIntensity + delta * 2.0);
      const jitter = (Math.random() - 0.5) * 0.06 * this.resonanceIntensity;
      this.armorPlates.forEach((plate) => {
        plate.position.x += jitter;
      });
      // Brighten core
      (this.coreMesh.material as THREE.MeshStandardMaterial).emissiveIntensity =
        0.8 + Math.sin(elapsed * 35.0) * 0.7 * this.resonanceIntensity;
    } else {
      this.resonanceIntensity = Math.max(0, this.resonanceIntensity - delta * 1.5);
    }

    // Attack cooldown
    this.attackTimer += delta;
    if (this.attackTimer >= this.attackInterval) {
      this.attackTimer = 0;
      return { attackReady: true };
    }

    return { attackReady: false };
  }

  /**
   * Catastrophic Resonance Shatter (Rezonans Parçalama):
   * Blows the enemy into dynamic spinning crystal and obsidian shards!
   */
  public triggerShatter() {
    if (this.isDead) return;
    this.isDead = true;

    // Hide original meshes
    this.coreMesh.visible = false;
    this.armorPlates.forEach((p) => (p.visible = false));

    const shardGeo = new THREE.TetrahedronGeometry(0.25, 0);
    const shardMat = new THREE.MeshStandardMaterial({
      color: (this.coreMesh.material as THREE.MeshStandardMaterial).color,
      emissive: (this.coreMesh.material as THREE.MeshStandardMaterial).emissive,
      emissiveIntensity: 0.8,
      metalness: 0.9,
      roughness: 0.2,
      transparent: true,
      opacity: 1.0,
    });

    const shardCount = this.type === 'golem' ? 36 : 24;
    for (let i = 0; i < shardCount; i++) {
      const shardMesh = new THREE.Mesh(shardGeo, shardMat.clone());
      shardMesh.position.copy(this.coreMesh.position);

      const angle = Math.random() * Math.PI * 2;
      const elevation = (Math.random() - 0.2) * Math.PI;
      const speed = 7.0 + Math.random() * 11.0;

      const vel = new THREE.Vector3(
        Math.cos(angle) * Math.cos(elevation) * speed,
        Math.sin(elevation) * speed + 3.0,
        Math.sin(angle) * Math.cos(elevation) * speed
      );

      const angVel = new THREE.Vector3(
        (Math.random() - 0.5) * 12.0,
        (Math.random() - 0.5) * 12.0,
        (Math.random() - 0.5) * 12.0
      );

      this.group.add(shardMesh);
      this.shards.push({
        mesh: shardMesh,
        velocity: vel,
        angularVelocity: angVel,
        life: 0,
        maxLife: 1.8 + Math.random() * 0.8,
      });
    }
  }

  public dispose() {
    this.group.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh;
        mesh.geometry.dispose();
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach((m) => m.dispose());
        } else {
          mesh.material.dispose();
        }
      }
    });
  }
}
