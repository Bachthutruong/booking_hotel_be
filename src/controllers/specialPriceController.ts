import { Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { RoomSpecialPrice, Room } from '../models';
import { AuthRequest } from '../types';
import { getPagination, createPaginationResponse } from '../utils/helpers';
import { computeRoomPriceBreakdown, getRoomPricePreview } from '../utils/specialPrice';

// @desc    Get all special price rules
// @route   GET /api/special-prices
// @access  Private/Admin
export const getSpecialPrices = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { page, limit, skip } = getPagination(req);
    const { type, isActive, roomId } = req.query;

    const query: any = {};
    if (type && type !== 'all') query.type = type;
    if (isActive !== undefined && isActive !== 'all') {
      query.isActive = isActive === 'true';
    }
    if (roomId) {
      query.rooms = new mongoose.Types.ObjectId(roomId as string);
    }

    const [rules, total] = await Promise.all([
      RoomSpecialPrice.find(query)
        .populate('rooms', 'name price hotel')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .lean(),
      RoomSpecialPrice.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: rules,
      pagination: createPaginationResponse(page, limit, total),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single special price rule
// @route   GET /api/special-prices/:id
// @access  Private/Admin
export const getSpecialPrice = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const rule = await RoomSpecialPrice.findById(req.params.id)
      .populate('rooms', 'name price hotel')
      .lean();

    if (!rule) {
      res.status(404).json({ success: false, message: 'Không tìm thấy rule giá đặc biệt' });
      return;
    }

    res.status(200).json({ success: true, data: rule });
  } catch (error) {
    next(error);
  }
};

// @desc    Create special price rule
// @route   POST /api/special-prices
// @access  Private/Admin
export const createSpecialPrice = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name, rooms, type, startDate, endDate, modifierType, modifierValue, isActive } = req.body;

    if (!name || !rooms || !Array.isArray(rooms) || rooms.length === 0 || !type || !modifierType || modifierValue == null) {
      res.status(400).json({
        success: false,
        message: 'Thiếu name, rooms (mảng), type, modifierType, modifierValue',
      });
      return;
    }

    if (!['date_range', 'weekend'].includes(type)) {
      res.status(400).json({ success: false, message: 'type phải là date_range hoặc weekend' });
      return;
    }

    if (!['percentage', 'fixed'].includes(modifierType)) {
      res.status(400).json({ success: false, message: 'modifierType phải là percentage hoặc fixed' });
      return;
    }

    const roomIds = rooms.map((id: string) => new mongoose.Types.ObjectId(id));

    if (type === 'date_range') {
      if (!startDate || !endDate) {
        res.status(400).json({ success: false, message: 'date_range cần startDate và endDate' });
        return;
      }
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (start > end) {
        res.status(400).json({ success: false, message: 'startDate phải trước hoặc bằng endDate' });
        return;
      }
    }

    const rule = await RoomSpecialPrice.create({
      name,
      rooms: roomIds,
      type,
      startDate: type === 'date_range' ? new Date(startDate) : undefined,
      endDate: type === 'date_range' ? new Date(endDate) : undefined,
      modifierType,
      modifierValue: Number(modifierValue),
      isActive: isActive !== false,
    });

    const populated = await RoomSpecialPrice.findById(rule._id)
      .populate('rooms', 'name price hotel')
      .lean();

    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    next(error);
  }
};

// @desc    Update special price rule
// @route   PUT /api/special-prices/:id
// @access  Private/Admin
export const updateSpecialPrice = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name, rooms, type, startDate, endDate, modifierType, modifierValue, isActive } = req.body;

    const rule = await RoomSpecialPrice.findById(req.params.id);
    if (!rule) {
      res.status(404).json({ success: false, message: 'Không tìm thấy rule' });
      return;
    }

    if (name != null) rule.name = name;
    if (rooms != null && Array.isArray(rooms)) {
      rule.rooms = rooms.map((id: string) => new mongoose.Types.ObjectId(id));
    }
    if (type != null) {
      if (!['date_range', 'weekend'].includes(type)) {
        res.status(400).json({ success: false, message: 'type phải là date_range hoặc weekend' });
        return;
      }
      rule.type = type;
      if (type === 'date_range') {
        if (startDate != null) rule.startDate = new Date(startDate);
        if (endDate != null) rule.endDate = new Date(endDate);
      } else {
        rule.startDate = undefined;
        rule.endDate = undefined;
      }
    }
    if (modifierType != null) {
      if (!['percentage', 'fixed'].includes(modifierType)) {
        res.status(400).json({ success: false, message: 'modifierType phải là percentage hoặc fixed' });
        return;
      }
      rule.modifierType = modifierType;
    }
    if (modifierValue != null) rule.modifierValue = Number(modifierValue);
    if (isActive !== undefined) rule.isActive = !!isActive;

    await rule.save();

    const populated = await RoomSpecialPrice.findById(rule._id)
      .populate('rooms', 'name price hotel')
      .lean();

    res.status(200).json({ success: true, data: populated });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete special price rule
// @route   DELETE /api/special-prices/:id
// @access  Private/Admin
export const deleteSpecialPrice = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const rule = await RoomSpecialPrice.findByIdAndDelete(req.params.id);
    if (!rule) {
      res.status(404).json({ success: false, message: 'Không tìm thấy rule' });
      return;
    }
    res.status(200).json({ success: true, message: 'Đã xóa rule giá đặc biệt' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get room price preview for date range (for booking form)
// @route   GET /api/special-prices/preview
// @access  Public (to show price when user selects dates)
export const previewRoomPrice = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { roomId, checkIn, checkOut } = req.query;
    if (!roomId || !checkIn || !checkOut) {
      res.status(400).json({
        success: false,
        message: 'Cần roomId, checkIn, checkOut',
      });
      return;
    }

    const checkInDate = new Date(checkIn as string);
    const checkOutDate = new Date(checkOut as string);
    if (checkInDate >= checkOutDate) {
      res.status(400).json({
        success: false,
        message: 'checkOut phải sau checkIn',
      });
      return;
    }

    const roomObjectId = new mongoose.Types.ObjectId(roomId as string);
    const result = await getRoomPricePreview(roomObjectId, checkInDate, checkOutDate);
    if (!result) {
      res.status(404).json({ success: false, message: 'Không tìm thấy phòng' });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        breakdown: result.breakdown,
        totalRoomPrice: result.totalRoomPrice,
        basePrice: result.basePrice,
      },
    });
  } catch (error) {
    next(error);
  }
};
