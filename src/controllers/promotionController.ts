import { Request, Response } from 'express';
import PromotionConfig from '../models/PromotionConfig';
import { AuthRequest, ApiResponse } from '../types';

// Get active promotions (public)
export const getActivePromotions = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const now = new Date();
    const promotions = await PromotionConfig.find({
      isActive: true,
      $or: [
        { startDate: null, endDate: null },
        { startDate: { $lte: now }, endDate: { $gte: now } },
        { startDate: { $lte: now }, endDate: null },
        { startDate: null, endDate: { $gte: now } },
      ],
    })
      .populate('hotel', 'name')
      .populate('room', 'name')
      .sort({ depositAmount: 1 });

    res.json({
      success: true,
      data: promotions,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// Get promotions for specific deposit amount
export const getPromotionForAmount = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const amount = parseInt(req.query.amount as string);
    if (!amount || amount < 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid amount is required',
      });
    }

    const now = new Date();
    const promotion = await PromotionConfig.findOne({
      isActive: true,
      depositAmount: { $lte: amount },
      $or: [
        { startDate: null, endDate: null },
        { startDate: { $lte: now }, endDate: { $gte: now } },
        { startDate: { $lte: now }, endDate: null },
        { startDate: null, endDate: { $gte: now } },
      ],
    })
      .sort({ depositAmount: -1 })
      .populate('hotel', 'name')
      .populate('room', 'name');

    if (!promotion) {
      return res.json({
        success: true,
        data: {
          bonusAmount: 0,
          message: 'No promotion available for this amount',
        },
      });
    }

    let bonusAmount = 0;
    if (promotion.bonusPercent) {
      bonusAmount = Math.floor(amount * promotion.bonusPercent / 100);
      if (promotion.maxBonus && bonusAmount > promotion.maxBonus) {
        bonusAmount = promotion.maxBonus;
      }
    } else if (promotion.bonusAmount) {
      bonusAmount = promotion.bonusAmount;
    }

    res.json({
      success: true,
      data: {
        promotion,
        bonusAmount,
        totalReceive: amount + bonusAmount,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// ADMIN: Get all promotions
export const getAllPromotions = async (req: AuthRequest, res: Response<ApiResponse>) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const hotelId = req.query.hotelId as string;
    const roomId = req.query.roomId as string;
    const isActive = req.query.isActive as string;
    const skip = (page - 1) * limit;

    const query: any = {};
    if (hotelId) query.hotel = hotelId;
    if (roomId) query.room = roomId;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const [promotions, total] = await Promise.all([
      PromotionConfig.find(query)
        .populate('hotel', 'name')
        .populate('room', 'name hotel')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      PromotionConfig.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: promotions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// ADMIN: Get promotion by ID
export const getPromotionById = async (req: AuthRequest, res: Response<ApiResponse>) => {
  try {
    const promotion = await PromotionConfig.findById(req.params.id)
      .populate('hotel', 'name')
      .populate('room', 'name hotel');

    if (!promotion) {
      return res.status(404).json({
        success: false,
        message: 'Promotion not found',
      });
    }

    res.json({
      success: true,
      data: promotion,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// ADMIN: Create promotion
export const createPromotion = async (req: AuthRequest, res: Response<ApiResponse>) => {
  try {
    const {
      hotel,
      room,
      name,
      description,
      depositAmount,
      bonusAmount,
      bonusPercent,
      minDeposit,
      maxBonus,
      startDate,
      endDate,
    } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Promotion name is required',
      });
    }

    if (depositAmount === undefined || depositAmount < 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid deposit amount is required',
      });
    }

    if (!bonusAmount && !bonusPercent) {
      return res.status(400).json({
        success: false,
        message: 'Either bonus amount or bonus percent is required',
      });
    }

    const promotion = await PromotionConfig.create({
      hotel: hotel || null,
      room: room || null,
      name,
      description,
      depositAmount,
      bonusAmount: bonusAmount || 0,
      bonusPercent: bonusPercent || null,
      minDeposit: minDeposit || null,
      maxBonus: maxBonus || null,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
    });

    res.status(201).json({
      success: true,
      message: 'Promotion created successfully',
      data: promotion,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// ADMIN: Update promotion
export const updatePromotion = async (req: AuthRequest, res: Response<ApiResponse>) => {
  try {
    const {
      hotel,
      room,
      name,
      description,
      depositAmount,
      bonusAmount,
      bonusPercent,
      minDeposit,
      maxBonus,
      isActive,
      startDate,
      endDate,
    } = req.body;

    const promotion = await PromotionConfig.findById(req.params.id);
    if (!promotion) {
      return res.status(404).json({
        success: false,
        message: 'Promotion not found',
      });
    }

    if (hotel !== undefined) promotion.hotel = hotel || undefined;
    if (room !== undefined) promotion.room = room || undefined;
    if (name) promotion.name = name;
    if (description !== undefined) promotion.description = description;
    if (depositAmount !== undefined) promotion.depositAmount = depositAmount;
    if (bonusAmount !== undefined) promotion.bonusAmount = bonusAmount;
    if (bonusPercent !== undefined) promotion.bonusPercent = bonusPercent || undefined;
    if (minDeposit !== undefined) promotion.minDeposit = minDeposit || undefined;
    if (maxBonus !== undefined) promotion.maxBonus = maxBonus || undefined;
    if (isActive !== undefined) promotion.isActive = isActive;
    if (startDate !== undefined) promotion.startDate = startDate ? new Date(startDate) : undefined;
    if (endDate !== undefined) promotion.endDate = endDate ? new Date(endDate) : undefined;

    await promotion.save();

    res.json({
      success: true,
      message: 'Promotion updated successfully',
      data: promotion,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// ADMIN: Delete promotion
export const deletePromotion = async (req: AuthRequest, res: Response<ApiResponse>) => {
  try {
    const promotion = await PromotionConfig.findById(req.params.id);
    if (!promotion) {
      return res.status(404).json({
        success: false,
        message: 'Promotion not found',
      });
    }

    await promotion.deleteOne();

    res.json({
      success: true,
      message: 'Promotion deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};
