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
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const bookingSchema = new mongoose_1.Schema({
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
    room: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Room',
        required: [true, 'Room is required'],
    },
    checkIn: {
        type: Date,
        required: [true, 'Check-in date is required'],
    },
    checkOut: {
        type: Date,
        required: [true, 'Check-out date is required'],
    },
    actualCheckIn: {
        type: Date,
    },
    actualCheckOut: {
        type: Date,
    },
    guests: {
        adults: {
            type: Number,
            required: true,
            min: 1,
        },
        children: {
            type: Number,
            default: 0,
            min: 0,
        },
    },
    roomPrice: {
        type: Number,
        default: 0,
        min: 0,
    },
    roomPriceBreakdown: [
        {
            date: { type: Date, required: true },
            price: { type: Number, required: true, min: 0 },
            label: { type: String, default: '' },
            basePrice: { type: Number, min: 0 },
            modifierType: { type: String, enum: ['percentage', 'fixed'] },
            modifierValue: { type: Number },
        },
    ],
    servicePrice: {
        type: Number,
        default: 0,
        min: 0,
    },
    totalPrice: {
        type: Number,
        required: [true, 'Total price is required'],
        min: 0,
    },
    estimatedPrice: {
        type: Number,
        default: 0,
        min: 0,
    },
    finalPrice: {
        type: Number,
        min: 0,
    },
    paidFromWallet: {
        type: Number,
        default: 0,
        min: 0,
    },
    paidFromBonus: {
        type: Number,
        default: 0,
        min: 0,
    },
    /** Số tiền cọc yêu cầu (tính từ deposit_config lúc tạo đơn). */
    depositAmount: {
        type: Number,
        default: 0,
        min: 0,
    },
    /** Số tiền cọc đã thanh toán (ví hoặc chuyển khoản sau khi admin duyệt). */
    paidDepositAmount: {
        type: Number,
        default: 0,
        min: 0,
    },
    services: [
        {
            service: {
                type: mongoose_1.Schema.Types.ObjectId,
                ref: 'Service',
            },
            quantity: {
                type: Number,
                default: 1,
            },
            price: {
                type: Number,
                required: true,
            },
            addedAt: {
                type: Date,
                default: Date.now,
            },
            deliveredAt: {
                type: Date,
            },
        },
    ],
    proofImage: {
        type: String,
    },
    status: {
        type: String,
        enum: ['pending', 'pending_deposit', 'awaiting_approval', 'confirmed', 'cancelled', 'completed'],
        default: 'pending_deposit',
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'deposit_paid', 'paid', 'refunded'],
        default: 'pending',
    },
    paymentMethod: {
        type: String,
        enum: ['bank_transfer', 'wallet', 'cash'],
        default: 'bank_transfer',
    },
    paymentOption: {
        type: String,
        enum: ['use_bonus', 'use_main_only', 'use_cash'],
    },
    invoiceNumber: {
        type: String,
    },
    checkoutNote: {
        type: String,
    },
    specialRequests: {
        type: String,
        default: '',
    },
    contactInfo: {
        fullName: {
            type: String,
            required: [true, 'Contact name is required'],
        },
        email: {
            type: String,
            required: [true, 'Contact email is required'],
        },
        phone: {
            type: String,
            required: [true, 'Contact phone is required'],
        },
    },
}, {
    timestamps: true,
});
// Index
bookingSchema.index({ user: 1, createdAt: -1 });
bookingSchema.index({ hotel: 1, checkIn: 1, checkOut: 1 });
bookingSchema.index({ room: 1, checkIn: 1, checkOut: 1 });
bookingSchema.index({ status: 1 });
bookingSchema.index({ createdAt: -1 });
const Booking = mongoose_1.default.model('Booking', bookingSchema);
exports.default = Booking;
//# sourceMappingURL=Booking.js.map