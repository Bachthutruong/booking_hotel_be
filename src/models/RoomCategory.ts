import mongoose, { Schema } from 'mongoose';
import { IRoomCategory } from '../types';

const roomCategorySchema = new Schema<IRoomCategory>(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      trim: true,
      unique: true,
    },
    description: {
      type: String,
      default: '',
    },
    icon: {
      type: String,
    },
    order: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
roomCategorySchema.index({ order: 1 });
roomCategorySchema.index({ isActive: 1 });
roomCategorySchema.index({ name: 'text' });

const RoomCategory = mongoose.model<IRoomCategory>('RoomCategory', roomCategorySchema);

export default RoomCategory;
