"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWithdrawalDetail = exports.confirmWithdrawal = exports.getWithdrawalByToken = exports.adminCreateWithdrawal = exports.adminCreateDeposit = exports.getAllTransactions = exports.getUserWalletDetails = exports.getAllUsersWallet = exports.processWithdrawalRequest = exports.getAllWithdrawalRequests = exports.processDepositRequest = exports.getAllDepositRequests = exports.getMyWithdrawalRequests = exports.createWithdrawalRequest = exports.getMyDepositRequests = exports.createDepositRequest = exports.getTransactionHistory = exports.getWalletBalance = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const User_1 = __importDefault(require("../models/User"));
const WalletTransaction_1 = __importDefault(require("../models/WalletTransaction"));
const DepositRequest_1 = __importDefault(require("../models/DepositRequest"));
const WithdrawalRequest_1 = __importDefault(require("../models/WithdrawalRequest"));
const PromotionConfig_1 = __importDefault(require("../models/PromotionConfig"));
const Booking_1 = __importDefault(require("../models/Booking"));
// Get wallet balance
const getWalletBalance = async (req, res) => {
    try {
        const user = await User_1.default.findById(req.user._id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }
        // Calculate pending payments from active bookings (same logic as createWithdrawalRequest)
        const pendingBookings = await Booking_1.default.find({
            user: user._id,
            status: { $in: ['confirmed', 'pending', 'pending_deposit', 'awaiting_approval'] },
            paymentStatus: { $ne: 'paid' },
        });
        const pendingPayments = pendingBookings.reduce((sum, booking) => sum + booking.totalPrice, 0);
        // Calculate pending withdrawal amounts
        const pendingWithdrawals = await WithdrawalRequest_1.default.aggregate([
            { $match: { user: user._id, status: 'pending' } },
            { $group: { _id: null, total: { $sum: '$amount' } } },
        ]);
        const pendingWithdrawalAmount = pendingWithdrawals[0]?.total || 0;
        const availableBalance = user.walletBalance - pendingPayments - pendingWithdrawalAmount;
        res.json({
            success: true,
            data: {
                walletBalance: user.walletBalance,
                bonusBalance: user.bonusBalance,
                totalBalance: user.walletBalance + user.bonusBalance,
                availableBalance,
                pendingPayments,
                pendingWithdrawalAmount,
            },
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
        });
    }
};
exports.getWalletBalance = getWalletBalance;
// Get transaction history
const getTransactionHistory = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const type = req.query.type;
        const skip = (page - 1) * limit;
        const query = { user: req.user._id };
        if (type && ['deposit', 'withdrawal', 'payment', 'refund', 'bonus'].includes(type)) {
            query.type = type;
        }
        const [transactions, total] = await Promise.all([
            WalletTransaction_1.default.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate('reference'),
            WalletTransaction_1.default.countDocuments(query),
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
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
        });
    }
};
exports.getTransactionHistory = getTransactionHistory;
// Create deposit request
const createDepositRequest = async (req, res) => {
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
        const promotion = await PromotionConfig_1.default.findOne({
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
            }
            else if (promotion.bonusAmount) {
                bonusAmount = promotion.bonusAmount;
            }
        }
        const depositRequest = await DepositRequest_1.default.create({
            user: req.user._id,
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
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
        });
    }
};
exports.createDepositRequest = createDepositRequest;
// Get deposit requests (user)
const getMyDepositRequests = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const status = req.query.status;
        const skip = (page - 1) * limit;
        const query = { user: req.user._id };
        if (status && ['pending', 'approved', 'rejected'].includes(status)) {
            query.status = status;
        }
        const [requests, total] = await Promise.all([
            DepositRequest_1.default.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            DepositRequest_1.default.countDocuments(query),
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
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
        });
    }
};
exports.getMyDepositRequests = getMyDepositRequests;
// Create withdrawal request
const createWithdrawalRequest = async (req, res) => {
    const session = await mongoose_1.default.startSession();
    session.startTransaction();
    try {
        const { amount, bankInfo } = req.body;
        const user = await User_1.default.findById(req.user._id).session(session);
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
        const pendingBookings = await Booking_1.default.find({
            user: user._id,
            status: { $in: ['confirmed', 'pending', 'pending_deposit', 'awaiting_approval'] },
            paymentStatus: { $ne: 'paid' },
        }).session(session);
        const pendingPayments = pendingBookings.reduce((sum, booking) => sum + booking.totalPrice, 0);
        // Available balance = wallet balance - pending payments - pending withdrawals
        const pendingWithdrawals = await WithdrawalRequest_1.default.aggregate([
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
        const withdrawalRequest = await WithdrawalRequest_1.default.create([{
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
    }
    catch (error) {
        await session.abortTransaction();
        res.status(500).json({
            success: false,
            message: 'Server error',
        });
    }
    finally {
        session.endSession();
    }
};
exports.createWithdrawalRequest = createWithdrawalRequest;
// Get withdrawal requests (user)
const getMyWithdrawalRequests = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const status = req.query.status;
        const skip = (page - 1) * limit;
        const query = { user: req.user._id };
        if (status && ['pending', 'approved', 'rejected', 'completed'].includes(status)) {
            query.status = status;
        }
        const [requests, total] = await Promise.all([
            WithdrawalRequest_1.default.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            WithdrawalRequest_1.default.countDocuments(query),
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
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
        });
    }
};
exports.getMyWithdrawalRequests = getMyWithdrawalRequests;
// ADMIN: Get all deposit requests
const getAllDepositRequests = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const status = req.query.status;
        const skip = (page - 1) * limit;
        const query = {};
        if (status && ['pending', 'approved', 'rejected'].includes(status)) {
            query.status = status;
        }
        const [requests, total] = await Promise.all([
            DepositRequest_1.default.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate('user', 'fullName email phone avatar')
                .populate('approvedBy', 'fullName'),
            DepositRequest_1.default.countDocuments(query),
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
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
        });
    }
};
exports.getAllDepositRequests = getAllDepositRequests;
// ADMIN: Approve/Reject deposit request
const processDepositRequest = async (req, res) => {
    const session = await mongoose_1.default.startSession();
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
        const depositRequest = await DepositRequest_1.default.findById(id).session(session);
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
        depositRequest.approvedBy = req.user._id;
        depositRequest.approvedAt = new Date();
        await depositRequest.save({ session });
        if (action === 'approve') {
            const user = await User_1.default.findById(depositRequest.user).session(session);
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
            await WalletTransaction_1.default.create([{
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
                await WalletTransaction_1.default.create([{
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
    }
    catch (error) {
        await session.abortTransaction();
        res.status(500).json({
            success: false,
            message: 'Server error',
        });
    }
    finally {
        session.endSession();
    }
};
exports.processDepositRequest = processDepositRequest;
// ADMIN: Get all withdrawal requests
const getAllWithdrawalRequests = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const status = req.query.status;
        const skip = (page - 1) * limit;
        const query = {};
        if (status && ['pending', 'approved', 'rejected', 'completed'].includes(status)) {
            query.status = status;
        }
        const [requests, total] = await Promise.all([
            WithdrawalRequest_1.default.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate('user', 'fullName email phone avatar walletBalance bonusBalance')
                .populate('processedBy', 'fullName'),
            WithdrawalRequest_1.default.countDocuments(query),
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
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
        });
    }
};
exports.getAllWithdrawalRequests = getAllWithdrawalRequests;
// ADMIN: Process withdrawal request
const processWithdrawalRequest = async (req, res) => {
    const session = await mongoose_1.default.startSession();
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
        const withdrawalRequest = await WithdrawalRequest_1.default.findById(id).session(session);
        if (!withdrawalRequest) {
            await session.abortTransaction();
            return res.status(404).json({
                success: false,
                message: 'Withdrawal request not found',
            });
        }
        const user = await User_1.default.findById(withdrawalRequest.user).session(session);
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
        withdrawalRequest.processedBy = req.user._id;
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
            await WalletTransaction_1.default.create([{
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
        }
        else if (action === 'complete') {
            withdrawalRequest.status = 'completed';
            // Update transaction status
            await WalletTransaction_1.default.updateOne({ reference: withdrawalRequest._id, type: 'withdrawal' }, { status: 'completed' }).session(session);
        }
        else if (action === 'reject') {
            // If was approved, refund the amount
            if (withdrawalRequest.status === 'approved') {
                const balanceBefore = user.walletBalance;
                user.walletBalance += withdrawalRequest.amount;
                await user.save({ session });
                await WalletTransaction_1.default.create([{
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
    }
    catch (error) {
        await session.abortTransaction();
        res.status(500).json({
            success: false,
            message: 'Server error',
        });
    }
    finally {
        session.endSession();
    }
};
exports.processWithdrawalRequest = processWithdrawalRequest;
// ADMIN: Get all users wallet info
const getAllUsersWallet = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search;
        const skip = (page - 1) * limit;
        const query = { role: 'user' };
        if (search) {
            query.$or = [
                { fullName: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } },
            ];
        }
        const [users, total] = await Promise.all([
            User_1.default.find(query)
                .select('fullName email phone avatar walletBalance bonusBalance isActive createdAt')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            User_1.default.countDocuments(query),
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
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
        });
    }
};
exports.getAllUsersWallet = getAllUsersWallet;
// ADMIN: Get user wallet details
const getUserWalletDetails = async (req, res) => {
    try {
        const { userId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const user = await User_1.default.findById(userId).select('fullName email phone avatar walletBalance bonusBalance');
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }
        const [transactions, total] = await Promise.all([
            WalletTransaction_1.default.find({ user: userId })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            WalletTransaction_1.default.countDocuments({ user: userId }),
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
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
        });
    }
};
exports.getUserWalletDetails = getUserWalletDetails;
// ADMIN: Get all transactions
const getAllTransactions = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const type = req.query.type;
        const userId = req.query.userId;
        const skip = (page - 1) * limit;
        const query = {};
        if (type && ['deposit', 'withdrawal', 'payment', 'refund', 'bonus'].includes(type)) {
            query.type = type;
        }
        if (userId) {
            query.user = userId;
        }
        const [transactions, total] = await Promise.all([
            WalletTransaction_1.default.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate('user', 'fullName email phone avatar'),
            WalletTransaction_1.default.countDocuments(query),
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
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
        });
    }
};
exports.getAllTransactions = getAllTransactions;
// ADMIN: Create deposit for user (admin-initiated)
const adminCreateDeposit = async (req, res) => {
    const session = await mongoose_1.default.startSession();
    session.startTransaction();
    try {
        const { userId, amount, note, signature } = req.body;
        if (!userId || !amount || amount < 1000) {
            await session.abortTransaction();
            return res.status(400).json({
                success: false,
                message: 'User ID and amount (minimum 1,000 VND) are required',
            });
        }
        if (!signature) {
            await session.abortTransaction();
            return res.status(400).json({
                success: false,
                message: 'Digital signature is required for this transaction',
            });
        }
        const user = await User_1.default.findById(userId).session(session);
        if (!user) {
            await session.abortTransaction();
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }
        // Find applicable promotion
        const now = new Date();
        const promotion = await PromotionConfig_1.default.findOne({
            isActive: true,
            depositAmount: { $lte: amount },
            $or: [
                { startDate: null, endDate: null },
                { startDate: { $lte: now }, endDate: { $gte: now } },
                { startDate: { $lte: now }, endDate: null },
                { startDate: null, endDate: { $gte: now } },
            ],
        }).sort({ depositAmount: -1 }).session(session);
        let bonusAmount = 0;
        if (promotion) {
            if (promotion.bonusPercent) {
                bonusAmount = Math.floor(amount * promotion.bonusPercent / 100);
                if (promotion.maxBonus && bonusAmount > promotion.maxBonus) {
                    bonusAmount = promotion.maxBonus;
                }
            }
            else if (promotion.bonusAmount) {
                bonusAmount = promotion.bonusAmount;
            }
        }
        // Create deposit request with approved status
        const depositRequest = await DepositRequest_1.default.create([{
                user: userId,
                amount,
                bonusAmount,
                proofImage: '',
                bankInfo: {
                    bankName: 'Admin',
                    accountNumber: 'N/A',
                    accountName: req.user.fullName || 'Admin',
                    transferContent: `Admin deposit - ${note || 'No note'}`,
                },
                status: 'approved',
                adminNote: note,
                approvedBy: req.user._id,
                approvedAt: new Date(),
                adminSignature: signature,
                isAdminCreated: true,
            }], { session });
        const balanceBefore = user.walletBalance;
        const bonusBalanceBefore = user.bonusBalance;
        user.walletBalance += amount;
        user.bonusBalance += bonusAmount;
        await user.save({ session });
        // Create transaction records
        await WalletTransaction_1.default.create([{
                user: user._id,
                type: 'deposit',
                amount: amount,
                balanceBefore,
                balanceAfter: user.walletBalance,
                bonusBalanceBefore,
                bonusBalanceAfter: user.bonusBalance,
                description: `Nạp tiền bởi Admin - ${amount.toLocaleString()} VND${note ? ` (${note})` : ''}`,
                reference: depositRequest[0]._id,
                referenceModel: 'DepositRequest',
                status: 'completed',
            }], { session });
        if (bonusAmount > 0) {
            await WalletTransaction_1.default.create([{
                    user: user._id,
                    type: 'bonus',
                    amount: bonusAmount,
                    balanceBefore: user.walletBalance,
                    balanceAfter: user.walletBalance,
                    bonusBalanceBefore,
                    bonusBalanceAfter: user.bonusBalance,
                    description: `Khuyến mãi nạp tiền - ${bonusAmount.toLocaleString()} VND`,
                    reference: depositRequest[0]._id,
                    referenceModel: 'DepositRequest',
                    status: 'completed',
                }], { session });
        }
        await session.commitTransaction();
        res.status(201).json({
            success: true,
            message: `Successfully deposited ${amount.toLocaleString()} VND for user ${user.fullName}`,
            data: depositRequest[0],
        });
    }
    catch (error) {
        await session.abortTransaction();
        console.error('Admin create deposit error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
        });
    }
    finally {
        session.endSession();
    }
};
exports.adminCreateDeposit = adminCreateDeposit;
// ADMIN: Create withdrawal for user (admin-initiated) - Creates pending confirmation request
const adminCreateWithdrawal = async (req, res) => {
    const session = await mongoose_1.default.startSession();
    session.startTransaction();
    try {
        const { userId, amount, note, bankInfo } = req.body;
        if (!userId || !amount || amount < 1000) {
            await session.abortTransaction();
            return res.status(400).json({
                success: false,
                message: 'User ID and amount (minimum 1,000 VND) are required',
            });
        }
        const user = await User_1.default.findById(userId).session(session);
        if (!user) {
            await session.abortTransaction();
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }
        if (user.walletBalance < amount) {
            await session.abortTransaction();
            return res.status(400).json({
                success: false,
                message: `Insufficient balance. User wallet: ${user.walletBalance.toLocaleString()} VND`,
            });
        }
        // Generate confirmation token
        const crypto = require('crypto');
        const confirmationToken = crypto.randomBytes(32).toString('hex');
        // Create withdrawal request with pending_confirmation status
        const withdrawalRequest = await WithdrawalRequest_1.default.create([{
                user: userId,
                amount,
                bankInfo: bankInfo || {
                    bankName: 'Cash',
                    accountNumber: 'N/A',
                    accountName: user.fullName || 'User',
                },
                status: 'pending_confirmation',
                adminNote: note,
                processedBy: req.user._id,
                processedAt: new Date(),
                isAdminCreated: true,
                confirmationToken,
            }], { session });
        await session.commitTransaction();
        res.status(201).json({
            success: true,
            message: `Withdrawal request created. Waiting for user confirmation.`,
            data: {
                ...withdrawalRequest[0].toObject(),
                confirmationUrl: `/withdraw/confirm/${confirmationToken}`,
            },
        });
    }
    catch (error) {
        await session.abortTransaction();
        console.error('Admin create withdrawal error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
        });
    }
    finally {
        session.endSession();
    }
};
exports.adminCreateWithdrawal = adminCreateWithdrawal;
// Get withdrawal by confirmation token (for user to view before confirming)
const getWithdrawalByToken = async (req, res) => {
    try {
        const { token } = req.params;
        const withdrawal = await WithdrawalRequest_1.default.findOne({ confirmationToken: token })
            .populate('user', 'fullName email phone')
            .populate('processedBy', 'fullName');
        if (!withdrawal) {
            return res.status(404).json({
                success: false,
                message: 'Withdrawal request not found',
            });
        }
        // Check if the logged-in user is the owner
        if (withdrawal.user._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'You are not authorized to view this withdrawal request',
            });
        }
        res.json({
            success: true,
            data: withdrawal,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
        });
    }
};
exports.getWithdrawalByToken = getWithdrawalByToken;
// User confirms withdrawal with signature
const confirmWithdrawal = async (req, res) => {
    const session = await mongoose_1.default.startSession();
    session.startTransaction();
    try {
        const { token } = req.params;
        const { userSignature } = req.body;
        if (!userSignature) {
            await session.abortTransaction();
            return res.status(400).json({
                success: false,
                message: 'User signature is required',
            });
        }
        const withdrawal = await WithdrawalRequest_1.default.findOne({ confirmationToken: token }).session(session);
        if (!withdrawal) {
            await session.abortTransaction();
            return res.status(404).json({
                success: false,
                message: 'Withdrawal request not found',
            });
        }
        // Check if the logged-in user is the owner
        if (withdrawal.user.toString() !== req.user._id.toString()) {
            await session.abortTransaction();
            return res.status(403).json({
                success: false,
                message: 'You are not authorized to confirm this withdrawal',
            });
        }
        if (withdrawal.status !== 'pending_confirmation') {
            await session.abortTransaction();
            return res.status(400).json({
                success: false,
                message: 'This withdrawal request has already been processed',
            });
        }
        const user = await User_1.default.findById(withdrawal.user).session(session);
        if (!user) {
            await session.abortTransaction();
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }
        if (user.walletBalance < withdrawal.amount) {
            await session.abortTransaction();
            return res.status(400).json({
                success: false,
                message: `Insufficient balance. Your wallet: ${user.walletBalance.toLocaleString()} VND`,
            });
        }
        // Update withdrawal status
        withdrawal.status = 'completed';
        withdrawal.userSignature = userSignature;
        withdrawal.confirmedAt = new Date();
        await withdrawal.save({ session });
        // Deduct from wallet
        const balanceBefore = user.walletBalance;
        user.walletBalance -= withdrawal.amount;
        await user.save({ session });
        // Create transaction record
        await WalletTransaction_1.default.create([{
                user: user._id,
                type: 'withdrawal',
                amount: withdrawal.amount,
                balanceBefore,
                balanceAfter: user.walletBalance,
                bonusBalanceBefore: user.bonusBalance,
                bonusBalanceAfter: user.bonusBalance,
                description: `Rút tiền - ${withdrawal.amount.toLocaleString()} VND${withdrawal.adminNote ? ` (${withdrawal.adminNote})` : ''}`,
                reference: withdrawal._id,
                referenceModel: 'WithdrawalRequest',
                status: 'completed',
            }], { session });
        await session.commitTransaction();
        res.json({
            success: true,
            message: `Successfully confirmed withdrawal of ${withdrawal.amount.toLocaleString()} VND`,
            data: withdrawal,
        });
    }
    catch (error) {
        await session.abortTransaction();
        console.error('Confirm withdrawal error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
        });
    }
    finally {
        session.endSession();
    }
};
exports.confirmWithdrawal = confirmWithdrawal;
// Get withdrawal detail by ID (for both admin and user)
const getWithdrawalDetail = async (req, res) => {
    try {
        const { id } = req.params;
        const withdrawal = await WithdrawalRequest_1.default.findById(id)
            .populate('user', 'fullName email phone')
            .populate('processedBy', 'fullName');
        if (!withdrawal) {
            return res.status(404).json({
                success: false,
                message: 'Withdrawal request not found',
            });
        }
        // Check authorization: either admin or the owner
        const isAdmin = req.user.role === 'admin';
        const isOwner = withdrawal.user._id.toString() === req.user._id.toString();
        if (!isAdmin && !isOwner) {
            return res.status(403).json({
                success: false,
                message: 'You are not authorized to view this withdrawal request',
            });
        }
        res.json({
            success: true,
            data: withdrawal,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
        });
    }
};
exports.getWithdrawalDetail = getWithdrawalDetail;
//# sourceMappingURL=walletController.js.map