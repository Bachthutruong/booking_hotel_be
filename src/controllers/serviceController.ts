import { Request, Response, NextFunction } from 'express';
import { Service } from '../models';
import { AuthRequest } from '../types';

// @desc    Get all services
// @route   GET /api/services
// @access  Public
export const getServices = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const services = await Service.find({ isActive: true });
    res.status(200).json({
      success: true,
      data: services,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all services (Admin)
// @route   GET /api/services/admin
// @access  Private/Admin
export const getAdminServices = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const total = await Service.countDocuments();
    const services = await Service.find()
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: services,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single service
// @route   GET /api/services/:id
// @access  Public
export const getService = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const service = await Service.findById(req.params.id);

    if (!service) {
      res.status(404).json({
        success: false,
        message: 'Không tìm thấy dịch vụ',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: service,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create service
// @route   POST /api/services
// @access  Private/Admin
export const createService = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const service = await Service.create(req.body);

    res.status(201).json({
      success: true,
      data: service,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update service
// @route   PUT /api/services/:id
// @access  Private/Admin
export const updateService = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const service = await Service.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!service) {
      res.status(404).json({
        success: false,
        message: 'Không tìm thấy dịch vụ',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: service,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete service
// @route   DELETE /api/services/:id
// @access  Private/Admin
export const deleteService = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const service = await Service.findById(req.params.id);

    if (!service) {
      res.status(404).json({
        success: false,
        message: 'Không tìm thấy dịch vụ',
      });
      return;
    }

    await service.deleteOne();

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get service by QR code (for scanning)
// @route   GET /api/services/qr/:serviceId
// @access  Public
export const getServiceByQR = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const service = await Service.findById(req.params.serviceId);

    if (!service || !service.isActive) {
      res.status(404).json({
        success: false,
        message: 'Dịch vụ không tồn tại hoặc không khả dụng',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: service,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Generate QR code data for service
// @route   GET /api/services/:id/qr-data
// @access  Private/Admin
export const getServiceQRData = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const service = await Service.findById(req.params.id);

    if (!service) {
      res.status(404).json({
        success: false,
        message: 'Không tìm thấy dịch vụ',
      });
      return;
    }

    // QR data contains service ID and a link to add it
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const qrData = {
      serviceId: service._id,
      name: service.name,
      price: service.price,
      // URL that can be scanned to add service to current booking
      scanUrl: `${baseUrl}/scan-service/${service._id}`,
      // Direct API endpoint
      apiEndpoint: `/api/services/qr/${service._id}`,
    };

    res.status(200).json({
      success: true,
      data: qrData,
    });
  } catch (error) {
    next(error);
  }
};
