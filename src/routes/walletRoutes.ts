import express from 'express';
import { protect, authorize } from '../middleware/auth';
import {
  getWalletBalance,
  getTransactionHistory,
  createDepositRequest,
  getMyDepositRequests,
  createWithdrawalRequest,
  getMyWithdrawalRequests,
  getAllDepositRequests,
  processDepositRequest,
  getAllWithdrawalRequests,
  processWithdrawalRequest,
  getAllUsersWallet,
  getUserWalletDetails,
  getAllTransactions,
  adminCreateDeposit,
  adminCreateWithdrawal,
  getWithdrawalByToken,
  confirmWithdrawal,
  getWithdrawalDetail,
} from '../controllers/walletController';

const router = express.Router();

// User routes
router.get('/balance', protect, getWalletBalance);
router.get('/transactions', protect, getTransactionHistory);
router.post('/deposit', protect, createDepositRequest);
router.get('/deposit/my', protect, getMyDepositRequests);
router.post('/withdrawal', protect, createWithdrawalRequest);
router.get('/withdrawal/my', protect, getMyWithdrawalRequests);

// Withdrawal confirmation routes (user)
router.get('/withdrawal/token/:token', protect, getWithdrawalByToken);
router.post('/withdrawal/confirm/:token', protect, confirmWithdrawal);
router.get('/withdrawal/:id', protect, getWithdrawalDetail);

// Admin routes
router.get('/admin/deposits', protect, authorize('admin'), getAllDepositRequests);
router.put('/admin/deposits/:id', protect, authorize('admin'), processDepositRequest);
router.post('/admin/deposits/create', protect, authorize('admin'), adminCreateDeposit);
router.get('/admin/withdrawals', protect, authorize('admin'), getAllWithdrawalRequests);
router.put('/admin/withdrawals/:id', protect, authorize('admin'), processWithdrawalRequest);
router.post('/admin/withdrawals/create', protect, authorize('admin'), adminCreateWithdrawal);
router.get('/admin/users', protect, authorize('admin'), getAllUsersWallet);
router.get('/admin/users/:userId', protect, authorize('admin'), getUserWalletDetails);
router.get('/admin/transactions', protect, authorize('admin'), getAllTransactions);

export default router;
