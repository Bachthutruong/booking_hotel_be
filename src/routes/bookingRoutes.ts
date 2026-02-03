import { Router } from 'express';
import {
  getBookings,
  getBooking,
  createBooking,
  createBookingAdmin,
  cancelBooking,
  updateBookingStatus,
  uploadPaymentProof,
  approveBooking,
  checkInBooking,
  addServiceToBooking,
  getBookingBill,
  checkoutBooking,
  payWithWallet,
  getInvoice,
} from '../controllers/bookingController';
import { protect, authorize } from '../middleware/auth';

const router = Router();

router.use(protect);

router.get('/', getBookings);
router.post('/', createBooking);
router.post('/admin', authorize('admin'), createBookingAdmin);

router.get('/:id', getBooking);
router.get('/:id/bill', getBookingBill);
router.get('/:id/invoice', getInvoice);
router.put('/:id/cancel', cancelBooking);
router.put('/:id/proof', uploadPaymentProof);
router.post('/:id/services', addServiceToBooking);
router.post('/:id/pay-wallet', payWithWallet);

// Admin only
router.put('/:id/status', authorize('admin'), updateBookingStatus);
router.put('/:id/approve', authorize('admin'), approveBooking);
router.put('/:id/checkin', authorize('admin'), checkInBooking);
router.post('/:id/checkout', authorize('admin'), checkoutBooking);

export default router;