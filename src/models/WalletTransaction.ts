import mongoose, { Schema } from 'mongoose';
import { IWalletTransaction } from '../types';

const walletTransactionSchema = new Schema<IWalletTransaction>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
    },
    type: {
      type: String,
      enum: ['deposit', 'withdrawal', 'payment', 'refund', 'bonus'],
      required: [true, 'Transaction type is required'],
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: 0,
    },
    balanceBefore: {
      type: Number,
      required: true,
      default: 0,
    },
    balanceAfter: {
      type: Number,
      required: true,
      default: 0,
    },
    bonusBalanceBefore: {
      type: Number,
      default: 0,
    },
    bonusBalanceAfter: {
      type: Number,
      default: 0,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
    },
    reference: {
      type: Schema.Types.ObjectId,
      refPath: 'referenceModel',
    },
    referenceModel: {
      type: String,
      enum: ['Booking', 'DepositRequest', 'WithdrawalRequest'],
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'completed'],
      default: 'completed',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
walletTransactionSchema.index({ user: 1, createdAt: -1 });
walletTransactionSchema.index({ type: 1 });
walletTransactionSchema.index({ status: 1 });
walletTransactionSchema.index({ createdAt: -1 });

const WalletTransaction = mongoose.model<IWalletTransaction>('WalletTransaction', walletTransactionSchema);

export default WalletTransaction;
