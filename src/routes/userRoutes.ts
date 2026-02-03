import { Router } from 'express';
import {
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  uploadAvatar,
} from '../controllers/userController';
import { protect, authorize } from '../middleware/auth';
import { upload } from '../config/cloudinary';

const router = Router();

router.use(protect);

router.get('/', authorize('admin'), getUsers);
router.get('/:id', getUser);
router.put('/:id', updateUser);
router.delete('/:id', authorize('admin'), deleteUser);
router.put('/:id/avatar', upload.single('avatar'), uploadAvatar);

export default router;
