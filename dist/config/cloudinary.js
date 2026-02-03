"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteImage = exports.upload = void 0;
const cloudinary_1 = require("cloudinary");
const multer_storage_cloudinary_1 = require("multer-storage-cloudinary");
const multer_1 = __importDefault(require("multer"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
cloudinary_1.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});
const storage = new multer_storage_cloudinary_1.CloudinaryStorage({
    cloudinary: cloudinary_1.v2,
    params: {
        folder: 'booking_hotel',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
        transformation: [{ width: 1200, height: 800, crop: 'limit' }],
    },
});
exports.upload = (0, multer_1.default)({ storage });
const deleteImage = async (publicId) => {
    try {
        await cloudinary_1.v2.uploader.destroy(publicId);
    }
    catch (error) {
        console.error('Error deleting image from Cloudinary:', error);
    }
};
exports.deleteImage = deleteImage;
exports.default = cloudinary_1.v2;
//# sourceMappingURL=cloudinary.js.map