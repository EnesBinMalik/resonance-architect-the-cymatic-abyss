/**
 * Enes-Acoustic Engine - Physical Acoustic & Procedural Instrumental Audio System
 * Author & Chief Architect: Enes Öztürk
 *
 * Implements physical acoustic synthesis (pipe organs, carillon bells, tuning forks,
 * sub-bass shockwaves, Chladni resonance hum, and dynamic orchestral concordance).
 * Zero synthetic pre-recorded files; 100% physically computed via Web Audio API.
 */

class AcousticEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private reverbNode: ConvolverNode | null = null;
  private droneGain: GainNode | null = null;
  private droneOscs: OscillatorNode[] = [];
  private organGain: GainNode | null = null;
  private organInterval: number | null = null;
  private isInitialized = false;
  private comboHarmonics = 0; // 0 to 1
  private masterVolume = 0.8;

  public init() {
    if (this.isInitialized) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.masterVolume, this.ctx.currentTime);

      // Create procedural cathedral convolution impulse response
      this.createCathedralImpulse();

      // Master output
      if (this.reverbNode) {
        this.masterGain.connect(this.ctx.destination);
      }

      this.isInitialized = true;
      this.startAmbientAcousticDrone();
    } catch (e) {
      console.warn('Web Audio initialization error:', e);
    }
  }

  public resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setVolume(vol: number) {
    this.masterVolume = Math.max(0, Math.min(1, vol));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.masterVolume, this.ctx.currentTime, 0.05);
    }
  }

  public getVolume() {
    return this.masterVolume;
  }

  /**
   * Procedural Cathedral Impulse Response Generator:
   * Generates realistic acoustic reflections of massive stone, crystal, and bronze surfaces.
   */
  private createCathedralImpulse() {
    if (!this.ctx) return;
    const rate = this.ctx.sampleRate;
    const duration = 3.6; // 3.6 second cathedral decay
    const length = Math.floor(rate * duration);
    const impulse = this.ctx.createBuffer(2, length, rate);
    const left = impulse.getChannelData(0);
    const right = impulse.getChannelData(1);

    const decay = 2.8;
    for (let i = 0; i < length; i++) {
      const t = i / rate;
      // Exponential decay with acoustic diffusion flutter
      const envelope = Math.exp(-t * decay);
      // Discrete early reflections followed by dense late reverberation
      const flutter = Math.sin(t * 180.0) * 0.15;
      const noiseL = (Math.random() * 2 - 1) * envelope * (1 + flutter);
      const noiseR = (Math.random() * 2 - 1) * envelope * (1 - flutter);
      left[i] = noiseL;
      right[i] = noiseR;
    }

    this.reverbNode = this.ctx.createConvolver();
    this.reverbNode.buffer = impulse;

    // Wet / Dry mixing
    const reverbGain = this.ctx.createGain();
    reverbGain.gain.setValueAtTime(0.42, this.ctx.currentTime);
    this.reverbNode.connect(reverbGain);
    reverbGain.connect(this.masterGain!);
  }

  /**
   * Ambient Acoustic Drone:
   * Continuous deep resonance of bronze structures and cavernous chambers.
   */
  private startAmbientAcousticDrone() {
    if (!this.ctx || !this.masterGain) return;

    this.droneGain = this.ctx.createGain();
    this.droneGain.gain.setValueAtTime(0.12, this.ctx.currentTime);
    this.droneGain.connect(this.masterGain);

    // Fundamental frequencies: 55Hz (A1), 110Hz (A2), 164.8Hz (E3)
    const droneFreqs = [55, 110, 164.81, 220];
    droneFreqs.forEach((freq, idx) => {
      if (!this.ctx || !this.droneGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = idx === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(freq * 2.2, this.ctx.currentTime);

      gain.gain.setValueAtTime(0.25 / (idx + 1), this.ctx.currentTime);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.droneGain);

      osc.start();
      this.droneOscs.push(osc);
    });
  }

  /**
   * Tuning Blade Strike:
   * Right-hand titanium blade impact. Emits pure harmonic tuning fork frequency with metal transient.
   */
  public playTuningBladeStrike(freq: number = 432, harmonicPhase: number = 1.0) {
    if (!this.ctx || !this.masterGain) return;
    this.resume();

    const now = this.ctx.currentTime;

    // 1. Titanium Strike Transient (Short sharp metallic click)
    const clickOsc = this.ctx.createOscillator();
    const clickGain = this.ctx.createGain();
    clickOsc.type = 'triangle';
    clickOsc.frequency.setValueAtTime(freq * 3.8, now);
    clickOsc.frequency.exponentialRampToValueAtTime(freq * 0.5, now + 0.04);
    clickGain.gain.setValueAtTime(0.45, now);
    clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
    clickOsc.connect(clickGain);
    clickGain.connect(this.masterGain);
    clickOsc.start(now);
    clickOsc.stop(now + 0.05);

    // 2. Pure Tuning Fork Fundamental
    const forkOsc = this.ctx.createOscillator();
    const forkGain = this.ctx.createGain();
    forkOsc.type = 'sine';
    forkOsc.frequency.setValueAtTime(freq, now);
    // Subtle frequency modulation from blade vibration
    forkOsc.frequency.linearRampToValueAtTime(freq * (1 + 0.005 * harmonicPhase), now + 0.1);
    forkOsc.frequency.linearRampToValueAtTime(freq, now + 0.3);

    const dur = 1.2;
    forkGain.gain.setValueAtTime(0.55, now);
    forkGain.gain.exponentialRampToValueAtTime(0.001, now + dur);

    forkOsc.connect(forkGain);
    forkGain.connect(this.masterGain);
    if (this.reverbNode) {
      forkGain.connect(this.reverbNode);
    }

    forkOsc.start(now);
    forkOsc.stop(now + dur);

    // 3. Second Harmonic (Chladni overtone)
    const overtoneOsc = this.ctx.createOscillator();
    const overtoneGain = this.ctx.createGain();
    overtoneOsc.type = 'sine';
    overtoneOsc.frequency.setValueAtTime(freq * 2.003, now); // Slightly detuned physical harmonic
    overtoneGain.gain.setValueAtTime(0.2, now);
    overtoneGain.gain.exponentialRampToValueAtTime(0.0001, now + dur * 0.6);
    overtoneOsc.connect(overtoneGain);
    overtoneGain.connect(this.masterGain);
    overtoneOsc.start(now);
    overtoneOsc.stop(now + dur * 0.6);
  }

  /**
   * Sub-Bass Gauntlet Blast:
   * Left-hand acoustic shockwave. 35Hz - 85Hz pneumatic impulse, displaces the atmosphere.
   */
  public playSubBassShockwave(power: number = 1.0) {
    if (!this.ctx || !this.masterGain) return;
    this.resume();

    const now = this.ctx.currentTime;
    const dur = 0.8 * power;

    // 1. Sub-bass drop oscillator
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(110, now);
    subOsc.frequency.exponentialRampToValueAtTime(32, now + 0.35);

    const peakGain = Math.min(1.0, 0.75 * power);
    subGain.gain.setValueAtTime(0.01, now);
    subGain.gain.linearRampToValueAtTime(peakGain, now + 0.03);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + dur);

    subOsc.connect(subGain);
    subGain.connect(this.masterGain);

    subOsc.start(now);
    subOsc.stop(now + dur);

    // 2. Air compression white noise burst through bandpass
    const bufferSize = this.ctx.sampleRate * 0.3;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.08));
    }
    const noiseNode = this.ctx.createBufferSource();
    noiseNode.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(160, now);
    filter.Q.setValueAtTime(3.0, now);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.4 * power, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    noiseNode.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.masterGain);
    if (this.reverbNode) {
      noiseGain.connect(this.reverbNode);
    }

    noiseNode.start(now);
    noiseNode.stop(now + 0.3);
  }

  /**
   * Resonance Shatter (Rezonans Parçalama):
   * When the frequency of the attack matches the target's natural eigenfrequency.
   * Catastrophic crystal acoustic shatter sound!
   */
  public playResonanceShatter(freq: number = 528) {
    if (!this.ctx || !this.masterGain) return;
    this.resume();

    const now = this.ctx.currentTime;

    // Harmonic screech buildup
    const screech = this.ctx.createOscillator();
    const screechGain = this.ctx.createGain();
    screech.type = 'sawtooth';
    screech.frequency.setValueAtTime(freq, now);
    screech.frequency.linearRampToValueAtTime(freq * 1.5, now + 0.08);

    screechGain.gain.setValueAtTime(0.3, now);
    screechGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

    screech.connect(screechGain);
    screechGain.connect(this.masterGain);
    screech.start(now);
    screech.stop(now + 0.1);

    // Multi-modal glass explosion (12 crystal bell partials shattering)
    const glassPartials = [1.0, 1.34, 1.76, 2.15, 2.82, 3.41, 4.2, 5.08, 6.2, 7.8];
    glassPartials.forEach((multiplier, i) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq * multiplier * (0.98 + Math.random() * 0.04), now);

      const decayTime = 0.4 + (1 - i / glassPartials.length) * 1.4;
      gain.gain.setValueAtTime(0.3 / (i + 1), now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + decayTime);

      osc.connect(gain);
      gain.connect(this.masterGain);
      if (this.reverbNode) {
        gain.connect(this.reverbNode);
      }

      osc.start(now);
      osc.stop(now + decayTime);
    });

    // Sub-rumble from shockwave collapse
    this.playSubBassShockwave(1.3);
  }

  /**
   * Echo Dash (Yankı Işınlanması):
   * Sonar ping followed by doppler acoustic warp along the reflected ray path.
   */
  public playEchoDash() {
    if (!this.ctx || !this.masterGain) return;
    this.resume();

    const now = this.ctx.currentTime;

    // 1. High-frequency acoustic locator ping (1760Hz - A6)
    const pingOsc = this.ctx.createOscillator();
    const pingGain = this.ctx.createGain();
    pingOsc.type = 'sine';
    pingOsc.frequency.setValueAtTime(1760, now);
    pingOsc.frequency.exponentialRampToValueAtTime(880, now + 0.25);

    pingGain.gain.setValueAtTime(0.4, now);
    pingGain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    pingOsc.connect(pingGain);
    pingGain.connect(this.masterGain);
    if (this.reverbNode) {
      pingGain.connect(this.reverbNode);
    }
    pingOsc.start(now);
    pingOsc.stop(now + 0.25);

    // 2. Air bend warp (frequency swoosh)
    const warpOsc = this.ctx.createOscillator();
    const warpGain = this.ctx.createGain();
    warpOsc.type = 'triangle';
    warpOsc.frequency.setValueAtTime(220, now + 0.05);
    warpOsc.frequency.exponentialRampToValueAtTime(1200, now + 0.2);

    warpGain.gain.setValueAtTime(0.01, now + 0.05);
    warpGain.gain.linearRampToValueAtTime(0.35, now + 0.12);
    warpGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    warpOsc.connect(warpGain);
    warpGain.connect(this.masterGain);
    warpOsc.start(now + 0.05);
    warpOsc.stop(now + 0.35);
  }

  /**
   * Pipe Organ Rank Chords (Katman 1 - The Pipe Organ Canyons):
   * Physical pipe organ simulation with flue pipes, wind noise, and fundamental ranks.
   */
  public playPipeOrganChord(notes: number[] = [220, 277.18, 329.63, 440]) {
    if (!this.ctx || !this.masterGain) return;
    this.resume();

    const now = this.ctx.currentTime;
    const dur = 2.4;

    notes.forEach((freq) => {
      if (!this.ctx || !this.masterGain) return;
      // 3 Pipe Ranks per note: Principal (8'), Octave (4'), Flute (16')
      const ranks = [
        { mult: 0.5, type: 'triangle' as OscillatorType, vol: 0.2 },
        { mult: 1.0, type: 'sawtooth' as OscillatorType, vol: 0.15 },
        { mult: 2.0, type: 'sine' as OscillatorType, vol: 0.12 }
      ];

      ranks.forEach(rank => {
        if (!this.ctx || !this.masterGain) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        osc.type = rank.type;
        osc.frequency.setValueAtTime(freq * rank.mult, now);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(freq * rank.mult * 3.5, now);

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(rank.vol, now + 0.15); // Organ pipe wind swell
        gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);
        if (this.reverbNode) {
          gain.connect(this.reverbNode);
        }

        osc.start(now);
        osc.stop(now + dur);
      });
    });
  }

  /**
   * Hand-blown Crystal Bells / Glass Carillon (Katman 4 - The Glass Carillon):
   * Inharmonic bell mode partials: Strike tone, Tierce, Quint, Nominal.
   */
  public playCarillonBell(fundamental: number = 440) {
    if (!this.ctx || !this.masterGain) return;
    this.resume();

    const now = this.ctx.currentTime;
    const dur = 3.5;

    // Physical bell partial ratios
    const partials = [
      { ratio: 0.5, amp: 0.35, decay: 3.5 }, // Hum tone
      { ratio: 1.0, amp: 0.45, decay: 2.5 }, // Strike note / prime
      { ratio: 1.183, amp: 0.25, decay: 2.0 }, // Tierce (minor 3rd)
      { ratio: 1.506, amp: 0.2, decay: 1.8 }, // Quint
      { ratio: 2.0, amp: 0.3, decay: 1.4 }, // Nominal
      { ratio: 2.614, amp: 0.15, decay: 1.0 }, // Superquint
      { ratio: 3.011, amp: 0.1, decay: 0.7 }  // Octave nominal
    ];

    partials.forEach(p => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(fundamental * p.ratio, now);

      gain.gain.setValueAtTime(p.amp, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + p.decay);

      osc.connect(gain);
      gain.connect(this.masterGain);
      if (this.reverbNode) {
        gain.connect(this.reverbNode);
      }

      osc.start(now);
      osc.stop(now + p.decay);
    });
  }

  /**
   * Dynamic Harmonic Concordance:
   * Sets combo harmonic clarity. As the player chains attacks and aligns frequencies,
   * dissonant chaotic noise smoothly morphs into pure orchestral acoustic consonance!
   */
  public updateComboHarmonics(comboCount: number) {
    // 0 to 10+ combo translates to 0.0 -> 1.0 harmonic clarity
    const target = Math.min(1.0, comboCount / 8);
    this.comboHarmonics = target;

    // Trigger uplifting resonant harmonic organ chord on combo milestones
    if (comboCount > 0 && comboCount % 4 === 0) {
      const chords = [
        [261.63, 329.63, 392.0, 523.25], // C Major
        [293.66, 369.99, 440.0, 587.33], // D Major
        [329.63, 415.30, 493.88, 659.25], // E Major
        [349.23, 440.0, 523.25, 698.46]  // F Major
      ];
      const chordIndex = Math.floor(comboCount / 4) % chords.length;
      this.playPipeOrganChord(chords[chordIndex]);
    }
  }

  public getHarmonicClarity() {
    return this.comboHarmonics;
  }

  public destroy() {
    if (this.droneOscs.length > 0) {
      this.droneOscs.forEach(o => {
        try { o.stop(); o.disconnect(); } catch {}
      });
      this.droneOscs = [];
    }
    if (this.ctx) {
      this.ctx.close();
      this.ctx = null;
    }
    this.isInitialized = false;
  }
}

export const acousticEngine = new AcousticEngine();
