import { Router } from 'express';
import {
  getStats,
  getRevenueByMonth,
  getBookingsChart,
  getRecentBookings,
  getTopHotels,
} from '../controllers/dashboardController';
import { protect, authorize } from '../middleware/auth';

const router = Router();

router.use(protect, authorize('admin'));

router.get('/stats', getStats);
router.get('/revenue', getRevenueByMonth);
router.get('/bookings-chart', getBookingsChart);
router.get('/recent-bookings', getRecentBookings);
router.get('/top-hotels', getTopHotels);

export default router;
