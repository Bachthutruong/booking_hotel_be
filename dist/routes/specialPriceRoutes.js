"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const specialPriceController_1 = require("../controllers/specialPriceController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Public: preview price for room + date range (for booking form)
router.get('/preview', specialPriceController_1.previewRoomPrice);
// Admin & staff (read/create/update); only admin can delete
router.use(auth_1.protect);
router.get('/', (0, auth_1.authorize)('admin', 'staff'), specialPriceController_1.getSpecialPrices);
router.get('/:id', (0, auth_1.authorize)('admin', 'staff'), specialPriceController_1.getSpecialPrice);
router.post('/', (0, auth_1.authorize)('admin', 'staff'), specialPriceController_1.createSpecialPrice);
router.put('/:id', (0, auth_1.authorize)('admin', 'staff'), specialPriceController_1.updateSpecialPrice);
router.delete('/:id', (0, auth_1.authorize)('admin'), specialPriceController_1.deleteSpecialPrice);
exports.default = router;
//# sourceMappingURL=specialPriceRoutes.js.map