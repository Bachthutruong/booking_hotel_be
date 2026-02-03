"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.changePassword = exports.getMe = exports.logout = exports.login = exports.register = void 0;
const models_1 = require("../models");
const jwt_1 = require("../utils/jwt");
// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res, next) => {
    try {
        const { email, password, fullName, phone } = req.body;
        // Check if user exists
        const existingUser = await models_1.User.findOne({ email });
        if (existingUser) {
            res.status(400).json({
                success: false,
                message: 'Email đã được sử dụng',
            });
            return;
        }
        // Create user
        const user = await models_1.User.create({
            email,
            password,
            fullName,
            phone,
        });
        (0, jwt_1.sendTokenResponse)(user, 201, res);
    }
    catch (error) {
        next(error);
    }
};
exports.register = register;
// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        // Validate email & password
        if (!email || !password) {
            res.status(400).json({
                success: false,
                message: 'Vui lòng nhập email và mật khẩu',
            });
            return;
        }
        // Check for user
        const user = await models_1.User.findOne({ email }).select('+password');
        if (!user) {
            res.status(401).json({
                success: false,
                message: 'Email hoặc mật khẩu không đúng',
            });
            return;
        }
        // Check if password matches
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            res.status(401).json({
                success: false,
                message: 'Email hoặc mật khẩu không đúng',
            });
            return;
        }
        // Check if user is active
        if (!user.isActive) {
            res.status(401).json({
                success: false,
                message: 'Tài khoản đã bị vô hiệu hóa',
            });
            return;
        }
        (0, jwt_1.sendTokenResponse)(user, 200, res);
    }
    catch (error) {
        next(error);
    }
};
exports.login = login;
// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
const logout = async (req, res) => {
    res.cookie('token', 'none', {
        expires: new Date(Date.now() + 10 * 1000),
        httpOnly: true,
    });
    res.status(200).json({
        success: true,
        message: 'Đăng xuất thành công',
    });
};
exports.logout = logout;
// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
    res.status(200).json({
        success: true,
        data: req.user,
    });
};
exports.getMe = getMe;
// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
const changePassword = async (req, res, next) => {
    try {
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
            res.status(400).json({
                success: false,
                message: 'Vui lòng nhập mật khẩu hiện tại và mật khẩu mới',
            });
            return;
        }
        const user = await models_1.User.findById(req.user?._id).select('+password');
        if (!user) {
            res.status(404).json({
                success: false,
                message: 'Không tìm thấy người dùng',
            });
            return;
        }
        // Check current password
        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            res.status(401).json({
                success: false,
                message: 'Mật khẩu hiện tại không đúng',
            });
            return;
        }
        user.password = newPassword;
        await user.save();
        res.status(200).json({
            success: true,
            message: 'Đổi mật khẩu thành công',
        });
    }
    catch (error) {
        next(error);
    }
};
exports.changePassword = changePassword;
//# sourceMappingURL=authController.js.map