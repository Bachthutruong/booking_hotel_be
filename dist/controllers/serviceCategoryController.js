"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteServiceCategory = exports.updateServiceCategory = exports.createServiceCategory = exports.getServiceCategoryById = exports.getAllServiceCategories = exports.getServiceCategories = void 0;
const models_1 = require("../models");
// Get all service categories (public - active only)
const getServiceCategories = async (req, res) => {
    try {
        const categories = await models_1.ServiceCategory.find({ isActive: true }).sort({ order: 1 });
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
exports.getServiceCategories = getServiceCategories;
// Get all service categories including inactive (admin)
const getAllServiceCategories = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 100;
        const skip = (page - 1) * limit;
        const [categories, total] = await Promise.all([
            models_1.ServiceCategory.find().sort({ order: 1 }).skip(skip).limit(limit),
            models_1.ServiceCategory.countDocuments(),
        ]);
        const categoriesWithCount = await Promise.all(categories.map(async (category) => {
            const serviceCount = await models_1.Service.countDocuments({ category: category._id });
            return {
                ...category.toObject(),
                serviceCount,
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
exports.getAllServiceCategories = getAllServiceCategories;
// Get category by ID
const getServiceCategoryById = async (req, res) => {
    try {
        const category = await models_1.ServiceCategory.findById(req.params.id);
        if (!category) {
            res.status(404).json({
                success: false,
                message: 'Danh mục không tồn tại',
            });
            return;
        }
        const serviceCount = await models_1.Service.countDocuments({ category: category._id });
        res.json({
            success: true,
            data: { ...category.toObject(), serviceCount },
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
        });
    }
};
exports.getServiceCategoryById = getServiceCategoryById;
// Create category (admin)
const createServiceCategory = async (req, res) => {
    try {
        const { name, description, icon, order } = req.body;
        if (!name) {
            res.status(400).json({
                success: false,
                message: 'Tên danh mục là bắt buộc',
            });
            return;
        }
        const existing = await models_1.ServiceCategory.findOne({ name });
        if (existing) {
            res.status(400).json({
                success: false,
                message: 'Đã tồn tại danh mục cùng tên',
            });
            return;
        }
        const category = await models_1.ServiceCategory.create({
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
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
        });
    }
};
exports.createServiceCategory = createServiceCategory;
// Update category (admin)
const updateServiceCategory = async (req, res) => {
    try {
        const { name, description, icon, order, isActive } = req.body;
        const category = await models_1.ServiceCategory.findById(req.params.id);
        if (!category) {
            res.status(404).json({
                success: false,
                message: 'Danh mục không tồn tại',
            });
            return;
        }
        if (name && name !== category.name) {
            const existing = await models_1.ServiceCategory.findOne({ name, _id: { $ne: category._id } });
            if (existing) {
                res.status(400).json({
                    success: false,
                    message: 'Đã tồn tại danh mục cùng tên',
                });
                return;
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
            message: 'Đã cập nhật danh mục',
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
exports.updateServiceCategory = updateServiceCategory;
// Delete category (admin)
const deleteServiceCategory = async (req, res) => {
    try {
        const category = await models_1.ServiceCategory.findById(req.params.id);
        if (!category) {
            res.status(404).json({
                success: false,
                message: 'Danh mục không tồn tại',
            });
            return;
        }
        const serviceCount = await models_1.Service.countDocuments({ category: category._id });
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
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
        });
    }
};
exports.deleteServiceCategory = deleteServiceCategory;
//# sourceMappingURL=serviceCategoryController.js.map