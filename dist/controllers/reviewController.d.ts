import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
export declare const getReviews: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const createReview: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const updateReview: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const deleteReview: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const getAllReviews: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const approveReview: (req: Request, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=reviewController.d.ts.map