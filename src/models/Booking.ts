import mongoose, { Schema } from 'mongoose';
import { IBooking } from '../types';

const bookingSchema = new Schema<IBooking>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
    },
    hotel: {
      type: Schema.Types.ObjectId,
      ref: 'Hotel',
      required: [true, 'Hotel is required'],
    },
    room: {
      type: Schema.Types.ObjectId,
      ref: 'Room',
      required: [true, 'Room is required'],
    },
    checkIn: {
      type: Date,
      required: [true, 'Check-in date is required'],
    },
    checkOut: {
      type: Date,
      required: [true, 'Check-out date is required'],
    },
    actualCheckIn: {
      type: Date,
    },
    actualCheckOut: {
      type: Date,
    },
    guests: {
      adults: {
        type: Number,
        required: true,
        min: 1,
      },
      children: {
        type: Number,
        default: 0,
        min: 0,
      },
    },
    roomPrice: {
      type: Number,
      default: 0,
      min: 0,
    },
    servicePrice: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalPrice: {
      type: Number,
      required: [true, 'Total price is required'],
      min: 0,
    },
    estimatedPrice: {
      type: Number,
      default: 0,
      min: 0,
    },
    finalPrice: {
      type: Number,
      min: 0,
    },
    paidFromWallet: {
      type: Number,
      default: 0,
      min: 0,
    },
    paidFromBonus: {
      type: Number,
      default: 0,
      min: 0,
    },
    services: [
      {
        service: {
          type: Schema.Types.ObjectId,
          ref: 'Service',
        },
        quantity: {
          type: Number,
          default: 1,
        },
        price: {
          type: Number,
          required: true,
        },
        addedAt: {
          type: Date,
          default: Date.now,
        },
        deliveredAt: {
          type: Date,
        },
      },
    ],
    proofImage: {
      type: String,
    },
    status: {
      type: String,
      enum: ['pending', 'pending_deposit', 'awaiting_approval', 'confirmed', 'cancelled', 'completed'],
      default: 'pending_deposit',
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'refunded'],
      default: 'pending',
    },
    paymentMethod: {
      type: String,
      enum: ['bank_transfer', 'wallet', 'cash'],
      default: 'bank_transfer',
    },
    paymentOption: {
      type: String,
      enum: ['use_bonus', 'use_main_only'],
    },
    invoiceNumber: {
      type: String,
    },
    checkoutNote: {
      type: String,
    },
    specialRequests: {
      type: String,
      default: '',
    },
    contactInfo: {
      fullName: {
        type: String,
        required: [true, 'Contact name is required'],
      },
      email: {
        type: String,
        required: [true, 'Contact email is required'],
      },
      phone: {
        type: String,
        required: [true, 'Contact phone is required'],
      },
    },
  },
  {
    timestamps: true,
  }
);

// Index
bookingSchema.index({ user: 1, createdAt: -1 });
bookingSchema.index({ hotel: 1, checkIn: 1, checkOut: 1 });
bookingSchema.index({ room: 1, checkIn: 1, checkOut: 1 });
bookingSchema.index({ status: 1 });
bookingSchema.index({ createdAt: -1 });

const Booking = mongoose.model<IBooking>('Booking', bookingSchema);

export default Booking;
