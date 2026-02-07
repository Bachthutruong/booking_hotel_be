import mongoose, { Schema } from 'mongoose';
import { INotification } from '../types';

const notificationSchema = new Schema<INotification>(
  {
    type: {
      type: String,
      required: true,
      enum: ['booking_service_added', 'booking_created_with_services'],
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    read: {
      type: Boolean,
      default: false,
    },
    recipientRole: {
      type: String,
      default: 'admin',
      enum: ['admin'],
    },
    referenceType: {
      type: String,
      enum: ['Booking'],
    },
    referenceId: {
      type: Schema.Types.ObjectId,
      ref: 'Booking',
    },
  },
  {
    timestamps: true,
  }
);

notificationSchema.index({ recipientRole: 1, read: 1 });
notificationSchema.index({ createdAt: -1 });

const Notification = mongoose.model<INotification>('Notification', notificationSchema);

export default Notification;
