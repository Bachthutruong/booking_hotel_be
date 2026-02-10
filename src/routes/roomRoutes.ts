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

// Protected: admin & staff (update/upload); only admin can delete
router.use(protect);

router.put('/:id', authorize('admin', 'staff'), updateRoom);
router.delete('/:id', authorize('admin'), deleteRoom);
router.post('/:id/images', authorize('admin', 'staff'), upload.array('images', 10), uploadRoomImages);

export default router;
