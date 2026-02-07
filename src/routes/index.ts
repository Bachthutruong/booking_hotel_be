import { Router } from 'express';
import authRoutes from './authRoutes';
import userRoutes from './userRoutes';
import hotelRoutes from './hotelRoutes';
import roomRoutes from './roomRoutes';
import bookingRoutes from './bookingRoutes';
import reviewRoutes from './reviewRoutes';
import dashboardRoutes from './dashboardRoutes';
import serviceRoutes from './serviceRoutes';
import serviceCategoryRoutes from './serviceCategoryRoutes';
import systemConfigRoutes from './systemConfigRoutes';
import uploadRoutes from './uploadRoutes';
import walletRoutes from './walletRoutes';
import roomCategoryRoutes from './roomCategoryRoutes';
import promotionRoutes from './promotionRoutes';
import notificationRoutes from './notificationRoutes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/hotels', hotelRoutes);
router.use('/rooms', roomRoutes);
router.use('/bookings', bookingRoutes);
router.use('/reviews', reviewRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/services', serviceRoutes);
router.use('/service-categories', serviceCategoryRoutes);
router.use('/config', systemConfigRoutes);
router.use('/upload', uploadRoutes);
router.use('/wallet', walletRoutes);
router.use('/categories', roomCategoryRoutes);
router.use('/promotions', promotionRoutes);
router.use('/notifications', notificationRoutes);

export default router;
