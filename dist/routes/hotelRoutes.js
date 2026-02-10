"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const hotelController_1 = require("../controllers/hotelController");
const roomController_1 = require("../controllers/roomController");
const reviewController_1 = require("../controllers/reviewController");
const auth_1 = require("../middleware/auth");
const cloudinary_1 = require("../config/cloudinary");
const router = (0, express_1.Router)();
// Public routes
router.get('/featured', hotelController_1.getFeaturedHotels);
router.get('/cities', hotelController_1.getPopularCities);
router.get('/', hotelController_1.getHotels);
router.get('/:id', hotelController_1.getHotel);
// Room routes for hotel
router.get('/:hotelId/rooms', roomController_1.getRooms);
router.get('/:hotelId/rooms/available', roomController_1.getAvailableRooms);
// Review routes for hotel
router.get('/:hotelId/reviews', reviewController_1.getReviews);
// Protected routes
router.use(auth_1.protect);
// User can create review
router.post('/:hotelId/reviews', reviewController_1.createReview);
// Admin & staff (create/update); only admin can delete
router.post('/', (0, auth_1.authorize)('admin', 'staff'), hotelController_1.createHotel);
router.post('/recalculate-prices', (0, auth_1.authorize)('admin'), hotelController_1.recalculateAllPriceRanges);
router.put('/:id', (0, auth_1.authorize)('admin', 'staff'), hotelController_1.updateHotel);
router.delete('/:id', (0, auth_1.authorize)('admin'), hotelController_1.deleteHotel);
router.post('/:id/images', (0, auth_1.authorize)('admin', 'staff'), cloudinary_1.upload.array('images', 10), hotelController_1.uploadHotelImages);
// Admin & staff create room
router.post('/:hotelId/rooms', (0, auth_1.authorize)('admin', 'staff'), roomController_1.createRoom);
exports.default = router;
//# sourceMappingURL=hotelRoutes.js.map