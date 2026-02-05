"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const walletController_1 = require("../controllers/walletController");
const router = express_1.default.Router();
// User routes
router.get('/balance', auth_1.protect, walletController_1.getWalletBalance);
router.get('/transactions', auth_1.protect, walletController_1.getTransactionHistory);
router.post('/deposit', auth_1.protect, walletController_1.createDepositRequest);
router.get('/deposit/my', auth_1.protect, walletController_1.getMyDepositRequests);
router.post('/withdrawal', auth_1.protect, walletController_1.createWithdrawalRequest);
router.get('/withdrawal/my', auth_1.protect, walletController_1.getMyWithdrawalRequests);
// Withdrawal confirmation routes (user)
router.get('/withdrawal/token/:token', auth_1.protect, walletController_1.getWithdrawalByToken);
router.post('/withdrawal/confirm/:token', auth_1.protect, walletController_1.confirmWithdrawal);
router.get('/withdrawal/:id', auth_1.protect, walletController_1.getWithdrawalDetail);
// Admin routes
router.get('/admin/deposits', auth_1.protect, (0, auth_1.authorize)('admin'), walletController_1.getAllDepositRequests);
router.put('/admin/deposits/:id', auth_1.protect, (0, auth_1.authorize)('admin'), walletController_1.processDepositRequest);
router.post('/admin/deposits/create', auth_1.protect, (0, auth_1.authorize)('admin'), walletController_1.adminCreateDeposit);
router.get('/admin/withdrawals', auth_1.protect, (0, auth_1.authorize)('admin'), walletController_1.getAllWithdrawalRequests);
router.put('/admin/withdrawals/:id', auth_1.protect, (0, auth_1.authorize)('admin'), walletController_1.processWithdrawalRequest);
router.post('/admin/withdrawals/create', auth_1.protect, (0, auth_1.authorize)('admin'), walletController_1.adminCreateWithdrawal);
router.get('/admin/users', auth_1.protect, (0, auth_1.authorize)('admin'), walletController_1.getAllUsersWallet);
router.get('/admin/users/:userId', auth_1.protect, (0, auth_1.authorize)('admin'), walletController_1.getUserWalletDetails);
router.get('/admin/transactions', auth_1.protect, (0, auth_1.authorize)('admin'), walletController_1.getAllTransactions);
exports.default = router;
//# sourceMappingURL=walletRoutes.js.map