/**
 * Architect Control Dock (Collapsible Bottom Dock - Zero Viewport Occlusion)
 * Author & Chief Architect: Enes Öztürk
 *
 * Implements Three.js ergonomic guidelines:
 * - Pinned to bottom-center with zero left/right viewport obstruction
 * - Collapsible "Cinema / Zen Mode" drawer (Hide/Show or press 'H')
 * - Static indicators (no pulsating dots)
 * - Deep controls for Arenas, Cymatics Modals, Ray-Traced Acoustics, and Diegetic modes
 */

import React, { useState } from 'react';
import {
  Volume2,
  VolumeX,
  Radio,
  Eye,
  EyeOff,
  Sparkles,
  Waves,
  Zap,
  ChevronDown,
  ChevronUp,
  Compass,
  Layers,
  Music,
} from 'lucide-react';
import { ARENA_DEFINITIONS } from '../arenas/arenaManager';

interface ArchitectDockProps {
  currentArenaId: number;
  onSelectArena: (id: number) => void;
  cymaticsM: number;
  cymaticsN: number;
  cymaticsFreq: number;
  onChangeCymatics: (m: number, n: number, freq: number) => void;
  showRayBundles: boolean;
  onToggleRayBundles: () => void;
  volume: number;
  onChangeVolume: (vol: number) => void;
  zeroUiMode: boolean;
  onToggleZeroUi: () => void;
  cameraMode: 'follow' | 'orbit';
  onToggleCameraMode: () => void;
  harmonicClarity: number;
  lockedFrequency: number | null;
  onTriggerEchoDash: () => void;
  onTriggerBladeSlash: () => void;
  onTriggerSubBass: () => void;
  onTriggerOrganChord: () => void;
}

