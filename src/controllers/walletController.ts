import { Response } from 'express';
import mongoose from 'mongoose';
import User from '../models/User';
import WalletTransaction from '../models/WalletTransaction';
import DepositRequest from '../models/DepositRequest';
import WithdrawalRequest from '../models/WithdrawalRequest';
import PromotionConfig from '../models/PromotionConfig';
import Booking from '../models/Booking';
import { AuthRequest, ApiResponse } from '../types';

// Get wallet balance
export const getWalletBalance = async (req: AuthRequest, res: Response<ApiResponse>) => {
  try {
    const user = await User.findById(req.user!._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.json({
      success: true,
      data: {
        walletBalance: user.walletBalance,
        bonusBalance: user.bonusBalance,
        totalBalance: user.walletBalance + user.bonusBalance,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// Get transaction history
export const getTransactionHistory = async (req: AuthRequest, res: Response<ApiResponse>) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const type = req.query.type as string;
    const skip = (page - 1) * limit;

    const query: any = { user: req.user!._id };
    if (type && ['deposit', 'withdrawal', 'payment', 'refund', 'bonus'].includes(type)) {
      query.type = type;
    }

    const [transactions, total] = await Promise.all([
      WalletTransaction.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('reference'),
      WalletTransaction.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// Create deposit request
export const createDepositRequest = async (req: AuthRequest, res: Response<ApiResponse>) => {
  try {
    const { amount, proofImage, bankInfo } = req.body;

    if (!amount || amount < 10000) {
      return res.status(400).json({
        success: false,
        message: 'Minimum deposit is 10,000 VND',
      });
    }

    if (!proofImage) {
      return res.status(400).json({
        success: false,
        message: 'Payment proof image is required',
      });
    }

    // Find applicable promotion
    const now = new Date();
    const promotion = await PromotionConfig.findOne({
      isActive: true,
      depositAmount: { $lte: amount },
      $or: [
        { startDate: null, endDate: null },
        { startDate: { $lte: now }, endDate: { $gte: now } },
        { startDate: { $lte: now }, endDate: null },
        { startDate: null, endDate: { $gte: now } },
      ],
    }).sort({ depositAmount: -1 });

    let bonusAmount = 0;
    if (promotion) {
      if (promotion.bonusPercent) {
        bonusAmount = Math.floor(amount * promotion.bonusPercent / 100);
        if (promotion.maxBonus && bonusAmount > promotion.maxBonus) {
          bonusAmount = promotion.maxBonus;
        }
      } else if (promotion.bonusAmount) {
        bonusAmount = promotion.bonusAmount;
      }
    }

    const depositRequest = await DepositRequest.create({
      user: req.user!._id,
      amount,
      bonusAmount,
      proofImage,
      bankInfo,
      status: 'pending',
    });

    res.status(201).json({
      success: true,
      message: 'Deposit request created successfully. Please wait for admin approval.',
      data: depositRequest,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// Get deposit requests (user)
export const getMyDepositRequests = async (req: AuthRequest, res: Response<ApiResponse>) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as string;
    const skip = (page - 1) * limit;

    const query: any = { user: req.user!._id };
    if (status && ['pending', 'approved', 'rejected'].includes(status)) {
      query.status = status;
    }

    const [requests, total] = await Promise.all([
      DepositRequest.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      DepositRequest.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: requests,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// Create withdrawal request
export const createWithdrawalRequest = async (req: AuthRequest, res: Response<ApiResponse>) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { amount, bankInfo } = req.body;
    const user = await User.findById(req.user!._id).session(session);

    if (!user) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (!amount || amount < 10000) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: 'Minimum withdrawal is 10,000 VND',
      });
    }

    // Calculate available balance (main wallet only, not bonus)
    // Check pending payments from bookings
    const pendingBookings = await Booking.find({
      user: user._id,
      status: { $in: ['confirmed', 'pending', 'pending_deposit', 'awaiting_approval'] },
      paymentStatus: { $ne: 'paid' },
    }).session(session);

    const pendingPayments = pendingBookings.reduce((sum, booking) => sum + booking.totalPrice, 0);

    // Available balance = wallet balance - pending payments - pending withdrawals
    const pendingWithdrawals = await WithdrawalRequest.aggregate([
      {
        $match: {
          user: user._id,
          status: 'pending',
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
        },
      },
    ]).session(session);

    const pendingWithdrawalAmount = pendingWithdrawals[0]?.total || 0;
    const availableBalance = user.walletBalance - pendingPayments - pendingWithdrawalAmount;

    if (amount > availableBalance) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: `Insufficient balance. Available: ${availableBalance.toLocaleString()} VND (excluding pending payments and withdrawals)`,
      });
    }

    if (!bankInfo?.bankName || !bankInfo?.accountNumber || !bankInfo?.accountName) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: 'Bank information is required',
      });
    }

    const withdrawalRequest = await WithdrawalRequest.create([{
      user: user._id,
      amount,
      bankInfo,
      status: 'pending',
    }], { session });

    await session.commitTransaction();

    res.status(201).json({
      success: true,
      message: 'Withdrawal request created successfully. Please wait for admin approval.',
      data: withdrawalRequest[0],
    });
  } catch (error) {
    await session.abortTransaction();
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  } finally {
    session.endSession();
  }
};

// Get withdrawal requests (user)
export const getMyWithdrawalRequests = async (req: AuthRequest, res: Response<ApiResponse>) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as string;
    const skip = (page - 1) * limit;

    const query: any = { user: req.user!._id };
    if (status && ['pending', 'approved', 'rejected', 'completed'].includes(status)) {
      query.status = status;
    }

    const [requests, total] = await Promise.all([
      WithdrawalRequest.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      WithdrawalRequest.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: requests,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// ADMIN: Get all deposit requests
export const getAllDepositRequests = async (req: AuthRequest, res: Response<ApiResponse>) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as string;
    const skip = (page - 1) * limit;

    const query: any = {};
    if (status && ['pending', 'approved', 'rejected'].includes(status)) {
      query.status = status;
    }

    const [requests, total] = await Promise.all([
      DepositRequest.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('user', 'fullName email phone avatar')
        .populate('approvedBy', 'fullName'),
      DepositRequest.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: requests,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// ADMIN: Approve/Reject deposit request
export const processDepositRequest = async (req: AuthRequest, res: Response<ApiResponse>) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    const { action, adminNote } = req.body;

    if (!['approve', 'reject'].includes(action)) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: 'Invalid action',
      });
    }

    const depositRequest = await DepositRequest.findById(id).session(session);
    if (!depositRequest) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: 'Deposit request not found',
      });
    }

    if (depositRequest.status !== 'pending') {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: 'Deposit request has already been processed',
      });
    }

    depositRequest.status = action === 'approve' ? 'approved' : 'rejected';
    depositRequest.adminNote = adminNote;
    depositRequest.approvedBy = req.user!._id;
    depositRequest.approvedAt = new Date();

    await depositRequest.save({ session });

    if (action === 'approve') {
      const user = await User.findById(depositRequest.user).session(session);
      if (!user) {
        await session.abortTransaction();
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      const balanceBefore = user.walletBalance;
      const bonusBalanceBefore = user.bonusBalance;

      user.walletBalance += depositRequest.amount;
      user.bonusBalance += depositRequest.bonusAmount;
      await user.save({ session });

      // Create transaction records
      await WalletTransaction.create([{
        user: user._id,
        type: 'deposit',
        amount: depositRequest.amount,
        balanceBefore,
        balanceAfter: user.walletBalance,
        bonusBalanceBefore,
        bonusBalanceAfter: user.bonusBalance,
        description: `Nạp tiền - ${depositRequest.amount.toLocaleString()} VND`,
        reference: depositRequest._id,
        referenceModel: 'DepositRequest',
        status: 'completed',
      }], { session });

      if (depositRequest.bonusAmount > 0) {
        await WalletTransaction.create([{
          user: user._id,
          type: 'bonus',
          amount: depositRequest.bonusAmount,
          balanceBefore: user.walletBalance,
          balanceAfter: user.walletBalance,
          bonusBalanceBefore,
          bonusBalanceAfter: user.bonusBalance,
          description: `Khuyến mãi nạp tiền - ${depositRequest.bonusAmount.toLocaleString()} VND`,
          reference: depositRequest._id,
          referenceModel: 'DepositRequest',
          status: 'completed',
        }], { session });
      }
    }

    await session.commitTransaction();

    res.json({
      success: true,
      message: action === 'approve' ? 'Deposit approved successfully' : 'Deposit rejected',
      data: depositRequest,
    });
  } catch (error) {
    await session.abortTransaction();
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  } finally {
    session.endSession();
  }
};

