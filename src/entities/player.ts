/**
 * Enes Öztürk - Resonance Architect Character & Weapon Rig
 * Author & Chief Architect: Enes Öztürk
 *
 * Hand-sculpted procedural 3D model featuring:
 * - Handcrafted Obsidian & Bronze Acoustic Resonance Armor
 * - The Tuning Blade (Titanium resonant blade with dual vibrating tuning fork tines)
 * - The Sub-Bass Gauntlet (Electro-Acoustic emitter with copper coil rings & vacuum tube)
 * - Absolute Diegetic Telemetry (vibrating tines, visor Chladni rings, copper wire stress)
 */

import * as THREE from 'three';

export interface PlayerCombatState {
  health: number; // 0 to 100
  maxHealth: number;
  lockedFrequency: number | null; // Frequency detected from striking enemy
  bladeEnergy: number; // 0 to 100
  gauntletCharge: number; // 0 to 1.0
  isChargingGauntlet: boolean;
  comboCount: number;
  lastStrikeTime: number;
  isDashing: boolean;
  isAttacking: boolean;
  attackStage: number; // 0, 1, 2 combo
  echoDashCooldown: number;
}

export class ResonanceArchitectPlayer {
  public group: THREE.Group;
  public state: PlayerCombatState;

  // Body parts
  public torso: THREE.Mesh;
  public head: THREE.Group;
  public visor: THREE.Mesh;
  public visorRing: THREE.Mesh;
  public leftArm: THREE.Group;
  public rightArm: THREE.Group;

  // Weapons
  public tuningBladeGroup: THREE.Group;
  public bladeTineLeft: THREE.Mesh;
  public bladeTineRight: THREE.Mesh;
  public bladeCore: THREE.Mesh;
  public subBassGauntletGroup: THREE.Group;
  public gauntletDiaphragm: THREE.Mesh;
  public gauntletVacuumTube: THREE.Mesh;
  public gauntletCoils: THREE.Mesh;

  // Movement physics
  public velocity = new THREE.Vector3();
  public position = new THREE.Vector3();
  public targetRotation = 0;
  public currentRotation = 0;
  private attackTimer = 0;
  private tineVibrationPhase = 0;
  private visorStressPulse = 0;

  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'EnesOzturk_ResonanceArchitect';

    this.state = {
      health: 100,
      maxHealth: 100,
      lockedFrequency: null,
      bladeEnergy: 100,
      gauntletCharge: 0,
      isChargingGauntlet: false,
      comboCount: 0,
      lastStrikeTime: 0,
      isDashing: false,
      isAttacking: false,
      attackStage: 0,
      echoDashCooldown: 0,
    };

    // Shared high-grade materials
    const obsidianArmorMat = new THREE.MeshStandardMaterial({
      color: 0x0f1118,
      metalness: 0.92,
      roughness: 0.22,
    });

    const forgedBronzeMat = new THREE.MeshStandardMaterial({
      color: 0xba7d3a,
      metalness: 0.95,
      roughness: 0.32,
    });

    const polishedTitaniumMat = new THREE.MeshStandardMaterial({
      color: 0xe6eef8,
      metalness: 0.98,
      roughness: 0.12,
    });

    const glowAcousticMat = new THREE.MeshBasicMaterial({
      color: 0x4fc3f7,
      transparent: true,
      opacity: 0.95,
    });

    // --- 1. Torso & Handcrafted Armor Plate ---
    const torsoGeo = new THREE.BoxGeometry(0.8, 1.1, 0.45);
    this.torso = new THREE.Mesh(torsoGeo, obsidianArmorMat);
    this.torso.position.y = 1.35;
    this.torso.castShadow = true;
    this.group.add(this.torso);

    // Chladni Bronze Breastplate (Diegetic armor crest)
    const breastplateGeo = new THREE.CylinderGeometry(0.24, 0.28, 0.08, 16);
    breastplateGeo.rotateX(Math.PI / 2);
    const breastplate = new THREE.Mesh(breastplateGeo, forgedBronzeMat);
    breastplate.position.set(0, 0.15, 0.25);
    this.torso.add(breastplate);

    // Pauldrons (Left & Right shoulder armor)
    const pauldronGeo = new THREE.BoxGeometry(0.35, 0.25, 0.4);
    const leftPauldron = new THREE.Mesh(pauldronGeo, forgedBronzeMat);
    leftPauldron.position.set(-0.52, 0.5, 0);
    this.torso.add(leftPauldron);

