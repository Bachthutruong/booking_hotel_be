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

// Admin routes
router.get('/', protect, authorize('admin'), getAllPromotions);
router.get('/:id', protect, authorize('admin'), getPromotionById);
router.post('/', protect, authorize('admin'), createPromotion);
router.put('/:id', protect, authorize('admin'), updatePromotion);
router.delete('/:id', protect, authorize('admin'), deletePromotion);

export default router;
