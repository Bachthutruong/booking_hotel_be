"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateBookingStatus = exports.cancelBooking = exports.approveBooking = exports.uploadPaymentProof = exports.createBookingAdmin = exports.createBooking = exports.getBooking = exports.getBookings = void 0;
const models_1 = require("../models");
const helpers_1 = require("../utils/helpers");
// @desc    Get all bookings
// @route   GET /api/bookings
// @access  Private
const getBookings = async (req, res, next) => {
    try {
        const { page, limit, skip } = (0, helpers_1.getPagination)(req);
        const { status, paymentStatus, startDate, endDate } = req.query;
        const query = {};
        // If not admin, only show user's own bookings
        if (req.user?.role !== 'admin') {
            query.user = req.user?._id;
        }
        if (status) {
            query.status = status;
        }
        if (paymentStatus) {
            query.paymentStatus = paymentStatus;
        }
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate)
                query.createdAt.$gte = new Date(startDate);
            if (endDate)
                query.createdAt.$lte = new Date(endDate);
        }
        const [bookings, total] = await Promise.all([
            models_1.Booking.find(query)
                .populate('user', 'fullName email phone')
                .populate('hotel', 'name city images')
                .populate('room', 'name type price images')
                .populate('services.service', 'name price')
                .skip(skip)
                .limit(limit)
                .sort({ createdAt: -1 }),
            models_1.Booking.countDocuments(query),
        ]);
        res.status(200).json({
            success: true,
            data: bookings,
            pagination: (0, helpers_1.createPaginationResponse)(page, limit, total),
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getBookings = getBookings;
// @desc    Get single booking
// @route   GET /api/bookings/:id
// @access  Private
const getBooking = async (req, res, next) => {
    try {
        const booking = await models_1.Booking.findById(req.params.id)
            .populate('user', 'fullName email phone')
            .populate('hotel', 'name address city images policies')
            .populate('room', 'name type price images amenities')
            .populate('services.service', 'name price description icon');
        if (!booking) {
            res.status(404).json({
                success: false,
                message: 'Không tìm thấy đặt phòng',
            });
            return;
        }
        // Check if user owns this booking or is admin
        if (req.user?.role !== 'admin' &&
            booking.user._id.toString() !== req.user?._id.toString()) {
            res.status(403).json({
                success: false,
                message: 'Bạn không có quyền xem đặt phòng này',
            });
            return;
        }
        res.status(200).json({
            success: true,
            data: booking,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getBooking = getBooking;
// @desc    Create booking (User)
// @route   POST /api/bookings
// @access  Private
const createBooking = async (req, res, next) => {
    try {
        const { hotelId, roomId, checkIn, checkOut, guests, contactInfo, specialRequests, services: requestedServices, // Array of { serviceId, quantity }
         } = req.body;
        // Validate dates
        const checkInDate = new Date(checkIn);
        const checkOutDate = new Date(checkOut);
        if (checkInDate >= checkOutDate) {
            res.status(400).json({
                success: false,
                message: 'Ngày check-out phải sau ngày check-in',
            });
            return;
        }
        if (checkInDate < new Date()) {
            res.status(400).json({
                success: false,
                message: 'Ngày check-in không thể trong quá khứ',
            });
            return;
        }
        // Get room and check availability
        const room = await models_1.Room.findById(roomId);
        if (!room || !room.isActive) {
            res.status(404).json({
                success: false,
                message: 'Không tìm thấy phòng',
            });
            return;
        }
        // Check room availability
        const bookedRooms = await models_1.Booking.countDocuments({
            room: roomId,
            status: { $in: ['pending', 'confirmed', 'pending_deposit', 'awaiting_approval'] },
            $or: [
                {
                    checkIn: { $lt: checkOutDate },
                    checkOut: { $gt: checkInDate },
                },
            ],
        });
        if (bookedRooms >= room.quantity) {
            res.status(400).json({
                success: false,
                message: 'Phòng đã hết trong khoảng thời gian này',
            });
            return;
        }
        // Calculate total price
        const nights = (0, helpers_1.calculateNights)(checkInDate, checkOutDate);
        let totalPrice = room.price * nights;
        const bookingServices = [];
        // Process services if any
        if (requestedServices && Array.isArray(requestedServices)) {
            for (const item of requestedServices) {
                const service = await models_1.Service.findById(item.serviceId);
                if (service && service.isActive) {
                    const quantity = item.quantity || 1;
                    const price = service.price; // Use current price
                    totalPrice += price * quantity;
                    bookingServices.push({
                        service: service._id,
                        quantity,
                        price
                    });
                }
            }
        }
        // Create booking
        const booking = await models_1.Booking.create({
            user: req.user?._id,
            hotel: hotelId,
            room: roomId,
            checkIn: checkInDate,
            checkOut: checkOutDate,
            guests,
            totalPrice,
            services: bookingServices,
            contactInfo,
            specialRequests,
            status: 'pending_deposit', // Start as pending deposit
            paymentStatus: 'pending',
        });
        const populatedBooking = await models_1.Booking.findById(booking._id)
            .populate('hotel', 'name address city')
            .populate('room', 'name type price')
            .populate('services.service', 'name price');
        res.status(201).json({
            success: true,
            data: populatedBooking,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.createBooking = createBooking;
// @desc    Create booking (Admin)
// @route   POST /api/bookings/admin
// @access  Private/Admin
const createBookingAdmin = async (req, res, next) => {
    try {
        const { userId, hotelId, roomId, checkIn, checkOut, guests, contactInfo, specialRequests, services: requestedServices, status, // Admin can set initial status
        paymentStatus } = req.body;
        const user = await models_1.User.findById(userId);
        if (!user) {
            res.status(404).json({ success: false, message: 'User not found' });
            return;
        }
        // Validate dates
        const checkInDate = new Date(checkIn);
        const checkOutDate = new Date(checkOut);
        const room = await models_1.Room.findById(roomId);
        if (!room) {
            res.status(404).json({ success: false, message: 'Room not found' });
            return;
        }
        // Calculate total price
        const nights = (0, helpers_1.calculateNights)(checkInDate, checkOutDate);
        let totalPrice = room.price * nights;
        const bookingServices = [];
        // Process services
        if (requestedServices && Array.isArray(requestedServices)) {
            for (const item of requestedServices) {
                const service = await models_1.Service.findById(item.serviceId);
                if (service) {
                    const quantity = item.quantity || 1;
                    const price = service.price;
                    totalPrice += price * quantity;
                    bookingServices.push({
                        service: service._id,
                        quantity,
                        price
                    });
                }
            }
        }
        // Create booking
        const booking = await models_1.Booking.create({
            user: userId,
            hotel: hotelId,
            room: roomId,
            checkIn: checkInDate,
            checkOut: checkOutDate,
            guests,
            totalPrice,
            services: bookingServices,
            contactInfo,
            specialRequests,
            status: status || 'confirmed',
            paymentStatus: paymentStatus || 'pending',
        });
        const populatedBooking = await models_1.Booking.findById(booking._id)
            .populate('hotel', 'name address city')
            .populate('room', 'name type price')
            .populate('services.service', 'name price');
        res.status(201).json({
            success: true,
            data: populatedBooking,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.createBookingAdmin = createBookingAdmin;
// @desc    Upload payment proof
// @route   PUT /api/bookings/:id/proof
// @access  Private
const uploadPaymentProof = async (req, res, next) => {
    try {
        const { proofImage } = req.body; // URL from cloud storage
        const booking = await models_1.Booking.findById(req.params.id);
        if (!booking) {
            res.status(404).json({ success: false, message: 'Booking not found' });
            return;
        }
        if (booking.user.toString() !== req.user?._id.toString()) {
            res.status(403).json({ success: false, message: 'Not authorized' });
            return;
        }
        booking.proofImage = proofImage;
        booking.status = 'awaiting_approval';
        await booking.save();
        res.status(200).json({
            success: true,
            data: booking,
            message: 'Payment proof uploaded, awaiting admin approval'
        });
    }
    catch (error) {
        next(error);
    }
};
exports.uploadPaymentProof = uploadPaymentProof;
// @desc    Approve/Reject booking (Admin)
// @route   PUT /api/bookings/:id/approve
// @access  Private/Admin
const approveBooking = async (req, res, next) => {
    try {
        const { action } = req.body; // 'approve' or 'reject'
        const booking = await models_1.Booking.findById(req.params.id);
        if (!booking) {
            res.status(404).json({ success: false, message: 'Booking not found' });
            return;
        }
        if (action === 'approve') {
            booking.status = 'confirmed';
            booking.paymentStatus = 'paid';
        }
        else if (action === 'reject') {
            booking.status = 'pending_deposit'; // Ask user to try again
            // Optional: Add rejection reason
        }
        else {
            res.status(400).json({ success: false, message: 'Invalid action' });
            return;
        }
        await booking.save();
        res.status(200).json({
            success: true,
            data: booking,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.approveBooking = approveBooking;
// @desc    Cancel booking
// @route   PUT /api/bookings/:id/cancel
// @access  Private
const cancelBooking = async (req, res, next) => {
    try {
        const booking = await models_1.Booking.findById(req.params.id);
        if (!booking) {
            res.status(404).json({
                success: false,
                message: 'Không tìm thấy đặt phòng',
            });
            return;
        }
        // Check if user owns this booking or is admin
        if (req.user?.role !== 'admin' &&
            booking.user.toString() !== req.user?._id.toString()) {
            res.status(403).json({
                success: false,
                message: 'Bạn không có quyền hủy đặt phòng này',
            });
            return;
        }
        // Check if booking can be cancelled
        if (booking.status === 'cancelled') {
            res.status(400).json({
                success: false,
                message: 'Đặt phòng đã được hủy trước đó',
            });
            return;
        }
        if (booking.status === 'completed') {
            res.status(400).json({
                success: false,
                message: 'Không thể hủy đặt phòng đã hoàn thành',
            });
            return;
        }
        booking.status = 'cancelled';
        if (booking.paymentStatus === 'paid') {
            booking.paymentStatus = 'refunded';
        }
        await booking.save();
        res.status(200).json({
            success: true,
            data: booking,
            message: 'Đã hủy đặt phòng thành công',
        });
    }
    catch (error) {
        next(error);
    }
};
exports.cancelBooking = cancelBooking;
// @desc    Update booking status (General)
// @route   PUT /api/bookings/:id/status
// @access  Private/Admin
const updateBookingStatus = async (req, res, next) => {
    try {
        const { status, paymentStatus } = req.body;
        const updateData = {};
        if (status)
            updateData.status = status;
        if (paymentStatus)
            updateData.paymentStatus = paymentStatus;
        const booking = await models_1.Booking.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true })
            .populate('user', 'fullName email phone')
            .populate('hotel', 'name city')
            .populate('room', 'name type price');
        if (!booking) {
            res.status(404).json({
                success: false,
                message: 'Không tìm thấy đặt phòng',
            });
            return;
        }
        res.status(200).json({
            success: true,
            data: booking,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.updateBookingStatus = updateBookingStatus;
//# sourceMappingURL=bookingController.js.map