    const rightPauldron = new THREE.Mesh(pauldronGeo, forgedBronzeMat);
    rightPauldron.position.set(0.52, 0.5, 0);
    this.torso.add(rightPauldron);

    // --- 2. Head & Diegetic Acoustic Visor ---
    this.head = new THREE.Group();
    this.head.position.set(0, 0.8, 0);

    const helmetGeo = new THREE.BoxGeometry(0.48, 0.52, 0.5);
    const helmet = new THREE.Mesh(helmetGeo, obsidianArmorMat);
    this.head.add(helmet);

    // Crystal Visor (reads out acoustic vibrations)
    const visorGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.12, 16, 1, false, 0, Math.PI);
    visorGeo.rotateZ(Math.PI / 2);
    const visorMat = new THREE.MeshStandardMaterial({
      color: 0x1a334d,
      metalness: 0.8,
      roughness: 0.1,
      transparent: true,
      opacity: 0.85,
    });
    this.visor = new THREE.Mesh(visorGeo, visorMat);
    this.visor.position.set(0, 0.05, 0.23);
    this.head.add(this.visor);

    // Visor internal Chladni ripple ring
    const visorRingGeo = new THREE.TorusGeometry(0.12, 0.015, 8, 24);
    this.visorRing = new THREE.Mesh(visorRingGeo, glowAcousticMat);
    this.visorRing.position.set(0, 0.05, 0.27);
    this.head.add(this.visorRing);

    // Copper side antenna / acoustic telemetry wires
    const wireGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.35);
    const leftWire = new THREE.Mesh(wireGeo, forgedBronzeMat);
    leftWire.position.set(-0.27, 0.15, 0.1);
    leftWire.rotation.z = -0.3;
    this.head.add(leftWire);

    const rightWire = new THREE.Mesh(wireGeo, forgedBronzeMat);
    rightWire.position.set(0.27, 0.15, 0.1);
    rightWire.rotation.z = 0.3;
    this.head.add(rightWire);

    this.torso.add(this.head);

    // --- 3. Right Arm & The Tuning Blade (Diyapazon Kılıcı) ---
    this.rightArm = new THREE.Group();
    this.rightArm.position.set(0.58, 0.35, 0);

    const bicepRGeo = new THREE.CylinderGeometry(0.14, 0.12, 0.6);
    const bicepR = new THREE.Mesh(bicepRGeo, obsidianArmorMat);
    bicepR.position.y = -0.3;
    this.rightArm.add(bicepR);

    // Forearm & Hand
    const forearmRGeo = new THREE.CylinderGeometry(0.12, 0.1, 0.55);
    const forearmR = new THREE.Mesh(forearmRGeo, forgedBronzeMat);
    forearmR.position.y = -0.8;
    this.rightArm.add(forearmR);

    // Tuning Blade Assembly
    this.tuningBladeGroup = new THREE.Group();
    this.tuningBladeGroup.position.set(0, -1.05, 0.2);
    this.tuningBladeGroup.rotation.x = Math.PI / 4;

    // Hilt & Brass Acoustic Dampener
    const hiltGeo = new THREE.CylinderGeometry(0.045, 0.05, 0.45);
    const hilt = new THREE.Mesh(hiltGeo, forgedBronzeMat);
    this.tuningBladeGroup.add(hilt);

    // Crossguard with Dual Tuning Resonators
    const guardGeo = new THREE.BoxGeometry(0.42, 0.08, 0.12);
    const guard = new THREE.Mesh(guardGeo, forgedBronzeMat);
    guard.position.y = 0.25;
    this.tuningBladeGroup.add(guard);

    // Central Acoustic Crystal Core
    const coreGeo = new THREE.OctahedronGeometry(0.09);
    this.bladeCore = new THREE.Mesh(coreGeo, glowAcousticMat);
    this.bladeCore.position.y = 0.25;
    this.tuningBladeGroup.add(this.bladeCore);

    // Dual Titanium Tuning Fork Tines (Blade body)
    const tineGeo = new THREE.BoxGeometry(0.045, 1.35, 0.04);
    this.bladeTineLeft = new THREE.Mesh(tineGeo, polishedTitaniumMat);
    this.bladeTineLeft.position.set(-0.065, 0.95, 0);
    this.tuningBladeGroup.add(this.bladeTineLeft);

    this.bladeTineRight = new THREE.Mesh(tineGeo, polishedTitaniumMat);
    this.bladeTineRight.position.set(0.065, 0.95, 0);
    this.tuningBladeGroup.add(this.bladeTineRight);

    this.rightArm.add(this.tuningBladeGroup);
    this.torso.add(this.rightArm);

    // --- 4. Left Arm & The Sub-Bass Gauntlet (Bas Topu / Elektro-Akustik Eldiven) ---
    this.leftArm = new THREE.Group();
    this.leftArm.position.set(-0.58, 0.35, 0);

    const bicepLGeo = new THREE.CylinderGeometry(0.14, 0.12, 0.6);
    const bicepL = new THREE.Mesh(bicepLGeo, obsidianArmorMat);
    bicepL.position.y = -0.3;
    this.leftArm.add(bicepL);

    // Gauntlet Main Casing
    this.subBassGauntletGroup = new THREE.Group();
    this.subBassGauntletGroup.position.set(0, -0.85, 0.1);

    const gauntletCasingGeo = new THREE.CylinderGeometry(0.18, 0.22, 0.7, 16);
    const gauntletCasing = new THREE.Mesh(gauntletCasingGeo, forgedBronzeMat);
    this.subBassGauntletGroup.add(gauntletCasing);

    // Heavy Acoustic Diaphragm (Front shockwave emitter nozzle)
    const diaphragmGeo = new THREE.CylinderGeometry(0.19, 0.19, 0.12, 16);
    diaphragmGeo.rotateX(Math.PI / 2);
    const diaphragmMat = new THREE.MeshStandardMaterial({
      color: 0x111115,
      metalness: 0.9,
      roughness: 0.15,
    });
    this.gauntletDiaphragm = new THREE.Mesh(diaphragmGeo, diaphragmMat);
    this.gauntletDiaphragm.position.set(0, -0.35, 0.12);
    this.subBassGauntletGroup.add(this.gauntletDiaphragm);

    // Copper Resonance Induction Coils (3 spiral rings)
    const coilGeo = new THREE.TorusGeometry(0.2, 0.025, 8, 20);
    this.gauntletCoils = new THREE.Mesh(coilGeo, forgedBronzeMat);
    this.gauntletCoils.position.y = -0.05;
    this.gauntletCoils.rotateX(Math.PI / 2);
    this.subBassGauntletGroup.add(this.gauntletCoils);

    // Vacuum Tube Indicator (Diegetic power readout)
    const tubeGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.22, 12);
    const tubeMat = new THREE.MeshStandardMaterial({
      color: 0x331a00,
      emissive: 0xffaa22,
      emissiveIntensity: 0.2,
      transparent: true,
      opacity: 0.85,
    });
    this.gauntletVacuumTube = new THREE.Mesh(tubeGeo, tubeMat);
    this.gauntletVacuumTube.position.set(0.16, 0.08, 0.08);
    this.subBassGauntletGroup.add(this.gauntletVacuumTube);

    this.leftArm.add(this.subBassGauntletGroup);
    this.torso.add(this.leftArm);

    // --- 5. Legs & Grounding Boots ---
    const legGeo = new THREE.BoxGeometry(0.26, 0.85, 0.28);
    const bootGeo = new THREE.BoxGeometry(0.28, 0.25, 0.42);

    const leftLeg = new THREE.Group();
    leftLeg.position.set(-0.25, -0.55, 0);
    const thighL = new THREE.Mesh(legGeo, obsidianArmorMat);
    thighL.position.y = -0.42;
    leftLeg.add(thighL);
    const bootL = new THREE.Mesh(bootGeo, forgedBronzeMat);
    bootL.position.set(0, -0.75, 0.07);
    leftLeg.add(bootL);
    this.torso.add(leftLeg);

    const rightLeg = new THREE.Group();
    rightLeg.position.set(0.25, -0.55, 0);
    const thighR = new THREE.Mesh(legGeo, obsidianArmorMat);
    thighR.position.y = -0.42;
    rightLeg.add(thighR);
    const bootR = new THREE.Mesh(bootGeo, forgedBronzeMat);
    bootR.position.set(0, -0.75, 0.07);
    rightLeg.add(bootR);
    this.torso.add(rightLeg);

    // Grounding contact shadow disc
    const shadowGeo = new THREE.CircleGeometry(0.85, 24);
    shadowGeo.rotateX(-Math.PI / 2);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.45,
      depthWrite: false,
    });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.position.y = 0.02;
    this.group.add(shadowMesh);
  }

  /**
   * Updates animations, physical tine vibration, and telemetry displays
   */
  public update(delta: number, elapsed: number) {
    // 1. Diegetic Telemetry: Tuning Blade Tines Vibration
    this.tineVibrationPhase += delta * 45.0;
    const vibrationAmp = (this.state.bladeEnergy / 100) * 0.025;
    const tineOffset = Math.sin(this.tineVibrationPhase) * vibrationAmp;
    this.bladeTineLeft.position.x = -0.065 - tineOffset;
    this.bladeTineRight.position.x = 0.065 + tineOffset;

    // Tuning blade core color updates according to locked enemy frequency
    if (this.state.lockedFrequency) {
      const hue = ((this.state.lockedFrequency % 1000) / 1000);
      (this.bladeCore.material as THREE.MeshBasicMaterial).color.setHSL(hue, 0.9, 0.6);
    } else {
      (this.bladeCore.material as THREE.MeshBasicMaterial).color.setHex(0x4fc3f7);
    }

    // 2. Diegetic Telemetry: Sub-Bass Gauntlet Vacuum Tube Glow
    const tubeMat = this.gauntletVacuumTube.material as THREE.MeshStandardMaterial;
    if (this.state.isChargingGauntlet) {
      tubeMat.emissiveIntensity = 0.4 + this.state.gauntletCharge * 2.5;
      // Pulse diaphragm
      this.gauntletDiaphragm.position.z = 0.12 + Math.sin(elapsed * 40) * 0.04 * this.state.gauntletCharge;
    } else {
      tubeMat.emissiveIntensity = THREE.MathUtils.damp(tubeMat.emissiveIntensity, 0.2, 5, delta);
      this.gauntletDiaphragm.position.z = THREE.MathUtils.damp(this.gauntletDiaphragm.position.z, 0.12, 10, delta);
    }

    // 3. Diegetic Telemetry: Visor Chladni Ring Pulse & Damage Warning
    if (this.visorStressPulse > 0) {
      this.visorStressPulse -= delta * 1.5;
      this.visorRing.scale.setScalar(1.0 + Math.sin(this.visorStressPulse * 15.0) * 0.35);
      (this.visorRing.material as THREE.MeshBasicMaterial).color.setHex(0xff3333);
    } else {
      const targetScale = 0.8 + (this.state.comboCount > 0 ? Math.min(0.6, this.state.comboCount * 0.08) : 0);
      this.visorRing.scale.setScalar(THREE.MathUtils.damp(this.visorRing.scale.x, targetScale, 4, delta));
      (this.visorRing.material as THREE.MeshBasicMaterial).color.setHex(0x4fc3f7);
    }

    // 4. Attack Animation Interpolation
    if (this.state.isAttacking) {
      this.attackTimer += delta * 6.0;
      const swing = Math.sin(this.attackTimer * Math.PI);
      this.rightArm.rotation.x = -Math.PI / 3 + swing * (1.6 + this.state.attackStage * 0.4);
      this.rightArm.rotation.y = swing * 0.5;

      if (this.attackTimer >= 1.0) {
        this.state.isAttacking = false;
        this.attackTimer = 0;
      }
    } else {
      this.rightArm.rotation.x = THREE.MathUtils.damp(this.rightArm.rotation.x, 0, 8, delta);
      this.rightArm.rotation.y = THREE.MathUtils.damp(this.rightArm.rotation.y, 0, 8, delta);
    }

    // Cooldown decay
    if (this.state.echoDashCooldown > 0) {
      this.state.echoDashCooldown -= delta;
    }

    // Blade energy gentle passive recharge
    if (this.state.bladeEnergy < 100) {
      this.state.bladeEnergy = Math.min(100, this.state.bladeEnergy + delta * 15.0);
    }

    // Smooth character rotation
    this.currentRotation = THREE.MathUtils.damp(this.currentRotation, this.targetRotation, 12, delta);
    this.group.rotation.y = this.currentRotation;
  }

  public triggerAttack(stage: number = 0) {
    this.state.isAttacking = true;
    this.state.attackStage = stage;
    this.attackTimer = 0;
    this.state.bladeEnergy = Math.max(0, this.state.bladeEnergy - 12);
  }

  public takeDamage(amount: number) {
    this.state.health = Math.max(0, this.state.health - amount);
    this.visorStressPulse = 1.0;
  }

  public getForwardVector(): THREE.Vector3 {
    return new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.currentRotation);
  }

  public dispose() {
    this.group.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh;
        mesh.geometry.dispose();
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach(m => m.dispose());
        } else {
          mesh.material.dispose();
        }
      }
    });
  }
}
