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
const promotionConfigSchema = new mongoose_1.Schema({
    hotel: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Hotel',
    },
    room: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Room',
    },
    name: {
        type: String,
        required: [true, 'Promotion name is required'],
        trim: true,
    },
    description: {
        type: String,
        default: '',
    },
    depositAmount: {
        type: Number,
        required: [true, 'Deposit amount is required'],
        min: 0,
    },
    bonusAmount: {
        type: Number,
        default: 0,
        min: 0,
    },
    bonusPercent: {
        type: Number,
        min: 0,
        max: 100,
    },
    minDeposit: {
        type: Number,
        min: 0,
    },
    maxBonus: {
        type: Number,
        min: 0,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    startDate: {
        type: Date,
    },
    endDate: {
        type: Date,
    },
}, {
    timestamps: true,
});
// Indexes
promotionConfigSchema.index({ hotel: 1 });
promotionConfigSchema.index({ room: 1 });
promotionConfigSchema.index({ isActive: 1 });
promotionConfigSchema.index({ depositAmount: 1 });
promotionConfigSchema.index({ startDate: 1, endDate: 1 });
const PromotionConfig = mongoose_1.default.model('PromotionConfig', promotionConfigSchema);
exports.default = PromotionConfig;
//# sourceMappingURL=PromotionConfig.js.map