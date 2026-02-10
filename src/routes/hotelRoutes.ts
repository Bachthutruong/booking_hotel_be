import { Router } from 'express';
import {
  getHotels,
  getHotel,
  createHotel,
  updateHotel,
  deleteHotel,
  uploadHotelImages,
  getFeaturedHotels,
  getPopularCities,
  recalculateAllPriceRanges,
} from '../controllers/hotelController';
import {
  getRooms,
  createRoom,
  getAvailableRooms,
} from '../controllers/roomController';
import {
  getReviews,
  createReview,
} from '../controllers/reviewController';
import { protect, authorize } from '../middleware/auth';
import { upload } from '../config/cloudinary';

const router = Router();

// Public routes
router.get('/featured', getFeaturedHotels);
router.get('/cities', getPopularCities);
router.get('/', getHotels);
router.get('/:id', getHotel);

// Room routes for hotel
router.get('/:hotelId/rooms', getRooms);
router.get('/:hotelId/rooms/available', getAvailableRooms);

// Review routes for hotel
router.get('/:hotelId/reviews', getReviews);

// Protected routes
router.use(protect);

// User can create review
router.post('/:hotelId/reviews', createReview);

// Admin & staff (create/update); only admin can delete
router.post('/', authorize('admin', 'staff'), createHotel);
router.post('/recalculate-prices', authorize('admin'), recalculateAllPriceRanges);
router.put('/:id', authorize('admin', 'staff'), updateHotel);
router.delete('/:id', authorize('admin'), deleteHotel);
router.post(
  '/:id/images',
  authorize('admin', 'staff'),
  upload.array('images', 10),
  uploadHotelImages
);

// Admin & staff create room
router.post('/:hotelId/rooms', authorize('admin', 'staff'), createRoom);

export default router;
