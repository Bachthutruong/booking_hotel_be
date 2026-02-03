import mongoose, { Schema } from 'mongoose';
import { IRoom } from '../types';

const roomSchema = new Schema<IRoom>(
  {
    hotel: {
      type: Schema.Types.ObjectId,
      ref: 'Hotel',
      required: [true, 'Hotel is required'],
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: 'RoomCategory',
    },
    name: {
      type: String,
      required: [true, 'Room name is required'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    type: {
      type: String,
      enum: ['standard', 'deluxe', 'suite', 'villa'],
      default: 'standard',
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: 0,
    },
    capacity: {
      adults: {
        type: Number,
        default: 2,
        min: 1,
      },
      children: {
        type: Number,
        default: 0,
        min: 0,
      },
    },
    size: {
      type: Number,
      default: 25,
    },
    bedType: {
      type: String,
      default: '1 giường đôi',
    },
    images: {
      type: [String],
      default: [],
    },
    amenities: {
      type: [String],
      default: [],
    },
    quantity: {
      type: Number,
      default: 1,
      min: 0,
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

// Index
roomSchema.index({ hotel: 1, isActive: 1 });
roomSchema.index({ price: 1 });
roomSchema.index({ type: 1 });
roomSchema.index({ createdAt: -1 });

const Room = mongoose.model<IRoom>('Room', roomSchema);

export default Room;
