"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.markAllAsRead = exports.markAsRead = exports.getNotifications = void 0;
const models_1 = require("../models");
// @desc    Get notifications for admin
// @route   GET /api/notifications
// @access  Private/Admin
const getNotifications = async (req, res) => {
    try {
        const limit = Math.min(parseInt(req.query.limit) || 50, 100);
        const unreadOnly = req.query.unread === 'true';
        const query = { recipientRole: 'admin' };
        if (unreadOnly)
            query.read = false;
        const notifications = await models_1.Notification.find(query)
            .sort({ createdAt: -1 })
            .limit(limit)
            .lean();
        const unreadCount = await models_1.Notification.countDocuments({ recipientRole: 'admin', read: false });
        res.json({
            success: true,
            data: notifications,
            unreadCount,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
        });
    }
};
exports.getNotifications = getNotifications;
// @desc    Mark notification as read
// @route   PATCH /api/notifications/:id/read
// @access  Private/Admin
const markAsRead = async (req, res) => {
    try {
        const notification = await models_1.Notification.findByIdAndUpdate(req.params.id, { read: true }, { new: true });
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
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
        });
    }
};
exports.markAsRead = markAsRead;
// @desc    Mark all notifications as read
// @route   PATCH /api/notifications/read-all
// @access  Private/Admin
const markAllAsRead = async (req, res) => {
    try {
        await models_1.Notification.updateMany({ recipientRole: 'admin', read: false }, { read: true });
        res.json({
            success: true,
            message: 'Đã đánh dấu tất cả đã đọc',
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
        });
    }
};
exports.markAllAsRead = markAllAsRead;
//# sourceMappingURL=notificationController.js.map