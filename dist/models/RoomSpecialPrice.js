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
const roomSpecialPriceSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: [true, 'Tên rule là bắt buộc'],
        trim: true,
    },
    rooms: [{
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'Room',
            required: true,
        }],
    type: {
        type: String,
        enum: ['date_range', 'weekend'],
        required: [true, 'Loại rule là bắt buộc'],
    },
    startDate: {
        type: Date,
        required: function () {
            return this.type === 'date_range';
        },
    },
    endDate: {
        type: Date,
        required: function () {
            return this.type === 'date_range';
        },
    },
    modifierType: {
        type: String,
        enum: ['percentage', 'fixed'],
        required: [true, 'Loại điều chỉnh giá là bắt buộc'],
    },
    modifierValue: {
        type: Number,
        required: [true, 'Giá trị điều chỉnh là bắt buộc'],
    },
    isActive: {
        type: Boolean,
        default: true,
    },
}, { timestamps: true });
roomSpecialPriceSchema.index({ rooms: 1, type: 1, isActive: 1 });
roomSpecialPriceSchema.index({ type: 1, startDate: 1, endDate: 1 });
const RoomSpecialPrice = mongoose_1.default.model('RoomSpecialPrice', roomSpecialPriceSchema);
exports.default = RoomSpecialPrice;
//# sourceMappingURL=RoomSpecialPrice.js.map