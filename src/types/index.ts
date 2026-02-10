import { Request } from 'express';
import { Document, Types } from 'mongoose';

// User Types
export interface IUser extends Document {
  _id: Types.ObjectId;
  email: string;
  password?: string;
  fullName: string;
  phone: string;
  avatar: string;
  role: 'user' | 'admin' | 'staff';
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

// Hotel Types
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

// Room Types
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

// Booking Types
export type BookingStatus = 'pending' | 'pending_deposit' | 'awaiting_approval' | 'confirmed' | 'cancelled' | 'completed';
export type PaymentStatus = 'pending' | 'deposit_paid' | 'paid' | 'refunded';

export interface IBookingService {
  service: Types.ObjectId;
  quantity: number;
  price: number;
  addedAt?: Date;      // Ngày giờ thêm dịch vụ
  deliveredAt?: Date;  // Admin đã bàn giao (cho dịch vụ cần xác nhận)
}

export type PaymentMethod = 'bank_transfer' | 'wallet' | 'cash';
export type PaymentOption = 'use_bonus' | 'use_main_only' | 'use_cash';

/** Chi tiết giá từng ngày (áp dụng giá đặc biệt). */
export interface IRoomPriceBreakdownItem {
  date: Date;
  price: number;
  label?: string; // e.g. 'Cuối tuần', 'Ngày lễ', 'Giá gốc'
  basePrice?: number; // Giá gốc/đêm
  modifierType?: 'percentage' | 'fixed'; // Cách tăng: theo % hay số tiền
  modifierValue?: number; // Giá trị (phần trăm hoặc VND)
}

// Room Special Price (giá đặc biệt theo ngày / cuối tuần)
export type SpecialPriceRuleType = 'date_range' | 'weekend';
export type SpecialPriceModifierType = 'percentage' | 'fixed';

export interface IRoomSpecialPrice extends Document {
  _id: Types.ObjectId;
  name: string;
  /** Áp dụng cho các phòng (có thể nhiều phòng). */
  rooms: Types.ObjectId[];
  type: SpecialPriceRuleType;
  /** Cho type date_range: ngày bắt đầu (hoặc 1 ngày nếu startDate = endDate). */
  startDate?: Date;
  endDate?: Date;
  /** Tăng giá: percentage (%) hoặc fixed (VND). */
  modifierType: SpecialPriceModifierType;
  modifierValue: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

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
  /** Chi tiết giá từng ngày (khi có giá đặc biệt). */
  roomPriceBreakdown?: IRoomPriceBreakdownItem[];
  servicePrice: number;
  totalPrice: number;
  estimatedPrice: number;
  finalPrice?: number;
  paidFromWallet?: number;
  paidFromBonus?: number;
  /** Số tiền cọc yêu cầu (tính từ deposit_config). */
  depositAmount?: number;
  /** Số tiền cọc đã thanh toán (ví hoặc CK sau khi admin duyệt). */
  paidDepositAmount?: number;
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

// Service Category Types
export interface IServiceCategory extends Document {
  _id: Types.ObjectId;
  name: string;
  description: string;
  icon?: string;
  order: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Service Types
export interface IService extends Document {
  _id: Types.ObjectId;
  category?: Types.ObjectId;
  name: string;
  description: string;
  price: number;
  icon?: string;
  qrCode?: string;
  isActive: boolean;
  requiresConfirmation?: boolean; // Mặc định true: admin cần xác nhận đã bàn giao
  createdAt: Date;
  updatedAt: Date;
}

// Notification Types (for admin: e.g. user added service to booking)
export interface INotification extends Document {
  _id: Types.ObjectId;
  type: string; // 'booking_service_added' | etc.
  title: string;
  message: string;
  read: boolean;
  recipientRole: 'admin';
  referenceType?: 'Booking';
  referenceId?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// System Config Types
export interface ISystemConfig extends Document {
  _id: Types.ObjectId;
  key: string;
  value: any;
  createdAt: Date;
  updatedAt: Date;
}

// Review Types
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

// Wallet Types
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

// Deposit Request Types
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

// Withdrawal Request Types
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

// Room Category Types
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

// Promotion Config Types
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

// Request with User
export interface AuthRequest extends Request {
  user?: IUser;
}

// API Response
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
  /** Số thông báo chưa đọc (dùng cho GET /notifications) */
  unreadCount?: number;
}
