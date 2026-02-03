import mongoose, { Schema } from 'mongoose';
import { IHotel } from '../types';

const hotelSchema = new Schema<IHotel>(
  {
    name: {
      type: String,
      required: [true, 'Hotel name is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
    },
    address: {
      type: String,
      required: [true, 'Address is required'],
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
    },
    country: {
      type: String,
      required: [true, 'Country is required'],
      trim: true,
      default: 'Việt Nam',
    },
    images: {
      type: [String],
      default: [],
    },
    amenities: {
      type: [String],
      default: [],
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    totalReviews: {
      type: Number,
      default: 0,
    },
    priceRange: {
      min: {
        type: Number,
        default: 0,
      },
      max: {
        type: Number,
        default: 0,
      },
    },
    policies: {
      checkIn: {
        type: String,
        default: '14:00',
      },
      checkOut: {
        type: String,
        default: '12:00',
      },
      cancellation: {
        type: String,
        default: 'Miễn phí hủy phòng trước 24 giờ',
      },
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

// Index for search
hotelSchema.index({ name: 'text', city: 'text', address: 'text' });
hotelSchema.index({ city: 1, 'priceRange.min': 1, rating: -1 });
hotelSchema.index({ createdAt: -1 });
hotelSchema.index({ isActive: 1 });

const Hotel = mongoose.model<IHotel>('Hotel', hotelSchema);

export default Hotel;
