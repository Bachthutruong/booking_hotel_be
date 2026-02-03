"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadImage = exports.upload = void 0;
const multer_1 = __importDefault(require("multer"));
const cloudinary_1 = require("cloudinary");
const multer_storage_cloudinary_1 = require("multer-storage-cloudinary");
// Configure Cloudinary
cloudinary_1.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});
// Configure Storage
const storage = new multer_storage_cloudinary_1.CloudinaryStorage({
    cloudinary: cloudinary_1.v2,
    params: {
        folder: 'booking-hotel',
        allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
    },
});
exports.upload = (0, multer_1.default)({ storage: storage });
// @desc    Upload image
// @route   POST /api/upload
// @access  Private
const uploadImage = (req, res, next) => {
    try {
        if (!req.file) {
            res.status(400).json({
                success: false,
                message: 'No file uploaded',
            });
            return;
        }
        res.status(200).json({
            success: true,
            data: {
                url: req.file.path,
                filename: req.file.filename,
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.uploadImage = uploadImage;
//# sourceMappingURL=uploadController.js.map