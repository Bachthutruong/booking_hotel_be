import { Request, Response, NextFunction } from 'express';
import { SystemConfig } from '../models';
import { AuthRequest } from '../types';

// @desc    Get system config by key
// @route   GET /api/config/:key
// @access  Public (or Private depending on key, but for now Public for bank info)
export const getSystemConfig = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const config = await SystemConfig.findOne({ key: req.params.key });

    if (!config) {
      res.status(404).json({
        success: false,
        message: 'Config not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: config,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update/Create system config
// @route   POST /api/config
// @access  Private/Admin
export const updateSystemConfig = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { key, value } = req.body;

    const config = await SystemConfig.findOneAndUpdate(
      { key },
      { value },
      { new: true, upsert: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: config,
    });
  } catch (error) {
    next(error);
  }
};
