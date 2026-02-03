import mongoose, { Schema } from 'mongoose';
import { ISystemConfig } from '../types';

const systemConfigSchema = new Schema<ISystemConfig>(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    value: {
      type: Schema.Types.Mixed,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const SystemConfig = mongoose.model<ISystemConfig>('SystemConfig', systemConfigSchema);

export default SystemConfig;
