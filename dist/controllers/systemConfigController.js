"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateSystemConfig = exports.getSystemConfig = void 0;
const models_1 = require("../models");
// @desc    Get system config by key
// @route   GET /api/config/:key
// @access  Public (or Private depending on key, but for now Public for bank info)
const getSystemConfig = async (req, res, next) => {
    try {
        const config = await models_1.SystemConfig.findOne({ key: req.params.key });
        if (!config) {
            res.status(404).json({
                success: false,
                message: 'Config not found',
            });
            return;
        }
        res.status(200).json({
            success: true,
            data: config,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getSystemConfig = getSystemConfig;
// @desc    Update/Create system config
// @route   POST /api/config
// @access  Private/Admin
const updateSystemConfig = async (req, res, next) => {
    try {
        const { key, value } = req.body;
        const config = await models_1.SystemConfig.findOneAndUpdate({ key }, { value }, { new: true, upsert: true, runValidators: true });
        res.status(200).json({
            success: true,
            data: config,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.updateSystemConfig = updateSystemConfig;
//# sourceMappingURL=systemConfigController.js.map