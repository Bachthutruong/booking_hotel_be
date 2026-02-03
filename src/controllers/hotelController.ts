import { Request, Response, NextFunction } from 'express';
import { Hotel, Room } from '../models';
import { getPagination, createPaginationResponse } from '../utils/helpers';

// @desc    Get all hotels
// @route   GET /api/hotels
// @access  Public
export const getHotels = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { page, limit, skip } = getPagination(req);
    const {
      search,
      city,
      minPrice,
      maxPrice,
      rating,
      amenities,
      sortBy,
    } = req.query;

    const query: any = { isActive: true };

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
      if (minPrice) query['priceRange.min'].$gte = parseInt(minPrice as string);
      if (maxPrice) query['priceRange.min'].$lte = parseInt(maxPrice as string);
    }

    // Filter by rating
    if (rating) {
      query.rating = { $gte: parseFloat(rating as string) };
    }

    // Filter by amenities
    if (amenities) {
      const amenitiesArray = (amenities as string).split(',');
      query.amenities = { $all: amenitiesArray };
    }

    // Sort options
    let sortOption: any = { createdAt: -1 };
    if (sortBy === 'price_asc') sortOption = { 'priceRange.min': 1 };
    if (sortBy === 'price_desc') sortOption = { 'priceRange.min': -1 };
    if (sortBy === 'rating') sortOption = { rating: -1 };
    if (sortBy === 'popular') sortOption = { totalReviews: -1 };

    const [hotels, total] = await Promise.all([
      Hotel.find(query).skip(skip).limit(limit).sort(sortOption).lean(),
      Hotel.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: hotels,
      pagination: createPaginationResponse(page, limit, total),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single hotel
// @route   GET /api/hotels/:id
// @access  Public
export const getHotel = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const hotel = await Hotel.findById(req.params.id).lean();

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
  } catch (error) {
    next(error);
  }
};

// @desc    Create hotel
// @route   POST /api/hotels
// @access  Private/Admin
export const createHotel = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const hotel = await Hotel.create(req.body);

    res.status(201).json({
      success: true,
      data: hotel,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update hotel
// @route   PUT /api/hotels/:id
// @access  Private/Admin
export const updateHotel = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const hotel = await Hotel.findByIdAndUpdate(req.params.id, req.body, {
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
  } catch (error) {
    next(error);
  }
};

// @desc    Delete hotel
// @route   DELETE /api/hotels/:id
// @access  Private/Admin
export const deleteHotel = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const hotel = await Hotel.findById(req.params.id);

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
    await Room.updateMany({ hotel: hotel._id }, { isActive: false });

    res.status(200).json({
      success: true,
      message: 'Đã xóa khách sạn',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload hotel images
// @route   POST /api/hotels/:id/images
// @access  Private/Admin
export const uploadHotelImages = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const hotel = await Hotel.findById(req.params.id);

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

    const imageUrls = (req.files as any[]).map((file) => file.path);
    hotel.images.push(...imageUrls);
    await hotel.save();

    res.status(200).json({
      success: true,
      data: hotel,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get featured hotels
// @route   GET /api/hotels/featured
// @access  Public
export const getFeaturedHotels = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const hotels = await Hotel.find({ isActive: true })
      .sort({ rating: -1, totalReviews: -1 })
      .limit(8)
      .lean();

    res.status(200).json({
      success: true,
      data: hotels,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get popular cities
// @route   GET /api/hotels/cities
// @access  Public
export const getPopularCities = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const cities = await Hotel.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$city', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    res.status(200).json({
      success: true,
      data: cities.map((c) => ({ city: c._id, count: c.count })),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update hotel price range (called when room prices change)
export const updateHotelPriceRange = async (hotelId: string): Promise<void> => {
  const rooms = await Room.find({ hotel: hotelId, isActive: true }).lean();

  if (rooms.length > 0) {
    const prices = rooms.map((r) => r.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);

    await Hotel.findByIdAndUpdate(hotelId, {
      priceRange: { min: minPrice, max: maxPrice },
    });
  }
};
