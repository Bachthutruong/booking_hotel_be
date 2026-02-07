import { Response } from 'express';
import { AuthRequest, ApiResponse } from '../types';
export declare const getNotifications: (req: AuthRequest, res: Response<ApiResponse>) => Promise<void>;
export declare const markAsRead: (req: AuthRequest, res: Response<ApiResponse>) => Promise<void>;
export declare const markAllAsRead: (req: AuthRequest, res: Response<ApiResponse>) => Promise<void>;
//# sourceMappingURL=notificationController.d.ts.map