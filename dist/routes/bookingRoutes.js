"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bookingController_1 = require("../controllers/bookingController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.protect);
router.get('/', bookingController_1.getBookings);
router.post('/', bookingController_1.createBooking);
router.post('/admin', (0, auth_1.authorize)('admin'), bookingController_1.createBookingAdmin);
router.get('/:id', bookingController_1.getBooking);
router.get('/:id/bill', bookingController_1.getBookingBill);
router.get('/:id/invoice', bookingController_1.getInvoice);
router.put('/:id/cancel', bookingController_1.cancelBooking);
router.put('/:id/proof', bookingController_1.uploadPaymentProof);
router.post('/:id/services', bookingController_1.addServiceToBooking);
router.post('/:id/pay-wallet', bookingController_1.payWithWallet);
// Admin only
router.put('/:id/status', (0, auth_1.authorize)('admin'), bookingController_1.updateBookingStatus);
router.put('/:id/approve', (0, auth_1.authorize)('admin'), bookingController_1.approveBooking);
router.put('/:id/checkin', (0, auth_1.authorize)('admin'), bookingController_1.checkInBooking);
router.post('/:id/checkout', (0, auth_1.authorize)('admin'), bookingController_1.checkoutBooking);
exports.default = router;
//# sourceMappingURL=bookingRoutes.js.map