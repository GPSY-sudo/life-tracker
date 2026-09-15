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
  selectedPreset: { type: String, default: 'preset-rainy-focus' }
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
    }
  }
});

const SoundPreference = mongoose.model('SoundPreference', soundPreferenceSchema);
export default SoundPreference;
