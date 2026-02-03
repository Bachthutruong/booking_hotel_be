import mongoose, { Schema } from 'mongoose';
import { IPromotionConfig } from '../types';

const promotionConfigSchema = new Schema<IPromotionConfig>(
  {
    hotel: {
      type: Schema.Types.ObjectId,
      ref: 'Hotel',
    },
    room: {
      type: Schema.Types.ObjectId,
      ref: 'Room',
    },
    name: {
      type: String,
      required: [true, 'Promotion name is required'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    depositAmount: {
      type: Number,
      required: [true, 'Deposit amount is required'],
      min: 0,
    },
    bonusAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    bonusPercent: {
      type: Number,
      min: 0,
      max: 100,
    },
    minDeposit: {
      type: Number,
      min: 0,
    },
    maxBonus: {
      type: Number,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    startDate: {
      type: Date,
    },
    endDate: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
promotionConfigSchema.index({ hotel: 1 });
promotionConfigSchema.index({ room: 1 });
promotionConfigSchema.index({ isActive: 1 });
promotionConfigSchema.index({ depositAmount: 1 });
promotionConfigSchema.index({ startDate: 1, endDate: 1 });

const PromotionConfig = mongoose.model<IPromotionConfig>('PromotionConfig', promotionConfigSchema);

export default PromotionConfig;
