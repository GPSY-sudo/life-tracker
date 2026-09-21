import mongoose from 'mongoose';

const soundPreferenceSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  masterVolume: { type: Number, default: 70 },
  enabledSounds: [{ type: String }],
  soundVolumes: {
    type: Map,
    of: Number,
    default: {}
  },
  selectedPreset: { type: String, default: 'preset-rainy-focus' },
  customPresets: [{
    id: { type: String, required: true },
    name: { type: String, required: true },
    sounds: {
      type: Map,
      of: Number,
      required: true
    }
  }]
}, {
  timestamps: true,
  toJSON: {
    transform: (doc, ret) => {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      delete ret.userId;
      
      if (ret.soundVolumes && ret.soundVolumes instanceof Map) {
        ret.soundVolumes = Object.fromEntries(ret.soundVolumes);
      }
      
      // Convert custom presets: convert Map to Object for each preset's sounds
      if (ret.customPresets && Array.isArray(ret.customPresets)) {
        ret.customPresets = ret.customPresets.map((preset) => ({
          id: preset.id,
          name: preset.name,
          sounds: preset.sounds instanceof Map ? Object.fromEntries(preset.sounds) : preset.sounds
        }));
      }
    }
  }
});

const SoundPreference = mongoose.model('SoundPreference', soundPreferenceSchema);
export default SoundPreference;
