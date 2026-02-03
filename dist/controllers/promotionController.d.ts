import { Request, Response } from 'express';
import { AuthRequest, ApiResponse } from '../types';
export declare const getActivePromotions: (req: Request, res: Response<ApiResponse>) => Promise<void>;
export declare const getPromotionForAmount: (req: Request, res: Response<ApiResponse>) => Promise<Response<ApiResponse<any>, Record<string, any>> | undefined>;
export declare const getAllPromotions: (req: AuthRequest, res: Response<ApiResponse>) => Promise<void>;
export declare const getPromotionById: (req: AuthRequest, res: Response<ApiResponse>) => Promise<Response<ApiResponse<any>, Record<string, any>> | undefined>;
export declare const createPromotion: (req: AuthRequest, res: Response<ApiResponse>) => Promise<Response<ApiResponse<any>, Record<string, any>> | undefined>;
export declare const updatePromotion: (req: AuthRequest, res: Response<ApiResponse>) => Promise<Response<ApiResponse<any>, Record<string, any>> | undefined>;
export declare const deletePromotion: (req: AuthRequest, res: Response<ApiResponse>) => Promise<Response<ApiResponse<any>, Record<string, any>> | undefined>;
//# sourceMappingURL=promotionController.d.ts.map