import { Request, Response } from 'express';
import { AuthRequest, ApiResponse } from '../types';
export declare const getServiceCategories: (req: Request, res: Response<ApiResponse>) => Promise<void>;
export declare const getAllServiceCategories: (req: AuthRequest, res: Response<ApiResponse>) => Promise<void>;
export declare const getServiceCategoryById: (req: Request, res: Response<ApiResponse>) => Promise<void>;
export declare const createServiceCategory: (req: AuthRequest, res: Response<ApiResponse>) => Promise<void>;
export declare const updateServiceCategory: (req: AuthRequest, res: Response<ApiResponse>) => Promise<void>;
export declare const deleteServiceCategory: (req: AuthRequest, res: Response<ApiResponse>) => Promise<void>;
//# sourceMappingURL=serviceCategoryController.d.ts.map