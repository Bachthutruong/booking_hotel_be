"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.changePassword = exports.getMe = exports.logout = exports.login = exports.resendVerificationCode = exports.verifyEmail = exports.register = void 0;
const models_1 = require("../models");
const jwt_1 = require("../utils/jwt");
// @desc    Register user - chỉ cần tên, email, số điện thoại
// Logic: 1 cặp (email, phone) chỉ đăng ký được 1 tài khoản. Cùng email khác phone hoặc cùng phone khác email thì được nhiều tài khoản.
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res, next) => {
    try {
        const { email, fullName, phone } = req.body;
        if (!email || !fullName || !phone) {
            res.status(400).json({
                success: false,
                message: 'Vui lòng nhập đầy đủ: Họ tên, Email và Số điện thoại',
            });
            return;
        }
        const normalizedEmail = String(email).trim().toLowerCase();
        const normalizedPhone = String(phone).trim();
        // Cặp (email, phone) đã tồn tại thì chỉ cho 1 tài khoản
        const existingUser = await models_1.User.findOne({
            email: normalizedEmail,
            phone: normalizedPhone,
        });
        if (existingUser) {
            res.status(400).json({
                success: false,
                message: 'Email và Số điện thoại này đã được đăng ký. Vui lòng đăng nhập hoặc dùng thông tin khác.',
            });
            return;
        }
        const user = await models_1.User.create({
            email: normalizedEmail,
            fullName: String(fullName).trim(),
            phone: normalizedPhone,
            isEmailVerified: true,
            isActive: true,
        });
        (0, jwt_1.sendTokenResponse)(user, 201, res);
    }
    catch (error) {
        // Duplicate key (email, phone) từ index unique
        if (error.code === 11000) {
            res.status(400).json({
                success: false,
                message: 'Email và Số điện thoại này đã được đăng ký.',
            });
            return;
        }
        next(error);
    }
};
exports.register = register;
// @desc    Verify email and complete registration (giữ cho tương thích cũ, không dùng trong flow mới)
// @route   POST /api/auth/verify-email
// @access  Public
const verifyEmail = async (req, res, next) => {
    res.status(400).json({
        success: false,
        message: 'Flow xác thực email không còn sử dụng. Vui lòng đăng ký với Email và Số điện thoại.',
    });
};
exports.verifyEmail = verifyEmail;
// @desc    Resend verification code (giữ cho tương thích)
// @route   POST /api/auth/resend-code
// @access  Public
const resendVerificationCode = async (req, res, next) => {
    res.status(400).json({
        success: false,
        message: 'Flow xác thực email không còn sử dụng.',
    });
};
exports.resendVerificationCode = resendVerificationCode;
// @desc    Login - chỉ cần email và số điện thoại (không mật khẩu)
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res, next) => {
    try {
        const { email, phone } = req.body;
        if (!email || !phone) {
            res.status(400).json({
                success: false,
                message: 'Vui lòng nhập Email và Số điện thoại',
            });
            return;
        }
        const normalizedEmail = String(email).trim().toLowerCase();
        const normalizedPhone = String(phone).trim();
        const user = await models_1.User.findOne({
            email: normalizedEmail,
            phone: normalizedPhone,
        });
        if (!user) {
            res.status(401).json({
                success: false,
                message: 'Không tìm thấy tài khoản với Email và Số điện thoại này.',
            });
            return;
        }
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
// @desc    Change password (chỉ khi user có password)
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
        if (!user.password) {
            res.status(400).json({
                success: false,
                message: 'Tài khoản đăng ký bằng Email + Số điện thoại không có mật khẩu.',
            });
            return;
        }
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