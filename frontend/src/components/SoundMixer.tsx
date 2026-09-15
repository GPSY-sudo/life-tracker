import { useState, useEffect, useCallback } from 'react';
import { Volume2, VolumeX, Square, Sliders } from 'lucide-react';
import { audioService } from '@/services/audioService';
import { soundService } from '@/services/soundService';
import { soundDefinitions } from '@/data/mockData';
import { useSoundPresets, useSettings } from '@/hooks/useAppData';
import { useToast } from '@/hooks/useToast';
import type { SoundId } from '@/types';

interface SoundMixerProps {
  compact?: boolean;
}

export function SoundMixer({ compact = false }: SoundMixerProps) {
  const toast = useToast();
  const presets = useSoundPresets();
  const settings = useSettings();
  const [enabledSounds, setEnabledSounds] = useState<Set<SoundId>>(new Set());
  const [volumes, setVolumes] = useState<Record<string, number>>({});
  const [masterVolume, setMasterVolume] = useState(settings.sounds.masterVolume);
  const [muted, setMuted] = useState(false);
  const [showMixer, setShowMixer] = useState(false);
  const [showSavePreset, setShowSavePreset] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');

  useEffect(() => {
    setMasterVolume(settings.sounds.masterVolume);
  audioService.setMasterVolume(settings.sounds.masterVolume);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleSound = useCallback((soundId: SoundId) => {
    const defaultVol = 50;
    const vol = volumes[soundId] ?? defaultVol;
    const isPlaying = audioService.isPlaying(soundId);

    if (isPlaying) {
      audioService.stop(soundId);
      setEnabledSounds((prev) => {
        const next = new Set(prev);
        next.delete(soundId);
        return next;
      });
    } else {
      audioService.play(soundId, vol);
      setEnabledSounds((prev) => new Set(prev).add(soundId));
      if (!volumes[soundId]) {
        setVolumes((prev) => ({ ...prev, [soundId]: defaultVol }));
      }
    }
  }, [volumes]);

  const setVolume = useCallback((soundId: SoundId, vol: number) => {
    setVolumes((prev) => ({ ...prev, [soundId]: vol }));
    audioService.setVolume(soundId, vol);
    if (vol === 0 && audioService.isPlaying(soundId)) {
      audioService.pause(soundId);
      setEnabledSounds((prev) => {
        const next = new Set(prev);
        next.delete(soundId);
        return next;
      });
    } else if (vol > 0 && !audioService.isPlaying(soundId) && enabledSounds.has(soundId)) {
      audioService.play(soundId, vol);
    }
  }, [enabledSounds]);

  const handleMasterVolume = (vol: number) => {
    setMasterVolume(vol);
    audioService.setMasterVolume(vol);
  };

  const toggleMute = () => {
    if (muted) {
      audioService.unmuteAll();
      setMuted(false);
    } else {
      audioService.muteAll();
      setMuted(true);
    }
  };

  const stopAll = () => {
    audioService.stopAll();
    setEnabledSounds(new Set());
  };

  const applyPreset = (presetId: string) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) return;
    audioService.stopAll();
    setEnabledSounds(new Set());
    const newVols: Record<string, number> = {};
    const newEnabled = new Set<SoundId>();
    for (const [soundId, vol] of Object.entries(preset.sounds)) {
      audioService.play(soundId as SoundId, vol);
      newVols[soundId] = vol;
      newEnabled.add(soundId as SoundId);
    }
    setVolumes(newVols);
    setEnabledSounds(newEnabled);
    toast(`Applied preset: ${preset.name}`, 'success');
  };

  const handleSavePreset = async () => {
    if (!newPresetName.trim()) return;
    const soundsObj: Record<string, number> = {};
    for (const soundId of enabledSounds) {
      soundsObj[soundId] = volumes[soundId] ?? 50;
    }
    await soundService.createPreset(newPresetName.trim(), soundsObj);
    setNewPresetName('');
    setShowSavePreset(false);
    toast('Preset saved', 'success');
  };

  const enabledCount = enabledSounds.size;

  if (compact) {
    return (
      <>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-primary dark:text-primary-300" />
            <span className="text-sm font-medium text-ink dark:text-slate-200">
              {enabledCount > 0 ? `${enabledCount} sound${enabledCount > 1 ? 's' : ''} on` : 'Sounds off'}
            </span>
          </div>
          <button onClick={() => setShowMixer(true)} className="btn-secondary px-3 py-2 text-sm">
            <Sliders className="w-4 h-4" /> Open Mixer
          </button>
        </div>

        {/* Mixer Modal/Drawer */}
        {showMixer && (
          <div className="fixed inset-0 z-50 bg-black/40 animate-fade-in" onClick={() => setShowMixer(false)}>
            <div
              className="absolute bottom-0 left-0 right-0 max-h-[85vh] bg-surface-card dark:bg-surface-dark-card rounded-t-2xl p-5 animate-slide-up overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-ink dark:text-slate-100">Sound Mixer</h3>
                <button onClick={() => setShowMixer(false)} className="btn-ghost px-3 py-1.5 text-sm">Close</button>
              </div>
              <MixerContent
                soundDefinitions={soundDefinitions}
                enabledSounds={enabledSounds}
                volumes={volumes}
                masterVolume={masterVolume}
                muted={muted}
                presets={presets}
                onToggle={toggleSound}
                onVolume={setVolume}
                onMasterVolume={handleMasterVolume}
                onMute={toggleMute}
                onStopAll={stopAll}
                onApplyPreset={applyPreset}
                showSavePreset={showSavePreset}
                setShowSavePreset={setShowSavePreset}
                newPresetName={newPresetName}
                setNewPresetName={setNewPresetName}
                onSavePreset={handleSavePreset}
              />
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-ink dark:text-slate-200">Focus Sounds</h3>
        <div className="flex gap-1">
          <button onClick={toggleMute} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700" aria-label={muted ? 'Unmute' : 'Mute'}>
            {muted ? <VolumeX className="w-4 h-4 text-danger" /> : <Volume2 className="w-4 h-4 text-primary dark:text-primary-300" />}
          </button>
          <button onClick={stopAll} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700" aria-label="Stop all">
            <Square className="w-4 h-4 text-ink-muted dark:text-slate-400" />
          </button>
        </div>
      </div>
      <MixerContent
        soundDefinitions={soundDefinitions}
        enabledSounds={enabledSounds}
        volumes={volumes}
        masterVolume={masterVolume}
        muted={muted}
        presets={presets}
        onToggle={toggleSound}
        onVolume={setVolume}
        onMasterVolume={handleMasterVolume}
        onMute={toggleMute}
        onStopAll={stopAll}
        onApplyPreset={applyPreset}
        showSavePreset={showSavePreset}
        setShowSavePreset={setShowSavePreset}
        newPresetName={newPresetName}
        setNewPresetName={setNewPresetName}
        onSavePreset={handleSavePreset}
      />
    </div>
  );
}

// Shared content for both inline and modal mixer
function MixerContent({
  soundDefinitions,
  enabledSounds,
  volumes,
  masterVolume,
  muted,
  presets,
  onToggle,
  onVolume,
  onMasterVolume,
  onMute,
  onStopAll,
  onApplyPreset,
  showSavePreset,
  setShowSavePreset,
  newPresetName,
  setNewPresetName,
  onSavePreset,
}: {
  soundDefinitions: typeof import('@/data/mockData').soundDefinitions;
  enabledSounds: Set<SoundId>;
  volumes: Record<string, number>;
  masterVolume: number;
  muted: boolean;
  presets: typeof import('@/data/mockData').mockSoundPresets;
  onToggle: (id: SoundId) => void;
  onVolume: (id: SoundId, vol: number) => void;
  onMasterVolume: (vol: number) => void;
  onMute: () => void;
  onStopAll: () => void;
  onApplyPreset: (id: string) => void;
  showSavePreset: boolean;
  setShowSavePreset: (v: boolean) => void;
  newPresetName: string;
  setNewPresetName: (v: string) => void;
  onSavePreset: () => void;
}) {
  const categories = ['music', 'nature', 'ambient', 'noise'] as const;
  const categoryLabels: Record<string, string> = { music: 'Music', nature: 'Nature', ambient: 'Ambient', noise: 'Noise' };

  return (
    <div>
      {/* Master volume */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-medium text-ink-muted dark:text-slate-400">Master Volume</span>
          <div className="flex gap-1">
            <button onClick={onMute} className="text-xs text-ink-muted hover:text-primary dark:hover:text-primary-300">
              {muted ? 'Unmute' : 'Mute'}
            </button>
            <span className="text-xs text-ink-muted">|</span>
            <button onClick={onStopAll} className="text-xs text-ink-muted hover:text-danger dark:hover:text-red-400">Stop All</button>
          </div>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          value={masterVolume}
          onChange={(e) => onMasterVolume(Number(e.target.value))}
          className="w-full"
          aria-label="Master volume"
        />
      </div>

      {/* Presets */}
      <div className="mb-4">
        <span className="text-xs font-medium text-ink-muted dark:text-slate-400 mb-1.5 block">Presets</span>
        <div className="flex flex-wrap gap-1.5">
          {presets.map((preset) => (
            <button
              key={preset.id}
              onClick={() => onApplyPreset(preset.id)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-700 text-ink-muted dark:text-slate-300 hover:bg-primary-50 hover:text-primary dark:hover:bg-primary/15 dark:hover:text-primary-300 transition-colors"
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      {/* Sound categories */}
      {categories.map((cat) => {
        const sounds = soundDefinitions.filter((s) => s.category === cat);
        if (sounds.length === 0) return null;
        return (
          <div key={cat} className="mb-4">
            <span className="text-xs font-medium text-ink-muted dark:text-slate-400 mb-2 block">{categoryLabels[cat]}</span>
            <div className="grid grid-cols-2 gap-2">
              {sounds.map((sound) => {
                const isEnabled = enabledSounds.has(sound.id);
                const vol = volumes[sound.id] ?? 50;
                return (
                  <div
                    key={sound.id}
                    className={`rounded-xl p-3 border transition-colors ${
                      isEnabled
                        ? 'border-primary bg-primary-50 dark:bg-primary/10'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50'
                    }`}
                  >
                    <button
                      onClick={() => onToggle(sound.id)}
                      className="flex items-center gap-2 w-full mb-2"
                    >
                      <span className="text-lg">{sound.icon}</span>
                      <span className={`text-sm font-medium flex-1 text-left ${isEnabled ? 'text-ink dark:text-slate-200' : 'text-ink-muted dark:text-slate-400'}`}>
                        {sound.label}
                      </span>
                      <div className={`w-9 h-5 rounded-full transition-colors ${isEnabled ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-600'} relative`}>
                        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${isEnabled ? 'translate-x-4' : 'translate-x-0.5'}`} />
                      </div>
                    </button>
                    {isEnabled && (
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min={0}
                          max={100}
                          value={vol}
                          onChange={(e) => onVolume(sound.id, Number(e.target.value))}
                          className="flex-1"
                          aria-label={`${sound.label} volume`}
                        />
                        <span className="text-xs text-ink-muted dark:text-slate-400 w-8 text-right">{vol}%</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Save preset */}
      {enabledSounds.size > 0 && (
        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
          {showSavePreset ? (
            <div className="flex gap-2">
              <input
                type="text"
                className="input flex-1"
                placeholder="Preset name"
                value={newPresetName}
                onChange={(e) => setNewPresetName(e.target.value)}
                autoFocus
              />
              <button onClick={onSavePreset} className="btn-primary px-4 py-2 text-sm">Save</button>
              <button onClick={() => setShowSavePreset(false)} className="btn-ghost px-3 py-2 text-sm">Cancel</button>
            </div>
          ) : (
            <button onClick={() => setShowSavePreset(true)} className="btn-secondary w-full py-2 text-sm">
              Save Current Mix as Preset
            </button>
          )}
        </div>
      )}
    </div>
  );
}
