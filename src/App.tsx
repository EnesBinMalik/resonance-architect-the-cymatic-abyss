/**
 * RESONANCE ARCHITECT: THE CYMATIC ABYSS
 * Author, Chief Architect & System Designer: Enes Öztürk
 *
 * 3D High-Tempo Acoustic Combat, Real-Time Cymatics Wave Shaping,
 * Ray-Traced Acoustics & Physical Reverberation Architecture Simulation.
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

import { acousticEngine } from './audio/acousticEngine';
import { CymaticsPlateSystem } from './cymatics/cymaticsSimulation';
import { AcousticRayTracer } from './acoustics/rayTracer';
import { ArenaManager, ARENA_DEFINITIONS, ArenaDefinition } from './arenas/arenaManager';
import { ResonanceArchitectPlayer } from './entities/player';
import { AcousticEnemy } from './entities/enemies';
import { ArchitectDock } from './components/ArchitectDock';
import { AcousticVisorOverlay } from './components/AcousticVisorOverlay';

export default function App() {
  const mountRef = useRef<HTMLDivElement>(null);

  // React state for HUD and Dock synchronization
  const [currentArenaId, setCurrentArenaId] = useState<number>(2); // Start at Chladni Dunes
  const [cymaticsM, setCymaticsM] = useState<number>(3);
  const [cymaticsN, setCymaticsN] = useState<number>(5);
  const [cymaticsFreq, setCymaticsFreq] = useState<number>(528);
  const [showRayBundles, setShowRayBundles] = useState<boolean>(true);
  const [volume, setVolume] = useState<number>(0.8);
  const [zeroUiMode, setZeroUiMode] = useState<boolean>(false);
  const [cameraMode, setCameraMode] = useState<'follow' | 'orbit'>('follow');
  const [harmonicClarity, setHarmonicClarity] = useState<number>(0);
  const [lockedFrequency, setLockedFrequency] = useState<number | null>(null);
  const [comboCount, setComboCount] = useState<number>(0);
  const [bladeEnergy, setBladeEnergy] = useState<number>(100);
  const [playerHealth, setPlayerHealth] = useState<number>(100);
  const [isTakingDamage, setIsTakingDamage] = useState<boolean>(false);

  // Engine references across renders
  const engineRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    controls: OrbitControls;
    player: ResonanceArchitectPlayer;
    arenaManager: ArenaManager;
    cymaticsSystem: CymaticsPlateSystem | null;
    rayTracer: AcousticRayTracer;
    enemies: AcousticEnemy[];
    keyState: Record<string, boolean>;
    dirLight: THREE.DirectionalLight;
    hemiLight: THREE.HemisphereLight;
    lastAttackTime: number;
    clock: THREE.Clock;
    frameId: number;
    isSoftwareGl: boolean;
  } | null>(null);

  // Current arena metadata
  const currentArena = ARENA_DEFINITIONS.find((a) => a.id === currentArenaId) || ARENA_DEFINITIONS[1];

  // --- Handlers exposed to user & keyboard ---

  const handleSelectArena = useCallback((id: number) => {
    setCurrentArenaId(id);
    const eng = engineRef.current;
    if (!eng) return;

    const { definition, colliders } = eng.arenaManager.buildArena(id);

    // Update scene lighting & fog for new arena atmosphere
    eng.scene.background = new THREE.Color(definition.atmosphereColor);
    eng.scene.fog = new THREE.FogExp2(definition.atmosphereColor, definition.fogDensity);
    eng.dirLight.color.setHex(definition.lightWarmth);

    // Reset player position to arena center
    eng.player.group.position.set(0, 0, 0);

    // Add Cymatics plate specifically for Layer 2, or keep clean for cathedral
    if (id === 2) {
      if (!eng.cymaticsSystem) {
        eng.cymaticsSystem = new CymaticsPlateSystem(2400, 28);
        eng.scene.add(eng.cymaticsSystem.group);
      }
      eng.cymaticsSystem.group.visible = true;
    } else {
      if (eng.cymaticsSystem) {
        eng.cymaticsSystem.group.visible = false;
      }
    }

    // Register colliders for ray-tracing acoustics
    const allColliders = [...colliders];
    if (eng.cymaticsSystem && id === 2) {
      allColliders.push(eng.cymaticsSystem.plateMesh);
    }
    eng.rayTracer.setColliders(allColliders);

    // Spawn themed arena enemies
    eng.enemies.forEach((e) => {
      eng.scene.remove(e.group);
      e.dispose();
    });
    eng.enemies = [];

    const enemyTypes: ('golem' | 'shrieker' | 'leviathan_core')[] =
      id === 5
        ? ['leviathan_core', 'shrieker', 'shrieker']
        : id === 4
        ? ['shrieker', 'shrieker', 'golem']
        : ['golem', 'golem', 'shrieker'];

    enemyTypes.forEach((type, idx) => {
      const angle = (idx / enemyTypes.length) * Math.PI * 2 + Math.PI / 4;
      const dist = type === 'leviathan_core' ? 0 : 9.0;
      const x = Math.cos(angle) * dist;
      const z = Math.sin(angle) * dist;
      const enemy = new AcousticEnemy(idx + 1, type, new THREE.Vector3(x, 0, z));
      eng.scene.add(enemy.group);
      eng.enemies.push(enemy);
    });

    // Audio acoustic response
    acousticEngine.playPipeOrganChord([definition.defaultFrequency, definition.defaultFrequency * 1.5]);
  }, []);

  const handleChangeCymatics = useCallback((m: number, n: number, freq: number) => {
    setCymaticsM(m);
    setCymaticsN(n);
    setCymaticsFreq(freq);
    const eng = engineRef.current;
    if (eng?.cymaticsSystem) {
      eng.cymaticsSystem.setModes(m, n, freq);
      acousticEngine.playTuningBladeStrike(freq, 0.8);
    }
  }, []);

  const handleToggleRayBundles = useCallback(() => {
    setShowRayBundles((prev) => {
      const next = !prev;
      if (engineRef.current) {
        engineRef.current.rayTracer.showRayBundles = next;
      }
      return next;
    });
  }, []);

  const handleChangeVolume = useCallback((val: number) => {
    setVolume(val);
    acousticEngine.setVolume(val);
  }, []);

  const handleToggleZeroUi = useCallback(() => {
    setZeroUiMode((prev) => !prev);
  }, []);

  const handleToggleCameraMode = useCallback(() => {
    setCameraMode((prev) => (prev === 'follow' ? 'orbit' : 'follow'));
  }, []);

  /**
   * Primary Attack: Tuning Blade Strike (Diyapazon Kılıcı)
   * Strikes enemy, detects and locks their eigenfrequency, plays cathedral reverberated strike.
   */
  const handleTriggerBladeSlash = useCallback(() => {
    const eng = engineRef.current;
    if (!eng) return;
    acousticEngine.init();

    const forward = eng.player.getForwardVector();
    const playerPos = eng.player.group.position;
    const stage = (eng.player.state.attackStage + 1) % 3;
    eng.player.triggerAttack(stage);

    // Cast acoustic ray impulse from blade slash
    const bladePos = playerPos.clone().add(forward.clone().multiplyScalar(1.2)).add(new THREE.Vector3(0, 1.2, 0));
    eng.rayTracer.traceAcousticImpulse(bladePos, forward, cymaticsFreq, 0.35);

    // Strike audio
    acousticEngine.playTuningBladeStrike(cymaticsFreq, 1.0 + stage * 0.2);

    // Check hit on nearby enemies
    let didHit = false;
    eng.enemies.forEach((enemy) => {
      if (enemy.isDead) return;
      const dist = enemy.group.position.distanceTo(playerPos);
      if (dist < 4.5) {
        const toEnemy = enemy.group.position.clone().sub(playerPos).normalize();
        const dot = forward.dot(toEnemy);
        if (dot > 0.3) {
          didHit = true;
          // Capture enemy's natural eigenfrequency!
          eng.player.state.lockedFrequency = enemy.naturalFrequency;
          setLockedFrequency(enemy.naturalFrequency);
          enemy.isResonating = true;
          enemy.health -= 25;

          // Increase combo
          const newCombo = eng.player.state.comboCount + 1;
          eng.player.state.comboCount = newCombo;
          eng.player.state.lastStrikeTime = performance.now();
          setComboCount(newCombo);
          acousticEngine.updateComboHarmonics(newCombo);
          setHarmonicClarity(acousticEngine.getHarmonicClarity());

          // Spawn localized shockwave
          eng.rayTracer.spawnShockwave(enemy.group.position, new THREE.Vector3(0, 1, 0), enemy.naturalFrequency, 5.0, 15.0);

          if (enemy.health <= 0) {
            enemy.triggerShatter();
            acousticEngine.playResonanceShatter(enemy.naturalFrequency);
          }
        }
      }
    });

    if (eng.cymaticsSystem && currentArenaId === 2) {
      eng.cymaticsSystem.pulseShockwave(playerPos.x, playerPos.z, 0.6);
    }
    setBladeEnergy(eng.player.state.bladeEnergy);
  }, [cymaticsFreq, currentArenaId]);

  /**
   * Sub-Bass Gauntlet Blast (Bas Topu / Elektro-Akustik Eldiven)
   * Fires devastating shockwave. If the enemy's frequency was locked, causes catastrophic Resonance Shatter!
   */
  const handleTriggerSubBass = useCallback(() => {
    const eng = engineRef.current;
    if (!eng) return;
    acousticEngine.init();

    const forward = eng.player.getForwardVector();
    const playerPos = eng.player.group.position;

    // Audio & ray-traced acoustic blast
    acousticEngine.playSubBassShockwave(1.2);
    const blastPos = playerPos.clone().add(forward.clone().multiplyScalar(1.5)).add(new THREE.Vector3(0, 1.0, 0));
    eng.rayTracer.traceAcousticImpulse(blastPos, forward, 60, 0.65);
    eng.rayTracer.spawnShockwave(blastPos, forward, 60, 14.0, 30.0);

    // Shake Chladni sand grains
    if (eng.cymaticsSystem && currentArenaId === 2) {
      eng.cymaticsSystem.pulseShockwave(playerPos.x, playerPos.z, 1.8);
    }

    // Check resonance shatter on enemies
    eng.enemies.forEach((enemy) => {
      if (enemy.isDead) return;
      const dist = enemy.group.position.distanceTo(playerPos);
      if (dist < 10.0) {
        const toEnemy = enemy.group.position.clone().sub(playerPos).normalize();
        const dot = forward.dot(toEnemy);
        if (dot > 0.4) {
          // If locked frequency matches enemy's natural frequency -> INSTANT RESONANCE SHATTER!
          if (eng.player.state.lockedFrequency === enemy.naturalFrequency || enemy.isResonating) {
            enemy.triggerShatter();
            acousticEngine.playResonanceShatter(enemy.naturalFrequency);

            const newCombo = eng.player.state.comboCount + 3;
            eng.player.state.comboCount = newCombo;
            setComboCount(newCombo);
            acousticEngine.updateComboHarmonics(newCombo);
            setHarmonicClarity(acousticEngine.getHarmonicClarity());
          } else {
            enemy.health -= 40;
            if (enemy.health <= 0) {
              enemy.triggerShatter();
              acousticEngine.playResonanceShatter(enemy.naturalFrequency);
            }
          }
        }
      }
    });

    eng.player.state.lockedFrequency = null;
    setLockedFrequency(null);
  }, [currentArenaId]);

  /**
   * Echo Dash (Yankı Işınlanması)
   * Sends high-frequency ping, reflects off nearest obstacle, and warps instantaneously along the reflected ray path!
   */
  const handleTriggerEchoDash = useCallback(() => {
    const eng = engineRef.current;
    if (!eng || eng.player.state.echoDashCooldown > 0) return;
    acousticEngine.init();

    const forward = eng.player.getForwardVector();
    const sourcePos = eng.player.group.position.clone().add(new THREE.Vector3(0, 1.2, 0));

    // Audio
    acousticEngine.playEchoDash();

    // Ray trace reflection path
    const { echoDashTarget, bounceHit } = eng.rayTracer.traceAcousticImpulse(sourcePos, forward, 1760, 0.2);

    // Spawn starting shockwave ring
    eng.rayTracer.spawnShockwave(sourcePos, forward, 1760, 8.0, 35.0);

    // Warp player to reflection target (bounded inside arena)
    const clampedTarget = echoDashTarget.clone();
    clampedTarget.y = 0;
    clampedTarget.x = Math.max(-17, Math.min(17, clampedTarget.x));
    clampedTarget.z = Math.max(-17, Math.min(17, clampedTarget.z));

    eng.player.group.position.copy(clampedTarget);
    eng.player.state.echoDashCooldown = 0.8;

    // Spawn arrival shockwave ring
    eng.rayTracer.spawnShockwave(clampedTarget, forward, 1760, 6.0, 28.0);
  }, []);

  const handleTriggerOrganChord = useCallback(() => {
    acousticEngine.init();
    acousticEngine.playPipeOrganChord([220, 277.18, 329.63, 440]);
    acousticEngine.playCarillonBell(528);
  }, []);

  // --- Main Three.js Lifecycle Setup ---
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Detect software WebGL from GPU renderer string
    const isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    // 2. Setup Three.js WebGLRenderer conforming to skill directives
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(renderer.domElement);

    // 3. Scene & Camera
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x080c14);
    scene.fog = new THREE.FogExp2(0x080c14, 0.016);

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 200);
    camera.position.set(0, 6.5, 12.0);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 - 0.05; // Don't clip below floor
    controls.minDistance = 3.5;
    controls.maxDistance = 45;
    controls.target.set(0, 1.2, 0);

    // 4. Mandatory Studio Environment Reflection (RoomEnvironment + PMREM)
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // 5. Studio 3-Point Lighting Rig
    const dirLight = new THREE.DirectionalLight(0xd4a359, 2.2);
    dirLight.position.set(12, 22, 14);
    dirLight.castShadow = !isSoftwareGl;
    if (dirLight.castShadow) {
      dirLight.shadow.mapSize.width = 2048;
      dirLight.shadow.mapSize.height = 2048;
      dirLight.shadow.camera.near = 0.5;
      dirLight.shadow.camera.far = 60;
      const d = 22;
      dirLight.shadow.camera.left = -d;
      dirLight.shadow.camera.right = d;
      dirLight.shadow.camera.top = d;
      dirLight.shadow.camera.bottom = -d;
      dirLight.shadow.bias = -0.0005;
      dirLight.shadow.normalBias = 0.02;
    }
    scene.add(dirLight);

    const hemiLight = new THREE.HemisphereLight(0x4fc3f7, 0x080c14, 0.85);
    scene.add(hemiLight);

    // 6. Instantiate Subsystems
    const arenaManager = new ArenaManager();
    scene.add(arenaManager.group);

    const cymaticsSystem = new CymaticsPlateSystem(2400, 28);
    scene.add(cymaticsSystem.group);

    const rayTracer = new AcousticRayTracer();
    scene.add(rayTracer.group);

    const player = new ResonanceArchitectPlayer();
    scene.add(player.group);

    // Initial Arena Build (Katman 2 - Chladni Dunes)
    const { colliders } = arenaManager.buildArena(2);
    rayTracer.setColliders([...colliders, cymaticsSystem.plateMesh]);

    // Spawn Initial Enemies
    const enemies: AcousticEnemy[] = [];
    [
      { type: 'golem' as const, pos: new THREE.Vector3(-6, 0, -6) },
      { type: 'golem' as const, pos: new THREE.Vector3(6, 0, -6) },
      { type: 'shrieker' as const, pos: new THREE.Vector3(0, 0, 7) },
    ].forEach((spec, idx) => {
      const e = new AcousticEnemy(idx + 1, spec.type, spec.pos);
      scene.add(e.group);
      enemies.push(e);
    });

    const keyState: Record<string, boolean> = {};

    engineRef.current = {
      scene,
      camera,
      renderer,
      controls,
      player,
      arenaManager,
      cymaticsSystem,
      rayTracer,
      enemies,
      keyState,
      dirLight,
      hemiLight,
      lastAttackTime: 0,
      clock: new THREE.Clock(),
      frameId: 0,
      isSoftwareGl,
    };

    // 7. Input Event Listeners
    const onKeyDown = (e: KeyboardEvent) => {
      keyState[e.code] = true;

      // Hotkeys
      if (e.code === 'KeyH') {
        const btn = document.querySelector('button[title*="Toggle Dock"]') as HTMLButtonElement | null;
        btn?.click();
      } else if (e.code === 'KeyZ') {
        setZeroUiMode((prev) => !prev);
      } else if (e.code === 'KeyC') {
        setCameraMode((prev) => (prev === 'follow' ? 'orbit' : 'follow'));
      } else if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
        handleTriggerEchoDash();
      } else if (e.code === 'Space') {
        handleTriggerSubBass();
      } else if (e.code === 'Digit1') {
        handleSelectArena(1);
      } else if (e.code === 'Digit2') {
        handleSelectArena(2);
      } else if (e.code === 'Digit3') {
        handleSelectArena(3);
      } else if (e.code === 'Digit4') {
        handleSelectArena(4);
      } else if (e.code === 'Digit5') {
        handleSelectArena(5);
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      keyState[e.code] = false;
    };

    const onMouseDown = (e: MouseEvent) => {
      if ((e.target as HTMLElement).closest('button, input, select')) return;
      if (e.button === 0) {
        handleTriggerBladeSlash();
      } else if (e.button === 2) {
        handleTriggerSubBass();
      }
    };

    const onContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('resize', onResize);
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('contextmenu', onContextMenu);

    // 8. Main Render Loop (with afterDraw pace for software WebGL)
    let isRunning = true;

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (!isRunning) return;
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          engineRef.current!.frameId = window.setTimeout(poll, 5);
        } else {
          gl.deleteSync(sync);
          engineRef.current!.frameId = window.setTimeout(cb, 80);
        }
      };
      engineRef.current!.frameId = window.setTimeout(poll, 5);
    }

    const _moveDir = new THREE.Vector3();

    function tick() {
      if (!isRunning) return;
      const eng = engineRef.current;
      if (!eng) return;

      const delta = Math.min(eng.clock.getDelta(), 0.1);
      const elapsed = eng.clock.getElapsedTime();

      // --- Player Movement Physics ---
      _moveDir.set(0, 0, 0);
      if (eng.keyState['KeyW'] || eng.keyState['ArrowUp']) _moveDir.z -= 1;
      if (eng.keyState['KeyS'] || eng.keyState['ArrowDown']) _moveDir.z += 1;
      if (eng.keyState['KeyA'] || eng.keyState['ArrowLeft']) _moveDir.x -= 1;
      if (eng.keyState['KeyD'] || eng.keyState['ArrowRight']) _moveDir.x += 1;

      if (_moveDir.lengthSq() > 0) {
        _moveDir.normalize();
        const moveSpeed = 9.5;
        eng.player.group.position.x += _moveDir.x * moveSpeed * delta;
        eng.player.group.position.z += _moveDir.z * moveSpeed * delta;

        // Arena boundary clamp
        eng.player.group.position.x = Math.max(-17, Math.min(17, eng.player.group.position.x));
        eng.player.group.position.z = Math.max(-17, Math.min(17, eng.player.group.position.z));

        // Face movement direction
        eng.player.targetRotation = Math.atan2(_moveDir.x, _moveDir.z);
      }

      // Update Player model & diegetic telemetry
      eng.player.update(delta, elapsed);

      // Camera Follow behavior
      if (cameraMode === 'follow') {
        const idealOffset = new THREE.Vector3(0, 5.2, 8.8);
        const playerPos = eng.player.group.position;
        const targetCamPos = playerPos.clone().add(idealOffset);

        eng.camera.position.x = THREE.MathUtils.damp(eng.camera.position.x, targetCamPos.x, 8, delta);
        eng.camera.position.y = THREE.MathUtils.damp(eng.camera.position.y, targetCamPos.y, 8, delta);
        eng.camera.position.z = THREE.MathUtils.damp(eng.camera.position.z, targetCamPos.z, 8, delta);

        eng.controls.target.x = THREE.MathUtils.damp(eng.controls.target.x, playerPos.x, 10, delta);
        eng.controls.target.y = THREE.MathUtils.damp(eng.controls.target.y, playerPos.y + 1.2, 10, delta);
        eng.controls.target.z = THREE.MathUtils.damp(eng.controls.target.z, playerPos.z, 10, delta);
      }
      eng.controls.update();

      // Update Arena animations (wave floor, swinging bells, organ vibrations)
      eng.arenaManager.update(delta, elapsed);

      // Update Cymatics particle physics (Layer 2)
      if (eng.cymaticsSystem && eng.cymaticsSystem.group.visible) {
        eng.cymaticsSystem.update(delta, elapsed);
      }

      // Update Ray-Tracer shockwaves & fading ray bundles
      eng.rayTracer.update(delta);

      // Update Enemies & handle their acoustic attacks
      const pPos = eng.player.group.position;
      eng.enemies.forEach((enemy) => {
        const { attackReady } = enemy.update(delta, elapsed, pPos);
        if (attackReady && !enemy.isDead) {
          const dist = enemy.group.position.distanceTo(pPos);
          if (dist < 12.0) {
            // Enemy releases acoustic shockwave towards player
            const dir = pPos.clone().sub(enemy.group.position).normalize();
            eng.rayTracer.spawnShockwave(enemy.group.position, dir, enemy.naturalFrequency, 10.0, 18.0);
            if (dist < 3.2) {
              eng.player.takeDamage(15);
              setIsTakingDamage(true);
              setTimeout(() => setIsTakingDamage(false), 300);
              setPlayerHealth(eng.player.state.health);
            }
          }
        }
      });

      // Combo expiration timer
      if (eng.player.state.comboCount > 0 && performance.now() - eng.player.state.lastStrikeTime > 4000) {
        eng.player.state.comboCount = 0;
        setComboCount(0);
        acousticEngine.updateComboHarmonics(0);
        setHarmonicClarity(0);
      }

      // Render Scene
      renderer.render(scene, camera);

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        eng.frameId = requestAnimationFrame(tick);
      }
    }

    tick();

    // Cleanup on unmount
    return () => {
      isRunning = false;
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('contextmenu', onContextMenu);

      cancelAnimationFrame(engineRef.current?.frameId || 0);
      clearTimeout(engineRef.current?.frameId || 0);

      controls.dispose();
      renderer.dispose();
      player.dispose();
      arenaManager.dispose();
      cymaticsSystem?.dispose();
      rayTracer.dispose();
      enemies.forEach((e) => e.dispose());
      acousticEngine.destroy();

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [
    handleSelectArena,
    handleTriggerBladeSlash,
    handleTriggerSubBass,
    handleTriggerEchoDash,
    cameraMode,
  ]);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#030406]">
      {/* 1. Dedicated Isolated 3D Canvas Mount (Zero backdrop-blur, stable lifecycle) */}
      <div ref={mountRef} className="absolute inset-0 w-full h-full cursor-crosshair" />

      {/* 2. Diegetic Acoustic Visor Overlay (Radial Vignette, Damage Feedback, Minimal Spec Badge) */}
      <AcousticVisorOverlay
        currentArena={currentArena}
        zeroUiMode={zeroUiMode}
        lockedFrequency={lockedFrequency}
        comboCount={comboCount}
        bladeEnergy={bladeEnergy}
        isTakingDamage={isTakingDamage}
        health={playerHealth}
      />

      {/* 3. Ergonomic Bottom-Center Collapsible Dock (Zero Viewport Occlusion) */}
      <ArchitectDock
        currentArenaId={currentArenaId}
        onSelectArena={handleSelectArena}
        cymaticsM={cymaticsM}
        cymaticsN={cymaticsN}
        cymaticsFreq={cymaticsFreq}
        onChangeCymatics={handleChangeCymatics}
        showRayBundles={showRayBundles}
        onToggleRayBundles={handleToggleRayBundles}
        volume={volume}
        onChangeVolume={handleChangeVolume}
        zeroUiMode={zeroUiMode}
        onToggleZeroUi={handleToggleZeroUi}
        cameraMode={cameraMode}
        onToggleCameraMode={handleToggleCameraMode}
        harmonicClarity={harmonicClarity}
        lockedFrequency={lockedFrequency}
        onTriggerEchoDash={handleTriggerEchoDash}
        onTriggerBladeSlash={handleTriggerBladeSlash}
        onTriggerSubBass={handleTriggerSubBass}
        onTriggerOrganChord={handleTriggerOrganChord}
      />
    </div>
  );
}
