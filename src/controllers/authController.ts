import { Request, Response, NextFunction } from 'express';
import { User } from '../models';
import { sendTokenResponse } from '../utils/jwt';
import { AuthRequest } from '../types';
import {
  generateVerificationCode,
  sendVerificationEmail,
  sendWelcomeEmail,
} from '../utils/emailService';

// Temporary store for pending registrations (in production, use Redis or database)
interface PendingRegistration {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  verificationCode: string;
  expiresAt: Date;
}

const pendingRegistrations = new Map<string, PendingRegistration>();

// Clean up expired registrations periodically
setInterval(() => {
  const now = new Date();
  for (const [email, registration] of pendingRegistrations.entries()) {
    if (registration.expiresAt < now) {
      pendingRegistrations.delete(email);
    }
  }
}, 60000); // Every minute

// @desc    Register user - Step 1: Send verification code (OR create directly if phone only)
// @route   POST /api/auth/register
// @access  Public
export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password, fullName, phone } = req.body;

    // Validate required fields
    if ((!email && !phone) || !password || !fullName) {
      res.status(400).json({
        success: false,
        message: 'Vui lòng nhập đầy đủ thông tin (Email hoặc Số điện thoại)',
      });
      return;
    }

    // Check if user already exists
    if (email) {
      const existingUserEmail = await User.findOne({ email });
      if (existingUserEmail) {
        res.status(400).json({ success: false, message: 'Email đã được sử dụng' });
        return;
      }
    }

    if (phone) {
      const existingUserPhone = await User.findOne({ phone });
      if (existingUserPhone) {
        res.status(400).json({ success: false, message: 'Số điện thoại đã được sử dụng' });
        return;
      }
    }

    // CASE 1: Email provided -> Require verification
    if (email) {
      // Generate verification code
      const verificationCode = generateVerificationCode();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Store pending registration
      pendingRegistrations.set(email, {
        email,
        password,
        fullName,
        phone,
        verificationCode,
        expiresAt,
      });

      // Send verification email
      try {
        await sendVerificationEmail(email, verificationCode, fullName);
      } catch (emailError) {
        console.error('Email sending error:', emailError);
        res.status(500).json({
          success: false,
          message: 'Không thể gửi email xác thực. Vui lòng kiểm tra lại email hoặc thử lại sau.',
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Mã xác thực đã được gửi đến email của bạn',
        requiresEmailVerification: true, // Flag for frontend
        data: {
          email,
          expiresIn: 600,
        },
      });
      return;
    }

    // CASE 2: No Email, Only Phone -> Create User Immediately
    const user = await User.create({
      phone,
      password,
      fullName,
      email: undefined, // Ensure sparse index works
      isEmailVerified: true, // No email to verify
      isActive: true
    });

    sendTokenResponse(user, 201, res);

  } catch (error) {
    next(error);
  }
};

// @desc    Verify email and complete registration
// @route   POST /api/auth/verify-email
// @access  Public
export const verifyEmail = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      res.status(400).json({
        success: false,
        message: 'Vui lòng nhập email và mã xác thực',
      });
      return;
    }

    // Check pending registration
    const pendingRegistration = pendingRegistrations.get(email);

    if (!pendingRegistration) {
      res.status(400).json({
        success: false,
        message: 'Không tìm thấy yêu cầu đăng ký hoặc đã hết hạn. Vui lòng đăng ký lại.',
      });
      return;
    }

    // Check if expired
    if (pendingRegistration.expiresAt < new Date()) {
      pendingRegistrations.delete(email);
      res.status(400).json({
        success: false,
        message: 'Mã xác thực đã hết hạn. Vui lòng đăng ký lại.',
      });
      return;
    }

    // Verify code
    if (pendingRegistration.verificationCode !== code) {
      res.status(400).json({
        success: false,
        message: 'Mã xác thực không đúng',
      });
      return;
    }

    // Create user
    const user = await User.create({
      email: pendingRegistration.email,
      password: pendingRegistration.password,
      fullName: pendingRegistration.fullName,
      phone: pendingRegistration.phone || undefined,
      isEmailVerified: true,
      isActive: true,
    });

    // Remove from pending
    pendingRegistrations.delete(email);

    // Send welcome email (non-blocking)
    sendWelcomeEmail(email, pendingRegistration.fullName).catch(console.error);

    sendTokenResponse(user, 201, res);
  } catch (error) {
    next(error);
  }
};

// @desc    Resend verification code
// @route   POST /api/auth/resend-code
// @access  Public
export const resendVerificationCode = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({
        success: false,
        message: 'Vui lòng nhập email',
      });
      return;
    }

    // Check pending registration
    const pendingRegistration = pendingRegistrations.get(email);

    if (!pendingRegistration) {
      res.status(400).json({
        success: false,
        message: 'Không tìm thấy yêu cầu đăng ký. Vui lòng đăng ký lại.',
      });
      return;
    }

    // Generate new code
    const verificationCode = generateVerificationCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // Update pending registration
    pendingRegistration.verificationCode = verificationCode;
    pendingRegistration.expiresAt = expiresAt;
    pendingRegistrations.set(email, pendingRegistration);

    // Send verification email
    try {
      await sendVerificationEmail(email, verificationCode, pendingRegistration.fullName);
    } catch (emailError) {
      console.error('Email sending error:', emailError);
      res.status(500).json({
        success: false,
        message: 'Không thể gửi email xác thực. Vui lòng thử lại.',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Mã xác thực mới đã được gửi đến email của bạn',
      data: {
        email,
        expiresIn: 600,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password, phone, identifier } = req.body; // Accept various input keys

    // Determine login identifier
    const loginIdentifier = identifier || email || phone;

    if (!loginIdentifier || !password) {
      res.status(400).json({
        success: false,
        message: 'Vui lòng nhập Email/Số điện thoại và mật khẩu',
      });
      return;
    }

    // Check for user by email OR phone
    // We try to determine if it is an email
    const isEmail = String(loginIdentifier).includes('@');
    
    let user;
    if (isEmail) {
      user = await User.findOne({ email: loginIdentifier }).select('+password');
    } else {
      user = await User.findOne({ phone: loginIdentifier }).select('+password');
    }

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Tài khoản hoặc mật khẩu không đúng',
      });
      return;
    }

    // Check if email is verified (Only if user has email and logged in via email - strict check? Or just if user has email?)
    // Requirement: "nếu điền email thì phảu xác nhận email". 
    // If user has email but isEmailVerified is false -> Block login
    if (user.email && !user.isEmailVerified) {
      res.status(401).json({
        success: false,
        message: 'Email chưa được xác thực. Vui lòng xác thực email trước khi đăng nhập.',
        code: 'EMAIL_NOT_VERIFIED',
      });
      return;
    }

    // Check if password matches
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      res.status(401).json({
        success: false,
        message: 'Tài khoản hoặc mật khẩu không đúng',
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

// @desc    Change password
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
  } catch (error) {
    next(error);
  }
};
