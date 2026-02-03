import { Request, Response, NextFunction } from 'express';
import { Review, Hotel, Booking } from '../models';
import { AuthRequest } from '../types';
import { getPagination, createPaginationResponse } from '../utils/helpers';

// @desc    Get reviews of a hotel
// @route   GET /api/hotels/:hotelId/reviews
// @access  Public
export const getReviews = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { hotelId } = req.params;
    const { page, limit, skip } = getPagination(req);
    const { rating } = req.query;

    const query: any = { hotel: hotelId, isApproved: true };

    if (rating) {
      query.rating = parseInt(rating as string);
    }

    const [reviews, total] = await Promise.all([
      Review.find(query)
        .populate('user', 'fullName avatar')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      Review.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: reviews,
      pagination: createPaginationResponse(page, limit, total),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create review
// @route   POST /api/hotels/:hotelId/reviews
// @access  Private
export const createReview = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { hotelId } = req.params;
    const { bookingId, rating, comment, images } = req.body;

    // Check if hotel exists
    const hotel = await Hotel.findById(hotelId);
    if (!hotel) {
      res.status(404).json({
        success: false,
        message: 'Không tìm thấy khách sạn',
      });
      return;
    }

    // Check if user has a completed booking
    const booking = await Booking.findOne({
      _id: bookingId,
      user: req.user?._id,
      hotel: hotelId,
      status: 'completed',
    });

    if (!booking) {
      res.status(400).json({
        success: false,
        message: 'Bạn cần hoàn thành đơn đặt phòng trước khi đánh giá',
      });
      return;
    }

    // Check if already reviewed this booking
    const existingReview = await Review.findOne({
      user: req.user?._id,
      booking: bookingId,
    });

    if (existingReview) {
      res.status(400).json({
        success: false,
        message: 'Bạn đã đánh giá đơn đặt phòng này rồi',
      });
      return;
    }

    // Create review
    const review = await Review.create({
      user: req.user?._id,
      hotel: hotelId,
      booking: bookingId,
      rating,
      comment,
      images: images || [],
      isApproved: true,
    });

    // Update hotel rating
    await updateHotelRating(hotelId as string);

    const populatedReview = await Review.findById(review._id).populate(
      'user',
      'fullName avatar'
    );

    res.status(201).json({
      success: true,
      data: populatedReview,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update review
// @route   PUT /api/reviews/:id
// @access  Private
export const updateReview = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { rating, comment, images } = req.body;

    const review = await Review.findById(req.params.id);

    if (!review) {
      res.status(404).json({
        success: false,
        message: 'Không tìm thấy đánh giá',
      });
      return;
    }

    // Check ownership
    if (
      req.user?.role !== 'admin' &&
      review.user.toString() !== req.user?._id.toString()
    ) {
      res.status(403).json({
        success: false,
        message: 'Bạn không có quyền sửa đánh giá này',
      });
      return;
    }

    if (rating !== undefined) review.rating = rating;
    if (comment !== undefined) review.comment = comment;
    if (images !== undefined) review.images = images;

    await review.save();

    // Update hotel rating
    await updateHotelRating(review.hotel.toString());

    const populatedReview = await Review.findById(review._id).populate(
      'user',
      'fullName avatar'
    );

    res.status(200).json({
      success: true,
      data: populatedReview,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete review
// @route   DELETE /api/reviews/:id
// @access  Private
export const deleteReview = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      res.status(404).json({
        success: false,
        message: 'Không tìm thấy đánh giá',
      });
      return;
    }

    // Check ownership
    if (
      req.user?.role !== 'admin' &&
      review.user.toString() !== req.user?._id.toString()
    ) {
      res.status(403).json({
        success: false,
        message: 'Bạn không có quyền xóa đánh giá này',
      });
      return;
    }

    const hotelId = review.hotel.toString();
    await review.deleteOne();

    // Update hotel rating
    await updateHotelRating(hotelId);

    res.status(200).json({
      success: true,
      message: 'Đã xóa đánh giá',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all reviews (Admin)
// @route   GET /api/reviews
// @access  Private/Admin
export const getAllReviews = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { page, limit, skip } = getPagination(req);
    const { isApproved, rating } = req.query;

    const query: any = {};

    if (isApproved !== undefined) {
      query.isApproved = isApproved === 'true';
    }

    if (rating) {
      query.rating = parseInt(rating as string);
    }

    const [reviews, total] = await Promise.all([
      Review.find(query)
        .populate('user', 'fullName email avatar')
        .populate('hotel', 'name')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      Review.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: reviews,
      pagination: createPaginationResponse(page, limit, total),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Approve/Reject review (Admin)
// @route   PUT /api/reviews/:id/approve
// @access  Private/Admin
export const approveReview = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { isApproved } = req.body;

    const review = await Review.findByIdAndUpdate(
      req.params.id,
      { isApproved },
      { new: true }
    ).populate('user', 'fullName avatar');

    if (!review) {
      res.status(404).json({
        success: false,
        message: 'Không tìm thấy đánh giá',
      });
      return;
    }

    // Update hotel rating
    await updateHotelRating(review.hotel.toString());

    res.status(200).json({
      success: true,
      data: review,
    });
  } catch (error) {
    next(error);
  }
};

// Helper function to update hotel rating
const updateHotelRating = async (hotelId: string): Promise<void> => {
  const stats = await Review.aggregate([
    { $match: { hotel: hotelId, isApproved: true } },
    {
      $group: {
        _id: '$hotel',
        avgRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 },
      },
    },
  ]);

  if (stats.length > 0) {
    await Hotel.findByIdAndUpdate(hotelId, {
      rating: Math.round(stats[0].avgRating * 10) / 10,
      totalReviews: stats[0].totalReviews,
    });
  } else {
    await Hotel.findByIdAndUpdate(hotelId, {
      rating: 0,
      totalReviews: 0,
    });
  }
};