export const ArchitectDock: React.FC<ArchitectDockProps> = ({
  currentArenaId,
  onSelectArena,
  cymaticsM,
  cymaticsN,
  cymaticsFreq,
  onChangeCymatics,
  showRayBundles,
  onToggleRayBundles,
  volume,
  onChangeVolume,
  zeroUiMode,
  onToggleZeroUi,
  cameraMode,
  onToggleCameraMode,
  harmonicClarity,
  lockedFrequency,
  onTriggerEchoDash,
  onTriggerBladeSlash,
  onTriggerSubBass,
  onTriggerOrganChord,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<'arena' | 'cymatics' | 'combat' | 'acoustic'>('arena');

  return (
    <div
      className="fixed z-30 transition-all duration-300 ease-out select-none"
      style={{
        bottom: isCollapsed ? '-280px' : '16px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: 'min(960px, 94vw)',
      }}
    >
      {/* Drawer Toggle Header Button */}
      <div className="flex justify-center mb-1">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="flex items-center gap-2 px-4 py-1.5 text-xs font-mono-code uppercase tracking-wider text-amber-200/90 bg-[#0c1017]/90 border border-amber-500/30 rounded-t-lg hover:bg-amber-950/40 hover:border-amber-400/60 transition-colors shadow-lg cursor-pointer"
          title="Toggle Dock (H)"
        >
          {isCollapsed ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          <span>{isCollapsed ? 'Show Architect Console [H]' : 'Hide Dock / Cinema Mode [H]'}</span>
        </button>
      </div>

      {/* Main Glassmorphic Dock Container */}
      <div className="bg-[#080b11]/95 border border-amber-500/25 rounded-2xl p-3 shadow-2xl backdrop-blur-none text-slate-200">
        {/* Navigation Tabs Bar */}
        <div className="flex items-center justify-between border-b border-amber-500/20 pb-2 mb-3">
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => setActiveTab('arena')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-mono-code uppercase rounded-md transition-all cursor-pointer ${
                activeTab === 'arena'
                  ? 'bg-amber-600/30 text-amber-300 border border-amber-500/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <Layers size={13} />
              <span>5 Katman Arena</span>
            </button>

            <button
              onClick={() => setActiveTab('cymatics')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-mono-code uppercase rounded-md transition-all cursor-pointer ${
                activeTab === 'cymatics'
                  ? 'bg-amber-600/30 text-amber-300 border border-amber-500/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <Waves size={13} />
              <span>Cymatics Fizik</span>
            </button>

            <button
              onClick={() => setActiveTab('combat')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-mono-code uppercase rounded-md transition-all cursor-pointer ${
                activeTab === 'combat'
                  ? 'bg-amber-600/30 text-amber-300 border border-amber-500/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <Zap size={13} />
              <span>Akustik Silahlar</span>
            </button>

            <button
              onClick={() => setActiveTab('acoustic')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-mono-code uppercase rounded-md transition-all cursor-pointer ${
                activeTab === 'acoustic'
                  ? 'bg-amber-600/30 text-amber-300 border border-amber-500/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <Radio size={13} />
              <span>Işın İzleme & Ses</span>
            </button>
          </div>

          {/* Quick Utility Toggles */}
          <div className="flex items-center gap-2">
            {/* Zero-UI mode toggle */}
            <button
              onClick={onToggleZeroUi}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono-code rounded-md border transition-colors cursor-pointer ${
                zeroUiMode
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                  : 'bg-slate-900 border-slate-700 text-slate-300'
              }`}
              title="Toggle Zero-UI Diegetic Immersion"
            >
              {zeroUiMode ? <EyeOff size={13} /> : <Eye size={13} />}
              <span className="hidden sm:inline">{zeroUiMode ? 'Zero-UI: Aktif' : 'Zero-UI: Kapalı'}</span>
            </button>

            {/* Camera View Switch */}
            <button
              onClick={onToggleCameraMode}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono-code bg-slate-900 border border-slate-700 hover:border-amber-500/40 text-slate-300 rounded-md transition-colors cursor-pointer"
              title="Kamera Modu (Follow / Free Orbit)"
            >
              <Compass size={13} />
              <span className="hidden sm:inline">{cameraMode === 'follow' ? 'Takip Kamerası' : 'Serbest Kamera'}</span>
            </button>
          </div>
        </div>

        {/* Tab 1: Arenas */}
        {activeTab === 'arena' && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {ARENA_DEFINITIONS.map((arena) => (
              <button
                key={arena.id}
                onClick={() => onSelectArena(arena.id)}
                className={`flex flex-col text-left p-2 rounded-lg border transition-all cursor-pointer ${
                  currentArenaId === arena.id
                    ? 'bg-amber-950/40 border-amber-400/70 text-amber-200 shadow-md'
                    : 'bg-[#10141d]/70 border-slate-800 hover:border-amber-600/30 text-slate-300'
                }`}
              >
                <div className="text-[10px] font-mono-code text-amber-400/80 uppercase">
                  Katman {arena.id}
                </div>
                <div className="text-xs font-semibold truncate text-slate-100">{arena.nameTr}</div>
                <div className="text-[10px] text-slate-400 line-clamp-1">{arena.name}</div>
              </button>
            ))}
          </div>
        )}

        {/* Tab 2: Cymatics Modals */}
        {activeTab === 'cymatics' && (
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-mono-code">
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Mod (m, n):</span>
              {[
                { m: 2, n: 3, label: 'm=2, n=3' },
                { m: 3, n: 5, label: 'm=3, n=5' },
                { m: 4, n: 4, label: 'm=4, n=4' },
                { m: 5, n: 7, label: 'm=5, n=7' },
                { m: 6, n: 6, label: 'm=6, n=6' },
              ].map((item) => (
                <button
                  key={item.label}
                  onClick={() => onChangeCymatics(item.m, item.n, cymaticsFreq)}
                  className={`px-2.5 py-1 rounded border text-[11px] transition-colors cursor-pointer ${
                    cymaticsM === item.m && cymaticsN === item.n
                      ? 'bg-amber-600/40 border-amber-400 text-amber-200'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-400">Frekans (Hz):</span>
              {[220, 432, 528, 640, 880].map((hz) => (
                <button
                  key={hz}
                  onClick={() => onChangeCymatics(cymaticsM, cymaticsN, hz)}
                  className={`px-2.5 py-1 rounded border text-[11px] transition-colors cursor-pointer ${
                    cymaticsFreq === hz
                      ? 'bg-cyan-900/40 border-cyan-400 text-cyan-200'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {hz} Hz
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Combat Actions */}
        {activeTab === 'combat' && (
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <button
                onClick={onTriggerBladeSlash}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-900/30 border border-amber-500/50 hover:bg-amber-800/40 text-amber-200 rounded-lg font-mono-code transition-colors cursor-pointer"
              >
                <Sparkles size={14} />
                <span>Diyapazon Darbesi [Sol Tık]</span>
              </button>

              <button
                onClick={onTriggerSubBass}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-950/40 border border-orange-500/50 hover:bg-orange-900/40 text-orange-200 rounded-lg font-mono-code transition-colors cursor-pointer"
              >
                <Waves size={14} />
                <span>Bas Topu / Şok Dalgası [Sağ Tık]</span>
              </button>

              <button
                onClick={onTriggerEchoDash}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-950/40 border border-cyan-500/50 hover:bg-cyan-900/40 text-cyan-200 rounded-lg font-mono-code transition-colors cursor-pointer"
              >
                <Radio size={14} />
                <span>Yankı Işınlanması (Echo Dash) [Shift]</span>
              </button>
            </div>

            {lockedFrequency && (
              <div className="flex items-center gap-2 px-3 py-1 bg-amber-950/60 border border-amber-400/50 rounded-lg font-mono-code text-xs text-amber-300">
                <span>Kilitli Frekans:</span>
                <span className="font-bold text-amber-100">{lockedFrequency} Hz</span>
                <span className="text-[10px] text-amber-400/70">(Bas Topu ile Parçala!)</span>
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Ray-Traced Acoustics & Master Audio */}
        {activeTab === 'acoustic' && (
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-mono-code">
            <div className="flex items-center gap-3">
              <button
                onClick={onToggleRayBundles}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-colors cursor-pointer ${
                  showRayBundles
                    ? 'bg-amber-900/30 border-amber-400 text-amber-200'
                    : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}
              >
                <Radio size={14} />
                <span>GPU Işın İzleme Demetleri ({showRayBundles ? 'Açık' : 'Kapalı'})</span>
              </button>

              <button
                onClick={onTriggerOrganChord}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 border border-slate-700 hover:border-amber-400 text-slate-300 rounded-lg transition-colors cursor-pointer"
              >
                <Music size={14} />
                <span>Org & Çan Akordu Çal</span>
              </button>
            </div>

            {/* Volume & Harmonic Concordance */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-slate-400">Armoni Uyumu:</span>
                <div className="w-20 h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                  <div
                    className="h-full bg-gradient-to-r from-amber-600 to-cyan-400 transition-all duration-300"
                    style={{ width: `${Math.round(harmonicClarity * 100)}%` }}
                  />
                </div>
                <span className="text-amber-300">{Math.round(harmonicClarity * 100)}%</span>
              </div>

              <div className="flex items-center gap-2">
                {volume > 0 ? (
                  <Volume2 size={15} className="text-amber-400" />
                ) : (
                  <VolumeX size={15} className="text-slate-500" />
                )}
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={volume}
                  onChange={(e) => onChangeVolume(parseFloat(e.target.value))}
                  className="w-20 accent-amber-500 cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
