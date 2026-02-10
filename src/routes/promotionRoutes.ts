import express from 'express';
import { protect, authorize } from '../middleware/auth';
import {
  getActivePromotions,
  getPromotionForAmount,
  getAllPromotions,
  getPromotionById,
  createPromotion,
  updatePromotion,
  deletePromotion,
} from '../controllers/promotionController';

const router = express.Router();

// Public routes
router.get('/active', getActivePromotions);
router.get('/calculate', getPromotionForAmount);

// Admin & staff (read/create/update); only admin can delete
router.get('/', protect, authorize('admin', 'staff'), getAllPromotions);
router.get('/:id', protect, authorize('admin', 'staff'), getPromotionById);
router.post('/', protect, authorize('admin', 'staff'), createPromotion);
router.put('/:id', protect, authorize('admin', 'staff'), updatePromotion);
router.delete('/:id', protect, authorize('admin'), deletePromotion);

export default router;
