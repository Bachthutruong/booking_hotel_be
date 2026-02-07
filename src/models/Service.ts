import mongoose, { Schema } from 'mongoose';
import { IService } from '../types';

const serviceSchema = new Schema<IService>(
  {
    category: {
      type: Schema.Types.ObjectId,
      ref: 'ServiceCategory',
    },
    name: {
      type: String,
      required: [true, 'Service name is required'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: 0,
    },
    icon: {
      type: String,
    },
    qrCode: {
      type: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    requiresConfirmation: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const Service = mongoose.model<IService>('Service', serviceSchema);

export default Service;
