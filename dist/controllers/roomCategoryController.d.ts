import { Request, Response } from 'express';
import { AuthRequest, ApiResponse } from '../types';
export declare const getCategories: (req: Request, res: Response<ApiResponse>) => Promise<void>;
export declare const getAllCategories: (req: AuthRequest, res: Response<ApiResponse>) => Promise<void>;
export declare const getCategoryById: (req: Request, res: Response<ApiResponse>) => Promise<Response<ApiResponse<any>, Record<string, any>> | undefined>;
export declare const createCategory: (req: AuthRequest, res: Response<ApiResponse>) => Promise<Response<ApiResponse<any>, Record<string, any>> | undefined>;
export declare const updateCategory: (req: AuthRequest, res: Response<ApiResponse>) => Promise<Response<ApiResponse<any>, Record<string, any>> | undefined>;
export declare const deleteCategory: (req: AuthRequest, res: Response<ApiResponse>) => Promise<Response<ApiResponse<any>, Record<string, any>> | undefined>;
//# sourceMappingURL=roomCategoryController.d.ts.map