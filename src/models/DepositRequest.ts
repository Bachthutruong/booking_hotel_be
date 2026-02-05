import mongoose, { Schema } from 'mongoose';
import { IDepositRequest } from '../types';

const depositRequestSchema = new Schema<IDepositRequest>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [1000, 'Minimum deposit is 1000 VND'],
    },
    bonusAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    proofImage: {
      type: String,
      default: '',
    },
    bankInfo: {
      bankName: {
        type: String,
        required: true,
      },
      accountNumber: {
        type: String,
        required: true,
      },
      accountName: {
        type: String,
        required: true,
      },
      transferContent: {
        type: String,
        required: true,
      },
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    adminNote: {
      type: String,
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    approvedAt: {
      type: Date,
    },
    adminSignature: {
      type: String,
    },
    isAdminCreated: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
depositRequestSchema.index({ user: 1, createdAt: -1 });
depositRequestSchema.index({ status: 1 });
depositRequestSchema.index({ createdAt: -1 });

const DepositRequest = mongoose.model<IDepositRequest>('DepositRequest', depositRequestSchema);

export default DepositRequest;
