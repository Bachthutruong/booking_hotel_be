import { Request, Response } from 'express';
import RoomCategory from '../models/RoomCategory';
import Room from '../models/Room';
import { AuthRequest, ApiResponse } from '../types';

// Get all categories (public)
export const getCategories = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const categories = await RoomCategory.find({ isActive: true }).sort({ order: 1 });
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

// Get all categories including inactive (admin)
export const getAllCategories = async (req: AuthRequest, res: Response<ApiResponse>) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const [categories, total] = await Promise.all([
      RoomCategory.find().sort({ order: 1 }).skip(skip).limit(limit),
      RoomCategory.countDocuments(),
    ]);

    // Get room count for each category
    const categoriesWithCount = await Promise.all(
      categories.map(async (category) => {
        const roomCount = await Room.countDocuments({ category: category._id, isActive: true });
        return {
          ...category.toObject(),
          roomCount,
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
export const getCategoryById = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const category = await RoomCategory.findById(req.params.id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
      });
    }

    const roomCount = await Room.countDocuments({ category: category._id, isActive: true });

    res.json({
      success: true,
      data: {
        ...category.toObject(),
        roomCount,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// Create category (admin)
export const createCategory = async (req: AuthRequest, res: Response<ApiResponse>) => {
  try {
    const { name, description, icon, order } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Category name is required',
      });
    }

    const existingCategory = await RoomCategory.findOne({ name });
    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: 'Category with this name already exists',
      });
    }

    const category = await RoomCategory.create({
      name,
      description,
      icon,
      order: order || 0,
    });

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
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
export const updateCategory = async (req: AuthRequest, res: Response<ApiResponse>) => {
  try {
    const { name, description, icon, order, isActive } = req.body;

    const category = await RoomCategory.findById(req.params.id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
      });
    }

    if (name && name !== category.name) {
      const existingCategory = await RoomCategory.findOne({ name, _id: { $ne: category._id } });
      if (existingCategory) {
        return res.status(400).json({
          success: false,
          message: 'Category with this name already exists',
        });
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
      message: 'Category updated successfully',
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
export const deleteCategory = async (req: AuthRequest, res: Response<ApiResponse>) => {
  try {
    const category = await RoomCategory.findById(req.params.id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
      });
    }

    // Check if there are rooms using this category
    const roomCount = await Room.countDocuments({ category: category._id });
    if (roomCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete category. ${roomCount} rooms are using this category.`,
      });
    }

    await category.deleteOne();

    res.json({
      success: true,
      message: 'Category deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};
