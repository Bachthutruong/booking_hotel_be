import { Request, Response } from 'express';
import { ServiceCategory, Service } from '../models';
import { AuthRequest, ApiResponse } from '../types';

// Get all service categories (public - active only)
export const getServiceCategories = async (req: Request, res: Response<ApiResponse>): Promise<void> => {
  try {
    const categories = await ServiceCategory.find({ isActive: true }).sort({ order: 1 });
    res.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// Get all service categories including inactive (admin)
export const getAllServiceCategories = async (req: AuthRequest, res: Response<ApiResponse>): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 100;
    const skip = (page - 1) * limit;

    const [categories, total] = await Promise.all([
      ServiceCategory.find().sort({ order: 1 }).skip(skip).limit(limit),
      ServiceCategory.countDocuments(),
    ]);

    const categoriesWithCount = await Promise.all(
      categories.map(async (category) => {
        const serviceCount = await Service.countDocuments({ category: category._id });
        return {
          ...category.toObject(),
          serviceCount,
        };
      })
    );

    res.json({
      success: true,
      data: categoriesWithCount,
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

// Get category by ID
export const getServiceCategoryById = async (req: Request, res: Response<ApiResponse>): Promise<void> => {
  try {
    const category = await ServiceCategory.findById(req.params.id);
    if (!category) {
      res.status(404).json({
        success: false,
        message: 'Danh mục không tồn tại',
      });
      return;
    }
    const serviceCount = await Service.countDocuments({ category: category._id });
    res.json({
      success: true,
      data: { ...category.toObject(), serviceCount },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// Create category (admin)
export const createServiceCategory = async (req: AuthRequest, res: Response<ApiResponse>): Promise<void> => {
  try {
    const { name, description, icon, order } = req.body;

    if (!name) {
      res.status(400).json({
        success: false,
        message: 'Tên danh mục là bắt buộc',
      });
      return;
    }

    const existing = await ServiceCategory.findOne({ name });
    if (existing) {
      res.status(400).json({
        success: false,
        message: 'Đã tồn tại danh mục cùng tên',
      });
      return;
    }

    const category = await ServiceCategory.create({
      name,
      description: description || '',
      icon,
      order: order ?? 0,
    });

    res.status(201).json({
      success: true,
      message: 'Đã tạo danh mục dịch vụ',
      data: category,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// Update category (admin)
export const updateServiceCategory = async (req: AuthRequest, res: Response<ApiResponse>): Promise<void> => {
  try {
    const { name, description, icon, order, isActive } = req.body;

    const category = await ServiceCategory.findById(req.params.id);
    if (!category) {
      res.status(404).json({
        success: false,
        message: 'Danh mục không tồn tại',
      });
      return;
    }

    if (name && name !== category.name) {
      const existing = await ServiceCategory.findOne({ name, _id: { $ne: category._id } });
      if (existing) {
        res.status(400).json({
          success: false,
          message: 'Đã tồn tại danh mục cùng tên',
        });
        return;
      }
      category.name = name;
    }
    if (description !== undefined) category.description = description;
    if (icon !== undefined) category.icon = icon;
    if (order !== undefined) category.order = order;
    if (isActive !== undefined) category.isActive = isActive;

    await category.save();

    res.json({
      success: true,
      message: 'Đã cập nhật danh mục',
      data: category,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// Delete category (admin)
export const deleteServiceCategory = async (req: AuthRequest, res: Response<ApiResponse>): Promise<void> => {
  try {
    const category = await ServiceCategory.findById(req.params.id);
    if (!category) {
      res.status(404).json({
        success: false,
        message: 'Danh mục không tồn tại',
      });
      return;
    }

    const serviceCount = await Service.countDocuments({ category: category._id });
    if (serviceCount > 0) {
      res.status(400).json({
        success: false,
        message: `Không thể xóa. Có ${serviceCount} dịch vụ đang dùng danh mục này.`,
      });
      return;
    }

    await category.deleteOne();

    res.json({
      success: true,
      message: 'Đã xóa danh mục',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};
