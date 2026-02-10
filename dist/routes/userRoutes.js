"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const userController_1 = require("../controllers/userController");
const auth_1 = require("../middleware/auth");
const cloudinary_1 = require("../config/cloudinary");
const router = (0, express_1.Router)();
router.use(auth_1.protect);
router.get('/', (0, auth_1.authorize)('admin', 'staff'), userController_1.getUsers);
router.get('/audit-logs', (0, auth_1.authorize)('admin'), userController_1.getUserAuditLogs);
router.post('/', (0, auth_1.authorize)('admin'), userController_1.createUser);
router.get('/:id', userController_1.getUser);
router.put('/:id', userController_1.updateUser);
router.delete('/:id', (0, auth_1.authorize)('admin'), userController_1.deleteUser);
router.put('/:id/avatar', cloudinary_1.upload.single('avatar'), userController_1.uploadAvatar);
exports.default = router;
//# sourceMappingURL=userRoutes.js.map