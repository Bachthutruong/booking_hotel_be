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
router.put('/:id/cancel', bookingController_1.cancelBooking);
router.put('/:id/proof', bookingController_1.uploadPaymentProof);
// Admin only
router.put('/:id/status', (0, auth_1.authorize)('admin'), bookingController_1.updateBookingStatus);
router.put('/:id/approve', (0, auth_1.authorize)('admin'), bookingController_1.approveBooking);
exports.default = router;
//# sourceMappingURL=bookingRoutes.js.map