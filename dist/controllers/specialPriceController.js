"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.previewRoomPrice = exports.deleteSpecialPrice = exports.updateSpecialPrice = exports.createSpecialPrice = exports.getSpecialPrice = exports.getSpecialPrices = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const models_1 = require("../models");
const helpers_1 = require("../utils/helpers");
const specialPrice_1 = require("../utils/specialPrice");
// @desc    Get all special price rules
// @route   GET /api/special-prices
// @access  Private/Admin
const getSpecialPrices = async (req, res, next) => {
    try {
        const { page, limit, skip } = (0, helpers_1.getPagination)(req);
        const { type, isActive, roomId } = req.query;
        const query = {};
        if (type && type !== 'all')
            query.type = type;
        if (isActive !== undefined && isActive !== 'all') {
            query.isActive = isActive === 'true';
        }
        if (roomId) {
            query.rooms = new mongoose_1.default.Types.ObjectId(roomId);
        }
        const [rules, total] = await Promise.all([
            models_1.RoomSpecialPrice.find(query)
                .populate('rooms', 'name price hotel')
                .skip(skip)
                .limit(limit)
                .sort({ createdAt: -1 })
                .lean(),
            models_1.RoomSpecialPrice.countDocuments(query),
        ]);
        res.status(200).json({
            success: true,
            data: rules,
            pagination: (0, helpers_1.createPaginationResponse)(page, limit, total),
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getSpecialPrices = getSpecialPrices;
// @desc    Get single special price rule
// @route   GET /api/special-prices/:id
// @access  Private/Admin
const getSpecialPrice = async (req, res, next) => {
    try {
        const rule = await models_1.RoomSpecialPrice.findById(req.params.id)
            .populate('rooms', 'name price hotel')
            .lean();
        if (!rule) {
            res.status(404).json({ success: false, message: 'Không tìm thấy rule giá đặc biệt' });
            return;
        }
        res.status(200).json({ success: true, data: rule });
    }
    catch (error) {
        next(error);
    }
};
exports.getSpecialPrice = getSpecialPrice;
// @desc    Create special price rule
// @route   POST /api/special-prices
// @access  Private/Admin
const createSpecialPrice = async (req, res, next) => {
    try {
        const { name, rooms, type, startDate, endDate, modifierType, modifierValue, isActive } = req.body;
        if (!name || !rooms || !Array.isArray(rooms) || rooms.length === 0 || !type || !modifierType || modifierValue == null) {
            res.status(400).json({
                success: false,
                message: 'Thiếu name, rooms (mảng), type, modifierType, modifierValue',
            });
            return;
        }
        if (!['date_range', 'weekend'].includes(type)) {
            res.status(400).json({ success: false, message: 'type phải là date_range hoặc weekend' });
            return;
        }
        if (!['percentage', 'fixed'].includes(modifierType)) {
            res.status(400).json({ success: false, message: 'modifierType phải là percentage hoặc fixed' });
            return;
        }
        const roomIds = rooms.map((id) => new mongoose_1.default.Types.ObjectId(id));
        if (type === 'date_range') {
            if (!startDate || !endDate) {
                res.status(400).json({ success: false, message: 'date_range cần startDate và endDate' });
                return;
            }
            const start = new Date(startDate);
            const end = new Date(endDate);
            if (start > end) {
                res.status(400).json({ success: false, message: 'startDate phải trước hoặc bằng endDate' });
                return;
            }
        }
        const rule = await models_1.RoomSpecialPrice.create({
            name,
            rooms: roomIds,
            type,
            startDate: type === 'date_range' ? new Date(startDate) : undefined,
            endDate: type === 'date_range' ? new Date(endDate) : undefined,
            modifierType,
            modifierValue: Number(modifierValue),
            isActive: isActive !== false,
        });
        const populated = await models_1.RoomSpecialPrice.findById(rule._id)
            .populate('rooms', 'name price hotel')
            .lean();
        res.status(201).json({ success: true, data: populated });
    }
    catch (error) {
        next(error);
    }
};
exports.createSpecialPrice = createSpecialPrice;
// @desc    Update special price rule
// @route   PUT /api/special-prices/:id
// @access  Private/Admin
const updateSpecialPrice = async (req, res, next) => {
    try {
        const { name, rooms, type, startDate, endDate, modifierType, modifierValue, isActive } = req.body;
        const rule = await models_1.RoomSpecialPrice.findById(req.params.id);
        if (!rule) {
            res.status(404).json({ success: false, message: 'Không tìm thấy rule' });
            return;
        }
        if (name != null)
            rule.name = name;
        if (rooms != null && Array.isArray(rooms)) {
            rule.rooms = rooms.map((id) => new mongoose_1.default.Types.ObjectId(id));
        }
        if (type != null) {
            if (!['date_range', 'weekend'].includes(type)) {
                res.status(400).json({ success: false, message: 'type phải là date_range hoặc weekend' });
                return;
            }
            rule.type = type;
            if (type === 'date_range') {
                if (startDate != null)
                    rule.startDate = new Date(startDate);
                if (endDate != null)
                    rule.endDate = new Date(endDate);
            }
            else {
                rule.startDate = undefined;
                rule.endDate = undefined;
            }
        }
        if (modifierType != null) {
            if (!['percentage', 'fixed'].includes(modifierType)) {
                res.status(400).json({ success: false, message: 'modifierType phải là percentage hoặc fixed' });
                return;
            }
            rule.modifierType = modifierType;
        }
        if (modifierValue != null)
            rule.modifierValue = Number(modifierValue);
        if (isActive !== undefined)
            rule.isActive = !!isActive;
        await rule.save();
        const populated = await models_1.RoomSpecialPrice.findById(rule._id)
            .populate('rooms', 'name price hotel')
            .lean();
        res.status(200).json({ success: true, data: populated });
    }
    catch (error) {
        next(error);
    }
};
exports.updateSpecialPrice = updateSpecialPrice;
// @desc    Delete special price rule
// @route   DELETE /api/special-prices/:id
// @access  Private/Admin
const deleteSpecialPrice = async (req, res, next) => {
    try {
        const rule = await models_1.RoomSpecialPrice.findByIdAndDelete(req.params.id);
        if (!rule) {
            res.status(404).json({ success: false, message: 'Không tìm thấy rule' });
            return;
        }
        res.status(200).json({ success: true, message: 'Đã xóa rule giá đặc biệt' });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteSpecialPrice = deleteSpecialPrice;
// @desc    Get room price preview for date range (for booking form)
// @route   GET /api/special-prices/preview
// @access  Public (to show price when user selects dates)
const previewRoomPrice = async (req, res, next) => {
    try {
        const { roomId, checkIn, checkOut } = req.query;
        if (!roomId || !checkIn || !checkOut) {
            res.status(400).json({
                success: false,
                message: 'Cần roomId, checkIn, checkOut',
            });
            return;
        }
        const checkInDate = new Date(checkIn);
        const checkOutDate = new Date(checkOut);
        if (checkInDate >= checkOutDate) {
            res.status(400).json({
                success: false,
                message: 'checkOut phải sau checkIn',
            });
            return;
        }
        const roomObjectId = new mongoose_1.default.Types.ObjectId(roomId);
        const result = await (0, specialPrice_1.getRoomPricePreview)(roomObjectId, checkInDate, checkOutDate);
        if (!result) {
            res.status(404).json({ success: false, message: 'Không tìm thấy phòng' });
            return;
        }
        res.status(200).json({
            success: true,
            data: {
                breakdown: result.breakdown,
                totalRoomPrice: result.totalRoomPrice,
                basePrice: result.basePrice,
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.previewRoomPrice = previewRoomPrice;
//# sourceMappingURL=specialPriceController.js.map