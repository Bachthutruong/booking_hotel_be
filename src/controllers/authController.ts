import { Request, Response, NextFunction } from 'express';
import { User } from '../models';
import { sendTokenResponse } from '../utils/jwt';
import { AuthRequest } from '../types';

// @desc    Register user - chỉ cần tên, email, số điện thoại
// Logic: 1 cặp (email, phone) chỉ đăng ký được 1 tài khoản. Cùng email khác phone hoặc cùng phone khác email thì được nhiều tài khoản.
// @route   POST /api/auth/register
// @access  Public
export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
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
    const existingUser = await User.findOne({
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

    const user = await User.create({
      email: normalizedEmail,
      fullName: String(fullName).trim(),
      phone: normalizedPhone,
      isEmailVerified: true,
      isActive: true,
    });

    sendTokenResponse(user, 201, res);
  } catch (error: any) {
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

// @desc    Verify email and complete registration (giữ cho tương thích cũ, không dùng trong flow mới)
// @route   POST /api/auth/verify-email
// @access  Public
export const verifyEmail = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  res.status(400).json({
    success: false,
    message: 'Flow xác thực email không còn sử dụng. Vui lòng đăng ký với Email và Số điện thoại.',
  });
};

// @desc    Resend verification code (giữ cho tương thích)
// @route   POST /api/auth/resend-code
// @access  Public
export const resendVerificationCode = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  res.status(400).json({
    success: false,
    message: 'Flow xác thực email không còn sử dụng.',
  });
};

// @desc    Login - chỉ cần email và số điện thoại (không mật khẩu)
// @route   POST /api/auth/login
// @access  Public
export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
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

    const user = await User.findOne({
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

    sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
export const logout = async (
  req: Request,
  res: Response
): Promise<void> => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });

  res.status(200).json({
    success: true,
    message: 'Đăng xuất thành công',
  });
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  res.status(200).json({
    success: true,
    data: req.user,
  });
};

// @desc    Change password (chỉ khi user có password)
// @route   PUT /api/auth/change-password
// @access  Private
export const changePassword = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      res.status(400).json({
        success: false,
        message: 'Vui lòng nhập mật khẩu hiện tại và mật khẩu mới',
      });
      return;
    }

    const user = await User.findById(req.user?._id).select('+password');

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
  } catch (error) {
    next(error);
  }
};
