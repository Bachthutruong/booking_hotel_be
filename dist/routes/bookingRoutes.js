"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bookingController_1 = require("../controllers/bookingController");
const uploadController_1 = require("../controllers/uploadController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Đặt phòng không bắt buộc đăng nhập: guest điền thông tin, backend tìm/tạo user theo email+phone
router.post('/', auth_1.optionalAuth, bookingController_1.createBooking);
// Các route sau yêu cầu đăng nhập
router.get('/', auth_1.protect, bookingController_1.getBookings);
router.post('/admin', auth_1.protect, (0, auth_1.authorize)('admin', 'staff'), bookingController_1.createBookingAdmin);
router.get('/:id', auth_1.protect, bookingController_1.getBooking);
router.get('/:id/bill', auth_1.protect, bookingController_1.getBookingBill);
router.get('/:id/invoice', auth_1.protect, bookingController_1.getInvoice);
router.put('/:id/cancel', auth_1.protect, bookingController_1.cancelBooking);
router.put('/:id/proof', auth_1.protect, bookingController_1.uploadPaymentProof);
// Upload minh chứng bằng file — không cần đăng nhập (khách có link thanh toán)
router.post('/:id/upload-proof', uploadController_1.upload.single('image'), bookingController_1.uploadProofFile);
router.post('/:id/services', auth_1.protect, bookingController_1.addServiceToBooking);
router.patch('/:id/services/deliver', auth_1.protect, (0, auth_1.authorize)('admin', 'staff'), bookingController_1.markServiceDelivered);
router.patch('/:id/services/deliver-all', auth_1.protect, (0, auth_1.authorize)('admin', 'staff'), bookingController_1.markAllServicesDelivered);
router.post('/:id/pay-wallet', auth_1.protect, bookingController_1.payWithWallet);
router.post('/:id/pay-deposit-wallet', auth_1.protect, bookingController_1.payDepositFromWallet);
// Admin & staff
router.put('/:id/status', auth_1.protect, (0, auth_1.authorize)('admin', 'staff'), bookingController_1.updateBookingStatus);
router.put('/:id/approve', auth_1.protect, (0, auth_1.authorize)('admin', 'staff'), bookingController_1.approveBooking);
router.put('/:id/checkin', auth_1.protect, (0, auth_1.authorize)('admin', 'staff'), bookingController_1.checkInBooking);
router.post('/:id/checkout', auth_1.protect, (0, auth_1.authorize)('admin', 'staff'), bookingController_1.checkoutBooking);
exports.default = router;
//# sourceMappingURL=bookingRoutes.js.map