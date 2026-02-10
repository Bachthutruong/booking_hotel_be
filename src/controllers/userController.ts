import { Request, Response, NextFunction } from 'express';
import { User, UserAuditLog } from '../models';
import { AuthRequest } from '../types';
import { getPagination, createPaginationResponse } from '../utils/helpers';

async function logUserAudit(
  action: 'created' | 'updated' | 'deleted',
  targetUser: { _id: any; email?: string; fullName?: string; role?: string },
  performedBy: { _id: any; email?: string; fullName?: string },
  details?: string,
  oldData?: Record<string, unknown>,
  newData?: Record<string, unknown>
) {
  await UserAuditLog.create({
    action,
    targetUser: targetUser._id,
    targetUserEmail: targetUser.email,
    targetUserFullName: targetUser.fullName,
    targetUserRole: targetUser.role,
    performedBy: performedBy._id,
    performedByEmail: performedBy.email,
    performedByFullName: performedBy.fullName,
    details,
    oldData,
    newData,
  });
}

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
export const getUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { page, limit, skip } = getPagination(req);
    const { search, role, isActive } = req.query;

    const query: any = {};

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
      User.find(query).skip(skip).limit(limit).sort({ createdAt: -1 }),
      User.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: users,
      pagination: createPaginationResponse(page, limit, total),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create user (admin, staff, or user) - Admin only
// @route   POST /api/users
// @access  Private/Admin
export const createUser = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, fullName, phone, role, password } = req.body;

    if (!email || !fullName || !phone) {
      res.status(400).json({
        success: false,
        message: 'Vui lòng nhập đầy đủ: Email, Họ tên và Số điện thoại',
      });
      return;
    }

    const validRoles = ['user', 'admin', 'staff'];
    const roleValue = role && validRoles.includes(role) ? role : 'user';

    const normalizedEmail = String(email).trim().toLowerCase();
    const normalizedPhone = String(phone).trim();

    const existingUser = await User.findOne({
      email: normalizedEmail,
      phone: normalizedPhone,
    });
    if (existingUser) {
      res.status(400).json({
        success: false,
        message: 'Email và Số điện thoại này đã được sử dụng.',
      });
      return;
    }

    const createData: any = {
      email: normalizedEmail,
      fullName: String(fullName).trim(),
      phone: normalizedPhone,
      role: roleValue,
      isActive: true,
      isEmailVerified: true,
    };
    if (password && String(password).length >= 6) {
      createData.password = String(password);
    }

    const user = await User.create(createData);

    await logUserAudit(
      'created',
      user,
      req.user!,
      `Tạo tài khoản ${roleValue}: ${user.fullName} (${user.email})`,
      undefined,
      {
        email: user.email,
        fullName: user.fullName,
        phone: user.phone,
        role: user.role,
      }
    );

    res.status(201).json({
      success: true,
      data: user,
      message: 'Đã tạo tài khoản thành công',
    });
  } catch (error: any) {
    if (error.code === 11000) {
      res.status(400).json({
        success: false,
        message: 'Email và Số điện thoại này đã được sử dụng.',
      });
      return;
    }
    next(error);
  }
};

// @desc    Get user audit logs (add/edit/delete) - Admin only
// @route   GET /api/users/audit-logs
// @access  Private/Admin
export const getUserAuditLogs = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { page, limit, skip } = getPagination(req);
    const { action, targetUserId } = req.query;

    const query: any = {};
    if (action) query.action = action;
    if (targetUserId) query.targetUser = targetUserId;

    const [logs, total] = await Promise.all([
      UserAuditLog.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      UserAuditLog.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: logs,
      pagination: createPaginationResponse(page, limit, total),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private
export const getUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = await User.findById(req.params.id);

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
  } catch (error) {
    next(error);
  }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private
export const updateUser = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { fullName, phone, avatar } = req.body;
    const userId = req.params.id;

    // Check if user can update this profile
    if (req.user?.role !== 'admin' && req.user?.role !== 'staff' && req.user?._id.toString() !== userId) {
      res.status(403).json({
        success: false,
        message: 'Bạn không có quyền cập nhật thông tin này',
      });
      return;
    }

    const oldUser = await User.findById(userId).lean();
    if (!oldUser) {
      res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng',
      });
      return;
    }

    const updateData: any = {};
    if (fullName) updateData.fullName = fullName;
    if (phone !== undefined) updateData.phone = phone;
    if (avatar !== undefined) updateData.avatar = avatar;

    // Only admin can update role and isActive
    if (req.user?.role === 'admin') {
      if (req.body.role) updateData.role = req.body.role;
      if (req.body.isActive !== undefined) updateData.isActive = req.body.isActive;
    }

    const user = await User.findByIdAndUpdate(userId, updateData, {
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

    // Log audit when admin updates (role/isActive or any field)
    if (req.user?.role === 'admin' && (Object.keys(updateData).length > 0)) {
      await logUserAudit(
        'updated',
        user,
        req.user,
        `Cập nhật thông tin: ${user.fullName}`,
        { fullName: oldUser.fullName, phone: oldUser.phone, role: oldUser.role, isActive: oldUser.isActive },
        { fullName: user.fullName, phone: user.phone, role: user.role, isActive: user.isActive }
      );
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete user (soft: deactivate) - Admin only
// @route   DELETE /api/users/:id
// @access  Private/Admin
export const deleteUser = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng',
      });
      return;
    }

    await logUserAudit(
      'deleted',
      user,
      req.user!,
      `Vô hiệu hóa tài khoản: ${user.fullName} (${user.email})`,
      { fullName: user.fullName, email: user.email, role: user.role, isActive: user.isActive },
      { isActive: false }
    );

    // Soft delete - just deactivate
    user.isActive = false;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Đã vô hiệu hóa người dùng',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload user avatar
// @route   PUT /api/users/:id/avatar
// @access  Private
export const uploadAvatar = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
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

    const user = await User.findByIdAndUpdate(
      userId,
      { avatar: (req.file as any).path },
      { new: true }
    );

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
  } catch (error) {
    next(error);
  }
};
