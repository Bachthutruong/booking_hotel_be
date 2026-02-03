"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const systemConfigController_1 = require("../controllers/systemConfigController");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
router.route('/:key').get(systemConfigController_1.getSystemConfig);
router.route('/').post(auth_1.protect, (0, auth_1.authorize)('admin'), systemConfigController_1.updateSystemConfig);
exports.default = router;
//# sourceMappingURL=systemConfigRoutes.js.map