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
const withdrawalRequestSchema = new mongoose_1.Schema({
    user: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User is required'],
    },
    amount: {
        type: Number,
        required: [true, 'Amount is required'],
        min: [1000, 'Minimum withdrawal is 1000 VND'],
    },
    bankInfo: {
        bankName: {
            type: String,
            required: [true, 'Bank name is required'],
        },
        accountNumber: {
            type: String,
            required: [true, 'Account number is required'],
        },
        accountName: {
            type: String,
            required: [true, 'Account name is required'],
        },
    },
    status: {
        type: String,
        enum: ['pending', 'pending_confirmation', 'approved', 'rejected', 'completed'],
        default: 'pending',
    },
    adminNote: {
        type: String,
    },
    processedBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
    },
    processedAt: {
        type: Date,
    },
    adminSignature: {
        type: String,
    },
    isAdminCreated: {
        type: Boolean,
        default: false,
    },
    // New fields for confirmation flow
    confirmationToken: {
        type: String,
        unique: true,
        sparse: true,
    },
    userSignature: {
        type: String,
    },
    confirmedAt: {
        type: Date,
    },
}, {
    timestamps: true,
});
// Indexes
withdrawalRequestSchema.index({ user: 1, createdAt: -1 });
withdrawalRequestSchema.index({ status: 1 });
withdrawalRequestSchema.index({ createdAt: -1 });
withdrawalRequestSchema.index({ confirmationToken: 1 });
const WithdrawalRequest = mongoose_1.default.model('WithdrawalRequest', withdrawalRequestSchema);
exports.default = WithdrawalRequest;
//# sourceMappingURL=WithdrawalRequest.js.map