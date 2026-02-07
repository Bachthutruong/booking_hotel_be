import mongoose, { Schema } from 'mongoose';
import { IServiceCategory } from '../types';

const serviceCategorySchema = new Schema<IServiceCategory>(
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

serviceCategorySchema.index({ order: 1 });
serviceCategorySchema.index({ isActive: 1 });

const ServiceCategory = mongoose.model<IServiceCategory>('ServiceCategory', serviceCategorySchema);

export default ServiceCategory;
