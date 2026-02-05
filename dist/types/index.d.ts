import { Request } from 'express';
import { Document, Types } from 'mongoose';
export interface IUser extends Document {
    _id: Types.ObjectId;
    email: string;
    password: string;
    fullName: string;
    phone: string;
    avatar: string;
    role: 'user' | 'admin';
    isActive: boolean;
    isEmailVerified: boolean;
    emailVerificationCode?: string;
    emailVerificationExpires?: Date;
    walletBalance: number;
    bonusBalance: number;
    createdAt: Date;
    updatedAt: Date;
    comparePassword(candidatePassword: string): Promise<boolean>;
}
export interface IHotel extends Document {
    _id: Types.ObjectId;
    name: string;
    description: string;
    address: string;
    city: string;
    country: string;
    images: string[];
    amenities: string[];
    rating: number;
    totalReviews: number;
    priceRange: {
        min: number;
        max: number;
    };
    policies: {
        checkIn: string;
        checkOut: string;
        cancellation: string;
    };
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export type RoomType = 'standard' | 'deluxe' | 'suite' | 'villa';
export interface IRoom extends Document {
    _id: Types.ObjectId;
    hotel: Types.ObjectId;
    category?: Types.ObjectId;
    name: string;
    description: string;
    type: RoomType;
    price: number;
    capacity: {
        adults: number;
        children: number;
    };
    size: number;
    bedType: string;
    images: string[];
    amenities: string[];
    quantity: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export type BookingStatus = 'pending' | 'pending_deposit' | 'awaiting_approval' | 'confirmed' | 'cancelled' | 'completed';
export type PaymentStatus = 'pending' | 'paid' | 'refunded';
export interface IBookingService {
    service: Types.ObjectId;
    quantity: number;
    price: number;
}
export type PaymentMethod = 'bank_transfer' | 'wallet' | 'cash';
export type PaymentOption = 'use_bonus' | 'use_main_only';
export interface IBooking extends Document {
    _id: Types.ObjectId;
    user: Types.ObjectId;
    hotel: Types.ObjectId;
    room: Types.ObjectId;
    checkIn: Date;
    checkOut: Date;
    actualCheckIn?: Date;
    actualCheckOut?: Date;
    guests: {
        adults: number;
        children: number;
    };
    roomPrice: number;
    servicePrice: number;
    totalPrice: number;
    estimatedPrice: number;
    finalPrice?: number;
    paidFromWallet?: number;
    paidFromBonus?: number;
    services: IBookingService[];
    proofImage?: string;
    status: BookingStatus;
    paymentStatus: PaymentStatus;
    paymentMethod: PaymentMethod;
    paymentOption?: PaymentOption;
    specialRequests: string;
    contactInfo: {
        fullName: string;
        email: string;
        phone: string;
    };
    invoiceNumber?: string;
    checkoutNote?: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface IService extends Document {
    _id: Types.ObjectId;
    name: string;
    description: string;
    price: number;
    icon?: string;
    qrCode?: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export interface ISystemConfig extends Document {
    _id: Types.ObjectId;
    key: string;
    value: any;
    createdAt: Date;
    updatedAt: Date;
}
export interface IReview extends Document {
    _id: Types.ObjectId;
    user: Types.ObjectId;
    hotel: Types.ObjectId;
    booking: Types.ObjectId;
    rating: number;
    comment: string;
    images: string[];
    isApproved: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export type TransactionType = 'deposit' | 'withdrawal' | 'payment' | 'refund' | 'bonus';
export type TransactionStatus = 'pending' | 'approved' | 'rejected' | 'completed';
export interface IWalletTransaction extends Document {
    _id: Types.ObjectId;
    user: Types.ObjectId;
    type: TransactionType;
    amount: number;
    balanceBefore: number;
    balanceAfter: number;
    bonusBalanceBefore?: number;
    bonusBalanceAfter?: number;
    description: string;
    reference?: Types.ObjectId;
    referenceModel?: 'Booking' | 'DepositRequest' | 'WithdrawalRequest';
    status: TransactionStatus;
    createdAt: Date;
    updatedAt: Date;
}
export type DepositStatus = 'pending' | 'approved' | 'rejected';
export interface IDepositRequest extends Document {
    _id: Types.ObjectId;
    user: Types.ObjectId;
    amount: number;
    bonusAmount: number;
    proofImage: string;
    bankInfo: {
        bankName: string;
        accountNumber: string;
        accountName: string;
        transferContent: string;
    };
    status: DepositStatus;
    adminNote?: string;
    approvedBy?: Types.ObjectId;
    approvedAt?: Date;
    adminSignature?: string;
    isAdminCreated?: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export type WithdrawalStatus = 'pending' | 'pending_confirmation' | 'approved' | 'rejected' | 'completed';
export interface IWithdrawalRequest extends Document {
    _id: Types.ObjectId;
    user: Types.ObjectId;
    amount: number;
    bankInfo: {
        bankName: string;
        accountNumber: string;
        accountName: string;
    };
    status: WithdrawalStatus;
    adminNote?: string;
    processedBy?: Types.ObjectId;
    processedAt?: Date;
    adminSignature?: string;
    isAdminCreated?: boolean;
    confirmationToken?: string;
    userSignature?: string;
    confirmedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
export interface IRoomCategory extends Document {
    _id: Types.ObjectId;
    name: string;
    description: string;
    icon?: string;
    order: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export interface IPromotionConfig extends Document {
    _id: Types.ObjectId;
    hotel?: Types.ObjectId;
    room?: Types.ObjectId;
    name: string;
    description: string;
    depositAmount: number;
    bonusAmount: number;
    bonusPercent?: number;
    minDeposit?: number;
    maxBonus?: number;
    isActive: boolean;
    startDate?: Date;
    endDate?: Date;
    createdAt: Date;
    updatedAt: Date;
}
export interface AuthRequest extends Request {
    user?: IUser;
}
export interface ApiResponse<T = any> {
    success: boolean;
    message?: string;
    data?: T;
    pagination?: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}
//# sourceMappingURL=index.d.ts.map