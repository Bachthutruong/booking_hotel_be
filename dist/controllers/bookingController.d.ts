import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
export declare const getBookings: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const getBooking: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const createBooking: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const createBookingAdmin: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const uploadPaymentProof: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const approveBooking: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const cancelBooking: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const updateBookingStatus: (req: Request, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=bookingController.d.ts.map