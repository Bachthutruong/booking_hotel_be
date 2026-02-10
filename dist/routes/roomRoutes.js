"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const roomController_1 = require("../controllers/roomController");
const auth_1 = require("../middleware/auth");
const cloudinary_1 = require("../config/cloudinary");
const router = (0, express_1.Router)();
// Public routes
router.get('/availability', roomController_1.checkAvailability);
router.get('/:id', roomController_1.getRoom);
// Protected: admin & staff (update/upload); only admin can delete
router.use(auth_1.protect);
router.put('/:id', (0, auth_1.authorize)('admin', 'staff'), roomController_1.updateRoom);
router.delete('/:id', (0, auth_1.authorize)('admin'), roomController_1.deleteRoom);
router.post('/:id/images', (0, auth_1.authorize)('admin', 'staff'), cloudinary_1.upload.array('images', 10), roomController_1.uploadRoomImages);
exports.default = router;
//# sourceMappingURL=roomRoutes.js.map