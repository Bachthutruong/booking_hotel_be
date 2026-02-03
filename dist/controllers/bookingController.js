"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getInvoice = exports.payWithWallet = exports.checkoutBooking = exports.getBookingBill = exports.addServiceToBooking = exports.checkInBooking = exports.updateBookingStatus = exports.cancelBooking = exports.approveBooking = exports.uploadPaymentProof = exports.createBookingAdmin = exports.createBooking = exports.getBooking = exports.getBookings = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
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
                .sort({ createdAt: -1 })
                .lean(),
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
            .populate('services.service', 'name price description icon')
            .lean();
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
        // Calculate room price and service price separately
        const roomPrice = room.price * nights;
        const servicePrice = bookingServices.reduce((sum, s) => sum + s.price * s.quantity, 0);
        // Create booking
        const booking = await models_1.Booking.create({
            user: req.user?._id,
            hotel: hotelId,
            room: roomId,
            checkIn: checkInDate,
            checkOut: checkOutDate,
            guests,
            roomPrice,
            servicePrice,
            totalPrice,
            estimatedPrice: totalPrice,
            services: bookingServices,
            contactInfo,
            specialRequests,
            status: 'pending_deposit', // Start as pending deposit
            paymentStatus: 'pending',
            paymentMethod: 'bank_transfer',
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
// @desc    Check-in booking
// @route   PUT /api/bookings/:id/checkin
// @access  Private/Admin
const checkInBooking = async (req, res, next) => {
    try {
        const booking = await models_1.Booking.findById(req.params.id);
        if (!booking) {
            res.status(404).json({ success: false, message: 'Booking not found' });
            return;
        }
        if (booking.status !== 'confirmed') {
            res.status(400).json({ success: false, message: 'Booking must be confirmed before check-in' });
            return;
        }
        booking.actualCheckIn = new Date();
        booking.status = 'confirmed'; // Keep confirmed, actualCheckIn marks they checked in
        await booking.save();
        const populatedBooking = await models_1.Booking.findById(booking._id)
            .populate('user', 'fullName email phone walletBalance bonusBalance')
            .populate('hotel', 'name address city')
            .populate('room', 'name type price')
            .populate('services.service', 'name price');
        res.status(200).json({
            success: true,
            data: populatedBooking,
            message: 'Check-in successful',
        });
    }
    catch (error) {
        next(error);
    }
};
exports.checkInBooking = checkInBooking;
// @desc    Add service to booking (via QR scan)
// @route   POST /api/bookings/:id/services
// @access  Private
const addServiceToBooking = async (req, res, next) => {
    try {
        const { serviceId, quantity = 1 } = req.body;
        const booking = await models_1.Booking.findById(req.params.id);
        if (!booking) {
            res.status(404).json({ success: false, message: 'Booking not found' });
            return;
        }
        // Only allow adding services to active bookings (checked in)
        if (booking.status !== 'confirmed' || !booking.actualCheckIn) {
            res.status(400).json({ success: false, message: 'Can only add services to checked-in bookings' });
            return;
        }
        // Check if booking belongs to user or admin is making request
        if (req.user?.role !== 'admin' && booking.user.toString() !== req.user?._id.toString()) {
            res.status(403).json({ success: false, message: 'Not authorized' });
            return;
        }
        const service = await models_1.Service.findById(serviceId);
        if (!service || !service.isActive) {
            res.status(404).json({ success: false, message: 'Service not found' });
            return;
        }
        // Check if service already exists in booking
        const existingServiceIndex = booking.services.findIndex(s => s.service.toString() === serviceId);
        if (existingServiceIndex > -1) {
            booking.services[existingServiceIndex].quantity += quantity;
        }
        else {
            booking.services.push({
                service: service._id,
                quantity,
                price: service.price,
            });
        }
        // Recalculate prices
        booking.servicePrice = booking.services.reduce((sum, s) => sum + s.price * s.quantity, 0);
        booking.estimatedPrice = booking.roomPrice + booking.servicePrice;
        await booking.save();
        const populatedBooking = await models_1.Booking.findById(booking._id)
            .populate('user', 'fullName email phone')
            .populate('hotel', 'name address city')
            .populate('room', 'name type price')
            .populate('services.service', 'name price icon');
        res.status(200).json({
            success: true,
            data: populatedBooking,
            message: 'Service added successfully',
        });
    }
    catch (error) {
        next(error);
    }
};
exports.addServiceToBooking = addServiceToBooking;
// @desc    Get estimated bill for booking
// @route   GET /api/bookings/:id/bill
// @access  Private
const getBookingBill = async (req, res, next) => {
    try {
        const booking = await models_1.Booking.findById(req.params.id)
            .populate('user', 'fullName email phone walletBalance bonusBalance')
            .populate('hotel', 'name address city')
            .populate('room', 'name type price')
            .populate('services.service', 'name price icon');
        if (!booking) {
            res.status(404).json({ success: false, message: 'Booking not found' });
            return;
        }
        // Check authorization
        if (req.user?.role !== 'admin' && booking.user._id.toString() !== req.user?._id.toString()) {
            res.status(403).json({ success: false, message: 'Not authorized' });
            return;
        }
        const user = await models_1.User.findById(booking.user._id);
        const nights = (0, helpers_1.calculateNights)(new Date(booking.checkIn), new Date(booking.checkOut));
        res.status(200).json({
            success: true,
            data: {
                booking,
                summary: {
                    roomPrice: booking.roomPrice,
                    servicePrice: booking.servicePrice,
                    estimatedTotal: booking.estimatedPrice,
                    nights,
                    userWalletBalance: user?.walletBalance || 0,
                    userBonusBalance: user?.bonusBalance || 0,
                },
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getBookingBill = getBookingBill;
// @desc    Checkout booking with payment
// @route   POST /api/bookings/:id/checkout
// @access  Private/Admin
const checkoutBooking = async (req, res, next) => {
    const session = await mongoose_1.default.startSession();
    session.startTransaction();
    try {
        const { paymentOption, checkoutNote } = req.body; // 'use_bonus' | 'use_main_only'
        const booking = await models_1.Booking.findById(req.params.id).session(session);
        if (!booking) {
            await session.abortTransaction();
            res.status(404).json({ success: false, message: 'Booking not found' });
            return;
        }
        if (booking.status === 'completed') {
            await session.abortTransaction();
            res.status(400).json({ success: false, message: 'Booking already completed' });
            return;
        }
        if (booking.status !== 'confirmed') {
            await session.abortTransaction();
            res.status(400).json({ success: false, message: 'Booking must be confirmed' });
            return;
        }
        const user = await models_1.User.findById(booking.user).session(session);
        if (!user) {
            await session.abortTransaction();
            res.status(404).json({ success: false, message: 'User not found' });
            return;
        }
        const finalPrice = booking.estimatedPrice;
        let paidFromWallet = 0;
        let paidFromBonus = 0;
        let remainingToPay = finalPrice;
        if (paymentOption === 'use_bonus') {
            // First use bonus balance, then main wallet
            if (user.bonusBalance >= remainingToPay) {
                paidFromBonus = remainingToPay;
                remainingToPay = 0;
            }
            else {
                paidFromBonus = user.bonusBalance;
                remainingToPay -= paidFromBonus;
                if (user.walletBalance >= remainingToPay) {
                    paidFromWallet = remainingToPay;
                    remainingToPay = 0;
                }
                else {
                    paidFromWallet = user.walletBalance;
                    remainingToPay -= paidFromWallet;
                }
            }
        }
        else {
            // use_main_only - Only use main wallet balance
            if (user.walletBalance >= remainingToPay) {
                paidFromWallet = remainingToPay;
                remainingToPay = 0;
            }
            else {
                paidFromWallet = user.walletBalance;
                remainingToPay -= paidFromWallet;
            }
        }
        // If there's still remaining amount, it needs to be paid by other means
        // For now, we'll still complete but record the remaining amount
        const balanceBefore = user.walletBalance;
        const bonusBalanceBefore = user.bonusBalance;
        user.walletBalance -= paidFromWallet;
        user.bonusBalance -= paidFromBonus;
        await user.save({ session });
        // Generate invoice number
        const invoiceNumber = `INV-${Date.now()}-${booking._id.toString().slice(-6).toUpperCase()}`;
        booking.actualCheckOut = new Date();
        booking.finalPrice = finalPrice;
        booking.paidFromWallet = paidFromWallet;
        booking.paidFromBonus = paidFromBonus;
        booking.paymentOption = paymentOption;
        booking.status = 'completed';
        booking.paymentStatus = remainingToPay === 0 ? 'paid' : 'pending';
        booking.invoiceNumber = invoiceNumber;
        booking.checkoutNote = checkoutNote;
        await booking.save({ session });
        // Create wallet transaction if paid from wallet
        if (paidFromWallet > 0 || paidFromBonus > 0) {
            await models_1.WalletTransaction.create([{
                    user: user._id,
                    type: 'payment',
                    amount: paidFromWallet + paidFromBonus,
                    balanceBefore,
                    balanceAfter: user.walletBalance,
                    bonusBalanceBefore,
                    bonusBalanceAfter: user.bonusBalance,
                    description: `Thanh toán phòng - ${invoiceNumber}`,
                    reference: booking._id,
                    referenceModel: 'Booking',
                    status: 'completed',
                }], { session });
        }
        await session.commitTransaction();
        const populatedBooking = await models_1.Booking.findById(booking._id)
            .populate('user', 'fullName email phone walletBalance bonusBalance')
            .populate('hotel', 'name address city')
            .populate('room', 'name type price')
            .populate('services.service', 'name price icon');
        res.status(200).json({
            success: true,
            data: {
                booking: populatedBooking,
                payment: {
                    totalAmount: finalPrice,
                    paidFromWallet,
                    paidFromBonus,
                    remainingToPay,
                    invoiceNumber,
                },
            },
            message: remainingToPay === 0 ? 'Checkout successful' : `Checkout completed. Remaining to pay: ${remainingToPay.toLocaleString()} VND`,
        });
    }
    catch (error) {
        await session.abortTransaction();
        next(error);
    }
    finally {
        session.endSession();
    }
};
exports.checkoutBooking = checkoutBooking;
// @desc    Pay booking with wallet
// @route   POST /api/bookings/:id/pay-wallet
// @access  Private
const payWithWallet = async (req, res, next) => {
    const session = await mongoose_1.default.startSession();
    session.startTransaction();
    try {
        const { paymentOption } = req.body; // 'use_bonus' | 'use_main_only'
        const booking = await models_1.Booking.findById(req.params.id).session(session);
        if (!booking) {
            await session.abortTransaction();
            res.status(404).json({ success: false, message: 'Booking not found' });
            return;
        }
        if (booking.user.toString() !== req.user?._id.toString()) {
            await session.abortTransaction();
            res.status(403).json({ success: false, message: 'Not authorized' });
            return;
        }
        if (booking.paymentStatus === 'paid') {
            await session.abortTransaction();
            res.status(400).json({ success: false, message: 'Booking already paid' });
            return;
        }
        const user = await models_1.User.findById(booking.user).session(session);
        if (!user) {
            await session.abortTransaction();
            res.status(404).json({ success: false, message: 'User not found' });
            return;
        }
        const amountToPay = booking.totalPrice;
        let paidFromWallet = 0;
        let paidFromBonus = 0;
        let remainingToPay = amountToPay;
        if (paymentOption === 'use_bonus') {
            if (user.bonusBalance >= remainingToPay) {
                paidFromBonus = remainingToPay;
                remainingToPay = 0;
            }
            else {
                paidFromBonus = user.bonusBalance;
                remainingToPay -= paidFromBonus;
                if (user.walletBalance >= remainingToPay) {
                    paidFromWallet = remainingToPay;
                    remainingToPay = 0;
                }
                else {
                    await session.abortTransaction();
                    res.status(400).json({
                        success: false,
                        message: `Insufficient balance. Need ${amountToPay.toLocaleString()} VND, have ${(user.walletBalance + user.bonusBalance).toLocaleString()} VND`
                    });
                    return;
                }
            }
        }
        else {
            if (user.walletBalance >= remainingToPay) {
                paidFromWallet = remainingToPay;
                remainingToPay = 0;
            }
            else {
                await session.abortTransaction();
                res.status(400).json({
                    success: false,
                    message: `Insufficient wallet balance. Need ${amountToPay.toLocaleString()} VND, have ${user.walletBalance.toLocaleString()} VND`
                });
                return;
            }
        }
        const balanceBefore = user.walletBalance;
        const bonusBalanceBefore = user.bonusBalance;
        user.walletBalance -= paidFromWallet;
        user.bonusBalance -= paidFromBonus;
        await user.save({ session });
        booking.paymentMethod = 'wallet';
        booking.paymentOption = paymentOption;
        booking.paidFromWallet = paidFromWallet;
        booking.paidFromBonus = paidFromBonus;
        booking.paymentStatus = 'paid';
        booking.status = 'confirmed';
        await booking.save({ session });
        await models_1.WalletTransaction.create([{
                user: user._id,
                type: 'payment',
                amount: paidFromWallet + paidFromBonus,
                balanceBefore,
                balanceAfter: user.walletBalance,
                bonusBalanceBefore,
                bonusBalanceAfter: user.bonusBalance,
                description: `Thanh toán đặt phòng - ${booking._id}`,
                reference: booking._id,
                referenceModel: 'Booking',
                status: 'completed',
            }], { session });
        await session.commitTransaction();
        const populatedBooking = await models_1.Booking.findById(booking._id)
            .populate('user', 'fullName email phone walletBalance bonusBalance')
            .populate('hotel', 'name address city')
            .populate('room', 'name type price')
            .populate('services.service', 'name price');
        res.status(200).json({
            success: true,
            data: {
                booking: populatedBooking,
                payment: {
                    totalAmount: amountToPay,
                    paidFromWallet,
                    paidFromBonus,
                },
            },
            message: 'Payment successful',
        });
    }
    catch (error) {
        await session.abortTransaction();
        next(error);
    }
    finally {
        session.endSession();
    }
};
exports.payWithWallet = payWithWallet;
// @desc    Get invoice data for printing
// @route   GET /api/bookings/:id/invoice
// @access  Private
const getInvoice = async (req, res, next) => {
    try {
        const booking = await models_1.Booking.findById(req.params.id)
            .populate('user', 'fullName email phone')
            .populate('hotel', 'name address city phone')
            .populate('room', 'name type price')
            .populate('services.service', 'name price');
        if (!booking) {
            res.status(404).json({ success: false, message: 'Booking not found' });
            return;
        }
        // Check authorization
        if (req.user?.role !== 'admin' && booking.user._id.toString() !== req.user?._id.toString()) {
            res.status(403).json({ success: false, message: 'Not authorized' });
            return;
        }
        const nights = (0, helpers_1.calculateNights)(new Date(booking.checkIn), new Date(booking.checkOut));
        const invoice = {
            invoiceNumber: booking.invoiceNumber || `INV-${booking._id.toString().slice(-8).toUpperCase()}`,
            createdAt: booking.updatedAt || booking.createdAt,
            hotel: booking.hotel,
            guest: {
                name: booking.contactInfo.fullName,
                email: booking.contactInfo.email,
                phone: booking.contactInfo.phone,
            },
            room: booking.room,
            checkIn: booking.checkIn,
            checkOut: booking.checkOut,
            actualCheckIn: booking.actualCheckIn,
            actualCheckOut: booking.actualCheckOut,
            nights,
            items: [
                {
                    description: `${booking.room.name} x ${nights} đêm`,
                    quantity: nights,
                    unitPrice: booking.room.price,
                    total: booking.roomPrice,
                },
                ...booking.services.map(s => ({
                    description: s.service.name,
                    quantity: s.quantity,
                    unitPrice: s.price,
                    total: s.price * s.quantity,
                })),
            ],
            subtotal: booking.estimatedPrice || booking.totalPrice,
            paidFromWallet: booking.paidFromWallet || 0,
            paidFromBonus: booking.paidFromBonus || 0,
            totalPaid: (booking.paidFromWallet || 0) + (booking.paidFromBonus || 0),
            finalAmount: booking.finalPrice || booking.totalPrice,
            status: booking.status,
            paymentStatus: booking.paymentStatus,
            paymentMethod: booking.paymentMethod,
        };
        res.status(200).json({
            success: true,
            data: invoice,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getInvoice = getInvoice;
//# sourceMappingURL=bookingController.js.map