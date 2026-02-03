"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendTokenResponse = exports.generateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const generateToken = (id) => {
    return jsonwebtoken_1.default.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: (process.env.JWT_EXPIRES_IN || '7d'),
    });
};
exports.generateToken = generateToken;
const sendTokenResponse = (user, statusCode, res) => {
    const token = (0, exports.generateToken)(user._id.toString());
    const cookieOptions = {
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
    };
    res.status(statusCode).cookie('token', token, cookieOptions).json({
        success: true,
        token,
        data: {
            _id: user._id,
            email: user.email,
            fullName: user.fullName,
            phone: user.phone,
            avatar: user.avatar,
            role: user.role,
        },
    });
};
exports.sendTokenResponse = sendTokenResponse;
//# sourceMappingURL=jwt.js.map