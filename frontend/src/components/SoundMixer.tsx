import { useState, useEffect, useCallback } from 'react';
import { Volume2, VolumeX, Square, Sliders, Trash2, Play, Pause, Music } from 'lucide-react';
import { audioService } from '@/services/audioService';
import { soundService } from '@/services/soundService';
import { soundDefinitions } from '@/data/mockData';
import { useSoundPresets, useSettings, updateSoundPreferences } from '@/hooks/useAppData';
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
  const [showMixer, setShowMixer] = useState(false);
  const [showSavePreset, setShowSavePreset] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');
  const [presetToDelete, setPresetToDelete] = useState<string | null>(null);
  
  // Subscribe to audioService state changes
  const [, setAudioStateVersion] = useState(0);

  useEffect(() => {
    const unsubscribe = audioService.subscribe(() => {
      setAudioStateVersion((v) => v + 1);
    });
    return unsubscribe;
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
        // Sync to settings
        const updatedSounds = Array.from(next);
        updateSoundPreferences({ enabledSounds: updatedSounds });
        return next;
      });
    } else {
      audioService.play(soundId, vol);
      setEnabledSounds((prev) => {
        const next = new Set(prev).add(soundId);
        // Sync to settings
        const updatedSounds = Array.from(next);
        updateSoundPreferences({ enabledSounds: updatedSounds });
        return next;
      });
      if (!volumes[soundId]) {
        setVolumes((prev) => ({ ...prev, [soundId]: defaultVol }));
      }
    }
  }, [volumes]);

  const setVolume = useCallback((soundId: SoundId, vol: number) => {
    setVolumes((prev) => {
      const updated = { ...prev, [soundId]: vol };
      // Sync to settings
      updateSoundPreferences({ soundVolumes: updated });
      return updated;
    });
    audioService.setVolume(soundId, vol);
    if (vol === 0 && audioService.isPlaying(soundId)) {
      audioService.pause(soundId);
      setEnabledSounds((prev) => {
        const next = new Set(prev);
        next.delete(soundId);
        // Sync to settings
        const updatedSounds = Array.from(next);
        updateSoundPreferences({ enabledSounds: updatedSounds });
        return next;
      });
    } else if (vol > 0 && !audioService.isPlaying(soundId) && enabledSounds.has(soundId)) {
      audioService.play(soundId, vol);
    }
  }, [enabledSounds]);

  const handleMasterVolume = (vol: number) => {
    audioService.setMasterVolume(vol);
    updateSoundPreferences({ masterVolume: vol });
  };

  const toggleMute = () => {
    if (audioService.isMuted()) {
      audioService.unmuteAll();
    } else {
      audioService.muteAll();
    }
  };

  const stopAll = () => {
    audioService.stopAll();
    setEnabledSounds(new Set());
    // Clear selectedPreset when stopping all
    updateSoundPreferences({
      enabledSounds: [],
      selectedPreset: undefined,
    });
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
    // Sync to settings: update selectedPreset and the sound config
    updateSoundPreferences({
      selectedPreset: presetId,
      enabledSounds: Array.from(newEnabled),
      soundVolumes: newVols,
    });
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

  const handleDeletePreset = async (presetId: string) => {
    await soundService.deletePreset(presetId);
    setPresetToDelete(null);
    toast('Preset deleted', 'success');
  };

  const enabledCount = enabledSounds.size;

  // Handlers for Now Playing player section
  const handlePlayPause = () => {
    const hasPlaying = audioService.hasAnyPlaying();
    if (hasPlaying) {
      audioService.pauseAll();
    } else if (enabledSounds.size > 0) {
      for (const soundId of enabledSounds) {
        const vol = volumes[soundId] ?? 50;
        audioService.play(soundId, vol);
      }
    }
  };

  const handleToggleMute = () => {
    toggleMute();
  };

  if (compact) {
    return (
      <>
        <button onClick={() => setShowMixer(true)} className="btn-secondary px-3 py-1.5 text-xs md:text-sm flex items-center gap-1">
          <Sliders className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Open Mixer</span>
        </button>

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
                presets={presets}
                selectedPreset={settings.sounds.selectedPreset}
                onToggle={toggleSound}
                onVolume={setVolume}
                onMasterVolume={handleMasterVolume}
                onMute={toggleMute}
                onStopAll={stopAll}
                onApplyPreset={applyPreset}
                onPlayPause={handlePlayPause}
                showSavePreset={showSavePreset}
                setShowSavePreset={setShowSavePreset}
                newPresetName={newPresetName}
                setNewPresetName={setNewPresetName}
                onSavePreset={handleSavePreset}
                presetToDelete={presetToDelete}
                setPresetToDelete={setPresetToDelete}
                onDeletePreset={handleDeletePreset}
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
          <button onClick={toggleMute} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700" aria-label={audioService.isMuted() ? 'Unmute' : 'Mute'}>
            {audioService.isMuted() ? <VolumeX className="w-4 h-4 text-danger" /> : <Volume2 className="w-4 h-4 text-primary dark:text-primary-300" />}
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
        presets={presets}
        selectedPreset={settings.sounds.selectedPreset}
        onToggle={toggleSound}
        onVolume={setVolume}
        onMasterVolume={handleMasterVolume}
        onMute={toggleMute}
        onStopAll={stopAll}
        onApplyPreset={applyPreset}
        onPlayPause={handlePlayPause}
        showSavePreset={showSavePreset}
        setShowSavePreset={setShowSavePreset}
        newPresetName={newPresetName}
        setNewPresetName={setNewPresetName}
        onSavePreset={handleSavePreset}
        presetToDelete={presetToDelete}
        setPresetToDelete={setPresetToDelete}
        onDeletePreset={handleDeletePreset}
      />
    </div>
  );
}

// Shared content for both inline and modal mixer
function MixerContent({
  soundDefinitions,
  enabledSounds,
  volumes,
  presets,
  selectedPreset,
  onToggle,
  onVolume,
  onMasterVolume,
  onMute,
  onStopAll,
  onApplyPreset,
  onPlayPause,
  showSavePreset,
  setShowSavePreset,
  newPresetName,
  setNewPresetName,
  onSavePreset,
  presetToDelete,
  setPresetToDelete,
  onDeletePreset,
}: {
  soundDefinitions: typeof import('@/data/mockData').soundDefinitions;
  enabledSounds: Set<SoundId>;
  volumes: Record<string, number>;
  presets: typeof import('@/data/mockData').mockSoundPresets;
  selectedPreset?: string;
  onToggle: (id: SoundId) => void;
  onVolume: (id: SoundId, vol: number) => void;
  onMasterVolume: (vol: number) => void;
  onMute: () => void;
  onStopAll: () => void;
  onApplyPreset: (id: string) => void;
  onPlayPause: () => void;
  showSavePreset: boolean;
  setShowSavePreset: (v: boolean) => void;
  newPresetName: string;
  setNewPresetName: (v: string) => void;
  onSavePreset: () => void;
  presetToDelete: string | null;
  setPresetToDelete: (v: string | null) => void;
  onDeletePreset: (id: string) => void;
}) {
  const categories = ['music', 'nature', 'ambient', 'noise'] as const;
  const categoryLabels: Record<string, string> = { music: 'Music', nature: 'Nature', ambient: 'Ambient', noise: 'Noise' };

  // Get current display name for Now Playing
  const getPresetDisplayName = (): string => {
    if (selectedPreset) {
      const preset = presets.find((p) => p.id === selectedPreset);
      if (preset) return preset.name;
    }
    if (enabledSounds.size > 0) {
      return Array.from(enabledSounds).join(' + ');
    }
    return 'No sound selected';
  };

  // Check if any sound is currently playing
  const isAnyPlaying = audioService.hasAnyPlaying();

  return (
    <div>
      {/* Now Playing Section */}
      <div className="mb-6 pb-6 border-b border-slate-200 dark:border-slate-700">
        <h3 className="text-xs font-medium text-ink-muted dark:text-slate-400 mb-3 uppercase tracking-wide">Now Playing</h3>
        <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Music className="w-5 h-5 text-primary dark:text-primary-300" />
            <span className="text-sm font-semibold text-ink dark:text-slate-200">
              {getPresetDisplayName()}
            </span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onPlayPause}
              className="btn-secondary px-3 py-1.5 text-xs flex items-center gap-1 flex-1"
              aria-label={isAnyPlaying ? 'Pause' : 'Play'}
            >
              {isAnyPlaying ? (
                <>
                  <Pause className="w-3.5 h-3.5" />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" />
                  <span>Play</span>
                </>
              )}
            </button>
            <button
              onClick={onMute}
              className="btn-secondary px-3 py-1.5 text-xs flex items-center gap-1"
              aria-label={audioService.isMuted() ? 'Unmute' : 'Mute'}
            >
              {audioService.isMuted() ? (
                <VolumeX className="w-3.5 h-3.5" />
              ) : (
                <Volume2 className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>
      </div>
      {/* Master volume */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-medium text-ink-muted dark:text-slate-400">Master Volume</span>
          <div className="flex gap-1">
            <button onClick={onMute} className="text-xs text-ink-muted hover:text-primary dark:hover:text-primary-300">
              {audioService.isMuted() ? 'Unmute' : 'Mute'}
            </button>
            <span className="text-xs text-ink-muted">|</span>
            <button onClick={onStopAll} className="text-xs text-ink-muted hover:text-danger dark:hover:text-red-400">Stop All</button>
          </div>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          value={audioService.getMasterVolume()}
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
            <div key={preset.id} className="relative group">
              <button
                onClick={() => onApplyPreset(preset.id)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-700 text-ink-muted dark:text-slate-300 hover:bg-primary-50 hover:text-primary dark:hover:bg-primary/15 dark:hover:text-primary-300 transition-colors"
              >
                {preset.name}
              </button>
              {/* Delete button for custom presets */}
              {!preset.isBuiltIn && (
                <button
                  onClick={() => setPresetToDelete(preset.id)}
                  className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-danger hover:bg-red-600 text-white rounded-full p-1"
                  aria-label={`Delete preset: ${preset.name}`}
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
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

      {/* Delete preset confirmation modal */}
      {presetToDelete && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-surface-card dark:bg-surface-dark-card rounded-2xl p-6 max-w-sm w-full shadow-lg">
            <h3 className="text-lg font-semibold text-ink dark:text-slate-100 mb-2">Delete Preset?</h3>
            <p className="text-sm text-ink-muted dark:text-slate-400 mb-6">
              Are you sure you want to delete this preset? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setPresetToDelete(null)}
                className="btn-ghost flex-1 py-2 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onDeletePreset(presetToDelete);
                }}
                className="btn-danger flex-1 py-2 text-sm"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