// ADMIN: Get all withdrawal requests
export const getAllWithdrawalRequests = async (req: AuthRequest, res: Response<ApiResponse>) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as string;
    const skip = (page - 1) * limit;

    const query: any = {};
    if (status && ['pending', 'approved', 'rejected', 'completed'].includes(status)) {
      query.status = status;
    }

    const [requests, total] = await Promise.all([
      WithdrawalRequest.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('user', 'fullName email phone avatar walletBalance bonusBalance')
        .populate('processedBy', 'fullName'),
      WithdrawalRequest.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: requests,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// ADMIN: Process withdrawal request
export const processWithdrawalRequest = async (req: AuthRequest, res: Response<ApiResponse>) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    const { action, adminNote } = req.body;

    if (!['approve', 'reject', 'complete'].includes(action)) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: 'Invalid action',
      });
    }

    const withdrawalRequest = await WithdrawalRequest.findById(id).session(session);
    if (!withdrawalRequest) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: 'Withdrawal request not found',
      });
    }

    const user = await User.findById(withdrawalRequest.user).session(session);
    if (!user) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (action === 'approve' && withdrawalRequest.status !== 'pending') {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: 'Withdrawal request cannot be approved',
      });
    }

    if (action === 'complete' && withdrawalRequest.status !== 'approved') {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: 'Withdrawal request must be approved first',
      });
    }

    if (action === 'reject' && !['pending', 'approved'].includes(withdrawalRequest.status)) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: 'Withdrawal request cannot be rejected',
      });
    }

    withdrawalRequest.adminNote = adminNote;
    withdrawalRequest.processedBy = req.user!._id;
    withdrawalRequest.processedAt = new Date();

    if (action === 'approve') {
      // Check balance before approving
      if (user.walletBalance < withdrawalRequest.amount) {
        await session.abortTransaction();
        return res.status(400).json({
          success: false,
          message: 'User has insufficient balance',
        });
      }

      withdrawalRequest.status = 'approved';

      // Deduct from wallet immediately on approval
      const balanceBefore = user.walletBalance;
      user.walletBalance -= withdrawalRequest.amount;
      await user.save({ session });

      // Create transaction record
      await WalletTransaction.create([{
        user: user._id,
        type: 'withdrawal',
        amount: withdrawalRequest.amount,
        balanceBefore,
        balanceAfter: user.walletBalance,
        bonusBalanceBefore: user.bonusBalance,
        bonusBalanceAfter: user.bonusBalance,
        description: `Rút tiền - ${withdrawalRequest.amount.toLocaleString()} VND`,
        reference: withdrawalRequest._id,
        referenceModel: 'WithdrawalRequest',
        status: 'pending',
      }], { session });
    } else if (action === 'complete') {
      withdrawalRequest.status = 'completed';

      // Update transaction status
      await WalletTransaction.updateOne(
        { reference: withdrawalRequest._id, type: 'withdrawal' },
        { status: 'completed' }
      ).session(session);
    } else if (action === 'reject') {
      // If was approved, refund the amount
      if (withdrawalRequest.status === 'approved') {
        const balanceBefore = user.walletBalance;
        user.walletBalance += withdrawalRequest.amount;
        await user.save({ session });

        await WalletTransaction.create([{
          user: user._id,
          type: 'refund',
          amount: withdrawalRequest.amount,
          balanceBefore,
          balanceAfter: user.walletBalance,
          bonusBalanceBefore: user.bonusBalance,
          bonusBalanceAfter: user.bonusBalance,
          description: `Hoàn tiền yêu cầu rút - ${withdrawalRequest.amount.toLocaleString()} VND`,
          reference: withdrawalRequest._id,
          referenceModel: 'WithdrawalRequest',
          status: 'completed',
        }], { session });
      }
      withdrawalRequest.status = 'rejected';
    }

    await withdrawalRequest.save({ session });
    await session.commitTransaction();

    res.json({
      success: true,
      message: `Withdrawal request ${action}d successfully`,
      data: withdrawalRequest,
    });
  } catch (error) {
    await session.abortTransaction();
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  } finally {
    session.endSession();
  }
};

