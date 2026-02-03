import { Request, Response, NextFunction } from 'express';
import { Room, Booking } from '../models';
import { updateHotelPriceRange } from './hotelController';
import { getPagination, createPaginationResponse } from '../utils/helpers';

// @desc    Get rooms of a hotel
// @route   GET /api/hotels/:hotelId/rooms
// @access  Public
export const getRooms = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { hotelId } = req.params;
    const { page, limit, skip } = getPagination(req);
    const { type, minPrice, maxPrice, capacity } = req.query;

    const query: any = { hotel: hotelId, isActive: true };

    if (type) {
      query.type = type;
    }

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseInt(minPrice as string);
      if (maxPrice) query.price.$lte = parseInt(maxPrice as string);
    }

    if (capacity) {
      query['capacity.adults'] = { $gte: parseInt(capacity as string) };
    }

    const [rooms, total] = await Promise.all([
      Room.find(query).populate('category').skip(skip).limit(limit).sort({ price: 1 }).lean(),
      Room.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: rooms,
      pagination: createPaginationResponse(page, limit, total),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single room
// @route   GET /api/rooms/:id
// @access  Public
export const getRoom = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const room = await Room.findById(req.params.id).populate('hotel').lean();

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
  } catch (error) {
    next(error);
  }
};

// @desc    Create room
// @route   POST /api/hotels/:hotelId/rooms
// @access  Private/Admin
export const createRoom = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { hotelId } = req.params;
    req.body.hotel = hotelId;

    const room = await Room.create(req.body);

    // Update hotel price range
    await updateHotelPriceRange(hotelId as string);

    res.status(201).json({
      success: true,
      data: room,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update room
// @route   PUT /api/rooms/:id
// @access  Private/Admin
export const updateRoom = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const room = await Room.findByIdAndUpdate(req.params.id, req.body, {
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
      await updateHotelPriceRange(room.hotel.toString());
    }

    res.status(200).json({
      success: true,
      data: room,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete room
// @route   DELETE /api/rooms/:id
// @access  Private/Admin
export const deleteRoom = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const room = await Room.findById(req.params.id);

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
    await updateHotelPriceRange(room.hotel.toString());

    res.status(200).json({
      success: true,
      message: 'Đã xóa phòng',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload room images
// @route   POST /api/rooms/:id/images
// @access  Private/Admin
export const uploadRoomImages = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const room = await Room.findById(req.params.id);

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

    const imageUrls = (req.files as any[]).map((file) => file.path);
    room.images.push(...imageUrls);
    await room.save();

    res.status(200).json({
      success: true,
      data: room,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Check room availability
// @route   GET /api/rooms/availability
// @access  Public
export const checkAvailability = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { roomId, checkIn, checkOut } = req.query;

    if (!roomId || !checkIn || !checkOut) {
      res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp roomId, checkIn và checkOut',
      });
      return;
    }

    const room = await Room.findById(roomId).lean();

    if (!room) {
      res.status(404).json({
        success: false,
        message: 'Không tìm thấy phòng',
      });
      return;
    }

    const checkInDate = new Date(checkIn as string);
    const checkOutDate = new Date(checkOut as string);

    // Count booked rooms for this period
    const bookedRooms = await Booking.countDocuments({
      room: roomId,
      status: { $in: ['pending', 'confirmed'] },
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
  } catch (error) {
    next(error);
  }
};

// @desc    Get available rooms for hotel with dates
// @route   GET /api/hotels/:hotelId/rooms/available
// @access  Public
export const getAvailableRooms = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
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

    const checkInDate = new Date(checkIn as string);
    const checkOutDate = new Date(checkOut as string);

    // Get all active rooms for this hotel
    const rooms = await Room.find({ hotel: hotelId, isActive: true }).lean();

    // For each room, check availability
    const availableRooms = await Promise.all(
      rooms.map(async (room) => {
        const bookedRooms = await Booking.countDocuments({
          room: room._id,
          status: { $in: ['pending', 'confirmed'] },
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
          const totalGuests =
            parseInt(adults as string) + parseInt((children as string) || '0');
          if (room.capacity.adults + room.capacity.children < totalGuests) {
            return null;
          }
        }

        return {
          ...room,
          availableQuantity,
          isAvailable: availableQuantity > 0,
        };
      })
    );

    // Filter out null values and unavailable rooms
    const filteredRooms = availableRooms.filter(
      (room) => room !== null && room.isAvailable
    );

    res.status(200).json({
      success: true,
      data: filteredRooms,
    });
  } catch (error) {
    next(error);
  }
};
