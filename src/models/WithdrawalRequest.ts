import mongoose, { Schema } from 'mongoose';
import { IWithdrawalRequest } from '../types';
import crypto from 'crypto';

const withdrawalRequestSchema = new Schema<IWithdrawalRequest>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [1000, 'Minimum withdrawal is 1000 VND'],
    },
    bankInfo: {
      bankName: {
        type: String,
        required: [true, 'Bank name is required'],
      },
      accountNumber: {
        type: String,
        required: [true, 'Account number is required'],
      },
      accountName: {
        type: String,
        required: [true, 'Account name is required'],
      },
    },
    status: {
      type: String,
      enum: ['pending', 'pending_confirmation', 'approved', 'rejected', 'completed'],
      default: 'pending',
    },
    adminNote: {
      type: String,
    },
    processedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    processedAt: {
      type: Date,
    },
    adminSignature: {
      type: String,
    },
    isAdminCreated: {
      type: Boolean,
      default: false,
    },
    // New fields for confirmation flow
    confirmationToken: {
      type: String,
      unique: true,
      sparse: true,
    },
    userSignature: {
      type: String,
    },
    confirmedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
withdrawalRequestSchema.index({ user: 1, createdAt: -1 });
withdrawalRequestSchema.index({ status: 1 });
withdrawalRequestSchema.index({ createdAt: -1 });
withdrawalRequestSchema.index({ confirmationToken: 1 });

const WithdrawalRequest = mongoose.model<IWithdrawalRequest>('WithdrawalRequest', withdrawalRequestSchema);

export default WithdrawalRequest;
