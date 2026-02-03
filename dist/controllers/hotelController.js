"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateHotelPriceRange = exports.getPopularCities = exports.getFeaturedHotels = exports.uploadHotelImages = exports.deleteHotel = exports.updateHotel = exports.createHotel = exports.getHotel = exports.getHotels = void 0;
const models_1 = require("../models");
const helpers_1 = require("../utils/helpers");
// @desc    Get all hotels
// @route   GET /api/hotels
// @access  Public
const getHotels = async (req, res, next) => {
    try {
        const { page, limit, skip } = (0, helpers_1.getPagination)(req);
        const { search, city, minPrice, maxPrice, rating, amenities, sortBy, } = req.query;
        const query = { isActive: true };
        // Search by name or city
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { city: { $regex: search, $options: 'i' } },
                { address: { $regex: search, $options: 'i' } },
            ];
        }
        // Filter by city
        if (city) {
            query.city = { $regex: city, $options: 'i' };
        }
        // Filter by price range
        if (minPrice || maxPrice) {
            query['priceRange.min'] = {};
            if (minPrice)
                query['priceRange.min'].$gte = parseInt(minPrice);
            if (maxPrice)
                query['priceRange.min'].$lte = parseInt(maxPrice);
        }
        // Filter by rating
        if (rating) {
            query.rating = { $gte: parseFloat(rating) };
        }
        // Filter by amenities
        if (amenities) {
            const amenitiesArray = amenities.split(',');
            query.amenities = { $all: amenitiesArray };
        }
        // Sort options
        let sortOption = { createdAt: -1 };
        if (sortBy === 'price_asc')
            sortOption = { 'priceRange.min': 1 };
        if (sortBy === 'price_desc')
            sortOption = { 'priceRange.min': -1 };
        if (sortBy === 'rating')
            sortOption = { rating: -1 };
        if (sortBy === 'popular')
            sortOption = { totalReviews: -1 };
        const [hotels, total] = await Promise.all([
            models_1.Hotel.find(query).skip(skip).limit(limit).sort(sortOption),
            models_1.Hotel.countDocuments(query),
        ]);
        res.status(200).json({
            success: true,
            data: hotels,
            pagination: (0, helpers_1.createPaginationResponse)(page, limit, total),
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getHotels = getHotels;
// @desc    Get single hotel
// @route   GET /api/hotels/:id
// @access  Public
const getHotel = async (req, res, next) => {
    try {
        const hotel = await models_1.Hotel.findById(req.params.id);
        if (!hotel) {
            res.status(404).json({
                success: false,
                message: 'Không tìm thấy khách sạn',
            });
            return;
        }
        res.status(200).json({
            success: true,
            data: hotel,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getHotel = getHotel;
// @desc    Create hotel
// @route   POST /api/hotels
// @access  Private/Admin
const createHotel = async (req, res, next) => {
    try {
        const hotel = await models_1.Hotel.create(req.body);
        res.status(201).json({
            success: true,
            data: hotel,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.createHotel = createHotel;
// @desc    Update hotel
// @route   PUT /api/hotels/:id
// @access  Private/Admin
const updateHotel = async (req, res, next) => {
    try {
        const hotel = await models_1.Hotel.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });
        if (!hotel) {
            res.status(404).json({
                success: false,
                message: 'Không tìm thấy khách sạn',
            });
            return;
        }
        res.status(200).json({
            success: true,
            data: hotel,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.updateHotel = updateHotel;
// @desc    Delete hotel
// @route   DELETE /api/hotels/:id
// @access  Private/Admin
const deleteHotel = async (req, res, next) => {
    try {
        const hotel = await models_1.Hotel.findById(req.params.id);
        if (!hotel) {
            res.status(404).json({
                success: false,
                message: 'Không tìm thấy khách sạn',
            });
            return;
        }
        // Soft delete
        hotel.isActive = false;
        await hotel.save();
        // Also deactivate all rooms
        await models_1.Room.updateMany({ hotel: hotel._id }, { isActive: false });
        res.status(200).json({
            success: true,
            message: 'Đã xóa khách sạn',
        });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteHotel = deleteHotel;
// @desc    Upload hotel images
// @route   POST /api/hotels/:id/images
// @access  Private/Admin
const uploadHotelImages = async (req, res, next) => {
    try {
        const hotel = await models_1.Hotel.findById(req.params.id);
        if (!hotel) {
            res.status(404).json({
                success: false,
                message: 'Không tìm thấy khách sạn',
            });
            return;
        }
        if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
            res.status(400).json({
                success: false,
                message: 'Vui lòng chọn ít nhất 1 ảnh',
            });
            return;
        }
        const imageUrls = req.files.map((file) => file.path);
        hotel.images.push(...imageUrls);
        await hotel.save();
        res.status(200).json({
            success: true,
            data: hotel,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.uploadHotelImages = uploadHotelImages;
// @desc    Get featured hotels
// @route   GET /api/hotels/featured
// @access  Public
const getFeaturedHotels = async (req, res, next) => {
    try {
        const hotels = await models_1.Hotel.find({ isActive: true })
            .sort({ rating: -1, totalReviews: -1 })
            .limit(8);
        res.status(200).json({
            success: true,
            data: hotels,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getFeaturedHotels = getFeaturedHotels;
// @desc    Get popular cities
// @route   GET /api/hotels/cities
// @access  Public
const getPopularCities = async (req, res, next) => {
    try {
        const cities = await models_1.Hotel.aggregate([
            { $match: { isActive: true } },
            { $group: { _id: '$city', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 },
        ]);
        res.status(200).json({
            success: true,
            data: cities.map((c) => ({ city: c._id, count: c.count })),
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getPopularCities = getPopularCities;
// @desc    Update hotel price range (called when room prices change)
const updateHotelPriceRange = async (hotelId) => {
    const rooms = await models_1.Room.find({ hotel: hotelId, isActive: true });
    if (rooms.length > 0) {
        const prices = rooms.map((r) => r.price);
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        await models_1.Hotel.findByIdAndUpdate(hotelId, {
            priceRange: { min: minPrice, max: maxPrice },
        });
    }
};
exports.updateHotelPriceRange = updateHotelPriceRange;
//# sourceMappingURL=hotelController.js.map