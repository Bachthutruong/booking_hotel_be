import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
export declare const getSystemConfig: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const updateSystemConfig: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=systemConfigController.d.ts.map