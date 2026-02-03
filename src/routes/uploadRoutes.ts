import express from 'express';
import { upload, uploadImage } from '../controllers/uploadController';
import { protect } from '../middleware/auth';

const router = express.Router();

router.post('/', protect, upload.single('image'), uploadImage);

export default router;
