"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const promotionController_1 = require("../controllers/promotionController");
const router = express_1.default.Router();
// Public routes
router.get('/active', promotionController_1.getActivePromotions);
router.get('/calculate', promotionController_1.getPromotionForAmount);
// Admin routes
router.get('/', auth_1.protect, (0, auth_1.authorize)('admin'), promotionController_1.getAllPromotions);
router.get('/:id', auth_1.protect, (0, auth_1.authorize)('admin'), promotionController_1.getPromotionById);
router.post('/', auth_1.protect, (0, auth_1.authorize)('admin'), promotionController_1.createPromotion);
router.put('/:id', auth_1.protect, (0, auth_1.authorize)('admin'), promotionController_1.updatePromotion);
router.delete('/:id', auth_1.protect, (0, auth_1.authorize)('admin'), promotionController_1.deletePromotion);
exports.default = router;
//# sourceMappingURL=promotionRoutes.js.map