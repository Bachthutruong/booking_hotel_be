"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const dashboardController_1 = require("../controllers/dashboardController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.protect, (0, auth_1.authorize)('admin'));
router.get('/stats', dashboardController_1.getStats);
router.get('/revenue', dashboardController_1.getRevenueByMonth);
router.get('/bookings-chart', dashboardController_1.getBookingsChart);
router.get('/recent-bookings', dashboardController_1.getRecentBookings);
router.get('/top-hotels', dashboardController_1.getTopHotels);
exports.default = router;
//# sourceMappingURL=dashboardRoutes.js.map