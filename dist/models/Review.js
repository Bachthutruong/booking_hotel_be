"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const Hotel_1 = __importDefault(require("./Hotel"));
const reviewSchema = new mongoose_1.Schema({
    user: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User is required'],
    },
    hotel: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Hotel',
        required: [true, 'Hotel is required'],
    },
    booking: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Booking',
        required: [true, 'Booking is required'],
    },
    rating: {
        type: Number,
        required: [true, 'Rating is required'],
        min: 1,
        max: 5,
    },
    comment: {
        type: String,
        required: [true, 'Comment is required'],
    },
    images: {
        type: [String],
        default: [],
    },
    isApproved: {
        type: Boolean,
        default: true,
    },
}, {
    timestamps: true,
});
// Index
reviewSchema.index({ hotel: 1 });
reviewSchema.index({ user: 1 });
reviewSchema.index({ booking: 1 }, { unique: true });
// Update hotel rating after save
reviewSchema.post('save', async function () {
    await updateHotelRating(this.hotel);
});
reviewSchema.post('findOneAndDelete', async function (doc) {
    if (doc) {
        await updateHotelRating(doc.hotel);
    }
});
async function updateHotelRating(hotelId) {
    const stats = await mongoose_1.default.model('Review').aggregate([
        { $match: { hotel: hotelId, isApproved: true } },
        {
            $group: {
                _id: '$hotel',
                avgRating: { $avg: '$rating' },
                totalReviews: { $sum: 1 },
            },
        },
    ]);
    if (stats.length > 0) {
        await Hotel_1.default.findByIdAndUpdate(hotelId, {
            rating: Math.round(stats[0].avgRating * 10) / 10,
            totalReviews: stats[0].totalReviews,
        });
    }
    else {
        await Hotel_1.default.findByIdAndUpdate(hotelId, {
            rating: 0,
            totalReviews: 0,
        });
    }
}
const Review = mongoose_1.default.model('Review', reviewSchema);
exports.default = Review;
//# sourceMappingURL=Review.js.map