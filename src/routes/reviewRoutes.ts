import { Router } from 'express';
import {
  getAllReviews,
  updateReview,
  deleteReview,
  approveReview,
} from '../controllers/reviewController';
import { protect, authorize } from '../middleware/auth';

const router = Router();

router.use(protect);

router.put('/:id', updateReview);
router.delete('/:id', deleteReview);

// Admin only
router.get('/', authorize('admin'), getAllReviews);
router.put('/:id/approve', authorize('admin'), approveReview);

export default router;
