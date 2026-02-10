import express from 'express';
import {
  getServices,
  getAdminServices,
  getService,
  createService,
  updateService,
  deleteService,
  getServiceByQR,
  getServiceQRData,
} from '../controllers/serviceController';
import { protect, authorize } from '../middleware/auth';

const router = express.Router();

router.route('/').get(getServices).post(protect, authorize('admin', 'staff'), createService);

router.route('/admin').get(protect, authorize('admin', 'staff'), getAdminServices);

// QR code routes
router.get('/qr/:serviceId', getServiceByQR);
router.get('/:id/qr-data', protect, authorize('admin', 'staff'), getServiceQRData);

router
  .route('/:id')
  .get(getService)
  .put(protect, authorize('admin', 'staff'), updateService)
  .delete(protect, authorize('admin'), deleteService);

export default router;
