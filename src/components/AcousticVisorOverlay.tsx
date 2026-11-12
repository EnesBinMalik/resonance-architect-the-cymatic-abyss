/**
 * Diegetic Acoustic Visor Overlay & Minimal Title Spec Badge
 * Author & Chief Architect: Enes Öztürk
 *
 * Provides:
 * - Minimal Title / Spec Badge in Top-Left (Cinzel typography, zero pulsating dots)
 * - Diegetic Chladni nodal watermark & acoustic resonance damage feedback
 * - Combat keybinding reference guide
 */

import React from 'react';
import { ArenaDefinition } from '../arenas/arenaManager';

interface AcousticVisorOverlayProps {
  currentArena: ArenaDefinition;
  zeroUiMode: boolean;
  lockedFrequency: number | null;
  comboCount: number;
  bladeEnergy: number;
  isTakingDamage: boolean;
  health: number;
}

export const AcousticVisorOverlay: React.FC<AcousticVisorOverlayProps> = ({
  currentArena,
  zeroUiMode,
  lockedFrequency,
  comboCount,
  bladeEnergy,
  isTakingDamage,
  health,
}) => {
  return (
    <div className="pointer-events-none fixed inset-0 z-20 select-none overflow-hidden">
      {/* 1. Acoustic Resonance Visor Lens Distortion (Diegetic feedback during damage/resonance) */}
      <div
        className={`absolute inset-0 transition-opacity duration-300 pointer-events-none ${
          isTakingDamage
            ? 'opacity-85 bg-[radial-gradient(ellipse_at_center,_transparent_50%,_rgba(255,40,40,0.35)_100%)]'
            : 'opacity-30 bg-[radial-gradient(ellipse_at_center,_transparent_65%,_rgba(5,10,20,0.8)_100%)]'
        }`}
      />

      {/* 2. Top-Left Minimal Title / Spec Badge (Compliant with Three.js skill layout) */}
      {!zeroUiMode && (
        <div className="absolute top-4 left-4 flex flex-col gap-1 pointer-events-auto">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 bg-amber-500 rounded-xs rotate-45" />
            <h1 className="font-cinzel text-base sm:text-lg font-bold tracking-widest text-amber-200 uppercase drop-shadow-md">
              Resonance Architect
            </h1>
            <span className="text-[10px] font-mono-code px-1.5 py-0.5 rounded bg-amber-950/60 border border-amber-500/40 text-amber-300">
              ENES ÖZTÜRK
            </span>
          </div>

          <div className="text-[11px] font-mono-code text-slate-400 tracking-wide flex items-center gap-2">
            <span>THE CYMATIC ABYSS</span>
            <span className="text-slate-600">•</span>
            <span className="text-amber-400/90 font-medium">{currentArena.nameTr}</span>
            <span className="text-slate-600">•</span>
            <span className="text-cyan-400 font-medium">{currentArena.defaultFrequency} Hz</span>
          </div>

          {/* Quick Controls Pill */}
          <div className="mt-1 flex flex-wrap gap-1.5 text-[10px] font-mono-code text-slate-400/90">
            <span className="px-1.5 py-0.5 bg-slate-900/80 border border-slate-800 rounded text-slate-300">
              [WASD] Hareket
            </span>
            <span className="px-1.5 py-0.5 bg-slate-900/80 border border-slate-800 rounded text-slate-300">
              [Sol Tık] Diyapazon Kılıcı
            </span>
            <span className="px-1.5 py-0.5 bg-slate-900/80 border border-slate-800 rounded text-slate-300">
              [Sağ Tık / Space] Bas Topu
            </span>
            <span className="px-1.5 py-0.5 bg-slate-900/80 border border-slate-800 rounded text-slate-300">
              [Shift] Yankı Işınlanması
            </span>
          </div>
        </div>
      )}

      {/* 3. Top-Right Specimen Resonant Frequency & Combo readout (Only if Zero-UI is off) */}
      {!zeroUiMode && (
        <div className="absolute top-4 right-4 flex flex-col items-end gap-1 pointer-events-auto">
          {comboCount > 0 && (
            <div className="flex items-baseline gap-1.5 text-right">
              <span className="font-cinzel text-2xl font-black text-amber-300 drop-shadow">
                {comboCount}x
              </span>
              <span className="text-[10px] font-mono-code text-amber-400 uppercase tracking-widest">
                Akustik Kombo
              </span>
            </div>
          )}

          {lockedFrequency && (
            <div className="flex items-center gap-2 px-2.5 py-1 bg-amber-950/70 border border-amber-500/60 rounded-md">
              <div className="w-2 h-2 rounded-full bg-cyan-400" />
              <span className="text-xs font-mono-code text-cyan-200">
                Hedef Özfrekans: <strong className="text-amber-200">{lockedFrequency} Hz</strong>
              </span>
            </div>
          )}

          {/* Mechanical Blade Energy Bar */}
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[10px] font-mono-code text-slate-400">Diyapazon Enerjisi</span>
            <div className="w-24 h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
              <div
                className="h-full bg-gradient-to-r from-amber-600 to-amber-300 transition-all duration-150"
                style={{ width: `${bladeEnergy}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* 4. Zero-UI Diegetic Notice (Briefly shows when Zero-UI is engaged) */}
      {zeroUiMode && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 px-3 py-1 bg-black/60 border border-amber-500/30 rounded-full text-[11px] font-mono-code text-amber-300/80 tracking-wider">
          MUTLAK DİEGETİK MOD (ZERO-UI) — Verileri Zırh ve Silahlardan Okuyunuz
        </div>
      )}
    </div>
  );
};
