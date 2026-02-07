import { Router } from 'express';
import {
  getBookings,
  getBooking,
  createBooking,
  createBookingAdmin,
  cancelBooking,
  updateBookingStatus,
  uploadPaymentProof,
  uploadProofFile,
  approveBooking,
  checkInBooking,
  addServiceToBooking,
  markServiceDelivered,
  markAllServicesDelivered,
  getBookingBill,
  checkoutBooking,
  payWithWallet,
  payDepositFromWallet,
  getInvoice,
} from '../controllers/bookingController';
import { upload } from '../controllers/uploadController';
import { protect, authorize, optionalAuth } from '../middleware/auth';

const router = Router();

// Đặt phòng không bắt buộc đăng nhập: guest điền thông tin, backend tìm/tạo user theo email+phone
router.post('/', optionalAuth, createBooking);

// Các route sau yêu cầu đăng nhập
router.get('/', protect, getBookings);
router.post('/admin', protect, authorize('admin'), createBookingAdmin);

router.get('/:id', protect, getBooking);
router.get('/:id/bill', protect, getBookingBill);
router.get('/:id/invoice', protect, getInvoice);
router.put('/:id/cancel', protect, cancelBooking);
router.put('/:id/proof', protect, uploadPaymentProof);
// Upload minh chứng bằng file — không cần đăng nhập (khách có link thanh toán)
router.post('/:id/upload-proof', upload.single('image'), uploadProofFile);
router.post('/:id/services', protect, addServiceToBooking);
router.patch('/:id/services/deliver', protect, authorize('admin'), markServiceDelivered);
router.patch('/:id/services/deliver-all', protect, authorize('admin'), markAllServicesDelivered);
router.post('/:id/pay-wallet', protect, payWithWallet);
router.post('/:id/pay-deposit-wallet', protect, payDepositFromWallet);

// Admin only
router.put('/:id/status', protect, authorize('admin'), updateBookingStatus);
router.put('/:id/approve', protect, authorize('admin'), approveBooking);
router.put('/:id/checkin', protect, authorize('admin'), checkInBooking);
router.post('/:id/checkout', protect, authorize('admin'), checkoutBooking);

export default router;