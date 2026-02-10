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
router.delete('/:id', authorize('admin'), deleteReview);

// Admin & staff
router.get('/', authorize('admin', 'staff'), getAllReviews);
router.put('/:id/approve', authorize('admin', 'staff'), approveReview);

export default router;
