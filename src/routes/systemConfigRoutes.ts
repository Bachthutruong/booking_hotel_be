import express from 'express';
import {
  getSystemConfig,
  updateSystemConfig,
} from '../controllers/systemConfigController';
import { protect, authorize } from '../middleware/auth';

const router = express.Router();

router.route('/:key').get(getSystemConfig);
router.route('/').post(protect, authorize('admin'), updateSystemConfig);

export default router;
