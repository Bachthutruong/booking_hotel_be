import { Router } from 'express';
import {
  getSpecialPrices,
  getSpecialPrice,
  createSpecialPrice,
  updateSpecialPrice,
  deleteSpecialPrice,
  previewRoomPrice,
} from '../controllers/specialPriceController';
import { protect, authorize } from '../middleware/auth';

const router = Router();

// Public: preview price for room + date range (for booking form)
router.get('/preview', previewRoomPrice);

// Admin & staff (read/create/update); only admin can delete
router.use(protect);
router.get('/', authorize('admin', 'staff'), getSpecialPrices);
router.get('/:id', authorize('admin', 'staff'), getSpecialPrice);
router.post('/', authorize('admin', 'staff'), createSpecialPrice);
router.put('/:id', authorize('admin', 'staff'), updateSpecialPrice);
router.delete('/:id', authorize('admin'), deleteSpecialPrice);

export default router;
