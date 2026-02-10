"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const roomCategoryController_1 = require("../controllers/roomCategoryController");
const router = express_1.default.Router();
// Public routes
router.get('/', roomCategoryController_1.getCategories);
router.get('/:id', roomCategoryController_1.getCategoryById);
// Admin & staff (create/update); only admin can delete
router.get('/admin/all', auth_1.protect, (0, auth_1.authorize)('admin', 'staff'), roomCategoryController_1.getAllCategories);
router.post('/', auth_1.protect, (0, auth_1.authorize)('admin', 'staff'), roomCategoryController_1.createCategory);
router.put('/:id', auth_1.protect, (0, auth_1.authorize)('admin', 'staff'), roomCategoryController_1.updateCategory);
router.delete('/:id', auth_1.protect, (0, auth_1.authorize)('admin'), roomCategoryController_1.deleteCategory);
exports.default = router;
//# sourceMappingURL=roomCategoryRoutes.js.map