// ADMIN: Get all users wallet info
export const getAllUsersWallet = async (req: AuthRequest, res: Response<ApiResponse>) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;
    const skip = (page - 1) * limit;

    const query: any = { role: 'user' };
    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    const [users, total] = await Promise.all([
      User.find(query)
        .select('fullName email phone avatar walletBalance bonusBalance isActive createdAt')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// ADMIN: Get user wallet details
export const getUserWalletDetails = async (req: AuthRequest, res: Response<ApiResponse>) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const user = await User.findById(userId).select('fullName email phone avatar walletBalance bonusBalance');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const [transactions, total] = await Promise.all([
      WalletTransaction.find({ user: userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      WalletTransaction.countDocuments({ user: userId }),
    ]);

    res.json({
      success: true,
      data: {
        user,
        transactions,
      },
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// ADMIN: Get all transactions
export const getAllTransactions = async (req: AuthRequest, res: Response<ApiResponse>) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const type = req.query.type as string;
    const userId = req.query.userId as string;
    const skip = (page - 1) * limit;

    const query: any = {};
    if (type && ['deposit', 'withdrawal', 'payment', 'refund', 'bonus'].includes(type)) {
      query.type = type;
    }
    if (userId) {
      query.user = userId;
    }

    const [transactions, total] = await Promise.all([
      WalletTransaction.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('user', 'fullName email phone avatar'),
      WalletTransaction.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};
