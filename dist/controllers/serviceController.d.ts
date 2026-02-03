import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
export declare const getServices: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const getAdminServices: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const getService: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const createService: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const updateService: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const deleteService: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const getServiceByQR: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const getServiceQRData: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=serviceController.d.ts.map