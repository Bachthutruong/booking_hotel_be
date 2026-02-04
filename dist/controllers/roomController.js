"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAvailableRooms = exports.checkAvailability = exports.uploadRoomImages = exports.deleteRoom = exports.updateRoom = exports.createRoom = exports.getRoom = exports.getRooms = void 0;
const models_1 = require("../models");
const hotelController_1 = require("./hotelController");
const helpers_1 = require("../utils/helpers");
// @desc    Get rooms of a hotel
// @route   GET /api/hotels/:hotelId/rooms
// @access  Public
const getRooms = async (req, res, next) => {
    try {
        const { hotelId } = req.params;
        const { page, limit, skip } = (0, helpers_1.getPagination)(req);
        const { type, minPrice, maxPrice, capacity, search, category, isActive } = req.query;
        const query = { hotel: hotelId };
        // Default isActive to true unless specified otherwise (for public API compatibility)
        // Admin can pass 'all' to see everything, or 'true'/'false'
        if (isActive === 'false') {
            query.isActive = false;
        }
        else if (isActive !== 'all') {
            query.isActive = true;
        }
        if (search) {
            query.name = { $regex: search, $options: 'i' };
        }
        if (category && category !== 'all') {
            query.category = category;
        }
        if (type) {
            query.type = type;
        }
        if (minPrice || maxPrice) {
            query.price = {};
            if (minPrice)
                query.price.$gte = parseInt(minPrice);
            if (maxPrice)
                query.price.$lte = parseInt(maxPrice);
        }
        if (capacity) {
            query['capacity.adults'] = { $gte: parseInt(capacity) };
        }
        const [rooms, total] = await Promise.all([
            models_1.Room.find(query).populate('category').skip(skip).limit(limit).sort({ price: 1 }).lean(),
            models_1.Room.countDocuments(query),
        ]);
        res.status(200).json({
            success: true,
            data: rooms,
            pagination: (0, helpers_1.createPaginationResponse)(page, limit, total),
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getRooms = getRooms;
// @desc    Get single room
// @route   GET /api/rooms/:id
// @access  Public
const getRoom = async (req, res, next) => {
    try {
        const room = await models_1.Room.findById(req.params.id).populate('hotel').lean();
        if (!room) {
            res.status(404).json({
                success: false,
                message: 'Không tìm thấy phòng',
            });
            return;
        }
        res.status(200).json({
            success: true,
            data: room,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getRoom = getRoom;
// @desc    Create room
// @route   POST /api/hotels/:hotelId/rooms
// @access  Private/Admin
const createRoom = async (req, res, next) => {
    try {
        const { hotelId } = req.params;
        req.body.hotel = hotelId;
        const room = await models_1.Room.create(req.body);
        // Update hotel price range
        await (0, hotelController_1.updateHotelPriceRange)(hotelId);
        res.status(201).json({
            success: true,
            data: room,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.createRoom = createRoom;
// @desc    Update room
// @route   PUT /api/rooms/:id
// @access  Private/Admin
const updateRoom = async (req, res, next) => {
    try {
        const room = await models_1.Room.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });
        if (!room) {
            res.status(404).json({
                success: false,
                message: 'Không tìm thấy phòng',
            });
            return;
        }
        // Update hotel price range if price changed
        if (req.body.price !== undefined) {
            await (0, hotelController_1.updateHotelPriceRange)(room.hotel.toString());
        }
        res.status(200).json({
            success: true,
            data: room,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.updateRoom = updateRoom;
// @desc    Delete room
// @route   DELETE /api/rooms/:id
// @access  Private/Admin
const deleteRoom = async (req, res, next) => {
    try {
        const room = await models_1.Room.findById(req.params.id);
        if (!room) {
            res.status(404).json({
                success: false,
                message: 'Không tìm thấy phòng',
            });
            return;
        }
        // Soft delete
        room.isActive = false;
        await room.save();
        // Update hotel price range
        await (0, hotelController_1.updateHotelPriceRange)(room.hotel.toString());
        res.status(200).json({
            success: true,
            message: 'Đã xóa phòng',
        });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteRoom = deleteRoom;
// @desc    Upload room images
// @route   POST /api/rooms/:id/images
// @access  Private/Admin
const uploadRoomImages = async (req, res, next) => {
    try {
        const room = await models_1.Room.findById(req.params.id);
        if (!room) {
            res.status(404).json({
                success: false,
                message: 'Không tìm thấy phòng',
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
        room.images.push(...imageUrls);
        await room.save();
        res.status(200).json({
            success: true,
            data: room,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.uploadRoomImages = uploadRoomImages;
// @desc    Check room availability
// @route   GET /api/rooms/availability
// @access  Public
const checkAvailability = async (req, res, next) => {
    try {
        const { roomId, checkIn, checkOut } = req.query;
        if (!roomId || !checkIn || !checkOut) {
            res.status(400).json({
                success: false,
                message: 'Vui lòng cung cấp roomId, checkIn và checkOut',
            });
            return;
        }
        const room = await models_1.Room.findById(roomId).lean();
        if (!room) {
            res.status(404).json({
                success: false,
                message: 'Không tìm thấy phòng',
            });
            return;
        }
        const checkInDate = new Date(checkIn);
        const checkOutDate = new Date(checkOut);
        // Count booked rooms for this period
        // Include all active booking statuses to prevent double booking
        const bookedRooms = await models_1.Booking.countDocuments({
            room: roomId,
            status: { $in: ['pending', 'pending_deposit', 'awaiting_approval', 'confirmed'] },
            $or: [
                {
                    checkIn: { $lt: checkOutDate },
                    checkOut: { $gt: checkInDate },
                },
            ],
        });
        const availableQuantity = room.quantity - bookedRooms;
        res.status(200).json({
            success: true,
            data: {
                roomId,
                totalQuantity: room.quantity,
                bookedQuantity: bookedRooms,
                availableQuantity,
                isAvailable: availableQuantity > 0,
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.checkAvailability = checkAvailability;
// @desc    Get available rooms for hotel with dates
// @route   GET /api/hotels/:hotelId/rooms/available
// @access  Public
const getAvailableRooms = async (req, res, next) => {
    try {
        const { hotelId } = req.params;
        const { checkIn, checkOut, adults, children } = req.query;
        if (!checkIn || !checkOut) {
            res.status(400).json({
                success: false,
                message: 'Vui lòng cung cấp ngày check-in và check-out',
            });
            return;
        }
        const checkInDate = new Date(checkIn);
        const checkOutDate = new Date(checkOut);
        // Get all active rooms for this hotel with category populated
        const rooms = await models_1.Room.find({ hotel: hotelId, isActive: true }).populate('category').lean();
        // For each room, check availability
        const availableRooms = await Promise.all(rooms.map(async (room) => {
            // Include all active booking statuses to prevent double booking
            const bookedRooms = await models_1.Booking.countDocuments({
                room: room._id,
                status: { $in: ['pending', 'pending_deposit', 'awaiting_approval', 'confirmed'] },
                $or: [
                    {
                        checkIn: { $lt: checkOutDate },
                        checkOut: { $gt: checkInDate },
                    },
                ],
            });
            const availableQuantity = room.quantity - bookedRooms;
            // Check capacity if specified
            if (adults) {
                const totalGuests = parseInt(adults) + parseInt(children || '0');
                if (room.capacity.adults + room.capacity.children < totalGuests) {
                    return null;
                }
            }
            return {
                ...room,
                availableQuantity,
                isAvailable: availableQuantity > 0,
            };
        }));
        // Filter out null values and unavailable rooms
        const filteredRooms = availableRooms.filter((room) => room !== null && room.isAvailable);
        res.status(200).json({
            success: true,
            data: filteredRooms,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getAvailableRooms = getAvailableRooms;
//# sourceMappingURL=roomController.js.map