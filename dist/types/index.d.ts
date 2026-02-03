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
export interface IBooking extends Document {
    _id: Types.ObjectId;
    user: Types.ObjectId;
    hotel: Types.ObjectId;
    room: Types.ObjectId;
    checkIn: Date;
    checkOut: Date;
    guests: {
        adults: number;
        children: number;
    };
    totalPrice: number;
    services: IBookingService[];
    proofImage?: string;
    status: BookingStatus;
    paymentStatus: PaymentStatus;
    specialRequests: string;
    contactInfo: {
        fullName: string;
        email: string;
        phone: string;
    };
    createdAt: Date;
    updatedAt: Date;
}
export interface IService extends Document {
    _id: Types.ObjectId;
    name: string;
    description: string;
    price: number;
    icon?: string;
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