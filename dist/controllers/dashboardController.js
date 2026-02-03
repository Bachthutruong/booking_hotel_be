"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTopHotels = exports.getRecentBookings = exports.getBookingsChart = exports.getRevenueByMonth = exports.getStats = void 0;
const models_1 = require("../models");
// @desc    Get dashboard stats
// @route   GET /api/dashboard/stats
// @access  Private/Admin
const getStats = async (req, res, next) => {
    try {
        const [totalUsers, totalHotels, totalRooms, totalBookings, pendingBookings, confirmedBookings, completedBookings, cancelledBookings, totalRevenue, totalReviews,] = await Promise.all([
            models_1.User.countDocuments({ role: 'user' }),
            models_1.Hotel.countDocuments({ isActive: true }),
            models_1.Room.countDocuments({ isActive: true }),
            models_1.Booking.countDocuments(),
            models_1.Booking.countDocuments({ status: 'pending' }),
            models_1.Booking.countDocuments({ status: 'confirmed' }),
            models_1.Booking.countDocuments({ status: 'completed' }),
            models_1.Booking.countDocuments({ status: 'cancelled' }),
            models_1.Booking.aggregate([
                { $match: { paymentStatus: 'paid' } },
                { $group: { _id: null, total: { $sum: '$totalPrice' } } },
            ]),
            models_1.Review.countDocuments({ isApproved: true }),
        ]);
        res.status(200).json({
            success: true,
            data: {
                users: totalUsers,
                hotels: totalHotels,
                rooms: totalRooms,
                bookings: {
                    total: totalBookings,
                    pending: pendingBookings,
                    confirmed: confirmedBookings,
                    completed: completedBookings,
                    cancelled: cancelledBookings,
                },
                revenue: totalRevenue[0]?.total || 0,
                reviews: totalReviews,
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getStats = getStats;
// @desc    Get revenue by month
// @route   GET /api/dashboard/revenue
// @access  Private/Admin
const getRevenueByMonth = async (req, res, next) => {
    try {
        const { year } = req.query;
        const selectedYear = parseInt(year) || new Date().getFullYear();
        const revenueByMonth = await models_1.Booking.aggregate([
            {
                $match: {
                    paymentStatus: 'paid',
                    createdAt: {
                        $gte: new Date(`${selectedYear}-01-01`),
                        $lt: new Date(`${selectedYear + 1}-01-01`),
                    },
                },
            },
            {
                $group: {
                    _id: { $month: '$createdAt' },
                    revenue: { $sum: '$totalPrice' },
                    count: { $sum: 1 },
                },
            },
            { $sort: { _id: 1 } },
        ]);
        // Fill in missing months with 0
        const months = Array.from({ length: 12 }, (_, i) => {
            const monthData = revenueByMonth.find((r) => r._id === i + 1);
            return {
                month: i + 1,
                revenue: monthData?.revenue || 0,
                count: monthData?.count || 0,
            };
        });
        res.status(200).json({
            success: true,
            data: months,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getRevenueByMonth = getRevenueByMonth;
// @desc    Get bookings chart data
// @route   GET /api/dashboard/bookings-chart
// @access  Private/Admin
const getBookingsChart = async (req, res, next) => {
    try {
        const { days } = req.query;
        const numDays = parseInt(days) || 30;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - numDays);
        const bookingsByDay = await models_1.Booking.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate },
                },
            },
            {
                $group: {
                    _id: {
                        $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
                    },
                    count: { $sum: 1 },
                    revenue: {
                        $sum: {
                            $cond: [{ $eq: ['$paymentStatus', 'paid'] }, '$totalPrice', 0],
                        },
                    },
                },
            },
            { $sort: { _id: 1 } },
        ]);
        res.status(200).json({
            success: true,
            data: bookingsByDay,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getBookingsChart = getBookingsChart;
// @desc    Get recent bookings
// @route   GET /api/dashboard/recent-bookings
// @access  Private/Admin
const getRecentBookings = async (req, res, next) => {
    try {
        const { limit } = req.query;
        const numLimit = parseInt(limit) || 10;
        const recentBookings = await models_1.Booking.find()
            .populate('user', 'fullName email')
            .populate('hotel', 'name')
            .populate('room', 'name type')
            .sort({ createdAt: -1 })
            .limit(numLimit);
        res.status(200).json({
            success: true,
            data: recentBookings,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getRecentBookings = getRecentBookings;
// @desc    Get top hotels
// @route   GET /api/dashboard/top-hotels
// @access  Private/Admin
const getTopHotels = async (req, res, next) => {
    try {
        const topHotels = await models_1.Booking.aggregate([
            { $match: { status: { $in: ['confirmed', 'completed'] } } },
            {
                $group: {
                    _id: '$hotel',
                    totalBookings: { $sum: 1 },
                    totalRevenue: { $sum: '$totalPrice' },
                },
            },
            { $sort: { totalBookings: -1 } },
            { $limit: 5 },
            {
                $lookup: {
                    from: 'hotels',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'hotel',
                },
            },
            { $unwind: '$hotel' },
            {
                $project: {
                    _id: '$hotel._id',
                    name: '$hotel.name',
                    city: '$hotel.city',
                    images: '$hotel.images',
                    rating: '$hotel.rating',
                    totalBookings: 1,
                    totalRevenue: 1,
                },
            },
        ]);
        res.status(200).json({
            success: true,
            data: topHotels,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getTopHotels = getTopHotels;
//# sourceMappingURL=dashboardController.js.map