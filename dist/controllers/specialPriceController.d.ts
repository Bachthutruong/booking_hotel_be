import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
export declare const getSpecialPrices: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const getSpecialPrice: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const createSpecialPrice: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const updateSpecialPrice: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const deleteSpecialPrice: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const previewRoomPrice: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=specialPriceController.d.ts.map