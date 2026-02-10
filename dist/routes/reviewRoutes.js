"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const reviewController_1 = require("../controllers/reviewController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.protect);
router.put('/:id', reviewController_1.updateReview);
router.delete('/:id', (0, auth_1.authorize)('admin'), reviewController_1.deleteReview);
// Admin & staff
router.get('/', (0, auth_1.authorize)('admin', 'staff'), reviewController_1.getAllReviews);
router.put('/:id/approve', (0, auth_1.authorize)('admin', 'staff'), reviewController_1.approveReview);
exports.default = router;
//# sourceMappingURL=reviewRoutes.js.map