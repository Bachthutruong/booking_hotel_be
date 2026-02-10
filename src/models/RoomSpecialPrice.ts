import mongoose, { Schema } from 'mongoose';
import { IRoomSpecialPrice } from '../types';

const roomSpecialPriceSchema = new Schema<IRoomSpecialPrice>(
  {
    name: {
      type: String,
      required: [true, 'Tên rule là bắt buộc'],
      trim: true,
    },
    rooms: [{
      type: Schema.Types.ObjectId,
      ref: 'Room',
      required: true,
    }],
    type: {
      type: String,
      enum: ['date_range', 'weekend'],
      required: [true, 'Loại rule là bắt buộc'],
    },
    startDate: {
      type: Date,
      required: function (this: IRoomSpecialPrice) {
        return this.type === 'date_range';
      },
    },
    endDate: {
      type: Date,
      required: function (this: IRoomSpecialPrice) {
        return this.type === 'date_range';
      },
    },
    modifierType: {
      type: String,
      enum: ['percentage', 'fixed'],
      required: [true, 'Loại điều chỉnh giá là bắt buộc'],
    },
    modifierValue: {
      type: Number,
      required: [true, 'Giá trị điều chỉnh là bắt buộc'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

roomSpecialPriceSchema.index({ rooms: 1, type: 1, isActive: 1 });
roomSpecialPriceSchema.index({ type: 1, startDate: 1, endDate: 1 });

const RoomSpecialPrice = mongoose.model<IRoomSpecialPrice>('RoomSpecialPrice', roomSpecialPriceSchema);

export default RoomSpecialPrice;
