import { Router } from 'express';
import {
  getRoom,
  updateRoom,
  deleteRoom,
  uploadRoomImages,
  checkAvailability,
} from '../controllers/roomController';
import { protect, authorize } from '../middleware/auth';
import { upload } from '../config/cloudinary';

const router = Router();

// Public routes
router.get('/availability', checkAvailability);
router.get('/:id', getRoom);

// Protected admin routes
router.use(protect, authorize('admin'));

router.put('/:id', updateRoom);
router.delete('/:id', deleteRoom);
router.post('/:id/images', upload.array('images', 10), uploadRoomImages);

export default router;
