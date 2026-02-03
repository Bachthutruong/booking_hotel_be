import { Request, Response, NextFunction } from 'express';
import { User, Hotel, Room, Booking, Review } from '../models';

// @desc    Get dashboard stats
// @route   GET /api/dashboard/stats
// @access  Private/Admin
export const getStats = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const [
      totalUsers,
      totalHotels,
      totalRooms,
      totalBookings,
      pendingBookings,
      confirmedBookings,
      completedBookings,
      cancelledBookings,
      totalRevenue,
      totalReviews,
    ] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      Hotel.countDocuments({ isActive: true }),
      Room.countDocuments({ isActive: true }),
      Booking.countDocuments(),
      Booking.countDocuments({ status: 'pending' }),
      Booking.countDocuments({ status: 'confirmed' }),
      Booking.countDocuments({ status: 'completed' }),
      Booking.countDocuments({ status: 'cancelled' }),
      Booking.aggregate([
        { $match: { paymentStatus: 'paid' } },
        { $group: { _id: null, total: { $sum: '$totalPrice' } } },
      ]),
      Review.countDocuments({ isApproved: true }),
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
  } catch (error) {
    next(error);
  }
};

// @desc    Get revenue by month
// @route   GET /api/dashboard/revenue
// @access  Private/Admin
export const getRevenueByMonth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { year } = req.query;
    const selectedYear = parseInt(year as string) || new Date().getFullYear();

    const revenueByMonth = await Booking.aggregate([
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
  } catch (error) {
    next(error);
  }
};

// @desc    Get bookings chart data
// @route   GET /api/dashboard/bookings-chart
// @access  Private/Admin
export const getBookingsChart = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { days } = req.query;
    const numDays = parseInt(days as string) || 30;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - numDays);

    const bookingsByDay = await Booking.aggregate([
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
  } catch (error) {
    next(error);
  }
};

// @desc    Get recent bookings
// @route   GET /api/dashboard/recent-bookings
// @access  Private/Admin
export const getRecentBookings = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { limit } = req.query;
    const numLimit = parseInt(limit as string) || 10;

    const recentBookings = await Booking.find()
      .populate('user', 'fullName email')
      .populate('hotel', 'name')
      .populate('room', 'name type')
      .sort({ createdAt: -1 })
      .limit(numLimit);

    res.status(200).json({
      success: true,
      data: recentBookings,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get top hotels
// @route   GET /api/dashboard/top-hotels
// @access  Private/Admin
export const getTopHotels = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const topHotels = await Booking.aggregate([
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
  } catch (error) {
    next(error);
  }
};
