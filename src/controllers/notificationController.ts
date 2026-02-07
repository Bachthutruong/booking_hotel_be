import { Response } from 'express';
import { Notification } from '../models';
import { AuthRequest, ApiResponse } from '../types';

// @desc    Get notifications for admin
// @route   GET /api/notifications
// @access  Private/Admin
export const getNotifications = async (req: AuthRequest, res: Response<ApiResponse>): Promise<void> => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const unreadOnly = req.query.unread === 'true';

    const query: { recipientRole: string; read?: boolean } = { recipientRole: 'admin' };
    if (unreadOnly) query.read = false;

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    const unreadCount = await Notification.countDocuments({ recipientRole: 'admin', read: false });

    res.json({
      success: true,
      data: notifications,
      unreadCount,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// @desc    Mark notification as read
// @route   PATCH /api/notifications/:id/read
// @access  Private/Admin
export const markAsRead = async (req: AuthRequest, res: Response<ApiResponse>): Promise<void> => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { read: true },
      { new: true }
    );

    if (!notification) {
      res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông báo',
      });
      return;
    }

    res.json({
      success: true,
      data: notification,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// @desc    Mark all notifications as read
// @route   PATCH /api/notifications/read-all
// @access  Private/Admin
export const markAllAsRead = async (req: AuthRequest, res: Response<ApiResponse>): Promise<void> => {
  try {
    await Notification.updateMany(
      { recipientRole: 'admin', read: false },
      { read: true }
    );

    res.json({
      success: true,
      message: 'Đã đánh dấu tất cả đã đọc',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};
