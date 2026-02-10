"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const serviceCategoryController_1 = require("../controllers/serviceCategoryController");
const router = express_1.default.Router();
// Public
router.get('/', serviceCategoryController_1.getServiceCategories);
router.get('/:id', serviceCategoryController_1.getServiceCategoryById);
// Admin & staff (create/update); only admin can delete
router.get('/admin/all', auth_1.protect, (0, auth_1.authorize)('admin', 'staff'), serviceCategoryController_1.getAllServiceCategories);
router.post('/', auth_1.protect, (0, auth_1.authorize)('admin', 'staff'), serviceCategoryController_1.createServiceCategory);
router.put('/:id', auth_1.protect, (0, auth_1.authorize)('admin', 'staff'), serviceCategoryController_1.updateServiceCategory);
router.delete('/:id', auth_1.protect, (0, auth_1.authorize)('admin'), serviceCategoryController_1.deleteServiceCategory);
exports.default = router;
//# sourceMappingURL=serviceCategoryRoutes.js.map