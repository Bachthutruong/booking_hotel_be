"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getServiceQRData = exports.getServiceByQR = exports.deleteService = exports.updateService = exports.createService = exports.getService = exports.getAdminServices = exports.getServices = void 0;
const models_1 = require("../models");
// @desc    Get all services
// @route   GET /api/services
// @access  Public
const getServices = async (req, res, next) => {
    try {
        const services = await models_1.Service.find({ isActive: true });
        res.status(200).json({
            success: true,
            data: services,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getServices = getServices;
// @desc    Get all services (Admin)
// @route   GET /api/services/admin
// @access  Private/Admin
const getAdminServices = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const total = await models_1.Service.countDocuments();
        const services = await models_1.Service.find()
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 });
        res.status(200).json({
            success: true,
            data: services,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getAdminServices = getAdminServices;
// @desc    Get single service
// @route   GET /api/services/:id
// @access  Public
const getService = async (req, res, next) => {
    try {
        const service = await models_1.Service.findById(req.params.id);
        if (!service) {
            res.status(404).json({
                success: false,
                message: 'Không tìm thấy dịch vụ',
            });
            return;
        }
        res.status(200).json({
            success: true,
            data: service,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getService = getService;
// @desc    Create service
// @route   POST /api/services
// @access  Private/Admin
const createService = async (req, res, next) => {
    try {
        const service = await models_1.Service.create(req.body);
        res.status(201).json({
            success: true,
            data: service,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.createService = createService;
// @desc    Update service
// @route   PUT /api/services/:id
// @access  Private/Admin
const updateService = async (req, res, next) => {
    try {
        const service = await models_1.Service.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });
        if (!service) {
            res.status(404).json({
                success: false,
                message: 'Không tìm thấy dịch vụ',
            });
            return;
        }
        res.status(200).json({
            success: true,
            data: service,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.updateService = updateService;
// @desc    Delete service
// @route   DELETE /api/services/:id
// @access  Private/Admin
const deleteService = async (req, res, next) => {
    try {
        const service = await models_1.Service.findById(req.params.id);
        if (!service) {
            res.status(404).json({
                success: false,
                message: 'Không tìm thấy dịch vụ',
            });
            return;
        }
        await service.deleteOne();
        res.status(200).json({
            success: true,
            data: {},
        });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteService = deleteService;
// @desc    Get service by QR code (for scanning)
// @route   GET /api/services/qr/:serviceId
// @access  Public
const getServiceByQR = async (req, res, next) => {
    try {
        const service = await models_1.Service.findById(req.params.serviceId);
        if (!service || !service.isActive) {
            res.status(404).json({
                success: false,
                message: 'Dịch vụ không tồn tại hoặc không khả dụng',
            });
            return;
        }
        res.status(200).json({
            success: true,
            data: service,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getServiceByQR = getServiceByQR;
// @desc    Generate QR code data for service
// @route   GET /api/services/:id/qr-data
// @access  Private/Admin
const getServiceQRData = async (req, res, next) => {
    try {
        const service = await models_1.Service.findById(req.params.id);
        if (!service) {
            res.status(404).json({
                success: false,
                message: 'Không tìm thấy dịch vụ',
            });
            return;
        }
        // QR data contains service ID and a link to add it
        const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const qrData = {
            serviceId: service._id,
            name: service.name,
            price: service.price,
            // URL that can be scanned to add service to current booking
            scanUrl: `${baseUrl}/scan-service/${service._id}`,
            // Direct API endpoint
            apiEndpoint: `/api/services/qr/${service._id}`,
        };
        res.status(200).json({
            success: true,
            data: qrData,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getServiceQRData = getServiceQRData;
//# sourceMappingURL=serviceController.js.map