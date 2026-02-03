"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadAvatar = exports.deleteUser = exports.updateUser = exports.getUser = exports.getUsers = void 0;
const models_1 = require("../models");
const helpers_1 = require("../utils/helpers");
// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
const getUsers = async (req, res, next) => {
    try {
        const { page, limit, skip } = (0, helpers_1.getPagination)(req);
        const { search, role, isActive } = req.query;
        const query = {};
        if (search) {
            query.$or = [
                { fullName: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
            ];
        }
        if (role) {
            query.role = role;
        }
        if (isActive !== undefined) {
            query.isActive = isActive === 'true';
        }
        const [users, total] = await Promise.all([
            models_1.User.find(query).skip(skip).limit(limit).sort({ createdAt: -1 }),
            models_1.User.countDocuments(query),
        ]);
        res.status(200).json({
            success: true,
            data: users,
            pagination: (0, helpers_1.createPaginationResponse)(page, limit, total),
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getUsers = getUsers;
// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private
const getUser = async (req, res, next) => {
    try {
        const user = await models_1.User.findById(req.params.id);
        if (!user) {
            res.status(404).json({
                success: false,
                message: 'Không tìm thấy người dùng',
            });
            return;
        }
        res.status(200).json({
            success: true,
            data: user,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getUser = getUser;
// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private
const updateUser = async (req, res, next) => {
    try {
        const { fullName, phone, avatar } = req.body;
        const userId = req.params.id;
        // Check if user can update this profile
        if (req.user?.role !== 'admin' && req.user?._id.toString() !== userId) {
            res.status(403).json({
                success: false,
                message: 'Bạn không có quyền cập nhật thông tin này',
            });
            return;
        }
        const updateData = {};
        if (fullName)
            updateData.fullName = fullName;
        if (phone !== undefined)
            updateData.phone = phone;
        if (avatar !== undefined)
            updateData.avatar = avatar;
        // Admin can update role and isActive
        if (req.user?.role === 'admin') {
            if (req.body.role)
                updateData.role = req.body.role;
            if (req.body.isActive !== undefined)
                updateData.isActive = req.body.isActive;
        }
        const user = await models_1.User.findByIdAndUpdate(userId, updateData, {
            new: true,
            runValidators: true,
        });
        if (!user) {
            res.status(404).json({
                success: false,
                message: 'Không tìm thấy người dùng',
            });
            return;
        }
        res.status(200).json({
            success: true,
            data: user,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.updateUser = updateUser;
// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
const deleteUser = async (req, res, next) => {
    try {
        const user = await models_1.User.findById(req.params.id);
        if (!user) {
            res.status(404).json({
                success: false,
                message: 'Không tìm thấy người dùng',
            });
            return;
        }
        // Soft delete - just deactivate
        user.isActive = false;
        await user.save();
        res.status(200).json({
            success: true,
            message: 'Đã vô hiệu hóa người dùng',
        });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteUser = deleteUser;
// @desc    Upload user avatar
// @route   PUT /api/users/:id/avatar
// @access  Private
const uploadAvatar = async (req, res, next) => {
    try {
        const userId = req.params.id;
        // Check if user can update this profile
        if (req.user?.role !== 'admin' && req.user?._id.toString() !== userId) {
            res.status(403).json({
                success: false,
                message: 'Bạn không có quyền cập nhật thông tin này',
            });
            return;
        }
        if (!req.file) {
            res.status(400).json({
                success: false,
                message: 'Vui lòng chọn ảnh',
            });
            return;
        }
        const user = await models_1.User.findByIdAndUpdate(userId, { avatar: req.file.path }, { new: true });
        if (!user) {
            res.status(404).json({
                success: false,
                message: 'Không tìm thấy người dùng',
            });
            return;
        }
        res.status(200).json({
            success: true,
            data: user,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.uploadAvatar = uploadAvatar;
//# sourceMappingURL=userController.js.map