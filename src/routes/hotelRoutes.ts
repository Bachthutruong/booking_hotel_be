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

// Admin only routes
router.post('/', authorize('admin'), createHotel);
router.put('/:id', authorize('admin'), updateHotel);
router.delete('/:id', authorize('admin'), deleteHotel);
router.post(
  '/:id/images',
  authorize('admin'),
  upload.array('images', 10),
  uploadHotelImages
);

// Admin create room
router.post('/:hotelId/rooms', authorize('admin'), createRoom);

export default router;
