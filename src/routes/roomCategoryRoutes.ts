import express from 'express';
import { protect, authorize } from '../middleware/auth';
import {
  getCategories,
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../controllers/roomCategoryController';

const router = express.Router();

// Public routes
router.get('/', getCategories);
router.get('/:id', getCategoryById);

// Admin & staff (create/update); only admin can delete
router.get('/admin/all', protect, authorize('admin', 'staff'), getAllCategories);
router.post('/', protect, authorize('admin', 'staff'), createCategory);
router.put('/:id', protect, authorize('admin', 'staff'), updateCategory);
router.delete('/:id', protect, authorize('admin'), deleteCategory);

export default router;
