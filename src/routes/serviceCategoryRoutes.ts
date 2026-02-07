import express from 'express';
import { protect, authorize } from '../middleware/auth';
import {
  getServiceCategories,
  getAllServiceCategories,
  getServiceCategoryById,
  createServiceCategory,
  updateServiceCategory,
  deleteServiceCategory,
} from '../controllers/serviceCategoryController';

const router = express.Router();

// Public
router.get('/', getServiceCategories);
router.get('/:id', getServiceCategoryById);

// Admin
router.get('/admin/all', protect, authorize('admin'), getAllServiceCategories);
router.post('/', protect, authorize('admin'), createServiceCategory);
router.put('/:id', protect, authorize('admin'), updateServiceCategory);
router.delete('/:id', protect, authorize('admin'), deleteServiceCategory);

export default router;
