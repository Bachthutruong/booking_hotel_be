"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCategory = exports.updateCategory = exports.createCategory = exports.getCategoryById = exports.getAllCategories = exports.getCategories = void 0;
const RoomCategory_1 = __importDefault(require("../models/RoomCategory"));
const Room_1 = __importDefault(require("../models/Room"));
// Get all categories (public)
const getCategories = async (req, res) => {
    try {
        const categories = await RoomCategory_1.default.find({ isActive: true }).sort({ order: 1 });
        res.json({
            success: true,
            data: categories,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
        });
    }
};
exports.getCategories = getCategories;
// Get all categories including inactive (admin)
const getAllCategories = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const [categories, total] = await Promise.all([
            RoomCategory_1.default.find().sort({ order: 1 }).skip(skip).limit(limit),
            RoomCategory_1.default.countDocuments(),
        ]);
        // Get room count for each category
        const categoriesWithCount = await Promise.all(categories.map(async (category) => {
            const roomCount = await Room_1.default.countDocuments({ category: category._id, isActive: true });
            return {
                ...category.toObject(),
                roomCount,
            };
        }));
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
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
        });
    }
};
exports.getAllCategories = getAllCategories;
// Get category by ID
const getCategoryById = async (req, res) => {
    try {
        const category = await RoomCategory_1.default.findById(req.params.id);
        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Category not found',
            });
        }
        const roomCount = await Room_1.default.countDocuments({ category: category._id, isActive: true });
        res.json({
            success: true,
            data: {
                ...category.toObject(),
                roomCount,
            },
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
        });
    }
};
exports.getCategoryById = getCategoryById;
// Create category (admin)
const createCategory = async (req, res) => {
    try {
        const { name, description, icon, order } = req.body;
        if (!name) {
            return res.status(400).json({
                success: false,
                message: 'Category name is required',
            });
        }
        const existingCategory = await RoomCategory_1.default.findOne({ name });
        if (existingCategory) {
            return res.status(400).json({
                success: false,
                message: 'Category with this name already exists',
            });
        }
        const category = await RoomCategory_1.default.create({
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
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
        });
    }
};
exports.createCategory = createCategory;
// Update category (admin)
const updateCategory = async (req, res) => {
    try {
        const { name, description, icon, order, isActive } = req.body;
        const category = await RoomCategory_1.default.findById(req.params.id);
        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Category not found',
            });
        }
        if (name && name !== category.name) {
            const existingCategory = await RoomCategory_1.default.findOne({ name, _id: { $ne: category._id } });
            if (existingCategory) {
                return res.status(400).json({
                    success: false,
                    message: 'Category with this name already exists',
                });
            }
            category.name = name;
        }
        if (description !== undefined)
            category.description = description;
        if (icon !== undefined)
            category.icon = icon;
        if (order !== undefined)
            category.order = order;
        if (isActive !== undefined)
            category.isActive = isActive;
        await category.save();
        res.json({
            success: true,
            message: 'Category updated successfully',
            data: category,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
        });
    }
};
exports.updateCategory = updateCategory;
// Delete category (admin)
const deleteCategory = async (req, res) => {
    try {
        const category = await RoomCategory_1.default.findById(req.params.id);
        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Category not found',
            });
        }
        // Check if there are rooms using this category
        const roomCount = await Room_1.default.countDocuments({ category: category._id });
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
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
        });
    }
};
exports.deleteCategory = deleteCategory;
//# sourceMappingURL=roomCategoryController.js.map