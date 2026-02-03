"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteService = exports.updateService = exports.createService = exports.getService = exports.getAdminServices = exports.getServices = void 0;
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
        const services = await models_1.Service.find();
        res.status(200).json({
            success: true,
            data: services,
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
//# sourceMappingURL=serviceController.js.map