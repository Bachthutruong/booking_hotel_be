"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const serviceController_1 = require("../controllers/serviceController");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
router.route('/').get(serviceController_1.getServices).post(auth_1.protect, (0, auth_1.authorize)('admin'), serviceController_1.createService);
router.route('/admin').get(auth_1.protect, (0, auth_1.authorize)('admin'), serviceController_1.getAdminServices);
router
    .route('/:id')
    .get(serviceController_1.getService)
    .put(auth_1.protect, (0, auth_1.authorize)('admin'), serviceController_1.updateService)
    .delete(auth_1.protect, (0, auth_1.authorize)('admin'), serviceController_1.deleteService);
exports.default = router;
//# sourceMappingURL=serviceRoutes.js.map